import path from 'path';
import fs from 'fs';
import { escribirHumano, DOC_CODES, esperarAleatorio } from '../../helpers/botUtils.js';
import { resolverCaptcha } from '../../helpers/captcha.js';
import { convertirImagenAPDF, manejarSubidaADrive } from '../../helpers/descargas.js';

export async function automatizarMiPlanilla(page, contratista, reporte) {
    try {
        console.log('Navegando a Mi Planilla...');
        await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx', { waitUntil: 'domcontentloaded' });

        const tipoIdValue = DOC_CODES['Mi Planilla'][contratista.tipo_documento] || 'CC';
        console.log(`📝 Ingresando datos Mi Planilla: ${contratista.numero_documento} (${tipoIdValue})`);
        
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
        const resuelto = await resolverCaptcha(page, 'img[src*="captchaImage.aspx"]', '#cp1_txtCaptcha');

        if (resuelto) {
            console.log('✅ Captcha superado, procediendo a consultar...');
            await page.click('#cp1_ButtonConsultar');
            
            // Esperamos a que aparezca el resultado (usualmente un contenedor con el reporte)
            // Selector tentativo basado en la descripción del usuario: buscaremos una imagen o un área de resultados
            await page.waitForTimeout(3000); // Espera base para que cargue la respuesta

            // Intentamos localizar el área de resultado. Si es una imagen después del botón:
            const selectorImagen = 'img#cp1_ImageResultado, #cp1_pnlResultado img, .resultado-planilla img'; // Selectores probables
            
            try {
                const imgElement = await page.waitForSelector(selectorImagen, { timeout: 10000 }).catch(() => null);
                
                if (imgElement) {
                    console.log('📸 Imagen de resultado encontrada. Capturando...');
                    const screenshotBuffer = await imgElement.screenshot();
                    
                    const docNum = contratista.numero_documento;
                    const nombreLimpio = (contratista.nombre || `Contratista_${docNum}`).trim().replace(/\s+/g, '_');
                    const downloadPath = path.join(process.cwd(), 'descargas');
                    if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath, { recursive: true });

                    const fileNamePdf = `${nombreLimpio}_${docNum}_Reporte.pdf`;
                    const fullPathPdf = path.join(downloadPath, fileNamePdf);

                    const exitoPdf = await convertirImagenAPDF(screenshotBuffer, fullPathPdf);
                    
                    if (exitoPdf) {
                        console.log(`✅ PDF generado desde imagen: ${fileNamePdf}`);
                        await manejarSubidaADrive(fullPathPdf, fileNamePdf, reporte, contratista);
                    }
                } else {
                    console.log('⚠️ No se encontró una imagen de resultado específica. Tomando captura de pantalla general.');
                    // Si no hay imagen específica, capturamos el área visible como respaldo
                    const body = await page.$('body');
                    const fullPageBuffer = await body.screenshot();
                    // ... mismo proceso
                }
            } catch (e) {
                console.log('⚠️ Error al capturar resultado en Mi Planilla:', e.message);
            }

        } else {
            console.error('❌ No se pudo resolver el captcha en Mi Planilla.');
        }
    } catch (err) {
        console.error('❌ Error en automatizarMiPlanilla:', err.message);
        throw err;
    }
}
