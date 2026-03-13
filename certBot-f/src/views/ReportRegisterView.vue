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
                  
                  <!-- SECCIÓN DE SUPERVISOR -->
                  <div class="col-12 q-mb-md">
                    <div class="text-weight-bold q-mb-xs text-sena-blue" style="color: var(--sena-navy) !important;">Supervisor Encargado</div>
                    <q-select 
                      v-model="formData.supervisorId" 
                      outlined
                      dense
                      :options="supervisoresOptions" 
                      emit-value 
                      map-options 
                      :rules="[v => !!v || 'Seleccione su supervisor']"
                      bg-color="white"
                      style="color: var(--sena-navy) !important;"
                      :loading="loadingSupervisores"
                    >
                      <template #prepend><q-icon name="person" color="primary" /></template>
                    </q-select>
                    <div class="text-caption text-grey-7 q-ml-xs">Este supervisor quedará asignado para sus próximos reportes hasta que lo cambie.</div>
                  </div>

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
                    
                    <!-- SECCIÓN GENERAL: FECHA DE PAGO (Se oculta para Asopagos) -->
                    <div class="col-12" v-if="formData.pagina !== 'Asopagos'">
                      <div class="form-section-title text-primary q-mb-sm">Fecha de Pago de la Planilla</div>
                      <div class="row q-col-gutter-sm">
                        <div class="col-12 col-sm-4">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Día</div>
                          <q-input v-model.number="formData.dia" type="number" outlined dense placeholder="1-31" :rules="[v => (v > 0 && v <= 31) || 'Día inválido']" bg-color="white" />
                        </div>
                        <div class="col-12 col-sm-4">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Mes Pago</div>
                          <q-select v-model="formData.mes_inicio" outlined dense :options="meses" emit-value map-options :rules="[v => !!v || 'Requerido']" bg-color="white" />
                        </div>
                        <div class="col-12 col-sm-4">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Año Pago</div>
                          <q-input v-model.number="formData.ano" type="number" outlined dense :rules="[v => !!v || 'Requerido']" bg-color="white" />
                        </div>
                      </div>
                    </div>

                    <!-- SECCIÓN GENERAL: PERIODO DE SALUD (Siempre visible) -->
                    <div class="col-12">
                      <div class="form-section-title text-primary q-mt-md q-mb-sm">Periodo que desea descargar (Salud)</div>
                      <div class="row q-col-gutter-sm">
                        <div class="col-6">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Mes del Periodo</div>
                          <q-select v-model="formData.mes_salud" outlined dense :options="meses" emit-value map-options bg-color="white" />
                        </div>
                        <div class="col-6">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Año del Periodo</div>
                          <q-input v-model.number="formData.ano_salud" type="number" outlined dense bg-color="white" />
                        </div>
                      </div>
                    </div>

                    <!-- CAMPOS ESPECÍFICOS SEGÚN PLATAFORMA -->
                    <div v-if="formData.pagina === 'Mi Planilla'" class="col-12">
                      <div class="row q-col-gutter-md q-mt-sm">
                        <div class="col-12 col-sm-6">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Número de Planilla</div>
                          <q-input v-model="formData.numero_planilla" outlined dense placeholder="Ej: 50885037" :rules="[v => !!v || 'Requerido']" bg-color="white" />
                        </div>
                        <div class="col-12 col-sm-6">
                          <div class="text-weight-bold q-mb-xs text-sena-blue">Valor Total Pagado</div>
                          <q-input v-model.number="formData.valor_planilla" type="number" outlined dense prefix="$" :rules="[v => !!v || 'Requerido']" bg-color="white" />
                        </div>
                      </div>
                    </div>

                    <!-- CAMPOS PARA OTRAS PLATAFORMAS -->
                    <div v-if="formData.pagina === 'Aportes en Línea'" class="col-12 col-sm-6">
                      <div class="text-weight-bold q-mb-xs text-sena-blue">Usted es...</div>
                      <q-select v-model="formData.usted_es" outlined dense :options="opUstedEs" emit-value map-options bg-color="white" />
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
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { postData, getData } from '../services/api'
import { useMainStore } from '../store/store'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import AppCard from '../components/AppCard.vue'

