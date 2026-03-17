import path from 'path';
import fs from 'fs';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';
import { resolverCaptcha } from '../../helpers/captcha.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarAsopagos(page, contratista, reporte, manejarArchivo, io, reporteId) {
    const enviarEstado = (msg, error = false) => {
        if (io) io.emit(`status_${reporteId}`, { msg, error, time: new Date().toLocaleTimeString() });
    };

    try {
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 🌐 Navegando a portal Asopagos...`);
        enviarEstado("Navegando al portal de Asopagos...");
        await page.goto('https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp', { waitUntil: 'domcontentloaded' });

        if (reporte.tipo_certificado === 0) {
            await page.check('input[value="verCertificadoTresNuevo"]');
        } else if (reporte.tipo_certificado === 1) {
            await page.check('input[value="verCertificadoCesantias"]');
        }

        const tipoDoc = DOC_CODES['Asopagos'][contratista.tipo_documento] || 'CC';
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📝 Ingresando credenciales del contratista...`);
        enviarEstado("Ingresando credenciales del contratista...");
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

        enviarEstado("Resolviendo captcha visual...");
        const resuelto = await resolverCaptcha(page, 'img#captcha_imgpop', '#captchaIn', io, reporteId);

        if (resuelto) {
            console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Captcha resuelto, iniciando descarga...`);
            enviarEstado("Captcha resuelto. Iniciando descarga...");

            // Escuchar los dos eventos en paralelo ANTES del clic
            const downloadPromise = page.waitForEvent('download', { timeout: 45000 })
                .then(dl => ({ tipo: 'download', data: dl }))
                .catch(() => null);

            const pagePromise = page.context().waitForEvent('page', { timeout: 45000 })
                .then(pg => ({ tipo: 'page', data: pg }))
                .catch(() => null);

            await page.click('#enviarConsRP');
            enviarEstado("Formulario enviado. Esperando respuesta del portal...");

            // Reaccionar a lo que llegue primero
            const resultado = await Promise.race([downloadPromise, pagePromise]);

            if (!resultado) {
                // Ninguno llego a tiempo — intentar captura por respuesta de red en la misma página
                console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ Sin descarga directa. Buscando PDF en la red...`);
                const respRed = await page.waitForResponse(
                    res => res.url().toLowerCase().includes('.pdf') || (res.headers()['content-type'] || '').includes('pdf'),
                    { timeout: 20000 }
                ).catch(() => null);

                if (respRed && manejarArchivo) {
                    const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}.pdf`.replace(/\s+/g, '_');
                    const fullPath = path.join(process.cwd(), 'descargas', fileName);
                    fs.writeFileSync(fullPath, await respRed.body());
                    await manejarArchivo(fullPath, fileName);
                    enviarEstado("¡Reporte de Asopagos capturado desde respuesta de red!");
                    return;
                }

                console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ No se detectó descarga ni nueva pestaña.`);
                enviarEstado("No se detectó el archivo tras la consulta.", true);
                return;
            }

            if (resultado.tipo === 'download') {
                const download = resultado.data;
                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📥 Descarga directa interceptada.`);
                enviarEstado("Descarga directa interceptada. Procesando archivo...");
                const suggestedFileName = download.suggestedFilename();
                const extension = suggestedFileName.split('.').pop() || 'pdf';
                const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}.${extension}`.replace(/\s+/g, '_');
                const fullPath = path.join(process.cwd(), 'descargas', fileName);
                await download.saveAs(fullPath);
                await manejarArchivo(fullPath, fileName);
                enviarEstado("¡Reporte de Asopagos procesado!");
                return;
            }

            if (resultado.tipo === 'page') {
                const newPage = resultado.data;
                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m ✨ Nueva pestaña detectada. Capturando PDF...`);
                enviarEstado("Nueva pestaña detectada. Capturando PDF del reporte...");

                // Esperar a que la nueva pestaña cargue y buscar el PDF
                const response = await newPage.waitForResponse(
                    res => res.url().toLowerCase().endsWith('.pdf') || (res.headers()['content-type'] || '').includes('pdf'),
                    { timeout: 25000 }
                ).catch(() => null);

                if (response && manejarArchivo) {
                    const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}_V.pdf`.replace(/\s+/g, '_');
                    const fullPath = path.join(process.cwd(), 'descargas', fileName);
                    fs.writeFileSync(fullPath, await response.body());
                    await manejarArchivo(fullPath, fileName);
                    await newPage.close();
                    enviarEstado("¡Reporte de Asopagos procesado desde nueva pestaña!");
                    return;
                }

                // Si la nueva pestaña no trajo un PDF directamente, intentar descarga desde ella
                const dlFromPage = await newPage.waitForEvent('download', { timeout: 15000 }).catch(() => null);
                if (dlFromPage && manejarArchivo) {
                    const suggestedFileName = dlFromPage.suggestedFilename();
                    const extension = suggestedFileName.split('.').pop() || 'pdf';
                    const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}_V.${extension}`.replace(/\s+/g, '_');
                    const fullPath = path.join(process.cwd(), 'descargas', fileName);
                    await dlFromPage.saveAs(fullPath);
                    await manejarArchivo(fullPath, fileName);
                    await newPage.close();
                    enviarEstado("¡Reporte de Asopagos procesado desde nueva pestaña (descarga)!");
                    return;
                }

                console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ La nueva pestaña no trajo ningún archivo.`);
                enviarEstado("La nueva pestaña no entregó ningún archivo.", true);
            }
        } else {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ No se pudo resolver el captcha.`);
            enviarEstado("No se pudo resolver el captcha.", true);
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en portal Asopagos:`, err.message);
        enviarEstado("Error crítico en el portal de Asopagos.", true);
        throw err;
    }
}
