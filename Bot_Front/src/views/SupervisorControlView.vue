<template>
  <q-layout view="lHr lpR fFf" class="app-page">
    
    <!-- Sidebar Administrativa -->
    <q-drawer show-if-above v-model="drawerOpen" side="left" class="sidebar-container" :width="280">
      <div class="sidebar-content">
        <div class="sidebar-brand q-pa-xl flex items-center gap-md">
          <div class="logo-circle bg-green-8 flex flex-center">
            <q-icon name="smart_toy" color="white" size="24px" />
          </div>
          <div>
            <div class="text-h6 text-weight-bolder text-grey-9 line-height-1">CertBot</div>
            <div class="text-overline text-green-8 text-weight-bold">Control Panel</div>
          </div>
        </div>

        <q-list padding class="q-px-md">
          <q-item clickable v-ripple active class="nav-item">
            <q-item-section avatar><q-icon name="grid_view" /></q-item-section>
            <q-item-section class="text-weight-bold">Dashboard</q-item-section>
          </q-item>
          <q-item clickable v-ripple class="nav-item text-grey-7">
            <q-item-section avatar><q-icon name="people" /></q-item-section>
            <q-item-section>Contratistas</q-item-section>
          </q-item>
          <q-separator class="q-my-lg" />
          <q-item clickable v-ripple class="nav-item text-grey-7" @click="logout">
            <q-item-section avatar><q-icon name="logout" /></q-item-section>
            <q-item-section>Cerrar Sesión</q-item-section>
          </q-item>
        </q-list>

        <div class="sidebar-user q-mt-auto q-pa-lg">
          <div class="user-card-flat flex items-center gap-md">
            <q-avatar size="44px" color="green-8" text-color="white">{{ supervisorIniciales }}</q-avatar>
            <div class="column">
              <span class="text-weight-bold text-grey-9">{{ supervisorNombre }}</span>
              <span class="text-caption text-grey-6">Supervisor General</span>
            </div>
          </div>
        </div>
      </div>
    </q-drawer>

    <AppHeader :userName="supervisorNombre" />

    <q-page-container>
      <q-page class="q-pa-xl">
        
        <!-- Header con Resumen -->
        <div class="row q-mb-xl items-end justify-between">
          <div class="col-12 col-md-auto">
            <div class="text-overline text-green-8 text-weight-bold">RESUMEN DE VALIDACIONES</div>
            <h1 class="text-h4 text-weight-bolder text-grey-9 q-ma-none">Estado del Sistema</h1>
          </div>
          <div class="col-12 col-md-auto q-mt-md">
            <AppButton icon="refresh" :loading="loading" @click="obtenerReportes">Actualizar Vista</AppButton>
          </div>
        </div>

        <!-- KPIs Dinámicos (Calculados sobre los ejemplos) -->
        <div class="row q-col-gutter-lg q-mb-xl">
          <div class="col-12 col-sm-6 col-md-3">
            <StatCard label="Aportes en Línea" :value="totales.aportes" icon="payments" colorClass="icon-primary" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <StatCard label="Mi Planilla" :value="totales.miPlanilla" icon="description" colorClass="icon-teal" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <StatCard label="SOI" :value="totales.soi" icon="public" colorClass="icon-blue" />
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <StatCard label="Asopagos" :value="totales.asopagos" icon="fact_check" colorClass="icon-orange" />
          </div>
        </div>

        <!-- Tabla de Datos (Ejemplos) -->
        <AppCard noPadding class="table-card">
          <template #header>
            <div class="flex justify-between items-center q-py-xs">
              <span class="text-h6 text-weight-bold">Reportes Recientes</span>
              <q-input dense v-model="searchText" placeholder="Buscar por contratista..." class="q-px-md bg-grey-1 rounded-borders" borderless style="width: 300px;">
                <template #prepend><q-icon name="search" size="xs" /></template>
              </q-input>
            </div>
          </template>

          <q-table
            flat
            :rows="reportesFiltrados"
            :columns="columns"
            row-key="_id"
            class="dashboard-table"
            :loading="loading"
            :rows-per-page-options="[10]"
          >
            <!-- Slot para nombre del contratista -->
            <template v-slot:body-cell-contratista="props">
              <q-td :props="props">
                <div class="flex items-center gap-sm">
                  <q-avatar size="32px" color="grey-2" text-color="grey-8">{{ props.row.contratistaId.nombre.charAt(0) }}</q-avatar>
                  <div class="column">
                    <span class="text-weight-bold">{{ props.row.contratistaId.nombre }}</span>
                    <span class="text-caption text-grey-6">{{ props.row.contratistaId.correo }}</span>
                  </div>
                </div>
              </q-td>
            </template>

            <!-- Slot para moneda formateada -->
            <template v-slot:body-cell-valor="props">
              <q-td :props="props" class="text-weight-bold text-grey-9">
                {{ formatCurrency(props.row.valor_planilla) }}
              </q-td>
            </template>

            <!-- Slot para estado con Chips profesionales -->
            <template v-slot:body-cell-estado="props">
              <q-td :props="props">
                <q-chip 
                  :color="props.row.estado_descarga ? 'green-1' : 'orange-1'" 
                  :text-color="props.row.estado_descarga ? 'green-9' : 'orange-9'"
                  size="sm"
                  class="text-weight-bold"
                >
                  <q-icon :name="props.row.estado_descarga ? 'verified' : 'history'" size="14px" class="q-mr-xs" />
                  {{ props.row.estado_descarga ? 'DESCARGADO' : 'PENDIENTE' }}
                </q-chip>
              </q-td>
            </template>
          </q-table>
        </AppCard>

      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { notifyError, showLoading, hideLoading } from '@/utils/notificaciones'
