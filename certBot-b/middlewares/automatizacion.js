import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

const DOC_CODES = {
    'Aportes en Línea': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '2', 'Cédula de Extranjería': '2', 'Tarjeta de identidad': '3', 'NIT': '4' },
    'Mi Planilla': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI' },
    'SOI': { 'Cédula de ciudadania': '1', 'Cédula de Ciudadanía': '1', 'Cédula de extranjería': '3', 'Cédula de Extranjería': '3', 'Tarjeta de identidad': '6', 'NIT': '2' },
    'Asopagos': { 'Cédula de ciudadania': 'CC', 'Cédula de Ciudadanía': 'CC', 'Cédula de extranjería': 'CE', 'Cédula de Extranjería': 'CE', 'Tarjeta de identidad': 'TI', 'NIT': 'NI', 'Pasaporte': 'PA' }
};

// --- Helpers de Humanización y Captcha ---
const esperarAleatorio = (min = 500, max = 1500) =>
    new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function escribirHumano(page, selector, texto) {
    if (!texto) return;
    await page.focus(selector);
    await page.type(selector, texto.toString(), { delay: Math.random() * (120 - 40) + 40 });
}

async function resolverCaptcha(page, selectorImg, selectorInput) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') {
        console.log('⚠️ Sin 2Captcha Key. Saltando resolución automática.');
        return;
    }

    try {
        await page.waitForSelector(selectorImg, { timeout: 10000 });
        const elementoImg = await page.$(selectorImg);
        const imagenBase64 = await elementoImg.screenshot({ encoding: 'base64' });

        const res = await axios.post('https://2captcha.com/in.php', null, {
            params: {
                key: process.env.TWOCAPTCHA_KEY,
                method: 'base64',
                body: imagenBase64,
                json: 1
            }
        });

        if (res.data.status !== 1) {
            console.error('❌ Error al enviar imagen a 2Captcha:', res.data.request);
            return;
        }

        const taskId = res.data.request;
        let respuesta = '';

        for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const consulta = await axios.get('https://2captcha.com/res.php', {
                params: {
                    key: process.env.TWOCAPTCHA_KEY,
                    action: 'get',
                    id: taskId,
                    json: 1
                }
            });
            if (consulta.data.status === 1) {
                respuesta = consulta.data.request;
                break;
            }
            if (consulta.data.request !== 'CAPCHA_NOT_READY') {
                console.error('❌ Error en 2Captcha:', consulta.data.request);
                break;
            }
        }

        if (respuesta) {
            console.log('🤖 Captcha Resuelto por 2Captcha:', respuesta);
            await escribirHumano(page, selectorInput, respuesta);
        }
    } catch (e) {
        console.error('❌ Fallo al resolver captcha:', e.message);
    }
}

