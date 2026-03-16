import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import { encolarReporte } from './automatizacion.js';

const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

let socketIo = null;

export const iniciarDisparador = (io) => {
    socketIo = io; // Guardamos el socket
    console.log('⏰ Disparador del Bot activado (Cada 1 minuto)');

    revisarReportesPendientes();
    setInterval(() => {
        revisarReportesPendientes();
    }, 1 * 60 * 1000);
};

const revisarReportesPendientes = async () => {
    console.log('🔍 Revisando reportes pendientes en Base de Datos...');

    try {
        for (const [nombrePagina, Modelo] of Object.entries(MODELOS)) {
            const pendientes = await Modelo.find({ estado_descarga: false });

            if (pendientes.length > 0) {
                console.log(`📂 Encontrados ${pendientes.length} pendientes en ${nombrePagina}`);

                for (const reporte of pendientes) {
                    // Ahora pasamos socketIo para que avise al frontend si alguien está escuchando
                    encolarReporte(reporte._id.toString(), nombrePagina, socketIo);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error en el disparador:', error.message);
    }
};
