<template>
  <q-layout view="hHh lpR fFf" class="app-page">
    <AppHeader />
    <q-page-container>
      <q-page class="flex flex-center q-pa-lg bg-grey-2">
        <div class="report-layout">
          
          <div class="text-center q-mb-xl">
            <h1 class="text-h4 text-weight-bolder text-sena-blue q-mb-xs" style="color: var(--sena-navy) !important;">Generar Reporte de Pago</h1>
            <p class="text-subtitle1 text-grey-7" style="color: var(--text-muted) !important;">Ingrese los datos exactos de su planilla de seguridad social.</p>
          </div>

          <div class="row justify-center">
            <div class="col-12 col-md-9">
              <AppCard class="no-shadow border-grey">
                <q-form @submit.prevent="submitReporte" class="q-gutter-y-sm">
                  
                  <div class="col-12 q-mb-lg">
                    <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Plataforma de Pago</div>
                    <q-select 
                      v-model="formData.pagina" 
                      outlined
                      dense
                      :options="opcionesPlataforma" 
                      emit-value 
                      map-options 
                      :rules="[v => !!v || 'Seleccione una plataforma']"
                      bg-color="white"
                      style="color: var(--sena-navy) !important;"
                    >
                      <template #prepend><q-icon name="language" color="primary" /></template>
                    </q-select>
                  </div>

                  <div v-if="formData.pagina" class="row q-col-gutter-md">
                    
                    <!-- FECHA COMÚN -->
                    <div class="col-12 col-sm-4">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Día del Pago</div>
                      <q-input v-model.number="formData.dia" type="number" outlined dense placeholder="1-31" :rules="[v => (v > 0 && v <= 31) || 'Día inválido']" bg-color="white" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Mes Inicio</div>
                      <q-select v-model="formData.mes_inicio" outlined dense :options="meses" emit-value map-options :rules="[v => !!v || 'Requerido']" bg-color="white" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Año</div>
                      <q-input v-model.number="formData.ano" type="number" outlined dense :rules="[v => !!v || 'Requerido']" bg-color="white" />
                    </div>

                    <!-- CAMPOS SEGÚN PLATAFORMA -->
                    <div class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Mes Final</div>
                      <q-select v-model="formData.mes_final" outlined dense :options="meses" emit-value map-options :rules="[v => !!v || 'Requerido']" bg-color="white" />
                    </div>

                    <div v-if="formData.pagina === 'Aportes en Línea'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Usted es...</div>
                      <q-select v-model="formData.usted_es" outlined dense :options="opUstedEs" emit-value map-options bg-color="white" />
                    </div>

                    <div v-if="formData.pagina === 'Mi Planilla'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Número de Planilla</div>
                      <q-input v-model="formData.numero_planilla" outlined dense :rules="[v => !!v || 'Requerido']" bg-color="white" />
                    </div>

                    <div v-if="formData.pagina === 'Mi Planilla'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Fecha de Pago</div>
                      <q-input v-model="formData.pago_planilla" type="date" outlined dense :rules="[v => !!v || 'Requerido']" bg-color="white" />
                    </div>

                    <div v-if="formData.pagina === 'Mi Planilla'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Valor Pagado (COP)</div>
                      <q-input 
                        v-model.number="formData.valor_planilla" 
                        type="number" 
                        outlined 
                        dense 
                        prefix="$"
                        :rules="[v => !!v || 'Requerido', v => v > 0 || 'Valor inválido']"
                        bg-color="white"
                      />
                    </div>

                    <div v-if="formData.pagina === 'Asopagos'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Tipo Certificado</div>
                      <q-select v-model="formData.tipo_certificado" outlined dense :options="opCert" emit-value map-options bg-color="white" />
                    </div>

                    <div v-if="formData.pagina === 'Asopagos'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Opción de Reporte</div>
                      <q-select v-model="formData.tipo_reporte" outlined dense :options="opRep" emit-value map-options bg-color="white" />
                    </div>

                  </div>

                  <div class="flex justify-end q-mt-xl">
                    <q-btn 
                      type="submit" 
                      color="primary" 
                      :loading="loading" 
                      class="q-px-xl btn-primary-sena" 
                      no-caps
                      size="lg"
                      label="ENVIAR REPORTE"
                      :disabled="!formData.pagina"
                    />
                  </div>

                </q-form>
              </AppCard>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
    <AppFooter />
  </q-layout>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { postData } from '../services/api'
