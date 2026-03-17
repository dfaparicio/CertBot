import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { automatizarAportesEnLinea } from './paginas/aportesEnLinea.js';
import { automatizarMiPlanilla } from './paginas/miPlanilla.js';
import { automatizarSOI } from './paginas/soi.js';
import { automatizarAsopagos } from './paginas/asopagos.js';
import { manejarSubidaADrive, procesarZip } from '../helpers/descargas.js';
import { esperarAleatorio } from '../helpers/botUtils.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

const reportesEnProceso = new Set();
const colaTareas = [];
let botTrabajando = false;

export const DOC_CODES = {
    'Aportes en Línea': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '2', 'Cédula de Extranjería': '2', 'Tarjeta de identidad': '3', 'NIT': '4' },
    'Mi Planilla': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI' },
    'SOI': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '3', 'Cédula de Extranjería': '3', 'Tarjeta de identidad': '6', 'NIT': '2' },
    'Asopagos': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI', 'Pasaporte': 'PA' }
};



const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

const enviarEstado = (io, reporteId, msg, error = false) => {
    if (io) {
        io.emit(`status_${reporteId}`, { msg, error, time: new Date().toLocaleTimeString() });
    }
};

export const encolarReporte = (reporteId, pagina, io, intentos = 0) => {
    const taskKey = `${pagina}_${reporteId}`;

    if (reportesEnProceso.has(taskKey) && intentos === 0) {
        const tareaActual = colaTareas.find(t => t.taskKey === taskKey);
        if (tareaActual) {
            tareaActual.io = io;
        }
        enviarEstado(io, reporteId, "La tarea ya está en proceso, sincronizando...");
        return true;
    }

    colaTareas.push({ reporteId, pagina, taskKey, io, intentos });
    reportesEnProceso.add(taskKey);
    procesarCola();
    return true;
};

export const ejecutarBot = async (req, res) => {
    const { reporteId, pagina } = req.body;
    const io = req.io;
    if (!reporteId || !pagina) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });
    const encolado = encolarReporte(reporteId, pagina, io);
    if (encolado) res.json({ ok: true, msg: 'Tarea añadida a la cola' });
    else res.json({ ok: true, msg: 'Ya en cola' });
};

