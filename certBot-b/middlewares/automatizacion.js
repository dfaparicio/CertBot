import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { automatizarAportesEnLinea } from './paginas/aportesEnLinea.js';
import { automatizarMiPlanilla } from './paginas/miPlanilla.js';
import { automatizarSOI } from './paginas/soi.js';
import { automatizarAsopagos } from './paginas/asopagos.js';
import { manejarSubidaADrive, procesarZip } from '../helpers/descargas.js';

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

export const esperarAleatorio = (min = 500, max = 1500) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

export async function escribirHumano(page, selector, texto) {
    if (!texto) return;
    await page.focus(selector);
    await page.type(selector, texto.toString(), { delay: Math.random() * (120 - 40) + 40 });
}

export const encolarReporte = (reporteId, pagina) => {
    const taskKey = `${pagina}_${reporteId}`;
    if (reportesEnProceso.has(taskKey)) return false;
    colaTareas.push({ reporteId, pagina, taskKey });
    reportesEnProceso.add(taskKey);
    procesarCola();
    return true;
};

export const ejecutarBot = async (req, res) => {
    const { reporteId, pagina } = req.body;
    if (!reporteId || !pagina) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });
    const encolado = encolarReporte(reporteId, pagina);
    if (encolado) res.json({ ok: true, msg: 'Tarea añadida a la cola' });
    else res.json({ ok: true, msg: 'Ya en cola' });
};

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

async function procesarCola() {
    if (botTrabajando || colaTareas.length === 0) return;
    botTrabajando = true;
    const { reporteId, pagina, taskKey } = colaTareas.shift();
    
    console.group(`\n${getTimestamp()} \x1b[35m[PROCESS]\x1b[0m 🤖 Iniciando Automatización: ${pagina}`);
    console.time(`⏱️ Tiempo total de ejecución`);
    
    try {
        await procesarReporte(reporteId, pagina, taskKey);
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Fallo en la cola:`, err.message);
    } finally {
        console.timeEnd(`⏱️ Tiempo total de ejecución`);
        console.groupEnd();
        botTrabajando = false;
        reportesEnProceso.delete(taskKey);
        procesarCola();
    }
}

const procesarReporte = async (reporteId, pagina, taskKey) => {
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
            return;
        }

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const docNum = contratista.numero_documento;
        const nombreC = `${contratista.nombre} ${contratista.apellidos}`.trim();
        
        console.info(`${getTimestamp()} \x1b[34m[INFO]\x1b[0m Datos Clave: ${nombreC} (${docNum})`);

        browser = await chromium.launch({ headless: process.env.BOT_HEADLESS === 'true' });
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
            } catch (err) {
                console.error(`❌ [DEBUG] Error en manejarArchivo: ${err.message}`);
            } finally {
                terminarSubida();
            }
        };

        context.on('download', async (download) => {
            console.log('📥 [DEBUG] Evento de descarga detectado en el navegador...');
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
            case 'Aportes en Línea': await automatizarAportesEnLinea(page, contratista, reporte); break;
            case 'Mi Planilla': await automatizarMiPlanilla(page, contratista, reporte); break;
            case 'SOI': await automatizarSOI(page, contratista, reporte, manejarArchivo); break;
            case 'Asopagos': await automatizarAsopagos(page, contratista, reporte, manejarArchivo); break;
        }

        await Promise.race([pendienteSubida, new Promise(r => setTimeout(r, 60000))]);

    } finally {
        if (browser) await browser.close();
    }
};
