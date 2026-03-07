import mongoose, { Schema } from 'mongoose';

export const campos_pagina = {
    'Aportes en Línea': {
        campos: ['ano', 'mes_inicio', 'mes_final', 'usted_es'],
        color: 'primary',
        icon: 'payment'
    },
    'Mi Planilla': {
        campos: ['numero_planilla', 'pago_planilla', 'periodo_salud', 'valor_planilla'],
        color: 'secondary',
        icon: 'analytics'
    },
    'SOI': {
        campos: ['mes_inicio', 'ano'],
        color: 'blue-8',
        icon: 'language'
    },
    'Asopagos': {
        campos: ['tipo_certificado', 'ano', 'mes_inicio', 'tipo_reporte'],
        color: 'deep-orange-7',
        icon: 'fact_check'
    }
};

const reporteSchema = new Schema({
    contratistaId: {
        type: Schema.Types.ObjectId,
        ref: 'Contratista',
        required: [true, 'El ID del contratista es obligatorio']
    },
    ano: {
        type: Number,
        required: [true, 'El año es obligatorio']
    },
    mes_inicio: {
        type: String,
        required: [true, 'El mes de inicio es obligatorio']
    },
    mes_final: {
        type: String,
        required: [true, 'El mes final es obligatorio']
    },
    dia: {
        type: Number,
        required: [true, 'El día es obligatorio']
    },
    usted_es: {
        type: Number,
        required: [true, 'El tipo de afiliado es obligatorio'],
        enum: {
            values: [0, 1],
            message: '{VALUE} no es válido. 0: Cotizante Activo, 1: Pensionado'
        }
    },
    numero_planilla: {
        type: String,
        required: [true, 'El número de planilla es obligatorio']
    },
    pago_planilla: {
        type: Date,
        required: [true, 'La fecha de pago de la planilla es obligatoria']
    },
    periodo_salud: {
        type: String,
        required: [true, 'El periodo de pago de salud es obligatorio']
    },
    valor_planilla: {
        type: Number,
        required: [true, 'El valor pagado es obligatorio']
    },
    tipo_certificado: {
        type: Number,
        required: [true, 'El tipo de certificado es obligatorio'],
        enum: {
            values: [0, 1],
            message: '{VALUE} no es válido. 0: seguridad social, 1: cesantías'
        }
    },
    tipo_reporte: {
        type: Number,
        required: [true, 'El tipo de reporte es obligatorio'],
        enum: {
            values: [0, 1],
            message: '{VALUE} no es válido. 0: Sin valores, 1: Con valores'
        }
    },
    pagina_bot: {
        type: String,
        default: null
    },
    estado_descarga: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const MiPlanilla = mongoose.model('MiPlanilla', reporteSchema);
export const Soi = mongoose.model('Soi', reporteSchema);
export const AportesEnLinea = mongoose.model('AportesEnLinea', reporteSchema);
export const Asopagos = mongoose.model('Asopagos', reporteSchema);