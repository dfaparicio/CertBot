<template>
  <q-layout view="lHr lpR fFf" class="app-page bg-grey-1">
    
    <!-- Sidebar Administrativa -->
    <q-drawer show-if-above v-model="store.isDrawerOpen" side="left" class="sidebar-container" :width="280" elevated>
      <div class="sidebar-content column full-height">
        <div class="sidebar-brand" style="display: flex; flex-direction: column; justify-content: center;">
          <h1 class="text-h5 text-weight-bolder text-sena-blue" style="margin:0 !important; padding:0 !important; line-height: 0.85 !important; display: inline-block;">Cert<span style="color: var(--sena-green);">Bot</span></h1>
          <span class="text-caption text-sena-primary text-weight-bold" style="margin-top: 2px !important; line-height: 1;">Sistema de Gestión y Revisión de Pagos</span>
        </div>

        <q-list padding class="q-px-md flex-1 q-mt-md">
          <q-item clickable v-ripple active class="nav-item" active-class="bg-green-1 text-sena-green">
            <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
            <q-item-section class="text-weight-bold">Panel de Control</q-item-section>
          </q-item>
          
          <q-item clickable v-ripple class="nav-item text-grey-7">
            <q-item-section avatar><q-icon name="group" /></q-item-section>
            <q-item-section>Contratistas</q-item-section>
          </q-item>

          <q-item clickable v-ripple class="nav-item text-grey-7">
            <q-item-section avatar><q-icon name="history" /></q-item-section>
            <q-item-section>Historial de Auditoría</q-item-section>
          </q-item>

          <q-separator class="q-my-lg" />

          <q-item clickable v-ripple class="nav-item text-red-8" @click="handleLogout">
            <q-item-section avatar><q-icon name="logout" /></q-item-section>
            <q-item-section class="text-weight-bold">Cerrar Sesión</q-item-section>
          </q-item>
        </q-list>

        <div class="sidebar-user q-pa-lg bg-grey-2">
          <div class="flex items-center gap-md">
            <q-avatar size="44px" color="sena-navy" text-color="white">{{ supervisorIniciales }}</q-avatar>
            <div class="column">
              <span class="text-weight-bold text-sena-navy truncate" style="max-width: 140px">{{ supervisorNombre }}</span>
              <span class="text-caption text-grey-7">Supervisor Activo</span>
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <q-page class="q-pa-xl">
        
        <!-- Header del Dashboard -->
        <div class="row q-mb-xl items-end justify-between">
          <div class="col-12 col-md-auto">
            <div class="text-overline text-sena-green text-weight-bold">VISIÓN GENERAL ADMINISTRATIVA</div>
            <h1 class="text-h3 text-weight-bolder text-sena-navy q-ma-none">Dashboard de Gestión</h1>
          </div>
          <div class="col-12 col-md-auto q-mt-md">
            <q-btn 
              color="primary" 
              icon="refresh" 
              label="Sincronizar Datos" 
              no-caps 
              unelevated 
              :loading="loading" 
              @click="obtenerReportes"
              class="btn-primary-sena q-px-lg"
            />
          </div>
        </div>

        <!-- KPI Stats Grid -->
        <div class="row q-col-gutter-lg q-mb-xl">
          <div v-for="stat in kpiStats" :key="stat.label" class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card no-shadow">
              <q-card-section class="row items-center no-wrap q-pa-lg">
                <div class="col">
                  <div class="text-caption text-grey-7 text-weight-bold text-uppercase">{{ stat.label }}</div>
                  <div class="text-h4 text-weight-bolder text-sena-navy">{{ stat.value }}</div>
                </div>
                <div :class="['stat-icon-box', `bg-${stat.color}-1`]">
                  <q-icon :name="stat.icon" :color="stat.color" size="24px" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Tabla Principal de Reportes -->
        <div class="q-mb-md flex items-center justify-between">
          <div class="text-h5 text-weight-bolder text-sena-navy">Reportes de Seguridad Social</div>
          <q-input dense v-model="searchText" placeholder="Buscar por documento o correo..." outlined class="bg-white" style="width: 350px; border-radius: 12px;">
            <template v-slot:prepend><q-icon name="search" color="grey-6" /></template>
          </q-input>
        </div>

        <q-table
          flat
          :rows="reportesFiltrados"
          :columns="columns"
          row-key="_id"
          :loading="loading"
          class="dashboard-table"
          no-data-label="No se encontraron reportes para mostrar"
        >
          <!-- Slot Contratista: Info Agrupada -->
          <template v-slot:body-cell-contratista="props">
            <q-td :props="props">
              <div class="column">
                <span class="text-weight-bold text-sena-navy">{{ props.row.contratistaId?.correo }}</span>
                <div class="row items-center gap-xs">
                  <q-chip dense size="xs" color="grey-2" text-color="grey-9" class="q-ma-none">DOC: {{ props.row.contratistaId?.numero_documento }}</q-chip>
                  <q-chip dense size="xs" color="blue-1" text-color="blue-9" class="q-ma-none">EPS: {{ props.row.contratistaId?.eps || 'Sura' }}</q-chip>
                </div>
              </div>
            </q-td>
          </template>

          <!-- Slot Valor -->
          <template v-slot:body-cell-valor="props">
            <q-td :props="props" class="text-weight-bolder text-sena-navy">
              {{ formatCurrency(props.row.valor_planilla || 0) }}
            </q-td>
          </template>

          <!-- Slot Estado -->
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-chip 
                :class="['status-chip', props.row.estado_descarga ? 'bg-soft-green' : 'bg-soft-orange']"
                unelevated
                size="sm"
              >
                {{ props.row.estado_descarga ? 'PROCESADO' : 'PENDIENTE' }}
              </q-chip>
            </q-td>
          </template>

          <!-- Slot Acciones -->
          <template v-slot:body-cell-acciones="props">
            <q-td :props="props" class="q-gutter-x-sm">
              <q-btn 
                flat round dense 
                color="sena-green" 
                icon="check_circle" 
                @click="cambiarEstadoDescarga(props.row)"
                v-if="!props.row.estado_descarga"
              >
                <q-tooltip>Marcar como revisado</q-tooltip>
              </q-btn>
              <q-btn flat round dense color="blue-7" icon="visibility">
                <q-tooltip>Ver planilla completa</q-tooltip>
              </q-btn>
              <q-btn flat round dense color="grey-5" icon="more_vert" />
            </q-td>
          </template>
        </q-table>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { getData, putData } from '../services/api'
