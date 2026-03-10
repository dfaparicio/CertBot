import { validationResult, check } from 'express-validator';

export const validarCampos = (req, res, next) => {
    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.status(400).json({
            ok: false,
            errores: errores.mapped()
        });
    }

    next();
};

// Validaciones para el login del supervisor
export const validarLogin = [
    check('correo', 'El correo es obligatorio').not().isEmpty(),
    check('correo', 'Debe ser un correo válido').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    validarCampos
];

// Validaciones para el registro del contratista
export const validarRegistro = [
    check('tipo_documento', 'El tipo de documento es obligatorio').not().isEmpty(),
    check('tipo_documento', 'Tipo de documento no válido').isIn([
        'CC', 'CE', 'TI', 'PP', 'NIT',
        'Cédula de ciudadania', 'Cédula de Ciudadanía',
        'Cédula de extranjería', 'Cédula de Extranjería',
        'Tarjeta de identidad', 'NIT', 'Pasaporte'
    ]),
    check('numero_documento', 'El número de documento es obligatorio').not().isEmpty(),
    check('fecha_expedicion', 'La fecha de expedición es obligatoria').not().isEmpty(),
    check('fecha_expedicion', 'Debe ser una fecha válida').isISO8601(),
    check('eps', 'La entidad de salud (EPS) es obligatoria').not().isEmpty(),
    check('correo', 'El correo es obligatorio').not().isEmpty(),
    check('correo', 'Debe ser un correo válido').isEmail(),
    check('password', 'La contraseña es obligatoria').not().isEmpty(),
    check('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validarCampos
];


