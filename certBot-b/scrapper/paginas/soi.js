import path from 'path';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';

const getTimestamp = () => `[\x1b[90m${new Date().toLocaleTimeString()}\x1b[0m]`;

export async function automatizarSOI(page, contratista, reporte, manejarArchivo, io, reporteId) {
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
        
        // Iniciamos la escucha del evento ANTES del clic
        const downloadPromise = page.waitForEvent('download', { timeout: 45000 }).catch(() => null);
        
        await page.click('button.btn-success');

        const download = await downloadPromise;
        if (download && manejarArchivo) {
            console.info(`${getTimestamp()} \x1b[35m[FILE]\x1b[0m 📥 Descarga capturada de SOI.`);
            enviarEstado("Descarga capturada. Procesando archivo...");
            const suggestedFileName = download.suggestedFilename();
            const extension = suggestedFileName.split('.').pop() || 'zip';
            const fileName = `${contratista.nombre}_${contratista.apellidos}_${contratista.numero_documento}.${extension}`.replace(/\s+/g, '_');
            const downloadPath = path.join(process.cwd(), 'descargas');
            const fullPath = path.join(downloadPath, fileName);
            
            await download.saveAs(fullPath);
            await manejarArchivo(fullPath, fileName);
            enviarEstado("¡Reporte de SOI procesado y subido!");
        }
    } catch (err) {
        console.error(`${getTimestamp()} \x1b[31m[ERROR]\x1b[0m ❌ Error en portal SOI:`, err.message);
        enviarEstado("Error crítico en el portal de SOI.", true);
        throw err;
    }
}
