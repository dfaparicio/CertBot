import { escribirHumano, DOC_CODES, esperarAleatorio } from '../automatizacion.js';
import { resolverReCaptcha } from '../../helpers/captcha.js';

export async function automatizarAportesEnLinea(page, contratista, reporte) {
    try {
        console.log('Navegando a Aportes en Línea...');
        await page.goto('https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx', { waitUntil: 'domcontentloaded' });

        await page.click('label[for="contenido_Pila"]');
        await esperarAleatorio(800, 1500);

        const tipoIdValue = DOC_CODES['Aportes en Línea'][contratista.tipo_documento] || '1';
        try {
            await page.selectOption('select#contenido_ddlTipoIdent', { value: tipoIdValue, timeout: 3000 });
        } catch (e) {
            await page.selectOption('select#contenido_ddlTipoIdent', { label: contratista.tipo_documento });
        }
        await escribirHumano(page, 'input#contenido_tbNumeroIdentificacion', contratista.numero_documento);

        if (contratista.fecha_expedicion) {
            const fechaExp = new Date(contratista.fecha_expedicion);
            const fechaFormateada = `${fechaExp.getUTCFullYear()}/${(fechaExp.getUTCMonth() + 1).toString().padStart(2, '0')}/${fechaExp.getUTCDate().toString().padStart(2, '0')}`;
            await escribirHumano(page, 'input#contenido_txtFechaExp', fechaFormateada);
        }

        if (contratista.eps) {
            await escribirHumano(page, 'input#contenido_txtAdmin', contratista.eps);
        }

        if (reporte.ano) {
            const anioStr = reporte.ano.toString();
            await page.selectOption('select#contenido_ddlAnioIni', anioStr);
            await page.selectOption('select#contenido_ddlAnioFin', anioStr);
        }

        if (reporte.mes_inicio) {
            await page.selectOption('select#contenido_ddlMesIni', parseInt(reporte.mes_inicio, 10).toString().padStart(2, '0'));
        }

        if (reporte.mes_final) {
            await page.selectOption('select#contenido_ddlMesFin', parseInt(reporte.mes_final, 10).toString().padStart(2, '0'));
        }

        if (contratista.tipo_afiliado === 'Cotizante' || contratista.tipo_afiliado === 'Cotizante activo') {
            await page.click('label[for="contenido_rdbActivo"]');
        } else if (contratista.tipo_afiliado === 'Pensionado') {
            await page.click('label[for="contenido_rdbPensionado"]');
        }

        // Resolución de reCAPTCHA
        await resolverReCaptcha(page, '6Lc6FDMUAAAAAKwQX0_xF92Z1MiUXm4sYbQ6bh6J', page.url());

        if (process.env.BOT_HEADLESS === 'true') {
            await page.click('#contenido_btnCalcular');
        }
    } catch (err) {
        console.error('❌ Error en automatizarAportesEnLinea:', err.message);
        throw err;
    }
}