import AppHeader from '@/components/AppHeader.vue'
import AppCard from '@/components/AppCard.vue'
import AppButton from '@/components/AppButton.vue'
import StatCard from '@/components/StatCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const drawerOpen = ref(true)
const loading = ref(false)
const searchText = ref('')

// DATOS DE EJEMPLO (Mock Data) para que el front funcione sin base de datos
const MOCK_DATA = [
  { _id: '1', pagina: 'SOI', ano: 2024, mes_inicio: '01', valor_planilla: 540000, estado_descarga: true, contratistaId: { nombre: 'Juan Pérez', correo: 'juan.perez@email.com' } },
  { _id: '2', pagina: 'Mi Planilla', ano: 2024, mes_inicio: '02', valor_planilla: 420000, estado_descarga: false, contratistaId: { nombre: 'María García', correo: 'm.garcia@email.com' } },
  { _id: '3', pagina: 'Aportes en Línea', ano: 2024, mes_inicio: '01', valor_planilla: 890000, estado_descarga: true, contratistaId: { nombre: 'Carlos Ruiz', correo: 'cruiz@email.com' } },
  { _id: '4', pagina: 'Asopagos', ano: 2023, mes_inicio: '12', valor_planilla: 310000, estado_descarga: true, contratistaId: { nombre: 'Ana Beltrán', correo: 'ana.b@email.com' } },
  { _id: '5', pagina: 'SOI', ano: 2024, mes_inicio: '03', valor_planilla: 540000, estado_descarga: false, contratistaId: { nombre: 'Diego López', correo: 'dlopez@email.com' } },
  { _id: '6', pagina: 'Mi Planilla', ano: 2024, mes_inicio: '01', valor_planilla: 420000, estado_descarga: true, contratistaId: { nombre: 'Elena Gómez', correo: 'egomez@email.com' } }
]

const reportesRaw = ref(MOCK_DATA)

const supervisorNombre = computed(() => authStore.user?.nombre || 'Administrador')
const supervisorIniciales = computed(() => supervisorNombre.value.substring(0,2).toUpperCase())

const columns = [
  { name: 'contratista', label: 'Contratista', align: 'left' },
  { name: 'pagina', label: 'Plataforma', align: 'left', field: 'pagina' },
  { name: 'ano', label: 'Año', align: 'left', field: 'ano' },
  { name: 'valor', label: 'Valor Reportado', align: 'left' },
  { name: 'estado', label: 'Estado Bot', align: 'left' }
]

const formatCurrency = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)

const totales = computed(() => ({
  aportes: reportesRaw.value.filter(r => r.pagina === 'Aportes en Línea').length,
  miPlanilla: reportesRaw.value.filter(r => r.pagina === 'Mi Planilla').length,
  soi: reportesRaw.value.filter(r => r.pagina === 'SOI').length,
  asopagos: reportesRaw.value.filter(r => r.pagina === 'Asopagos').length
}))

const reportesFiltrados = computed(() => {
  if (!searchText.value) return reportesRaw.value
  const term = searchText.value.toLowerCase()
  return reportesRaw.value.filter(r => 
    r.contratistaId.nombre.toLowerCase().includes(term) || 
    r.pagina.toLowerCase().includes(term)
  )
})

const obtenerReportes = async () => {
  loading.value = true
  showLoading('Sincronizando con base de datos...')
  // Simulamos una demora de red profesional
  setTimeout(() => {
    loading.value = false
    hideLoading()
    // Aquí iría el código real:
    // const res = await getData('/reportes/obtener')
    // if (res.ok) reportesRaw.value = res.reportes
  }, 1000)
}

const logout = () => { authStore.token = ''; authStore.user = null; router.push('/login') }

onMounted(() => {
  // obtenerReportes() // Comentado hasta que tengas datos en la DB
})
</script>

<style scoped>
.app-page { background: #f4f7f6; }
.sidebar-content { height: 100%; display: flex; flex-direction: column; background: white; border-right: 1px solid #eee; }
.nav-item { border-radius: 12px; margin-bottom: 4px; }
.nav-item.q-item--active { background: #e8f5e9; color: var(--sena-green); }
.table-card { border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.04); }
.line-height-1 { line-height: 1; }
</style>
