import { MiPlanilla, Soi, AportesEnLinea, Asopagos } from '../models/reportes.js';
import Contratista from '../models/Contratista.js';

// Mapa de modelos para facilitar el acceso dinámico según la página
const MODELOS = {
    'Mi Planilla': MiPlanilla,
    'SOI': Soi,
    'Aportes en Línea': AportesEnLinea,
    'Asopagos': Asopagos
};

export const crearReporte = async (req, res, next) => {
    try {
        const { pagina, supervisorId, contratistaId, ...datos } = req.body;
        const Modelo = MODELOS[pagina];

        if (!Modelo) {
            return res.status(400).json({
                ok: false,
                msg: `La página "${pagina}" no es válida o no está soportada`
            });
        }

        // Si se proporciona un nuevo supervisorId, actualizar al contratista
        if (supervisorId && contratistaId) {
            await Contratista.findByIdAndUpdate(contratistaId, { supervisorId });
        }

        const nuevoReporte = new Modelo({
            ...datos,
            contratistaId,
            supervisorId,
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

export const obtenerDataSupervisor = async (req, res, next) => {
    try {
        const { supervisorId } = req.params;

        // 1. Obtener todos los contratistas asignados a este supervisor
        // Usamos find con el ID tal cual viene del parámetro
        const contratistas = await Contratista.find({ supervisorId: supervisorId })
            .select('-password')
            .sort({ createdAt: -1 });

        // Si no hay contratistas, retornamos vacío de una vez
        if (!contratistas || contratistas.length === 0) {
            console.log(`No se encontraron contratistas para el supervisor: ${supervisorId}`);
            return res.json({
                ok: true,
                contratistas: [],
                reportes: []
            });
        }

        // 2. Extraer los IDs de los contratistas
        const idsContratistas = contratistas.map(c => c._id);

        // 3. Buscar reportes en todas las colecciones donde el contratistaId esté en nuestra lista
        const promesas = Object.values(MODELOS).map(Modelo => 
            Modelo.find({ contratistaId: { $in: idsContratistas } })
                .populate('contratistaId', 'nombre apellidos numero_documento correo eps tipo_documento')
                .sort({ createdAt: -1 })
                .lean() // Usar lean para que sea más rápido y fácil de manipular
        );

        const resultados = await Promise.all(promesas);
        
        // Aplanamos el array de arrays y ordenamos por fecha de creación descendente
        const todosLosReportes = resultados
            .flat()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        console.log(`Supervisor ${supervisorId}: Encontrados ${contratistas.length} contratistas y ${todosLosReportes.length} reportes.`);

        res.json({
            ok: true,
            contratistas,
            reportes: todosLosReportes
        });
    } catch (error) {
        console.error('Error en obtenerDataSupervisor:', error);
        next(error);
    }
};
