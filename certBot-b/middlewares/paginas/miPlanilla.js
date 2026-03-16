import path from 'path';
import fs from 'fs';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';
import { resolverCaptcha } from '../../helpers/captcha.js';
import { convertirImagenAPDF, manejarSubidaADrive } from '../../helpers/descargas.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarMiPlanilla(page, contratista, reporte) {
    try {
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 🌐 Navegando a Mi Planilla...`);
        await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx', { waitUntil: 'domcontentloaded' });

        const tipoIdValue = DOC_CODES['Mi Planilla'][contratista.tipo_documento] || 'CC';
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📝 Ingresando datos del contratista...`);
        
        await page.selectOption('select#cp1_ddlTipoDocumento', tipoIdValue);
        await escribirHumano(page, 'input#cp1_txtNumeroDocumento', contratista.numero_documento);

        if (reporte.numero_planilla) {
            await escribirHumano(page, 'input#cp1_txtNumeroPlanilla', reporte.numero_planilla);
        }

        if (reporte.pago_planilla) {
            const fechaPago = new Date(reporte.pago_planilla);
            await page.selectOption('select#cp1_cmbDiaPago', fechaPago.getUTCDate().toString());
            await page.selectOption('select#cp1_cmbMesPago', (fechaPago.getUTCMonth() + 1).toString());
            await page.selectOption('select#cp1_ddlAnoPago', fechaPago.getUTCFullYear().toString());
        }

        if (reporte.periodo_salud) {
            const [mes, ano] = reporte.periodo_salud.includes('/') ? reporte.periodo_salud.split('/') : [reporte.mes_inicio, reporte.ano];
            await page.selectOption('select#cp1_ddlMesSalud', parseInt(mes, 10).toString());
            await page.selectOption('select#cp1_ddlAnoSalud', ano.toString());
        }

        if (reporte.valor_planilla) {
            await escribirHumano(page, 'input#cp1_txtValorPagado', reporte.valor_planilla.toString());
        }

        const resuelto = await resolverCaptcha(page, 'img[src*="captchaImage.aspx"]', '#cp1_txtCaptcha');

        if (resuelto) {
            console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Captcha resuelto, consultando...`);
            await page.click('#cp1_ButtonConsultar');
            
            await page.waitForTimeout(4000); 

            try {
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                const nombreLimpio = `${nombre}_${apellido}`;
                const downloadPath = path.join(process.cwd(), 'descargas');
                if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

                const fileNamePdf = `${nombreLimpio}_${docNum}_V.pdf`;
                const fullPathPdf = path.join(downloadPath, fileNamePdf);

                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📸 Capturando evidencia visual...`);
                
                const element = await page.$('#cp1_pnlResultado') || await page.$('.container') || await page.$('body');
                const screenshotBuffer = await element.screenshot({ type: 'jpeg', quality: 80 });

                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📄 Convirtiendo captura a PDF...`);
                const exitoPdf = await convertirImagenAPDF(screenshotBuffer, fullPathPdf);
                
                if (exitoPdf) {
                    await manejarSubidaADrive(fullPathPdf, fileNamePdf, reporte, contratista);
                }

            } catch (e) {
                console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error al procesar captura en Mi Planilla:`, e.message);
            }

        } else {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ No se pudo resolver el captcha.`);
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en portal Mi Planilla:`, err.message);
        throw err;
    }
}
