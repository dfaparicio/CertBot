import { escribirHumano, DOC_CODES } from '../automatizacion.js';
import { resolverCaptcha } from '../../helpers/captcha.js';

export async function automatizarAsopagos(page, contratista, reporte) {
    try {
        console.log('Navegando a Asopagos...');
        await page.goto('https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp', { waitUntil: 'domcontentloaded' });

        if (reporte.tipo_certificado === 0) {
            await page.check('input[value="verCertificadoTresNuevo"]');
        } else if (reporte.tipo_certificado === 1) {
            await page.check('input[value="verCertificadoCesantias"]');
        }

        const tipoDoc = DOC_CODES['Asopagos'][contratista.tipo_documento] || 'CC';
        await page.selectOption('select#tipoID', tipoDoc);
        await escribirHumano(page, 'input#numeroID', contratista.numero_documento);

        if (reporte.ano) {
            await escribirHumano(page, 'input#ano', reporte.ano.toString());
        }

        if (reporte.mes_inicio) {
            await page.selectOption('select#mes', reporte.mes_inicio.toString());
        }

        const tipoReporte = reporte.tipo_reporte === 1 ? 'conValores' : 'sinValores';
        await page.selectOption('select#tipoReporte', tipoReporte);

        // Resolución de Captcha de Imagen
        await resolverCaptcha(page, 'img#captcha_imgpop', '#captchaIn');

        if (process.env.BOT_HEADLESS === 'true') {
            await page.click('#enviarConsRP');
        }
    } catch (err) {
        console.error('❌ Error en automatizarAsopagos:', err.message);
        throw err;
    }
}