const $q = useQuasar()
const router = useRouter()
const store = useMainStore()
const loading = ref(false)
const loadingSupervisores = ref(false)
const supervisores = ref([])

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
  supervisorId: store.user?.supervisorId || '',
  pagina: '', 
  dia: new Date().getDate(), 
  ano: new Date().getFullYear(),
  mes_inicio: String(new Date().getMonth() + 1).padStart(2, '0'), 
  mes_final: '', 
  usted_es: 0, 
  numero_planilla: '',
  pago_planilla: '', 
  valor_planilla: null, 
  tipo_certificado: 0, 
  tipo_reporte: 0,
  mes_salud: String(new Date().getMonth() + 1).padStart(2, '0'),
  ano_salud: new Date().getFullYear()
})

const meses = Array.from({length: 12}, (_, i) => ({ 
  label: new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase(), 
  value: String(i+1).padStart(2, '0') 
}))

const opUstedEs = [{label: 'Cotizante Activo', value: 0}, {label: 'Pensionado', value: 1}]
const opCert = [{label: 'Seguridad Social', value: 0}, {label: 'Cesantías', value: 1}]
const opRep = [{label: 'Sin Valores', value: 0}, {label: 'Con Valores', value: 1}]

const supervisoresOptions = computed(() => {
  return supervisores.value.map(s => ({
    label: `${s.nombre} ${s.apellidos}`,
    value: s._id
  }))
})

const fetchSupervisores = async () => {
  loadingSupervisores.value = true
  try {
    const res = await getData('/auth/supervisores')
    if (res.ok) {
      supervisores.value = res.supervisores
    }
  } catch (error) {
    console.error('Error cargando supervisores:', error)
  } finally {
    loadingSupervisores.value = false
  }
}

onMounted(() => {
  fetchSupervisores()
})

const submitReporte = async () => {
  if (!store.user?._id) {
    $q.notify({ type: 'negative', message: 'Sesión expirada. Por favor inicie sesión.' })
    router.push('/login')
    return
  }

  loading.value = true
  
  try {
    const payload = {
      contratistaId: store.user._id,
      supervisorId: formData.supervisorId,
      pagina: formData.pagina,
      dia: Number(formData.dia),
      // El bot usa 'ano' y 'mes_inicio' para el periodo de la planilla/salud
      // Enviamos exactamente lo que el usuario seleccionó en la sección de Salud
      ano: Number(formData.ano_salud), 
      mes_inicio: formData.mes_salud,
      mes_final: formData.mes_salud,
      usted_es: Number(formData.usted_es),
      numero_planilla: formData.numero_planilla || 'N/A',
      // La fecha de pago es informativa y se construye con los datos de la primera sección
      pago_planilla: new Date(formData.ano, Number(formData.mes_inicio) - 1, formData.dia),
      // Formato MM/YYYY para Mi Planilla
      periodo_salud: `${formData.mes_salud}/${formData.ano_salud}`,
      valor_planilla: Number(formData.valor_planilla) || 0,
      // Si es Asopagos, forzamos valores por defecto (Seguridad Social y Sin Valores)
      tipo_certificado: formData.pagina === 'Asopagos' ? 0 : Number(formData.tipo_certificado),
      tipo_reporte: formData.pagina === 'Asopagos' ? 0 : Number(formData.tipo_reporte)
    }

    // 1. Crear el reporte en la base de datos
    const res = await postData('/reporte/crear', payload)
    
    if (res.ok && res.reporte?._id) {
      
      // Actualizar el supervisor en el store del usuario para que se mantenga en la sesión
      if (store.user) {
        store.user.supervisorId = formData.supervisorId
      }

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
