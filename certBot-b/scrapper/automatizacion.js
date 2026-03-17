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

        // Si hay más tareas en la cola, esperamos entre 30 y 45 segundos
        if (colaTareas.length > 0) {
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

        let terminarSubida;
        const pendienteSubida = new Promise(resolve => terminarSubida = resolve);

        const manejarArchivo = async (fullPath, fileName) => {
            console.log(`🛠️ [DEBUG] Procesando archivo final: ${fileName} en ${fullPath}`);
            enviarEstado(io, reporteId, `Archivo capturado: ${fileName}. Subiendo a Drive...`);
            try {
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                const nombreLimpio = `${nombre}_${apellido}`;

                if (fileName.toLowerCase().endsWith('.zip')) {
                    await procesarZip(fullPath, fileName, downloadPath, nombreLimpio, docNum, reporte, contratista);
                } else {
                    await manejarSubidaADrive(fullPath, fileName, reporte, contratista);
                }
                enviarEstado(io, reporteId, "¡Proceso finalizado con éxito! Archivo en Drive.");
            } catch (err) {
                console.error(`❌ [DEBUG] Error en manejarArchivo: ${err.message}`);
                enviarEstado(io, reporteId, "Error al subir el archivo a Drive.", true);
            } finally {
                terminarSubida();
            }
        };

        context.on('download', async (download) => {
            console.log('📥 [DEBUG] Evento de descarga detectado en el navegador...');
            enviarEstado(io, reporteId, "Descarga iniciada desde el portal...");
            const docNum = contratista.numero_documento;
            const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
            const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');

            const suggestedFileName = download.suggestedFilename();
            console.log(`📄 [DEBUG] Archivo sugerido por el portal: ${suggestedFileName}`);

            const extension = suggestedFileName.split('.').pop() || 'pdf';
            const fileName = `${nombre}_${apellido}_${docNum}.${extension}`;
            const fullPath = path.join(downloadPath, fileName);

            console.log(`💾 [DEBUG] Guardando archivo en disco: ${fullPath}`);
            await download.saveAs(fullPath);

            if (fs.existsSync(fullPath)) {
                console.log('✅ [DEBUG] Archivo guardado correctamente. Iniciando manejarArchivo...');
                await manejarArchivo(fullPath, fileName);
            } else {
                console.error('❌ [DEBUG] ERROR CRÍTICO: El archivo no se encontró en el disco tras saveAs');
            }
        });

        context.on('page', async (newPage) => {
            console.log(`✨ [DEBUG] Nueva ventana detectada: ${newPage.url()}`);

            // Esperamos un momento para ver si la nueva página es una descarga
            const response = await newPage.waitForResponse(res => {
                const isPdf = res.url().toLowerCase().endsWith('.pdf') || res.headers()['content-type']?.includes('application/pdf');
                const isZip = res.url().toLowerCase().endsWith('.zip') || res.headers()['content-type']?.includes('application/zip') || res.headers()['content-type']?.includes('application/x-zip-compressed');
                return isPdf || isZip;
            }, { timeout: 15000 }).catch(() => null);

            if (response) {
                console.log(`✅ [DEBUG] Respuesta detectada en nueva ventana: ${response.url()} (Tipo: ${response.headers()['content-type']})`);
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');

                const isZip = response.url().toLowerCase().endsWith('.zip') || response.headers()['content-type']?.includes('zip');
                const extension = isZip ? 'zip' : 'pdf';
                const suffix = isZip ? '' : '_V';

                const fileName = `${nombre}_${apellido}_${docNum}${suffix}.${extension}`;
                const fullPath = path.join(downloadPath, fileName);

                console.log(`💾 [DEBUG] Guardando archivo desde flujo de red: ${fileName}`);
                fs.writeFileSync(fullPath, await response.body());
                await manejarArchivo(fullPath, fileName);
            } else {
                console.log('⚠️ [DEBUG] La nueva ventana no cargó un PDF o ZIP en 15 segundos.');
            }
        });


        switch (pagina) {
            case 'Aportes en Línea':
                enviarEstado(io, reporteId, "Accediendo a Aportes en Línea...");
                await automatizarAportesEnLinea(page, contratista, reporte, io, reporteId);
                break;
            case 'Mi Planilla':
                enviarEstado(io, reporteId, "Accediendo a Mi Planilla...");
                await automatizarMiPlanilla(page, contratista, reporte, io, reporteId);
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

        await Promise.race([pendienteSubida, new Promise(r => setTimeout(r, 60000))]);
        enviarEstado(io, reporteId, "¡Automatización finalizada con éxito!");

    } finally {
        if (browser) await browser.close();
    }
};