async function procesarCola() {
    if (botTrabajando || colaTareas.length === 0) return;
    botTrabajando = true;
    const { reporteId, pagina, taskKey, io, intentos } = colaTareas.shift();

    console.group(`\n${getTimestamp()} \x1b[35m[PROCESS]\x1b[0m 🤖 Automatización: ${pagina} (Intento ${intentos + 1}/3)`);

    try {
        await procesarReporte(reporteId, pagina, taskKey, io);
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Fallo en el intento ${intentos + 1}:`, err.message);

        if (intentos < 2) { // 3 intentos en total (0, 1, 2)
            const waitTime = 5000;
            enviarEstado(io, reporteId, `Error en intento ${intentos + 1}. Reintentando en ${waitTime / 1000}s...`);

            setTimeout(() => {
                reportesEnProceso.delete(taskKey);
                encolarReporte(reporteId, pagina, io, intentos + 1);
            }, waitTime);
        } else {
            enviarEstado(io, reporteId, "Se agotaron los reintentos. Verifique sus datos o el estado del portal.", true);
            const Modelo = MODELOS[pagina];
            if (Modelo) await Modelo.findByIdAndUpdate(reporteId, { estado: 'Rechazado' });
        }
    } finally {
        console.groupEnd();
        reportesEnProceso.delete(taskKey);

        // Si hay más tareas, esperamos de 30 a 45 segundos según la solicitud del usuario "entre pagina y pagina"
        if (colaTareas.length > 0) {
            // Calculamos un estimado solo para el log, esperarAleatorio hará el cálculo real
            console.info(`${getTimestamp()} \x1b[33m[WAIT]\x1b[0m ⏳ Aplicando pausa aleatoria (30-45s) antes de la siguiente página...`);
            await esperarAleatorio(30000, 45000);
        }

        botTrabajando = false;
        procesarCola();
    }
}

const procesarReporte = async (reporteId, pagina, taskKey, io) => {
    const Modelo = MODELOS[pagina];
    if (!Modelo) return;

    let browser;
    try {
        const reporte = await Modelo.findById(reporteId).populate({
            path: 'contratistaId',
            populate: { path: 'supervisorId' }
        });

        if (!reporte || reporte.estado_descarga) {
            console.warn(`${getTimestamp()} \x1b[33m[WARN]\x1b[0m Reporte ya procesado u omitido.`);
            enviarEstado(io, reporteId, "El reporte ya fue procesado o no existe.");
            return;
        }

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const docNum = contratista.numero_documento;
        const nombreC = `${contratista.nombre} ${contratista.apellidos}`.trim();

        console.info(`${getTimestamp()} \x1b[34m[INFO]\x1b[0m Datos Clave: ${nombreC} (${docNum})`);
        enviarEstado(io, reporteId, `Iniciando bot para ${nombreC}...`);

        browser = await chromium.launch({ headless: process.env.BOT_HEADLESS === 'true' });
        enviarEstado(io, reporteId, "Navegador iniciado con éxito.");

        const context = await browser.newContext();
        const page = await context.newPage();

        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

        // Escucha de respuestas (Logs profesionales)
        page.on('response', (res) => {
            const url = res.url();
            const contentType = (res.headers()['content-type'] || '').toLowerCase();
            if (url.includes('soi') || url.includes('miplanilla') || url.includes('asopagos') || url.includes('aportes')) {
                if (res.status() === 200 && (contentType.includes('octet-stream') || contentType.includes('zip') || contentType.includes('pdf'))) {
                    console.info(`${getTimestamp()} \x1b[32m[NET]\x1b[0m Flujo de datos capturado: ${contentType}`);
                }
            }
        });

        const archivosCapturados = [];
        const manejarArchivo = async (fullPath, fileName) => {
            console.log(`📋 [BOT] Registrando archivo para procesamiento diferido: ${fileName}`);
            archivosCapturados.push({ fullPath, fileName });
        };

        // Listeners centrales ajustados para NO procesar inmediatamente
        context.on('download', async (download) => {
            console.log('📥 [DEBUG] Descarga detectada, guardando temporalmente...');
            const docNum = contratista.numero_documento;
            const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
            const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');

            const suggestedFileName = download.suggestedFilename();
            const extension = suggestedFileName.split('.').pop() || 'pdf';
            const fileName = `${nombre}_${apellido}_${docNum}.${extension}`;
            const fullPath = path.join(downloadPath, fileName);

            await download.saveAs(fullPath);
            if (fs.existsSync(fullPath)) {
                await manejarArchivo(fullPath, fileName);
            }
        });

        context.on('page', async (newPage) => {
            console.log(`✨ [DEBUG] Nueva ventana detectada.`);
            const response = await newPage.waitForResponse(res => {
                const isPdf = res.url().toLowerCase().endsWith('.pdf') || res.headers()['content-type']?.includes('application/pdf');
                const isZip = res.url().toLowerCase().endsWith('.zip') || res.headers()['content-type']?.includes('application/zip') || res.headers()['content-type']?.includes('application/x-zip-compressed');
                return isPdf || isZip;
            }, { timeout: 15000 }).catch(() => null);

            if (response) {
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                const isZip = response.url().toLowerCase().endsWith('.zip') || response.headers()['content-type']?.includes('zip');
                const extension = isZip ? 'zip' : 'pdf';
                const suffix = isZip ? '' : '_V';

                const fileName = `${nombre}_${apellido}_${docNum}${suffix}.${extension}`;
                const fullPath = path.join(downloadPath, fileName);

                fs.writeFileSync(fullPath, await response.body());
                await manejarArchivo(fullPath, fileName);
                await newPage.close().catch(() => {});
            }
        });

        // Ejecutar la automatización según el portal
        switch (pagina) {
            case 'Aportes en Línea':
                enviarEstado(io, reporteId, "Accediendo a Aportes en Línea...");
                await automatizarAportesEnLinea(page, contratista, reporte, io, reporteId);
                break;
            case 'Mi Planilla':
                enviarEstado(io, reporteId, "Accediendo a Mi Planilla...");
                await automatizarMiPlanilla(page, contratista, reporte, manejarArchivo, io, reporteId);
                break;
            case 'SOI':
                enviarEstado(io, reporteId, "Accediendo a SOI...");
                await automatizarSOI(page, contratista, reporte, manejarArchivo, io, reporteId);
                break;
            case 'Asopagos':
                enviarEstado(io, reporteId, "Accediendo a Asopagos...");
                await automatizarAsopagos(page, contratista, reporte, manejarArchivo, io, reporteId);
                break;
        }

        // Si llegamos aquí sin errores, procesamos lo capturado
        if (archivosCapturados.length > 0) {
            enviarEstado(io, reporteId, "Portal finalizado con éxito. Procesando archivos capturados...");
            for (const item of archivosCapturados) {
                if (item.fileName.toLowerCase().endsWith('.zip')) {
                    const docNum = contratista.numero_documento;
                    const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                    const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                    const nombreLimpio = `${nombre}_${apellido}`;
                    await procesarZip(item.fullPath, item.fileName, downloadPath, nombreLimpio, docNum, reporte, contratista, false);
                } else {
                    await manejarSubidaADrive(item.fullPath, item.fileName, reporte, contratista, false);
                }
            }

            // Marcamos como finalizado en una única operación atómica al final
            reporte.estado_descarga = true;
            reporte.estado = 'Aprobado';
            await reporte.save();
            enviarEstado(io, reporteId, "¡Automatización y subida finalizada con éxito!");
        } else {
            console.warn(`${getTimestamp()} \x1b[33m[WARN]\x1b[0m La automatización terminó pero no se capturó ningún archivo.`);
            enviarEstado(io, reporteId, "No se detectaron archivos de certificados tras la consulta.", true);
            throw new Error("No se capturó ningún archivo");
        }

    } catch (err) {
        // En caso de error, limpiar archivos temporales si existen para evitar basura
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m Error en proceso: ${err.message}`);
        
        // El usuario pidió que si hay error no se descargue nada (borramos lo que se capturó a medias)
        for (const item of archivosCapturados) {
            try {
                if (fs.existsSync(item.fullPath)) fs.unlinkSync(item.fullPath);
                console.log(`🧹 [CLEANUP] Archivo eliminado por error en el proceso: ${item.fileName}`);
            } catch (e) {}
        }

        throw err;
    } finally {
        if (browser) await browser.close();
    }
};
