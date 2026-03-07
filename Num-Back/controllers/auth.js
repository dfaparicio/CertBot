import Supervisor from '../models/Supervisor.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const loginSupervisor = async (req, res, next) => {
    try {
        const { correo, password } = req.body;
        const supervisor = await Supervisor.findOne({ correo });

        if (!supervisor) {
            return res.status(400).json({
                ok: false,
                msg: 'Correo o contraseña incorrectos'
            });
        }

        if (!supervisor.estado) {
            return res.status(400).json({
                ok: false,
                msg: 'Supervisor desactivado, contacte al administrador'
            });
        }

        const passwordValido = bcrypt.compareSync(password, supervisor.password);

        if (!passwordValido) {
            return res.status(400).json({
                ok: false,
                msg: 'Correo o contraseña incorrectos'
            });
        }

        // Generar JWT
        const token = jwt.sign(
            { id: supervisor._id, correo: supervisor.correo },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            ok: true,
            msg: 'Login exitoso',
            supervisor: {
                _id: supervisor._id,
                nombre: supervisor.nombre,
                apellidos: supervisor.apellidos,
                correo: supervisor.correo
            },
            token
        });
    } catch (error) {
        next(error);
    }
};