import { useMainStore } from '../store/store'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import AppCard from '../components/AppCard.vue'

const $q = useQuasar()
const router = useRouter()
const store = useMainStore()
const loading = ref(false)

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}

const getMesNombre = (mesVal) => {
  const mes = meses.find(m => m.value === mesVal)
  return mes ? mes.label.charAt(0) + mes.label.slice(1).toLowerCase() : ''
}

// Opciones de plataforma
const opcionesPlataforma = [
  { label: 'Mi Planilla', value: 'Mi Planilla' },
  { label: 'SOI', value: 'SOI' },
  { label: 'Aportes en Línea', value: 'Aportes en Línea' },
  { label: 'Asopagos', value: 'Asopagos' }
]

const formData = reactive({
  pagina: '', 
  dia: new Date().getDate(), 
  ano: new Date().getFullYear(),
  mes_inicio: '', 
  mes_final: '', 
  usted_es: 0, 
  numero_planilla: '',
  pago_planilla: '', 
  valor_planilla: null, 
  tipo_certificado: 0, 
  tipo_reporte: 0
})

const meses = Array.from({length: 12}, (_, i) => ({ 
  label: new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase(), 
  value: String(i+1).padStart(2, '0') 
}))

const opUstedEs = [{label: 'Cotizante Activo', value: 0}, {label: 'Pensionado', value: 1}]
const opCert = [{label: 'Seguridad Social', value: 0}, {label: 'Cesantías', value: 1}]
const opRep = [{label: 'Sin Valores', value: 0}, {label: 'Con Valores', value: 1}]

const submitReporte = async () => {
  if (!store.user?._id) {
    $q.notify({ type: 'negative', message: 'Sesión expirada. Por favor inicie sesión.' })
    router.push('/login')
    return
  }

  loading.value = true
  
  try {
    // Construimos el payload con valores por defecto para los campos no visibles según la plataforma
    // para cumplir con las validaciones de Mongoose (required: true)
    const payload = {
      contratistaId: store.user._id,
      pagina: formData.pagina,
      dia: Number(formData.dia),
      ano: Number(formData.ano),
      mes_inicio: formData.mes_inicio,
      mes_final: formData.mes_final || formData.mes_inicio,
      usted_es: Number(formData.usted_es),
      numero_planilla: formData.numero_planilla || 'N/A',
      pago_planilla: formData.pago_planilla || new Date(),
      periodo_salud: `${formData.ano}-${formData.mes_inicio}`,
      valor_planilla: Number(formData.valor_planilla) || 0,
      tipo_certificado: Number(formData.tipo_certificado),
      tipo_reporte: Number(formData.tipo_reporte)
    }

    // 1. Crear el reporte en la base de datos
    const res = await postData('/reporte/crear', payload)
    
    if (res.ok && res.reporte?._id) {
      $q.notify({
        type: 'positive',
        message: '¡Reporte guardado! Iniciando automatización...',
        position: 'top-right',
        timeout: 2000
      })

      // 2. Disparar el Bot (Automatización)
      const botRes = await postData('/reporte/automatizar', {
        reporteId: res.reporte._id,
        pagina: formData.pagina
      })

      if (botRes.ok) {
        $q.notify({
          color: 'indigo-7',
          icon: 'smart_toy',
          message: 'El bot está procesando su solicitud en segundo plano.',
          position: 'bottom-right',
          timeout: 5000
        })
      }

      // Limpiar formulario tras éxito completo
      formData.pagina = ''
      formData.valor_planilla = null
    }
  } catch (error) {
    console.error('Error en el proceso de reporte:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.msg || 'Error al conectar con el servidor',
      position: 'top-right'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import "../styles/report.css";
</style>