import { useMainStore } from '../store/store'

const $q = useQuasar()
const router = useRouter()
const store = useMainStore()
const loading = ref(false)
const searchText = ref('')

// --- MOCK DATA PARA DISEÑO (Basado en el backend real) ---
const MOCK_REPORTES = [
  { _id: '1', pagina: 'SOI', ano: 2024, valor_planilla: 540000, estado_descarga: true, contratistaId: { correo: 'juan.perez@sena.edu.co', numero_documento: '1020304050', eps: 'Sura' } },
  { _id: '2', pagina: 'Mi Planilla', ano: 2024, valor_planilla: 420000, estado_descarga: false, contratistaId: { correo: 'maria.garcia@sena.edu.co', numero_documento: '1080907060', eps: 'Sanitas' } },
  { _id: '3', pagina: 'Aportes en Línea', ano: 2024, valor_planilla: 890000, estado_descarga: true, contratistaId: { correo: 'carlos.ruiz@sena.edu.co', numero_documento: '1050403020', eps: 'Compensar' } },
  { _id: '4', pagina: 'Asopagos', ano: 2024, valor_planilla: 310000, estado_descarga: false, contratistaId: { correo: 'ana.beltran@sena.edu.co', numero_documento: '1030201040', eps: 'Nueva EPS' } }
]

const reportesRaw = ref(MOCK_REPORTES)

// --- Computeds ---
const supervisorNombre = computed(() => store.user?.nombre || 'Administrador SENA')
const supervisorIniciales = computed(() => supervisorNombre.value.substring(0,2).toUpperCase())

const kpiStats = computed(() => [
  { label: 'Total Reportes', value: reportesRaw.value.length, icon: 'analytics', color: 'indigo' },
  { label: 'Por Revisar', value: reportesRaw.value.filter(r => !r.estado_descarga).length, icon: 'pending_actions', color: 'orange' },
  { label: 'Procesados', value: reportesRaw.value.filter(r => r.estado_descarga).length, icon: 'task_alt', color: 'green' },
  { label: 'Monto Total', value: formatCurrency(reportesRaw.value.reduce((acc, r) => acc + (r.valor_planilla || 0), 0)), icon: 'payments', color: 'teal' }
])

const columns = [
  { name: 'contratista', label: 'Contratista / Identidad', align: 'left' },
  { name: 'pagina', label: 'Plataforma', align: 'left', field: 'pagina' },
  { name: 'ano', label: 'Periodo', align: 'left', field: 'ano' },
  { name: 'valor', label: 'Valor Reportado', align: 'left' },
  { name: 'estado', label: 'Estado', align: 'left' },
  { name: 'acciones', label: 'Acciones', align: 'center' }
]

// --- Métodos ---
const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const reportesFiltrados = computed(() => {
  if (!searchText.value) return reportesRaw.value
  const term = searchText.value.toLowerCase()
  return reportesRaw.value.filter(r => 
    r.contratistaId?.correo?.toLowerCase().includes(term) || 
    r.contratistaId?.numero_documento?.includes(term) ||
    r.pagina.toLowerCase().includes(term)
  )
})

const obtenerReportes = async () => {
  loading.value = true
  try {
    // PETICIÓN LISTA: Cuando crees el endpoint GET /reporte/todos
    const res = await getData('/reporte/todos')
    if (res.ok && res.reportes?.length > 0) {
      reportesRaw.value = res.reportes
    }
  } catch (error) {
    console.warn('Backend offline o sin ruta GET /reporte/todos. Usando Mock Data.')
  } finally {
    loading.value = false
  }
}

const cambiarEstadoDescarga = async (reporte) => {
  try {
    // PETICIÓN LISTA: Usa el endpoint PUT /actualizar/:id del backend
    const res = await putData(`/reporte/actualizar/${reporte._id}`, { 
      pagina: reporte.pagina, 
      estado_descarga: true 
    })
    
    if (res.ok) {
      $q.notify({ type: 'positive', message: 'Reporte procesado correctamente', position: 'bottom-right' })
      obtenerReportes() 
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al actualizar el estado' })
  }
}

const handleLogout = () => {
  store.logout()
  router.push('/login')
}

onMounted(() => {
  // En producción, aquí validarías el token
  obtenerReportes()
})
</script>

<style scoped>
@import "../styles/supervisor.css";
</style>
