import { Schema, model } from 'mongoose';

const ContratistaSchema = Schema({
    tipo_documento: {
        type: String,
        required: [true, 'El tipo de documento es obligatorio']
    },
    numero_documento: {
        type: String,
        required: [true, 'El número de identificación es obligatorio'],
        unique: true
    },
    fecha_expedicion: {
        type: Date,
        required: [true, 'La fecha de expedición del documento es obligatoria']
    },
    eps: {
        type: String,
        required: [true, 'La entidad de salud (EPS) es obligatoria']
    },
    tipo_afiliado: {
        type: String,
        required: [true, 'El tipo de afiliado es obligatorio'],
        enum: {
            values: ['Cotizante', 'Pensionado'],
            message: '{VALUE} no es un tipo de afiliado válido'
        }
    },
    correo: {
        type: String,
        required: [true, 'El correo electrónico del contratista es obligatorio'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña para loguearse es obligatoria']
    },
    supervisorId: {
        type: Schema.Types.ObjectId,
        ref: 'Supervisor',
        required: [true, 'El ID del supervisor es obligatorio']
    }
}, { _id: true, timestamps: true });

export default model('Contratista', ContratistaSchema);
