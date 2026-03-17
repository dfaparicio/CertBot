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

              <!-- SECCIÓN DE HISTORIAL DE REPORTES -->
              <div class="q-mt-xl">
                <div class="row items-center q-mb-md">
                  <q-icon name="history" size="md" color="primary" class="q-mr-sm" />
                  <div class="text-h5 text-weight-bold text-sena-navy">Historial de Mis Reportes</div>
                  <q-space />
                  <q-btn flat round icon="refresh" color="primary" @click="fetchMyReports" :loading="loadingHistory">
                    <q-tooltip>Actualizar Historial</q-tooltip>
                  </q-btn>
                </div>

                <q-table
                  :rows="myReports"
                  :columns="colReports"
                  row-key="_id"
                  :loading="loadingHistory"
                  no-data-label="Aún no ha registrado reportes"
                  class="no-shadow border-grey compact-table"
                  :pagination="{ rowsPerPage: 5 }"
                >
                  <template v-slot:body-cell-estado="props">
                    <q-td :props="props">
                      <q-chip
                        :color="getStatusColor(props.row.estado)"
                        text-color="white"
                        size="sm"
                        class="text-weight-bold"
                      >
                        {{ props.row.estado || 'Pendiente' }}
                      </q-chip>
                    </q-td>
                  </template>
                </q-table>
              </div>

            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
    <AppFooter />


  </q-layout>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
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
const myReports = ref([])
const loadingHistory = ref(false)

// Configuración del Formulario
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

const opcionesPlataforma = [
  { label: 'Mi Planilla', value: 'Mi Planilla' },
  { label: 'SOI', value: 'SOI' },
  { label: 'Aportes en Línea', value: 'Aportes en Línea' },
  { label: 'Asopagos', value: 'Asopagos' }
]

const meses = Array.from({length: 12}, (_, i) => ({ 
  label: new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase(), 
  value: String(i+1).padStart(2, '0') 
}))

const opUstedEs = [{label: 'Cotizante Activo', value: 0}, {label: 'Pensionado', value: 1}]

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

const fetchMyReports = async () => {
  if (!store.user?._id) return
  loadingHistory.value = true
  try {
    const res = await getData(`/reporte/supervisor/${store.user.supervisorId}`)
    if (res.ok) {
      myReports.value = res.reportes.filter(r => 
        (r.contratistaId?._id === store.user._id) || (r.contratistaId === store.user._id)
      )
    }
  } catch (error) {
    console.error('Error cargando historial:', error)
  } finally {
    loadingHistory.value = false
  }
}

onMounted(() => {
  fetchSupervisores()
  fetchMyReports()
})

onUnmounted(() => {
  // socket logic removed
})

const colReports = [
  { name: 'fecha', label: 'FECHA REGISTRO', align: 'left', field: row => new Date(row.createdAt).toLocaleDateString() },
  { name: 'pagina', label: 'PLATAFORMA', align: 'left', field: 'pagina_bot' },
  { name: 'periodo', label: 'PERIODO', align: 'left', field: 'periodo_salud' },
  { name: 'estado', label: 'ESTADO', align: 'center' }
]

const getStatusColor = (status) => {
  switch (status) {
    case 'Aprobado': return 'green-7'
    case 'Rechazado': return 'red-7'
    case 'Procesado': return 'blue-7'
    default: return 'orange-8'
  }
}

const submitReporte = async () => {
  if (!store.user?._id) {
    $q.notify({ type: 'negative', message: 'Sesión expirada.' })
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
      ano: Number(formData.ano_salud), 
      mes_inicio: formData.mes_salud,
      mes_final: formData.mes_salud,
      usted_es: Number(formData.usted_es),
      numero_planilla: formData.numero_planilla || 'N/A',
      pago_planilla: new Date(formData.ano, Number(formData.mes_inicio) - 1, formData.dia),
      periodo_salud: `${formData.mes_salud}/${formData.ano_salud}`,
      valor_planilla: Number(formData.valor_planilla) || 0,
      tipo_certificado: formData.pagina === 'Asopagos' ? 0 : Number(formData.tipo_certificado),
      tipo_reporte: formData.pagina === 'Asopagos' ? 0 : Number(formData.tipo_reporte),
      pagina_bot: formData.pagina
    }

    const res = await postData('/reporte/crear', payload)
    
    if (res.ok) {
      $q.notify({
        type: 'positive',
        message: 'Reporte registrado exitosamente para su procesamiento.',
        position: 'top-right',
        timeout: 4000
      })
      
      fetchMyReports()
      
      formData.pagina = ''
      formData.valor_planilla = null
    }
  } catch (error) {
    console.error('Error:', error)
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

.compact-table :deep(thead tr th) {
  background-color: #f8f9fa;
  font-weight: 700;
  color: var(--sena-navy);
}
</style>
