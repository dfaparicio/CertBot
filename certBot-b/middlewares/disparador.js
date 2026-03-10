import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { procesarReporte } from './automatizacion.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

// Set para rastrear qué reportes ya están siendo procesados por el bot
const reportesEnProceso = new Set();

export const iniciarDisparador = () => {

    console.log('⏰ Disparador del Bot activado (Cada 5 minutos)');

    // Ejecutar inmediatamente al iniciar y luego cada 5 min
    revisarReportesPendientes();

    setInterval(() => {
        revisarReportesPendientes();
    }, 1 * 60 * 1000);
};

const revisarReportesPendientes = async () => {
    console.log('🔍 Revisando reportes pendientes de descarga...');

    try {
        for (const [nombrePagina, Modelo] of Object.entries(MODELOS)) {
            // Buscamos reportes que no han sido descargados
            const pendientes = await Modelo.find({ estado_descarga: false });

            if (pendientes.length > 0) {
                console.log(`📂 Encontrados ${pendientes.length} pendientes en ${nombrePagina}`);

                // Procesamos uno por uno para no saturar la RAM con navegadores
                for (const reporte of pendientes) {
                    const idStr = reporte._id.toString();

                    if (reportesEnProceso.has(idStr)) {
                        console.log(`⏩ Reporte ${idStr} ya está en proceso, saltando...`);
                        continue;
                    }

                    console.log(`🚀 Disparando bot para reporte: ${idStr} (${nombrePagina})`);

                    // Marcamos como en proceso
                    reportesEnProceso.add(idStr);

                    // Ejecutamos y cuando termine (bien o mal), liberamos el ID
                    procesarReporte(reporte._id, nombrePagina).finally(() => {
                        reportesEnProceso.delete(idStr);
                    });
                }
            }
        }
    } catch (error) {
        console.error('❌ Error en el disparador:', error.message);
    }
};
