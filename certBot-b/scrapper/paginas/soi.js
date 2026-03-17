import path from 'path';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarSOI(page, contratista, reporte, manejarArchivo, io, reporteId, permitirDescarga) {
    const enviarEstado = (msg, error = false) => {
        if (io) io.emit(`status_${reporteId}`, { msg, error, time: new Date().toLocaleTimeString() });
    };

    try {
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 🌐 Navegando a portal SOI...`);
        enviarEstado("Navegando al portal de SOI...");
        // Esperamos a que la página cargue completamente sus scripts
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'load' });

        // Aseguramos que el formulario principal esté listo
        await page.waitForSelector('select#tipoDocumentoAportante', { timeout: 10000 });

        const tipoIdValue = DOC_CODES['SOI'][contratista.tipo_documento] || '1';
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📝 Ingresando credenciales del contratista...`);
        enviarEstado("Ingresando credenciales del contratista...");
        
        await page.selectOption('select#tipoDocumentoAportante', tipoIdValue);
        await page.waitForTimeout(1000); 
        
        await page.waitForSelector('input[name="numeroDocumentoAportante"]');
        await escribirHumano(page, 'input[name="numeroDocumentoAportante"]', contratista.numero_documento);

        await page.selectOption('select#tipoDocumentoCotizante', tipoIdValue);
        await page.waitForTimeout(1000);
        
        await page.waitForSelector('input#numeroDocumentoCotizante');
        await escribirHumano(page, 'input#numeroDocumentoCotizante', contratista.numero_documento);

        if (contratista.eps) {
            try {
                // Esperamos que el selector de EPS esté presente
                await page.waitForSelector('select#administradoraSalud', { timeout: 5000 });
                const epsValue = await page.evaluate((epsQuery) => {
                    const select = document.querySelector('select#administradoraSalud');
                    if (!select) return null;
                    const options = Array.from(select.options);
                    const found = options.find(o => o.textContent.toLowerCase().includes(epsQuery.toLowerCase().trim()));
                    return found ? found.value : null;
                }, contratista.eps);

                if (epsValue) {
                    console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📝 Seleccionando EPS: \x1b[36m${contratista.eps}\x1b[0m`);
                    enviarEstado(`Seleccionando EPS: ${contratista.eps}...`);
                    await page.selectOption('select#administradoraSalud', epsValue);
                    await page.dispatchEvent('select#administradoraSalud', 'change');
                    await page.waitForTimeout(800);
                }
            } catch (e) {
                console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ Selector de EPS no disponible.`);
            }
        }

        const mes = reporte.mes_inicio || (new Date().getMonth() + 1).toString();
        const ano = reporte.ano || new Date().getFullYear().toString();

        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📅 Periodo: \x1b[36m${mes}/${ano}\x1b[0m`);
        enviarEstado(`Configurando periodo: ${mes}/${ano}...`);
        await page.waitForSelector('select#periodoLiqSaludMes');
        await page.selectOption('select#periodoLiqSaludMes', parseInt(mes, 10).toString());
        
        await page.waitForSelector('select#periodoLiqSaludAnnio');
        await page.selectOption('select#periodoLiqSaludAnnio', ano.toString());

        console.info(`${getTimestamp()} \x1b[32m[SUCCESS]\x1b[0m ✅ Datos completados, iniciando descarga...`);
        enviarEstado("Iniciando generación de descarga en SOI...");
        await page.waitForSelector('button.btn-success');
        
        // --- VALIDACIÓN DE ERROR ANTES DE CLIC ---
        const errorVisible = await page.evaluate(() => {
            const bodyText = document.body.innerText.toLowerCase();
            return bodyText.includes('error') || bodyText.includes('incorrecto') || bodyText.includes('no existe');
        });

        if (errorVisible) {
            console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Se detectó un error en el portal de SOI.`);
            enviarEstado("Error detectado en el portal. Cancelando descarga.", true);
            throw new Error("Error detectado en el portal antes de descargar");
        }

        // Si llegamos aquí, permitimos la descarga
        if (permitirDescarga) permitirDescarga();
        
        // Preparamos la promesa de descarga antes del clic
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);

        // El controlador central en automatizacion.js también capturará el evento 'download'
        await page.click('button.btn-success');

        const download = await downloadPromise;
        if (download) {
            console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📥 Descarga de SOI detectada: ${download.suggestedFilename()}`);
            enviarEstado("Archivo generado y capturado con éxito.");
            
            // Guardamos el archivo nosotros mismos ya que tenemos el objeto 'download'
            const docNum = contratista.numero_documento;
            const nombre = (contratista.nombre || 'Sin').trim().replace(/\s+/g, '_');
            const apellido = (contratista.apellidos || 'Nombre').trim().replace(/\s+/g, '_');
            const extension = download.suggestedFilename().split('.').pop() || 'zip';
            const fileName = `${nombre}_${apellido}_${docNum}.${extension}`;
            const downloadPath = path.join(process.cwd(), 'descargas');
            const fullPath = path.join(downloadPath, fileName);

            await download.saveAs(fullPath);
            console.info(`${getTimestamp()} \x1b[32m[FILE]\x1b[0m ✅ Archivo de SOI guardado en: ${fileName}`);
            
            if (manejarArchivo) {
                await manejarArchivo(fullPath, fileName);
            }
        } else {
            console.warn(`${getTimestamp()} \x1b[33m[BOT]\x1b[0m ⚠️ El portal no inició la descarga automáticamente.`);
        }

        // Esperar un momento razonable para que el controlador central termine de procesar si es necesario
        await page.waitForTimeout(5000); 
        console.info(`${getTimestamp()} \x1b[34m[BOT]\x1b[0m 📜 Transacción en SOI completada.`);

    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en portal SOI:`, err.message);
        enviarEstado("Error crítico en el portal de SOI.", true);
        throw err;
    }
}
