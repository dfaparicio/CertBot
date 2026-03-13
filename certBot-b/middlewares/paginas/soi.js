import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';

export async function automatizarSOI(page, contratista, reporte) {
    try {
        console.log('Navegando a SOI...');
        // Esperamos a que la página cargue completamente sus scripts
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'load' });

        // Aseguramos que el formulario principal esté listo
        await page.waitForSelector('select#tipoDocumentoAportante', { timeout: 10000 });

        const tipoIdValue = DOC_CODES['SOI'][contratista.tipo_documento] || '1';
        console.log(`📝 Ingresando datos SOI: ${contratista.numero_documento} (${tipoIdValue})`);
        
        await page.selectOption('select#tipoDocumentoAportante', tipoIdValue);
        await page.waitForTimeout(800); // Pausa para evitar error 'limpiarFormulario'
        
        await page.waitForSelector('input[name="numeroDocumentoAportante"]');
        await escribirHumano(page, 'input[name="numeroDocumentoAportante"]', contratista.numero_documento);

        await page.selectOption('select#tipoDocumentoCotizante', tipoIdValue);
        await page.waitForTimeout(800);
        
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
                    console.log(`📝 Seleccionando EPS: ${contratista.eps}`);
                    await page.selectOption('select#administradoraSalud', epsValue);
                    await page.dispatchEvent('select#administradoraSalud', 'change');
                    await page.waitForTimeout(500);
                }
            } catch (e) {
                console.log(`Aviso: Selector de EPS no disponible o error: ${e.message}`);
            }
        }

        const mes = reporte.mes_inicio || (new Date().getMonth() + 1).toString();
        const ano = reporte.ano || new Date().getFullYear().toString();

        console.log(`📝 Periodo: ${mes}/${ano}`);
        await page.waitForSelector('select#periodoLiqSaludMes');
        await page.selectOption('select#periodoLiqSaludMes', parseInt(mes, 10).toString());
        
        await page.waitForSelector('select#periodoLiqSaludAnnio');
        await page.selectOption('select#periodoLiqSaludAnnio', ano.toString());

        console.log('✅ Procediendo a descargar en SOI...');
        await page.waitForSelector('button.btn-success');
        await page.click('button.btn-success');
    } catch (err) {
        console.error('❌ Error en automatizarSOI:', err.message);
        throw err;
    }
}
