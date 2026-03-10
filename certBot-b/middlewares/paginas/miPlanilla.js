import { escribirHumano, DOC_CODES } from '../automatizacion.js';
import { resolverCaptcha } from '../../helpers/captcha.js';

export async function automatizarMiPlanilla(page, contratista, reporte) {
    try {
        console.log('Navegando a Mi Planilla...');
        await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx', { waitUntil: 'domcontentloaded' });

        const tipoIdValue = DOC_CODES['Mi Planilla'][contratista.tipo_documento] || 'CC';
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

        // Resolución de Captcha de Imagen
        await resolverCaptcha(page, 'img[src*="captchaImage.aspx"]', '#cp1_txtCaptcha');

        if (process.env.BOT_HEADLESS === 'true') {
            await page.click('#cp1_ButtonConsultar');
        }
    } catch (err) {
        console.error('❌ Error en automatizarMiPlanilla:', err.message);
        throw err;
    }
}
