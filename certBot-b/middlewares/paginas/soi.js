import { escribirHumano, DOC_CODES } from '../automatizacion.js';

export async function automatizarSOI(page, contratista, reporte) {
    try {
        console.log('Navegando a SOI...');
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'domcontentloaded' });

        const tipoIdValue = DOC_CODES['SOI'][contratista.tipo_documento] || '1';
        await page.selectOption('select#tipoDocumentoAportante', tipoIdValue);
        await escribirHumano(page, 'input[name="numeroDocumentoAportante"]', contratista.numero_documento);

        await page.selectOption('select#tipoDocumentoCotizante', tipoIdValue);
        await escribirHumano(page, 'input#numeroDocumentoCotizante', contratista.numero_documento);

        if (contratista.eps) {
            try {
                await page.waitForTimeout(1000);
                const epsValue = await page.evaluate((epsQuery) => {
                    const select = document.querySelector('select#administradoraSalud');
                    if (!select) return null;
                    const options = Array.from(select.options);
                    const found = options.find(o => o.textContent.toLowerCase().includes(epsQuery.toLowerCase().trim()));
                    return found ? found.value : null;
                }, contratista.eps);

                if (epsValue) {
                    await page.selectOption('select#administradoraSalud', epsValue);
                    await page.dispatchEvent('select#administradoraSalud', 'change');
                }
            } catch (e) {
                console.log(`Error al seleccionar EPS en SOI: ${e.message}`);
            }
        }

        const mes = reporte.mes_inicio || (new Date().getMonth() + 1).toString();
        const ano = reporte.ano || new Date().getFullYear().toString();

        await page.selectOption('select#periodoLiqSaludMes', parseInt(mes, 10).toString());
        await page.selectOption('select#periodoLiqSaludAnnio', ano.toString());

        if (process.env.BOT_HEADLESS === 'true') {
            await page.click('button.btn-success');
        }
    } catch (err) {
        console.error('❌ Error en automatizarSOI:', err.message);
        throw err;
    }
}
