import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { automatizarAportesEnLinea } from './paginas/aportesEnLinea.js';
import { automatizarMiPlanilla } from './paginas/miPlanilla.js';
import { automatizarSOI } from './paginas/soi.js';
import { automatizarAsopagos } from './paginas/asopagos.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

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

    let browser;
    try {
        const reporte = await Modelo.findById(reporteId).populate('contratistaId');
        if (!reporte || reporte.estado_descarga) return;

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const isHeadless = process.env.BOT_HEADLESS === 'true';
        browser = await chromium.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await (await browser.newContext()).newPage();

        // Directorio de descargas
        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

        // Escuchador de descargas (Tanto para Headless como Visible)
        page.on('download', async (download) => {
            try {
                const fileName = `Certificado_${pagina.replace(/ /g, '_')}_${contratista.numero_documento}_${Date.now()}.pdf`;
                await download.saveAs(path.join(downloadPath, fileName));
                console.log(`✅ Archivo descargado exitosamente: ${fileName}`);
                
                // Actualizamos el reporte inmediatamente
                reporte.estado_descarga = true;
                await reporte.save();
                console.log(`💾 Estado del reporte actualizado a 'descargado: true'`);

            } catch (err) {
                console.error('❌ Error al guardar el archivo:', err.message);
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
            // En headless, esperamos específicamente el evento de descarga por 30 segundos
            try {
                await page.waitForEvent('download', { timeout: 30000 });
                // Esperamos un segundito extra para asegurar el guardado por el listener
                await page.waitForTimeout(2000); 
            } catch (e) {
                console.log('⚠️ El bot terminó pero no se detectó ninguna descarga.');
            }
        } else {
            // En visible esperamos a que el usuario cierre el navegador
            await page.waitForEvent('close', { timeout: 0 });
        }

    } catch (error) {
        console.error(`❌ Error en el Bot (${pagina}):`, error.message);
    } finally {
        if (browser) await browser.close();
    }
};

export const ejecutarBot = async (req, res) => {
    const { reporteId, pagina } = req.body;
    if (!reporteId || !pagina) return res.status(400).json({ ok: false, msg: 'Faltan parámetros' });
    procesarReporte(reporteId, pagina);
    res.json({ ok: true, msg: 'Bot disparado' });
};
