import { Router } from 'express';
import { crearReporte, actualizarReporte, obtenerDataSupervisor } from '../controllers/reporte.js';
const router = Router();

// IMPORTANTE: Esta ruta debe estar antes de cualquier ruta que use :id genérico si existiera
router.get('/supervisor/:supervisorId', obtenerDataSupervisor);

// Ruta para crear un nuevo reporte (Mi Planilla, SOI, etc.)
router.post('/crear', crearReporte);

// Ruta para actualizar un reporte existente o el estado de descarga
router.put('/actualizar/:reporteId', actualizarReporte);


export default router;
