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

async function procesarCola() {
    if (botTrabajando || colaTareas.length === 0) return;
    botTrabajando = true;
    const { reporteId, pagina, taskKey } = colaTareas.shift();
    try {
        await procesarReporte(reporteId, pagina, taskKey);
    } catch (err) {
        console.error(`❌ Error en cola:`, err.message);
    } finally {
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

        if (!reporte || reporte.estado_descarga) return;
        const contratista = reporte.contratistaId;
        if (!contratista) return;

        browser = await chromium.launch({ headless: process.env.BOT_HEADLESS === 'true' });
        const context = await browser.newContext();
        const page = await context.newPage();
        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

        let terminarSubida;
        const pendienteSubida = new Promise(resolve => terminarSubida = resolve);

        const manejarDescarga = async (fullPath, fileName) => {
            try {
                const anio = reporte.ano || new Date().getFullYear();
                const mesNombre = reporte.mes_inicio || "Mes";
                const supervisor = contratista.supervisorId;
                const supervisorName = supervisor ? `${supervisor.nombre} ${supervisor.apellidos}`.trim() : "General";
                await subirADrive(fullPath, fileName, supervisorName, mesNombre, anio);
                reporte.estado_descarga = true;
                await reporte.save();
            } finally {
                terminarSubida();
            }
        };

        context.on('download', async (download) => {
            const docNum = contratista.numero_documento;
            const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
            const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
            const fileName = `${nombre}_${apellido}_${docNum}.pdf`;
            const fullPath = path.join(downloadPath, fileName);
            await download.saveAs(fullPath);
            await manejarDescarga(fullPath, fileName);
        });

        context.on('page', async (newPage) => {
            const response = await newPage.waitForResponse(res => 
                res.url().toLowerCase().endsWith('.pdf') || res.headers()['content-type']?.includes('application/pdf'), 
                { timeout: 15000 }
            ).catch(() => null);

            if (response) {
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                const fileName = `${nombre}_${apellido}_${docNum}_V.pdf`;
                const fullPath = path.join(downloadPath, fileName);
                fs.writeFileSync(fullPath, await response.body());
                await manejarDescarga(fullPath, fileName);
            }
        });

        switch (pagina) {
            case 'Aportes en Línea': await automatizarAportesEnLinea(page, contratista, reporte); break;
            case 'Mi Planilla': await automatizarMiPlanilla(page, contratista, reporte); break;
            case 'SOI': await automatizarSOI(page, contratista, reporte); break;
            case 'Asopagos': await automatizarAsopagos(page, contratista, reporte); break;
        }

        await Promise.race([pendienteSubida, new Promise(r => setTimeout(r, 60000))]);

    } finally {
        if (browser) await browser.close();
    }
};
