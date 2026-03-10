import { Router } from 'express';
import { crearReporte, actualizarReporte } from '../controllers/reporte.js';
import { ejecutarBot } from '../middlewares/automatizacion.js';

const router = Router();

// Ruta para crear un nuevo reporte (Mi Planilla, SOI, etc.)
router.post('/crear', crearReporte);

// Ruta para actualizar un reporte existente o el estado de descarga
router.put('/actualizar/:reporteId', actualizarReporte);

// Ruta para disparar la automatización del bot
router.post('/automatizar', ejecutarBot, (req, res) => {
    res.json(req.botResultado);
});

export default router;