// --- Función Principal de Procesamiento ---
export const procesarReporte = async (reporteId, pagina) => {
    const Modelo = MODELOS[pagina];
    if (!Modelo) return;

    let browser;
    try {
        const reporte = await Modelo.findById(reporteId).populate('contratistaId');
        if (!reporte || reporte.estado_descarga) return;

        const contratista = reporte.contratistaId;
        if (!contratista) return;

        const isHeadless = process.env.BOT_HEADLESS === 'true';

        browser = await chromium.launch({
            headless: isHeadless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Configurar carpeta de descargas
        const downloadPath = path.join(process.cwd(), 'descargas');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

        console.log(`🚀 Iniciando Bot (${isHeadless ? 'Invisible' : 'Visible'}) para ${pagina}...`);

        switch (pagina) {
            case 'Aportes en Línea': await automatizarAportesEnLinea(page, contratista, reporte); break;
            case 'Mi Planilla': await automatizarMiPlanilla(page, contratista, reporte); break;
            case 'SOI': await automatizarSOI(page, contratista, reporte); break;
            case 'Asopagos': await automatizarAsopagos(page, contratista, reporte); break;
        }

        if (!isHeadless) {
            console.log(`✅ Datos llenados en ${pagina}. Esperando descarga manual y cierre...`);
            await page.waitForEvent('close', { timeout: 0 });
        } else {
            console.log(`🤖 Modo automático: Intentando capturar descarga...`);
            // Aquí se añade la lógica de clic en descargar si tenemos el selector
            // Por ahora esperamos un evento de descarga o cierre
            try {
                const download = await page.waitForEvent('download', { timeout: 30000 });
                const fileName = `Certificado_${pagina.replace(/ /g, '_')}_${contratista.numero_documento}.pdf`;
                await download.saveAs(path.join(downloadPath, fileName));
                console.log(`✅ Archivo descargado: ${fileName}`);
            } catch (e) {
                console.log('⚠️ No se detectó descarga automática. Verifique selectores.');
            }
        }

        reporte.estado_descarga = true;
        await reporte.save();

    } catch (error) {
        console.error(`❌ Error en el Bot (${pagina}):`, error.message);
    } finally {
        if (browser) await browser.close();
    }
};


export const ejecutarBot = async (req, res, next) => {
    const { reporteId, pagina } = req.body;

    if (!reporteId || !pagina) {
        return res.status(400).json({ ok: false, msg: 'reporteId y pagina son obligatorios' });
    }

    // Disparar sin esperar (background)
    procesarReporte(reporteId, pagina);

    res.json({
        ok: true,
        msg: 'Bot disparado exitosamente'
    });
};


async function resolverReCaptcha(page, siteKey, url) {
    if (!process.env.TWOCAPTCHA_KEY || process.env.TWOCAPTCHA_KEY === 'TU_CLAVE_DE_2CAPTCHA_AQUI') return;

    try {
        console.log('🤖 Solicitando resolución de reCAPTCHA a 2Captcha...');
        const res = await axios.post('https://2captcha.com/in.php', null, {
            params: {
                key: process.env.TWOCAPTCHA_KEY,
                method: 'userrecaptcha',
                googlekey: siteKey,
                pageurl: url,
                json: 1
            }
        });

        if (res.data.status !== 1) {
            console.error('❌ Error al enviar reCAPTCHA:', res.data.request);
            return;
        }

        const taskId = res.data.request;
        let gResponse = '';

        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 5000));
            const consulta = await axios.get('https://2captcha.com/res.php', {
                params: {
                    key: process.env.TWOCAPTCHA_KEY,
                    action: 'get',
                    id: taskId,
                    json: 1
                }
            });
            if (consulta.data.status === 1) {
                gResponse = consulta.data.request;
                break;
            }
            if (consulta.data.request !== 'CAPCHA_NOT_READY') {
                console.error('❌ Error en 2Captcha reCAPTCHA:', consulta.data.request);
                break;
            }
        }

        if (gResponse) {
            console.log('✅ reCAPTCHA resuelto con 2Captcha.');
            await page.evaluate((token) => {
                const elements = document.getElementsByName('g-recaptcha-response');
                for (let el of elements) {
                    el.value = token;
                    el.innerHTML = token;
                }
            }, gResponse);
        }
    } catch (e) {
        console.error('❌ Error en reCAPTCHA:', e.message);
    }
}

// --- Funciones de Automatización con Selectores Reales ---

async function automatizarAportesEnLinea(page, contratista, reporte) {
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

async function automatizarMiPlanilla(page, contratista, reporte) {
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

async function automatizarSOI(page, contratista, reporte) {
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

async function automatizarAsopagos(page, contratista, reporte) {
    try {
        console.log('Navegando a Asopagos...');
        await page.goto('https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp', { waitUntil: 'domcontentloaded' });

        if (reporte.tipo_certificado === 0) {
            await page.check('input[value="verCertificadoTresNuevo"]');
        } else if (reporte.tipo_certificado === 1) {
            await page.check('input[value="verCertificadoCesantias"]');
        }

        const tipoDoc = DOC_CODES['Asopagos'][contratista.tipo_documento] || 'CC';
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

        // Resolución de Captcha de Imagen
        await resolverCaptcha(page, 'img#captcha_imgpop', '#captchaIn');

        if (process.env.BOT_HEADLESS === 'true') {
            await page.click('#enviarConsRP');
        }
    } catch (err) {
        console.error('❌ Error en automatizarAsopagos:', err.message);
        throw err;
    }
}

