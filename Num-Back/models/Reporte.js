import { Schema, model } from 'mongoose';

// Esquema para el historial de reportes mensuales de cada contratista
const HistorialReporteSchema = Schema({
    mes_anio: {
        type: String,
        required: [true, 'El mes-año del reporte (ej. "03-2026") es obligatorio']
    },
    pagina_pago: {
        type: String,
        required: [true, 'La página de pago es obligatoria'],
        enum: {
            values: ['Mi Planilla', 'SOI', 'Aportes en Línea'],
            message: '{VALUE} no es una página soportada'
        }
    },
    numero_planilla: {
        type: String,
        required: [true, 'El número de planilla es obligatorio']
    },
    fecha_pago_planilla: {
        type: Date,
        required: [true, 'La fecha de pago de la planilla es obligatoria']
    },
    periodo_pago_salud: {
        type: String,
        required: [true, 'El periodo de pago de salud es obligatorio']
    },
    periodo_pago: {
        type: String,
        required: [true, 'El periodo de pago es obligatorio']
    },
    valor_pagado: {
        type: Number,
        required: [true, 'El monto de la planilla es obligatorio']
    },
    tipo_reporte: {
        type: String,
        required: [true, 'La clasificación del reporte es obligatoria']
    },
    pdf_contratista: {
        type: String,
        default: null
    },
    pdf_bot: {
        type: String,
        default: null
    },
    estado: {
        type: String,
        required: [true, 'El estado del reporte es obligatorio'],
        enum: {
            values: ['Pendiente por subir', 'En proceso de revisión', 'A corregir', 'Al día'],
            message: '{VALUE} no es un estado permitido'
        },
        default: 'Pendiente por subir'
    },
    nota_supervisor: {
        type: String,
        default: ''
    }
}, { _id: true });

// Esquema para la información del usuario contratista
const UsuarioContratistaSchema = Schema({
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
    historial_reportes: [HistorialReporteSchema]
}, { _id: true });

// Modelo principal de Reportes
const ReporteSchema = Schema({
    usuarios: [UsuarioContratistaSchema]
}, { timestamps: true });

export default model('Reporte', ReporteSchema);
