import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { automatizarAportesEnLinea } from './paginas/aportesEnLinea.js';
import { automatizarMiPlanilla } from './paginas/miPlanilla.js';
import { automatizarSOI } from './paginas/soi.js';
import { automatizarAsopagos } from './paginas/asopagos.js';
import { subirADrive } from '../helpers/googleDrive.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

// Set para evitar ejecuciones duplicadas simultáneas
const reportesEnProceso = new Set();

// Mapa de códigos de documentos (Se mantiene igual)
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

export const procesarReporte = async (reporteId, pagina) => {
    const Modelo = MODELOS[pagina];
    if (!Modelo) return;

    const taskKey = `${pagina}_${reporteId}`;
    if (reportesEnProceso.has(taskKey)) {
        console.log(`⚠️ El bot ya está procesando ${pagina} para este reporte. Ignorando...`);
        return;
    }

    let browser;
    try {
        const reporte = await Modelo.findById(reporteId).populate({
            path: 'contratistaId',
            populate: { path: 'supervisorId' }
        });

        if (!reporte || reporte.estado_descarga) return;

        // Marcamos como en proceso
        reportesEnProceso.add(taskKey);

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const isHeadless = process.env.BOT_HEADLESS === 'true';
        browser = await chromium.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Directorio de descargas
        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

        // Sincronización de subida
        let terminarSubida;
        const pendienteSubida = new Promise(resolve => terminarSubida = resolve);
        let archivosProcesados = 0;

        const manejarDescarga = async (fullPath, fileName) => {
            try {
                // Lógica de Drive: Año > Mes > Supervisor
                const anio = reporte.ano || new Date().getFullYear();
                const mesNombre = reporte.mes_inicio || "Mes_Sin_Definir";
                const supervisor = contratista.supervisorId;
                const supervisorName = supervisor ? `${supervisor.nombre} ${supervisor.apellidos}`.trim() : "Supervisor_General";

                console.log(`☁️ Iniciando subida a Drive para: ${fileName}...`);
                await subirADrive(fullPath, fileName, supervisorName, mesNombre, anio);
                
                reporte.estado_descarga = true;
                await reporte.save();
                console.log(`💾 Reporte actualizado y subido con éxito.`);
            } catch (err) {
                console.error('❌ Error en el proceso de subida:', err.message);
            } finally {
                archivosProcesados++;
                terminarSubida();
            }
        };

        // 1. Escuchar descargas en TODO el contexto (pestañas nuevas, popups, etc.)
        context.on('download', async (download) => {
            try {
                const docNum = contratista.numero_documento;
                const nombreLimpio = (contratista.nombre || contratista.nombre_completo || `Contratista_${docNum}`).trim().replace(/\s+/g, '_');
                const suggestedFileName = download.suggestedFilename();
                const extension = suggestedFileName.split('.').pop() || 'pdf';
                const fileName = `${nombreLimpio}_${docNum}.${extension}`;
                const fullPath = path.join(downloadPath, fileName);

                await download.saveAs(fullPath);
                console.log(`✅ Archivo capturado vía descarga: ${fileName}`);
                await manejarDescarga(fullPath, fileName);
            } catch (err) {
                console.error('❌ Fallo en captura de descarga:', err.message);
                terminarSubida();
            }
        });

        // 2. Escuchar pestañas nuevas que puedan ser el PDF visor
        context.on('page', async (newPage) => {
            console.log('📄 Nueva pestaña detectada, monitoreando contenido...');
            try {
                // Si la URL termina en .pdf o el Content-Type es PDF
                const response = await newPage.waitForResponse(res => 
                    res.url().toLowerCase().endsWith('.pdf') || 
                    res.headers()['content-type']?.includes('application/pdf'), 
                    { timeout: 15000 }
                ).catch(() => null);

                if (response) {
                    const docNum = contratista.numero_documento;
                    const nombreLimpio = (contratista.nombre || contratista.nombre_completo || `Contratista_${docNum}`).trim().replace(/\s+/g, '_');
                    const fileName = `${nombreLimpio}_${docNum}_V.pdf`;
                    const fullPath = path.join(downloadPath, fileName);
                    
                    const buffer = await response.body();
                    fs.writeFileSync(fullPath, buffer);
                    console.log(`✅ Archivo capturado vía visor PDF: ${fileName}`);
                    await manejarDescarga(fullPath, fileName);
                }
            } catch (e) {
                // Silencioso si no es un PDF
            }
        });

        console.log(`🚀 Iniciando Bot (${isHeadless ? 'Invisible' : 'Visible'}) para ${pagina}...`);

        switch (pagina) {
            case 'Aportes en Línea': await automatizarAportesEnLinea(page, contratista, reporte); break;
            case 'Mi Planilla': await automatizarMiPlanilla(page, contratista, reporte); break;
            case 'SOI': await automatizarSOI(page, contratista, reporte); break;
            case 'Asopagos': await automatizarAsopagos(page, contratista, reporte); break;
        }

        if (isHeadless) {
            try {
                // Esperamos descarga o un tiempo prudente
                await Promise.race([
                    page.waitForEvent('download', { timeout: 40000 }),
                    pendienteSubida,
                    new Promise(r => setTimeout(r, 45000))
                ]);
            } catch (e) {
                console.log('⚠️ Finalizando espera de descarga.');
            }
        } else {
            console.log('📝 Modo Visible: El bot esperará a que el navegador se cierre o termine la subida.');
            // En visible, esperamos a que el usuario cierre O termine la subida
            await Promise.race([
                page.waitForEvent('close', { timeout: 0 }),
                pendienteSubida
            ]);
            // Pequeña espera extra si acaba de terminar
            await new Promise(r => setTimeout(r, 2000));
        }

    } catch (error) {
        console.error(`❌ Error en el Bot (${pagina}):`, error.message);
    } finally {
        if (browser) await browser.close();
        // Liberamos el bloqueo
        reportesEnProceso.delete(taskKey);
    }
};

export const ejecutarBot = async (req, res) => {
    const { reporteId, pagina } = req.body;
    if (!reporteId || !pagina) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });
    procesarReporte(reporteId, pagina);
    res.json({ ok: true, msg: 'Bot disparado' });
};
