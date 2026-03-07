import Reporte from '../models/Reporte.js';
import bcrypt from 'bcryptjs';

export const registroContratista = async (req, res, next) => {
    try {
        const { tipo_documento, numero_documento, fecha_expedicion, eps, tipo_afiliado, correo, password } = req.body;

        // Verificar si ya existe un contratista con ese correo o número de documento
        const existeContratista = await Reporte.findOne({
            $or: [
                { 'usuarios.correo': correo },
                { 'usuarios.numero_documento': numero_documento }
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

        const nuevoContratista = {
            tipo_documento,
            numero_documento,
            fecha_expedicion,
            eps,
            tipo_afiliado,
            correo,
            password: passwordEncriptado,
            historial_reportes: []
        };

        // Insertar en el array de usuarios (upsert crea el documento si no existe)
        const reporte = await Reporte.findOneAndUpdate(
            {},
            { $push: { usuarios: nuevoContratista } },
            { new: true, upsert: true }
        );

        const contratistaCreado = reporte.usuarios[reporte.usuarios.length - 1];

        res.status(201).json({
            ok: true,
            msg: 'Contratista registrado exitosamente',
            contratista: {
                _id: contratistaCreado._id,
                tipo_documento: contratistaCreado.tipo_documento,
                numero_documento: contratistaCreado.numero_documento,
                eps: contratistaCreado.eps,
                tipo_afiliado: contratistaCreado.tipo_afiliado,
                correo: contratistaCreado.correo
            }
        });
    } catch (error) {
        next(error);
    }
};
