<template>
  <q-layout view="hHh lpR fFf" class="app-page bg-grey-2">
    
    <!-- Header Profesional SENA -->
    <q-header elevated class="bg-white text-sena-navy q-py-xs">
      <q-toolbar class="container-xl">
        <div class="header-brand">
          <h1 class="text-h5 text-weight-bolder" style="margin:0; line-height: 1;">Cert<span style="color: var(--sena-green);">Bot</span></h1>
          <span class="text-caption text-weight-bold text-grey-7">Gestión de Supervisión</span>
        </div>
        
        <q-space />

        <div class="row items-center gap-md">
          <div class="column items-end gt-xs">
            <span class="text-weight-bold">{{ supervisorNombre }}</span>
            <span class="text-caption text-sena-green text-weight-bold">SUPERVISOR ACTIVO</span>
          </div>
          <q-avatar size="40px" color="primary" text-color="white" class="q-ml-sm shadow-2">
            {{ supervisorIniciales }}
          </q-avatar>
          <q-btn flat round dense icon="logout" color="red-8" @click="handleLogout" class="q-ml-md">
            <q-tooltip>Cerrar Sesión</q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="q-pa-lg container-xl">
        
        <!-- Título y Acción Principal -->
        <div class="row q-mb-lg items-center justify-between">
          <div>
            <h1 class="text-h4 text-weight-bolder text-sena-navy q-ma-none">Panel de Control General</h1>
            <p class="text-subtitle2 text-grey-7">Visualización completa de contratistas y reportes de seguridad social.</p>
          </div>
          <q-btn 
            color="primary" 
            icon="sync" 
            label="Sincronizar Datos" 
            no-caps 
            unelevated 
            :loading="loading" 
            @click="cargarDatos" 
            class="btn-primary-sena q-px-lg shadow-2" 
          />
        </div>

        <!-- KPI Stats Cards (Arriba) -->
        <div class="row q-col-gutter-md q-mb-xl">
          <div v-for="stat in statsReportes" :key="stat.label" class="col-12 col-sm-6 col-md-3">
            <q-card class="stat-card no-shadow border-grey">
              <q-card-section class="row items-center no-wrap q-pa-md">
                <div class="col">
                  <div class="text-caption text-grey-7 text-weight-bold text-uppercase">{{ stat.label }}</div>
                  <div class="text-h4 text-weight-bolder text-sena-navy">{{ stat.value }}</div>
                </div>
                <div :class="['stat-icon-box', `bg-${stat.color}-1`]">
                  <q-icon :name="stat.icon" :color="stat.color" size="28px" />
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- SECCIÓN 1: MIS CONTRATISTAS -->
        <div class="q-mb-xl">
          <div class="flex items-center q-mb-md">
            <q-icon name="group" size="24px" color="primary" class="q-mr-sm" />
            <div class="text-h6 text-weight-bold text-sena-navy">Personal a Cargo ({{ contratistas.length }})</div>
          </div>
          <q-card flat bordered class="no-shadow border-grey">
            <q-table
              flat
              :rows="contratistas"
              :columns="colContratistas"
              row-key="_id"
              :pagination="{ rowsPerPage: 10 }"
              class="compact-table"
            >
              <template v-slot:body-cell-nombre_completo="props">
                <q-td :props="props" class="text-weight-bold text-sena-navy">
                  {{ props.row.nombre }} {{ props.row.apellidos }}
                </q-td>
              </template>
              <template v-slot:body-cell-estado="props">
                <q-td :props="props">
                  <q-badge :color="props.row.estado ? 'green-7' : 'red-7'" class="q-px-sm">
                    {{ props.row.estado ? 'ACTIVO' : 'INACTIVO' }}
                  </q-badge>
                </q-td>
              </template>
            </q-table>
          </q-card>
        </div>

      </q-page>
    </q-page-container>

    <!-- Footer Institucional -->
    <q-footer class="bg-white text-grey-7 border-top q-pa-sm text-center">
      <div class="text-caption text-weight-bold">© 2026 CertBot SENA - Sistema de Gestión de Pagos Automatizado</div>
    </q-footer>

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
const reportes = ref([])
const contratistas = ref([])

// --- Computeds ---
const supervisorNombre = computed(() => `${store.user?.nombre || ''} ${store.user?.apellidos || ''}`.trim())
const supervisorIniciales = computed(() => supervisorNombre.value.split(' ').map(n => n[0]).join('').toUpperCase())

const statsReportes = computed(() => [
  { label: 'Total Reportes', value: reportes.value.length, icon: 'summarize', color: 'primary' },
  { label: 'Pendientes', value: reportes.value.filter(r => (r.estado || 'Pendiente') === 'Pendiente').length, icon: 'pending', color: 'orange' },
  { label: 'Aprobados', value: reportes.value.filter(r => r.estado === 'Aprobado').length, icon: 'verified_user', color: 'green' },
  { label: 'Rechazados', value: reportes.value.filter(r => r.estado === 'Rechazado').length, icon: 'block', color: 'red' }
])

const colContratistas = [
  { name: 'nombre_completo', label: 'Nombre Completo', align: 'left' },
  { name: 'numero_documento', label: 'N° Documento', align: 'left', field: 'numero_documento' },
  { name: 'correo', label: 'Correo SENA', align: 'left', field: 'correo' },
  { name: 'eps', label: 'EPS Afiliada', align: 'left', field: 'eps' },
  { name: 'estado', label: 'Estado', align: 'left' }
]

// --- Métodos ---
const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const cargarDatos = async () => {
  if (!store.user?._id) return
  loading.value = true
  try {
    const res = await getData(`/reporte/supervisor/${store.user._id}`)
    if (res.ok) {
      reportes.value = res.reportes || []
      contratistas.value = res.contratistas || []
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: 'Error al conectar con el servidor', position: 'top-right' })
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  store.logout()
  router.push('/login')
}

onMounted(() => {
  cargarDatos()
})
</script>

<style scoped>
.container-xl {
  max-width: 1440px;
  margin: 0 auto;
}
.stat-card {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
}
.stat-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.border-grey {
  border: 1px solid #e0e0e0;
}
.border-top {
  border-top: 1px solid #e0e0e0;
}
.compact-table :deep(thead tr th) {
  background-color: #f8f9fa;
  font-weight: 700;
  color: var(--sena-navy);
}
</style>
