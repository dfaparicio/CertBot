import Contratista from '../models/Contratista.js';
import bcrypt from 'bcryptjs';

export const registroContratista = async (req, res, next) => {
    try {
        const { tipo_documento, numero_documento, fecha_expedicion, eps, tipo_afiliado, correo, password } = req.body;

        // Verificar si ya existe un contratista con ese correo o número de documento
        const existeContratista = await Contratista.findOne({
            $or: [
                { correo },
                { numero_documento }
            ]
        });

        if (existeContratista) {
            return res.status(400).json({
                ok: false,
                msg: 'Ya existe un contratista con ese correo o número de documento'
            });
        }

        // Encriptar contraseña
        const salt = bcrypt.genSaltSync(10);
        const passwordEncriptado = bcrypt.hashSync(password, salt);

        const nuevoContratista = new Contratista({
            tipo_documento,
            numero_documento,
            fecha_expedicion,
            eps,
            tipo_afiliado,
            correo,
            password: passwordEncriptado
        });

        await nuevoContratista.save();

        res.status(201).json({
            ok: true,
            msg: 'Contratista registrado exitosamente',
            contratista: {
                _id: nuevoContratista._id,
                tipo_documento: nuevoContratista.tipo_documento,
                numero_documento: nuevoContratista.numero_documento,
                eps: nuevoContratista.eps,
                tipo_afiliado: nuevoContratista.tipo_afiliado,
                correo: nuevoContratista.correo
            }
        });
    } catch (error) {
        next(error);
    }
};
