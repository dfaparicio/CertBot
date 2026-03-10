import { chromium } from 'playwright';
import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import Contratista from '../models/Contratista.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

export const ejecutarBot = async (req, res, next) => {
    const { reporteId, pagina } = req.body;

    if (!reporteId || !pagina) {
        return res.status(400).json({
            ok: false,
            msg: 'reporteId y pagina son obligatorios'
        });
    }

    const Modelo = MODELOS[pagina];
    if (!Modelo) {
        return res.status(400).json({
            ok: false,
            msg: `La página "${pagina}" no es válida`
        });
    }

    let browser;
    try {
        // 1. Buscar el reporte y el contratista
        const reporte = await Modelo.findById(reporteId).populate('contratistaId');
        if (!reporte) {
            return res.status(404).json({
                ok: false,
                msg: 'Reporte no encontrado'
            });
        }

        const contratista = reporte.contratistaId;
        if (!contratista) {
            return res.status(400).json({
                ok: false,
                msg: 'El reporte no tiene un contratista asociado'
            });
        }

        // 2. Iniciar el bot
        browser = await chromium.launch({
            headless: false, // Cambiar a false si quieres ver el proceso
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const context = await browser.newContext();
        const page = await context.newPage();

        // 3. Lógica por portal
        switch (pagina) {
            case 'Aportes en Línea':
                await automatizarAportesEnLinea(page, contratista, reporte);
                break;
            case 'Mi Planilla':
                await automatizarMiPlanilla(page, contratista, reporte);
                break;
            case 'SOI':
                await automatizarSOI(page, contratista, reporte);
                break;
            case 'Asopagos':
                await automatizarAsopagos(page, contratista, reporte);
                break;
            default:
                throw new Error(`Lógica no implementada para ${pagina}`);
        }

        // 4. Actualizar estado en la BD
        reporte.estado_descarga = true;
        await reporte.save();

        req.botResultado = {
            ok: true,
            msg: 'Automatización completada con éxito'
        };

        await browser.close();
        next();

    } catch (error) {
        if (browser) await browser.close();
        console.error('Error en el Bot:', error);
        next(error);
    }
};

// --- Funciones de Automatización con Selectores Reales ---

async function automatizarAportesEnLinea(page, contratista, reporte) {
    try {
        console.log('Navegando a Aportes en Línea...');
        await page.goto('https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx', { waitUntil: 'domcontentloaded' });

        // 1. Pestaña PILA (Generalmente ya seleccionada por defecto)
        await page.click('label[for="contenido_Pila"]');

        // Mapeo seguro para los values del select
        const tipoIdMapping = {
            'Cédula de ciudadania': '1',
            'Cédula de Ciudadanía': '1',
            'Cédula de extranjería': '2',
            'Cédula de Extranjería': '2',
            'Tarjeta de identidad': '3',
            'NIT': '4' // Asumido, en caso de fallo hará fallback a label
        };
        const tipoIdValue = tipoIdMapping[contratista.tipo_documento] || '1';

        // 2. Datos de Identificación
        console.log('Seleccionando tipo documento...');
        try {
            await page.selectOption('select#contenido_ddlTipoIdent', { value: tipoIdValue, timeout: 3000 });
        } catch (e) {
            await page.selectOption('select#contenido_ddlTipoIdent', { label: contratista.tipo_documento });
        }

        console.log('Llenando identificacion...');
        await page.fill('input#contenido_tbNumeroIdentificacion', contratista.numero_documento);

        // 3. Fecha de Expedición (Formato AAAA/MM/DD)
        if (contratista.fecha_expedicion) {
            console.log('Llenando fecha expedicion...');
            const fechaExp = new Date(contratista.fecha_expedicion);
            const fechaFormateada = `${fechaExp.getUTCFullYear()}/${(fechaExp.getUTCMonth() + 1).toString().padStart(2, '0')}/${fechaExp.getUTCDate().toString().padStart(2, '0')}`;
            await page.fill('input#contenido_txtFechaExp', fechaFormateada);
        }

        // 4. EPS
        if (contratista.eps) {
            console.log('Llenando EPS...');
            await page.fill('input#contenido_txtAdmin', contratista.eps);
        }

        // 5. Rango de Fechas (Desde - Hasta)
        if (reporte.ano) {
            console.log('Llenando año...');
            const anioStr = reporte.ano.toString();
            await page.selectOption('select#contenido_ddlAnioIni', anioStr);
            await page.selectOption('select#contenido_ddlAnioFin', anioStr);
        }

        if (reporte.mes_inicio) {
            console.log('Llenando mes inicio...');
            await page.selectOption('select#contenido_ddlMesIni', parseInt(reporte.mes_inicio, 10).toString().padStart(2, '0'));
        }

        if (reporte.mes_final) {
            console.log('Llenando mes fin...');
            await page.selectOption('select#contenido_ddlMesFin', parseInt(reporte.mes_final, 10).toString().padStart(2, '0'));
        }

        // 6. Actualmente usted es (Cotizante Activo o Pensionado)
        console.log('Seleccionando tipo cotizante...');
        if (contratista.tipo_afiliado === 'Cotizante' || contratista.tipo_afiliado === 'Cotizante activo') {
            await page.click('label[for="contenido_rdbActivo"]');
        } else if (contratista.tipo_afiliado === 'Pensionado') {
            await page.click('label[for="contenido_rdbPensionado"]');
        }

        console.log('✅ Bot: Datos llenados en Aportes en Línea. Esperando Captcha...');
    } catch (err) {
        console.error('❌ Error en automatizarAportesEnLinea:', err.message);
        throw err;
    }
}

async function automatizarMiPlanilla(page, contratista, reporte) {
    try {
        console.log('Navegando a Mi Planilla...');
        await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx', { waitUntil: 'domcontentloaded' });

        const tipoIdMapping = {
            'Cédula de ciudadania': 'CC',
            'Cédula de Ciudadanía': 'CC',
            'Cédula de extranjería': 'CE',
            'Cédula de Extranjería': 'CE',
            'Tarjeta de identidad': 'TI',
            'NIT': 'NI'
        };
        const tipoIdValue = tipoIdMapping[contratista.tipo_documento] || 'CC';

        console.log(`Seleccionando tipo documento (${tipoIdValue})...`);
        await page.selectOption('select#cp1_ddlTipoDocumento', tipoIdValue);

        console.log('Llenando numero documento...');
        await page.fill('input#cp1_txtNumeroDocumento', contratista.numero_documento);

        if (reporte.numero_planilla) {
            console.log('Llenando numero planilla...');
            await page.fill('input#cp1_txtNumeroPlanilla', reporte.numero_planilla);
        }

        if (reporte.pago_planilla) {
            console.log('Llenando fecha de pago de planilla...');
            const fechaPago = new Date(reporte.pago_planilla);
            // Día puede venir sin padding
            await page.selectOption('select#cp1_cmbDiaPago', fechaPago.getUTCDate().toString());
            await page.selectOption('select#cp1_cmbMesPago', (fechaPago.getUTCMonth() + 1).toString());
            await page.selectOption('select#cp1_ddlAnoPago', fechaPago.getUTCFullYear().toString());
        }

        if (reporte.periodo_salud) {
            console.log('Llenando periodo salud...');
            const [mes, ano] = reporte.periodo_salud.includes('/')
                ? reporte.periodo_salud.split('/')
                : [reporte.mes_inicio, reporte.ano];

            await page.selectOption('select#cp1_ddlMesSalud', parseInt(mes, 10).toString());
            await page.selectOption('select#cp1_ddlAnoSalud', ano.toString());
        }

        if (reporte.valor_planilla) {
            console.log('Llenando valor planilla...');
            await page.fill('input#cp1_txtValorPagado', reporte.valor_planilla.toString());
        }

        console.log('✅ Bot: Datos llenados en Mi Planilla. Esperando Captcha...');
    } catch (err) {
        console.error('❌ Error en automatizarMiPlanilla:', err.message);
        throw err;
    }
}

async function automatizarSOI(page, contratista, reporte) {
    try {
        console.log('Navegando a SOI...');
        await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do', { waitUntil: 'domcontentloaded' });

        const tipoIdMapping = {
            'Cédula de ciudadania': '1',
            'Cédula de Ciudadanía': '1',
            'Cédula de extranjería': '3',
            'Cédula de Extranjería': '3',
            'Tarjeta de identidad': '6',
            'NIT': '2'
        };
        const tipoIdValue = tipoIdMapping[contratista.tipo_documento] || '1';

        // 1. Información del Aportante (Suelen ser los mismos datos para independientes)
        console.log(`Llenando Aportante (${tipoIdValue})...`);
        await page.selectOption('select#tipoDocumentoAportante', tipoIdValue);
        await page.fill('input[name="numeroDocumentoAportante"]', contratista.numero_documento);

        // 2. Información del Cotizante
        console.log(`Llenando Cotizante (${tipoIdValue})...`);
        await page.selectOption('select#tipoDocumentoCotizante', tipoIdValue);
        await page.fill('input#numeroDocumentoCotizante', contratista.numero_documento);

        // 3. Entidad de Salud (EPS)
        if (contratista.eps) {
            console.log(`Seleccionando EPS (${contratista.eps})...`);
            try {
                await page.selectOption('select#administradoraSalud', { label: contratista.eps, timeout: 2000 });
            } catch (e) {
                console.log(`No se pudo seleccionar la EPS automáticamente. Intentando mapeo manual en SOI.`);
            }
        }

        // 4. Periodo de Pago (Mes y Año)
        console.log('Llenando periodo de pago...');
        const mes = reporte.mes_inicio || (new Date().getMonth() + 1).toString();
        const ano = reporte.ano || new Date().getFullYear().toString();

        await page.selectOption('select#periodoLiqSaludMes', parseInt(mes, 10).toString());
        await page.selectOption('select#periodoLiqSaludAnnio', ano.toString());

        console.log('✅ Bot: Datos llenados en SOI. Esperando acción del usuario para descargar...');
    } catch (err) {
        console.error('❌ Error en automatizarSOI:', err.message);
        throw err;
    }
}

async function automatizarAsopagos(page, contratista, reporte) {
    try {
        console.log('Navegando a Asopagos...');
        // Redirigimos directamente al formulario de certificación para evitar la navegación compleja del carrusel
        await page.goto('https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp', { waitUntil: 'domcontentloaded' });

        // 1. Tipo de Certificado (0: Seguridad Social, 1: Cesantías)
        console.log('Seleccionando tipo de certificado...');
        if (reporte.tipo_certificado === 0) {
            await page.check('input[value="verCertificadoTresNuevo"]');
        } else if (reporte.tipo_certificado === 1) {
            await page.check('input[value="verCertificadoCesantias"]');
        }

        // 2. Datos de Identificación
        console.log('Llenando datos de identificacion...');
        const mapaTipos = {
            'Cédula de ciudadania': 'CC',
            'Cédula de Ciudadanía': 'CC',
            'Cédula de extranjería': 'CE',
            'Cédula de Extranjería': 'CE',
            'Tarjeta de identidad': 'TI',
            'NIT': 'NI',
            'Pasaporte': 'PA'
        };
        const tipoDoc = mapaTipos[contratista.tipo_documento] || 'CC';
        await page.selectOption('select#tipoID', tipoDoc);
        await page.fill('input#numeroID', contratista.numero_documento);

        // 3. Año y Mes
        if (reporte.ano) {
            console.log('Llenando año...');
            await page.fill('input#ano', reporte.ano.toString());
        }

        if (reporte.mes_inicio) {
            console.log('Llenando mes...');
            // Asopagos usa formato "01", "02", etc.
            const mesPad = reporte.mes_inicio.toString();
            await page.selectOption('select#mes', mesPad);
        }

        // 4. Tipo de Reporte (0: Sin valores, 1: Con valores)
        console.log('Llenando tipo de reporte...');
        const tipoReporte = reporte.tipo_reporte === 1 ? 'conValores' : 'sinValores';
        await page.selectOption('select#tipoReporte', tipoReporte);

        console.log('✅ Bot: Datos llenados en Asopagos. Esperando Captcha...');
    } catch (err) {
        console.error('❌ Error en automatizarAsopagos:', err.message);
        throw err;
    }
}
