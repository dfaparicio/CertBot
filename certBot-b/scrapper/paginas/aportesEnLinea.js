import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';
import { resolverReCaptcha } from '../../helpers/captcha.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarAportesEnLinea(page, contratista, reporte, io, reporteId) {
    const enviarEstado = (msg, error = false) => {
        if (io) io.emit(`status_${reporteId}`, { msg, error, time: new Date().toLocaleTimeString() });
    };

    try {
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 🌐 Navegando a Aportes en Línea...`);
        enviarEstado("Navegando al portal de Aportes en Línea...");
        await page.goto('https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx', { waitUntil: 'domcontentloaded' });

        await page.click('label[for="contenido_Pila"]');
        await esperarAleatorio(800, 1500);

        const tipoIdValue = DOC_CODES['Aportes en Línea'][contratista.tipo_documento] || '1';
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📝 Ingresando credenciales del contratista...`);
        enviarEstado("Ingresando credenciales del contratista...");

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

        const anioStr = reporte.ano ? reporte.ano.toString() : new Date().getFullYear().toString();
        await page.selectOption('select#contenido_ddlAnioIni', anioStr);
        await page.selectOption('select#contenido_ddlAnioFin', anioStr);

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

        enviarEstado("Resolviendo reCAPTCHA (esto puede tardar 2-3 minutos)...");
        const resuelto = await resolverReCaptcha(page, '6Lc6FDMUAAAAAKwQX0_xF92Z1MiUXm4sYbQ6bh6J', page.url(), io, reporteId);

        if (resuelto) {
            console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ reCAPTCHA superado, generando descarga...`);
            enviarEstado("reCAPTCHA superado. Generando descarga del archivo...");
            await page.click('#contenido_btnCalcular');
            enviarEstado("Botón de descarga pulsado. Procesando...");
            // Esperamos un momento para que el controlador central capture el evento
            await page.waitForTimeout(5000);
        } else {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ No se pudo resolver el reCAPTCHA.`);
            enviarEstado("No se pudo resolver el reCAPTCHA.", true);
            throw new Error("No se pudo superar el reCAPTCHA de Aportes en Línea");
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en Aportes en Línea:`, err.message);
        enviarEstado("Error crítico en Aportes en Línea.", true);
        throw err;
    }
}
