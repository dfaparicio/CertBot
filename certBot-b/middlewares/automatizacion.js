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
            headless: true, // Cambiar a false si quieres ver el proceso
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
    await page.goto('https://empresas.aportesenlinea.com/Autoservicio/CertificadoAportes.aspx');

    // 1. Pestaña PILA (Generalmente ya seleccionada por defecto)
    await page.click('label[for="contenido_Pila"]');

    // 2. Datos de Identificación
    if (contratista.tipo_documento) {
        await page.selectOption('select#contenido_ddlTipoIdent', { label: contratista.tipo_documento });
    }
    await page.fill('input#contenido_tbNumeroIdentificacion', contratista.numero_documento);

    // 3. Fecha de Expedición (Formato AAAA/MM/DD)
    if (contratista.fecha_expedicion) {
        const fechaExp = new Date(contratista.fecha_expedicion);
        const fechaFormateada = `${fechaExp.getFullYear()}/${(fechaExp.getMonth() + 1).toString().padStart(2, '0')}/${fechaExp.getDate().toString().padStart(2, '0')}`;
        await page.fill('input#contenido_txtFechaExp', fechaFormateada);
    }

    // 4. EPS
    if (contratista.eps) {
        await page.fill('input#contenido_txtAdmin', contratista.eps);
    }

    // 5. Rango de Fechas (Desde - Hasta)
    if (reporte.ano) {
        const anioStr = reporte.ano.toString();
        await page.selectOption('select#contenido_ddlAnioIni', anioStr);
        await page.selectOption('select#contenido_ddlAnioFin', anioStr);
    }

    if (reporte.mes_inicio) {
        await page.selectOption('select#contenido_ddlMesIni', reporte.mes_inicio.toString().padStart(2, '0'));
    }

    if (reporte.mes_final) {
        await page.selectOption('select#contenido_ddlMesFin', reporte.mes_final.toString().padStart(2, '0'));
    }

    // 6. Actualmente usted es (Cotizante Activo o Pensionado)
    if (contratista.tipo_afiliado === 'Cotizante' || contratista.tipo_afiliado === 'Cotizante activo') {
        await page.click('label[for="contenido_rdbActivo"]');
    } else if (contratista.tipo_afiliado === 'Pensionado') {
        await page.click('label[for="contenido_rdbPensionado"]');
    }

    // El CAPTCHA se deja para el usuario. Botón: a#contenido_btnCalcular
}

async function automatizarMiPlanilla(page, contratista, reporte) {
    await page.goto('https://www.miplanilla.com/Private/Consultaplanillaindependiente.aspx');

    // 1. Datos de Identificación
    await page.selectOption('select#cp1_ddlTipoDocumento', { label: contratista.tipo_documento });
    await page.fill('input#cp1_txtNumeroDocumento', contratista.numero_documento);

    // 2. Número de Planilla
    if (reporte.numero_planilla) {
        await page.fill('input#cp1_txtNumeroPlanilla', reporte.numero_planilla);
    }

    // 3. Fecha de pago de la planilla (Día, Mes, Año)
    if (reporte.pago_planilla) {
        const fechaPago = new Date(reporte.pago_planilla);
        // Día: cp1_cmbDiaPago, Mes: cp1_cmbMesPago, Año: cp1_ddlAnoPago
        await page.selectOption('select#cp1_cmbDiaPago', fechaPago.getDate().toString().padStart(2, '0'));
        await page.selectOption('select#cp1_cmbMesPago', (fechaPago.getMonth() + 1).toString().padStart(2, '0'));
        await page.selectOption('select#cp1_ddlAnoPago', fechaPago.getFullYear().toString());
    }

    // 4. Periodo de pago salud (Mes, Año)
    if (reporte.periodo_salud) {
        // El formato en la DB suele ser "MM/YYYY" o similar. Extraemos mes y año.
        const [mes, ano] = reporte.periodo_salud.includes('/')
            ? reporte.periodo_salud.split('/')
            : [reporte.mes_inicio, reporte.ano];

        await page.selectOption('select#cp1_ddlMesSalud', mes.toString().padStart(2, '0'));
        await page.selectOption('select#cp1_ddlAnoSalud', ano.toString());
    }

    // 5. Valor pagado
    if (reporte.valor_planilla) {
        await page.fill('input#cp1_txtValorPagado', reporte.valor_planilla.toString());
    }

    // El CAPTCHA (input#cp1_txtCaptcha) se gestionará manualmente o se ignorará por ahora.
}

async function automatizarSOI(page, contratista, reporte) {
    await page.goto('https://servicio.nuevosoi.com.co/soi/certificadoAportesCotizante.do');

    // 1. Información del Aportante (Suelen ser los mismos datos para independientes)
    await page.selectOption('select#tipoDocumentoAportante', { label: contratista.tipo_documento });
    await page.fill('input[name="numeroDocumentoAportante"]', contratista.numero_documento);

    // 2. Información del Cotizante
    await page.selectOption('select#tipoDocumentoCotizante', { label: contratista.tipo_documento });
    await page.fill('input#numeroDocumentoCotizante', contratista.numero_documento);

    // 3. Entidad de Salud (EPS)
    if (contratista.eps) {
        // Intentamos seleccionar por etiqueta (label) ya que la EPS viene como string
        try {
            await page.selectOption('select#administradoraSalud', { label: contratista.eps });
        } catch (e) {
            console.log(`No se pudo seleccionar la EPS "${contratista.eps}" automáticamente`);
        }
    }

    // 4. Periodo de Pago (Mes y Año)
    const mes = reporte.mes_inicio || (new Date().getMonth() + 1).toString();
    const ano = reporte.ano || new Date().getFullYear().toString();

    await page.selectOption('select#periodoLiqSaludMes', mes.toString().padStart(2, '0'));
    await page.selectOption('select#periodoLiqSaludAnnio', ano.toString());

    // El botón de descarga es button.btn-success o contiene el texto "Descargar PDF"
}

async function automatizarAsopagos(page, contratista, reporte) {
    // Redirigimos directamente al formulario de certificación para evitar la navegación compleja del carrusel
    await page.goto('https://www.enlace-apb.com/interssi/descargarCertificacionPago.jsp');

    // 1. Tipo de Certificado (0: Seguridad Social, 1: Cesantías)
    if (reporte.tipo_certificado === 0) {
        await page.check('input[value="verCertificadoTresNuevo"]');
    } else if (reporte.tipo_certificado === 1) {
        await page.check('input[value="verCertificadoCesantias"]');
    }

    // 2. Datos de Identificación
    const mapaTipos = {
        'Cédula de Ciudadanía': 'CC',
        'Cédula de Extranjería': 'CE',
        'NIT': 'NI',
        'Pasaporte': 'PA'
    };
    const tipoDoc = mapaTipos[contratista.tipo_documento] || 'CC';
    await page.selectOption('select#tipoID', tipoDoc);
    await page.fill('input#numeroID', contratista.numero_documento);

    // 3. Año y Mes
    if (reporte.ano) {
        await page.fill('input#ano', reporte.ano.toString());
    }

    if (reporte.mes_inicio) {
        // Asopagos usa formato "01", "02", etc.
        const mesPad = reporte.mes_inicio.toString().padStart(2, '0');
        await page.selectOption('select#mes', mesPad);
    }

    // 4. Tipo de Reporte (0: Sin valores, 1: Con valores)
    const tipoReporte = reporte.tipo_reporte === 1 ? 'conValores' : 'sinValores';
    await page.selectOption('select#tipoReporte', tipoReporte);

    // El CAPTCHA (input#captchaIn) se deja para el usuario
}
