import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';

// Mapa de modelos para facilitar el acceso dinámico según la página
const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

export const crearReporte = async (req, res, next) => {
    try {
        const { pagina, ...datos } = req.body;
        const Modelo = MODELOS[pagina];

        if (!Modelo) {
            return res.status(400).json({
                ok: false,
                msg: `La página "${pagina}" no es válida o no está soportada`
            });
        }

        const nuevoReporte = new Modelo({
            ...datos,
            estado_descarga: false
        });

        await nuevoReporte.save();

        res.status(201).json({
            ok: true,
            msg: 'Reporte creado exitosamente',
            reporte: nuevoReporte
        });
    } catch (error) {
        next(error);
    }
};

export const actualizarReporte = async (req, res, next) => {
    try {
        const { reporteId } = req.params;
        const { pagina, ...datosActualizar } = req.body;
        const Modelo = MODELOS[pagina];

        if (!Modelo) {
            return res.status(400).json({
                ok: false,
                msg: `La página "${pagina}" es obligatoria para actualizar`
            });
        }

        const reporteActualizado = await Modelo.findByIdAndUpdate(
            reporteId,
            datosActualizar,
            { new: true, runValidators: true }
        );

        if (!reporteActualizado) {
            return res.status(404).json({
                ok: false,
                msg: 'Reporte no encontrado'
            });
        }

        res.json({
            ok: true,
            msg: 'Reporte actualizado correctamente',
            reporte: reporteActualizado
        });
    } catch (error) {
        next(error);
    }
};
