import path from 'path';
import fs from 'fs';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';
import { resolverCaptcha } from '../../helpers/captcha.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarAsopagos(page, contratista, reporte, manejarArchivo, io, reporteId, permitirDescarga) {
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

            // --- VALIDACIÓN DE ERROR ANTES DE CLIC ---
            const errorVisible = await page.evaluate(() => {
                const bodyText = document.body.innerText.toLowerCase();
                return bodyText.includes('error') || bodyText.includes('incorrecto') || bodyText.includes('no existe') || bodyText.includes('no se encontró');
            });

            if (errorVisible) {
                console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Se detectó un error en el portal de Asopagos.`);
                enviarEstado("Error detectado en el portal. Cancelando descarga.", true);
                throw new Error("Error detectado en el portal antes de descargar");
            }

            // Si llegamos aquí, permitimos la descarga
            if (permitirDescarga) permitirDescarga();

            // Escuchar los dos eventos en paralelo ANTES del clic
            const downloadPromise = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
            const pagePromise = page.context().waitForEvent('page', { timeout: 60000 }).catch(() => null);

            await page.click('#enviarConsRP');
            enviarEstado("Formulario enviado. Esperando respuesta del portal...");

            // Esperar un momento a ver qué sucede primero
            const [download, newPage] = await Promise.all([
                downloadPromise,
                pagePromise
            ]);

            if (download) {
                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📥 Descarga directa detectada en Asopagos.`);
                enviarEstado("Descarga detectada. Procesando archivo...");
                
                const docNum = contratista.numero_documento;
                const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
                const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
                const extension = download.suggestedFilename().split('.').pop() || 'pdf';
                const fileName = `${nombre}_${apellido}_${docNum}.${extension}`;
                const downloadPath = path.join(process.cwd(), 'descargas');
                const fullPath = path.join(downloadPath, fileName);

                await download.saveAs(fullPath);
                console.info(`${getTimestamp()} \x1b[32m[FILE]\x1b[0m ✅ Archivo de Asopagos guardado en: ${fileName}`);
                
                if (manejarArchivo) {
                    await manejarArchivo(fullPath, fileName);
                }
                return;
            }

            if (newPage) {
                console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m ✨ Nueva pestaña detectada en Asopagos.`);
                enviarEstado("El reporte se abrió en una nueva pestaña. Capturando...");
                
                // Esperamos a que la nueva pestaña cargue o el controlador central la procese
                await newPage.waitForLoadState('networkidle').catch(() => null);
                await page.waitForTimeout(8000); 
                return;
            }

            // Si nada de lo anterior funcionó, intentar captura por respuesta de red
            console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ Sin descarga directa ni pestaña. Buscando flujo de red...`);
            const respRed = await page.waitForResponse(
                res => res.url().toLowerCase().includes('.pdf') || (res.headers()['content-type'] || '').includes('pdf'),
                { timeout: 15000 }
            ).catch(() => null);

            if (respRed && manejarArchivo) {
                const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}_V.pdf`.replace(/\s+/g, '_');
                const fullPath = path.join(process.cwd(), 'descargas', fileName);
                fs.writeFileSync(fullPath, await respRed.body());
                await manejarArchivo(fullPath, fileName);
                enviarEstado("¡Reporte capturado exitosamente desde la red!");
            } else {
                console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ No se detectó el archivo de Asopagos.`);
                enviarEstado("No se pudo capturar el archivo tras la consulta.", true);
            }
        } else {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ No se pudo resolver el captcha.`);
            enviarEstado("No se pudo resolver el captcha.", true);
            throw new Error("Captcha no resuelto");
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en portal Asopagos:`, err.message);
        enviarEstado("Error crítico en el portal de Asopagos.", true);
        throw err;
    }
}
