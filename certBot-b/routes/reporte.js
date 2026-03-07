import { Router } from 'express';
import { crearReporte, actualizarReporte } from '../controllers/reporte.js';

const router = Router();

// Ruta para crear un nuevo reporte (Mi Planilla, SOI, etc.)
router.post('/crear', crearReporte);

// Ruta para actualizar un reporte existente o el estado de descarga
router.put('/actualizar/:reporteId', actualizarReporte);

export default router;
