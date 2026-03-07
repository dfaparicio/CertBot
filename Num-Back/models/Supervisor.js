import { Schema, model } from 'mongoose';

const SupervisorSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del supervisor es obligatorio']
    },
    apellidos: {
        type: String,
        required: [true, 'Los apellidos son obligatorios']
    },
    cedula: {
        type: String,
        required: [true, 'El número de documento (cédula) es obligatorio'],
        unique: true
    },
    correo: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    estado: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export default model('Supervisor', SupervisorSchema);
