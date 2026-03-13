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

// Set para evitar ejecuciones duplicadas simultáneas del mismo reporte
const reportesEnProceso = new Set();
// Cola de tareas pendientes
const colaTareas = [];
let botTrabajando = false;

/**
 * Añade un reporte a la cola de procesamiento
 */
export const encolarReporte = (reporteId, pagina) => {
    const taskKey = `${pagina}_${reporteId}`;
    
    if (reportesEnProceso.has(taskKey)) {
        console.log(`⏩ ${pagina} (${reporteId}) ya está en cola o procesándose.`);
        return false;
    }

    colaTareas.push({ reporteId, pagina, taskKey });
    reportesEnProceso.add(taskKey);

    console.log(`📥 Tarea añadida a la cola: ${pagina} (${reporteId}). Total en cola: ${colaTareas.length}`);
    procesarCola();
    return true;
};

/**
 * Endpoint para disparar el bot manualmente o vía API
 */
export const ejecutarBot = async (req, res) => {
    const { reporteId, pagina } = req.body;
    if (!reporteId || !pagina) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });

    const encolado = encolarReporte(reporteId, pagina);
    res.json({ 
        ok: true, 
        msg: encolado ? 'Tarea añadida a la cola de espera' : 'Este reporte ya está en cola o procesándose' 
    });
};

/**
 * Worker que procesa la cola de forma secuencial
 */
async function procesarCola() {
    if (botTrabajando || colaTareas.length === 0) return;

    botTrabajando = true;
    const { reporteId, pagina, taskKey } = colaTareas.shift();

    console.log(`\n🤖 [Queue] Iniciando siguiente tarea: ${pagina}. Quedan en espera: ${colaTareas.length}`);
    
    try {
        await procesarReporte(reporteId, pagina, taskKey);
    } catch (err) {
        console.error(`❌ [Queue] Error procesando tarea:`, err.message);
    } finally {
        botTrabajando = false;
        reportesEnProceso.delete(taskKey);
        procesarCola();
    }
}

/**
 * Lógica principal de ejecución del bot para un reporte específico
 */
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
            console.log(`⏭️ Saltando reporte ${reporteId}: ya descargado o no encontrado.`);
            return;
        }

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const isHeadless = process.env.BOT_HEADLESS === 'true';
        browser = await chromium.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();
        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

        // Sincronización de finalización
        let terminarSubida;
        const pendienteSubida = new Promise(resolve => terminarSubida = resolve);

        // 1. Escuchar descargas (incluyendo paquetes ZIP de SOI)
        context.on('download', async (download) => {
            try {
                const docNum = contratista.numero_documento;
<<<<<<< HEAD
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                
                const suggestedFileName = download.suggestedFilename();
                const extension = suggestedFileName.split('.').pop() || 'pdf';
                const fileName = `${nombre}_${apellido}_${docNum}.${extension}`;
=======
                const nombreLimpio = (contratista.nombre || contratista.nombre_completo || `Contratista_${docNum}`).trim().replace(/\s+/g, '_');
                const extension = download.suggestedFilename().split('.').pop() || 'pdf';
                const fileName = `${nombreLimpio}_${docNum}.${extension}`;
>>>>>>> 620181acfbc4615087b123362b8c6eb31a935ee4
                const fullPath = path.join(downloadPath, fileName);

                await download.saveAs(fullPath);
                console.log(`✅ Archivo capturado vía descarga: ${fileName}`);

                if (extension.toLowerCase() === 'zip') {
                    await procesarZip(fullPath, fileName, downloadPath, nombreLimpio, docNum, reporte, contratista);
                } else {
                    await manejarSubidaADrive(fullPath, fileName, reporte, contratista);
                }
            } catch (err) {
                console.error('❌ Fallo en captura de descarga:', err.message);
            } finally {
                terminarSubida();
            }
        });

        // 2. Escuchar pestañas nuevas (visores PDF)
        context.on('page', async (newPage) => {
            console.log('📄 Nueva pestaña detectada, monitoreando contenido...');
            try {
                const response = await newPage.waitForResponse(res => 
                    res.url().toLowerCase().endsWith('.pdf') || 
                    res.headers()['content-type']?.includes('application/pdf'), 
                    { timeout: 15000 }
                ).catch(() => null);

                if (response) {
                    const docNum = contratista.numero_documento;
                    const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                    const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                    
                    const fileName = `${nombre}_${apellido}_${docNum}_V.pdf`;
                    const fullPath = path.join(downloadPath, fileName);
                    
                    fs.writeFileSync(fullPath, await response.body());
                    console.log(`✅ Archivo capturado vía visor PDF: ${fileName}`);
                    await manejarSubidaADrive(fullPath, fileName, reporte, contratista);
                    terminarSubida();
                }
            } catch (e) { /* Silencioso si no es PDF */ }
        });

        console.log(`🚀 Iniciando Bot (${isHeadless ? 'Invisible' : 'Visible'}) para ${pagina}...`);

        // Ejecutar rutina específica del portal
        const rutinas = {
            'Aportes en Línea': automatizarAportesEnLinea,
            'Mi Planilla': automatizarMiPlanilla,
            'SOI': automatizarSOI,
            'Asopagos': automatizarAsopagos
        };

        if (rutinas[pagina]) {
            await rutinas[pagina](page, contratista, reporte);
        }

        // Espera final según modo
        if (isHeadless) {
            await Promise.race([
                page.waitForEvent('download', { timeout: 40000 }).catch(() => null),
                pendienteSubida,
                new Promise(r => setTimeout(r, 45000))
            ]);
        } else {
            console.log('📝 Modo Visible: El bot esperará a que el navegador se cierre o termine la subida.');
            await Promise.race([
                page.waitForEvent('close', { timeout: 0 }).catch(() => null),
                pendienteSubida
            ]);
            await new Promise(r => setTimeout(r, 2000));
        }

    } catch (error) {
        console.error(`❌ Error en el Bot (${pagina}):`, error.message);
    } finally {
        if (browser) await browser.close();
    }
};
