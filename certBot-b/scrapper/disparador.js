import cron from 'node-cron';
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
    socketIo = io; // Guardamos el socket por si hay alguien conectado, aunque sea a las 2am
    console.log('⏰ Programación del Bot activada (Diariamente a las 2:00 AM)');

    // Programar la tarea para las 2:00 AM todos los días
    cron.schedule('00 02 * * *', () => {
        console.log('🚀 Iniciando ejecución programada de las 2:00 AM...');
        revisarReportesPendientes();
    });
};

const revisarReportesPendientes = async () => {
    console.log('🔍 Revisando reportes pendientes en Base de Datos...');

    try {
        for (const [nombrePagina, Modelo] of Object.entries(MODELOS)) {
            const pendientes = await Modelo.find({ estado_descarga: false });

            if (pendientes.length > 0) {
                console.log(`📂 Encontrados ${pendientes.length} pendientes en ${nombrePagina}`);

                for (const reporte of pendientes) {
                    // Se encolan de forma secuencial mediante el sistema de cola existente
                    encolarReporte(reporte._id.toString(), nombrePagina, socketIo);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error en el disparador programado:', error.message);
    }
};

   