import jwt from 'jsonwebtoken';
import Supervisor from '../models/supervisor.js';

export const validarJWT = async (req, res, next) => {
    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No hay token en la petición'
        });
    }

    try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const supervisor = await Supervisor.findById(id);

        if (!supervisor) {
            return res.status(401).json({
                ok: false,
                msg: 'Token no válido - supervisor no existe'
            });
        }

        if (!supervisor.estado) {
            return res.status(401).json({
                ok: false,
                msg: 'Token no válido - supervisor desactivado'
            });
        }

        req.supervisor = supervisor;

        next();
    } catch (error) {
        return res.status(401).json({
            ok: false,
            msg: 'Token no válido'
        });
    }
};
