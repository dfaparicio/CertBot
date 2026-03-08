<template>
  <q-layout view="hHh lpR fFf" class="app-page">
    <AppHeader />
    <q-page-container>
      <q-page class="flex flex-center q-pa-lg bg-grey-2">
        <div class="report-layout">
          
          <div class="text-center q-mb-xl">
            <h1 class="text-h4 text-weight-bolder text-grey-9 q-mb-xs">Generar Reporte de Pago</h1>
            <p class="text-subtitle1 text-grey-7">Ingrese los datos exactos de su planilla de seguridad social.</p>
          </div>

          <div class="row q-col-gutter-xl">
            <div class="col-12 col-md-8">
              <AppCard>
                <q-form @submit.prevent="submitReporte" class="q-gutter-y-sm">
                  
                  <div class="col-12 q-mb-lg">
                    <AppInput 
                      v-model="formData.pagina" 
                      type="select" 
                      label="Plataforma de Pago" 
                      :options="opcionesPlataforma" 
                      emit-value 
                      map-options 
                      :rules="[v => !!v || 'Seleccione una plataforma']"
                    >
                      <template #prepend><q-icon name="language" color="primary" /></template>
                    </AppInput>
                  </div>

                  <div v-if="formData.pagina" class="row q-col-gutter-md">
                    
                    <!-- FECHA SEPARADA -->
                    <div class="col-12 col-sm-4">
                      <AppInput v-model.number="formData.dia" type="number" label="Día del Pago" placeholder="1-31" :rules="[v => (v > 0 && v <= 31) || 'Día inválido']" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <AppInput v-model="formData.mes_inicio" type="select" label="Mes" :options="meses" emit-value map-options :rules="[v => !!v || 'Requerido']" />
                    </div>
                    <div class="col-12 col-sm-4">
                      <AppInput v-model.number="formData.ano" type="number" label="Año" :rules="[v => !!v || 'Requerido']" />
                    </div>

                    <!-- CAMPOS DINÁMICOS -->
                    <div v-if="camposExtra.includes('mes_final')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.mes_final" type="select" label="Mes Final" :options="meses" emit-value map-options :rules="[v => !!v || 'Requerido']" />
                    </div>

                    <div v-if="camposExtra.includes('usted_es')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.usted_es" type="select" label="Usted es..." :options="opUstedEs" emit-value map-options />
                    </div>

                    <div v-if="camposExtra.includes('numero_planilla')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.numero_planilla" label="Número de Planilla" :rules="[v => !!v || 'Requerido']" />
                    </div>

                    <div v-if="camposExtra.includes('pago_planilla')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.pago_planilla" type="date" label="Fecha de Pago" :rules="[v => !!v || 'Requerido']" />
                    </div>

                    <!-- VALOR PAGADO (CORREGIDO: Permite cifras grandes sin bloqueos) -->
                    <div v-if="camposExtra.includes('valor_planilla')" class="col-12 col-sm-6">
                      <AppInput 
                        v-model.number="formData.valor_planilla" 
                        type="number" 
                        label="Valor Pagado (COP)" 
                        prefix="$"
                        placeholder="Ej: 500000"
                        :rules="[v => !!v || 'Ingrese el valor pagado', v => v > 0 || 'Valor inválido']"
                      >
                        <template #append>
                          <span class="text-caption text-grey-6">COP</span>
                        </template>
                      </AppInput>
                    </div>

                    <div v-if="camposExtra.includes('tipo_certificado')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.tipo_certificado" type="select" label="Tipo Certificado" :options="opCert" emit-value map-options />
                    </div>

                    <div v-if="camposExtra.includes('tipo_reporte')" class="col-12 col-sm-6">
                      <AppInput v-model="formData.tipo_reporte" type="select" label="Opción de Reporte" :options="opRep" emit-value map-options />
                    </div>

                  </div>

                  <div class="flex justify-end q-mt-xl">
                    <AppButton type="submit" :loading="loading" size="lg" class="q-px-xl" :disabled="!formData.pagina">
                      ENVIAR REPORTE
                    </AppButton>
                  </div>

                </q-form>
              </AppCard>
            </div>

            <div class="col-12 col-md-4">
              <AppCard class="bg-primary text-white no-border shadow-2">
                <div class="flex items-center gap-sm q-mb-md">
                  <q-icon name="payments" size="24px" />
                  <span class="text-subtitle1 text-weight-bold">Información de Pago</span>
                </div>
                <p class="text-body2 opacity-90">Ingrese el valor total pagado sin puntos ni comas. El sistema formateará la cifra automáticamente para su revisión.</p>
                <div v-if="formData.valor_planilla" class="q-mt-md q-pa-md rounded-borders bg-white text-primary text-h6 text-weight-bolder text-center">
                  {{ formatCurrency(formData.valor_planilla) }}
                </div>
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
import { postData } from '@/services/api'
import { useAuthStore } from '@/store/auth'
import { notifySuccess, notifyError, showLoading, hideLoading } from '@/utils/notificaciones'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppCard from '@/components/AppCard.vue'
import AppInput from '@/components/AppInput.vue'
import AppButton from '@/components/AppButton.vue'

const authStore = useAuthStore()
const loading = ref(false)

const formatCurrency = (val) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val)
}

const configCampos = {
  'Aportes en Línea': ['mes_final', 'usted_es'],
  'Mi Planilla': ['numero_planilla', 'pago_planilla', 'valor_planilla'],
  'SOI': [],
  'Asopagos': ['tipo_certificado', 'tipo_reporte']
}

const formData = reactive({
  pagina: '', dia: new Date().getDate(), ano: new Date().getFullYear(),
  mes_inicio: '', mes_final: '', usted_es: 0, numero_planilla: '',
  pago_planilla: '', valor_planilla: null, tipo_certificado: 0, tipo_reporte: 0
})

const camposExtra = computed(() => configCampos[formData.pagina] || [])
const opcionesPlataforma = Object.keys(configCampos).map(k => ({ label: k, value: k }))
const meses = Array.from({length: 12}, (_, i) => ({ 
  label: new Date(0, i).toLocaleString('es', {month: 'long'}).toUpperCase(), 
  value: String(i+1).padStart(2, '0') 
}))

const opUstedEs = [{label: 'Cotizante Activo', value: 0}, {label: 'Pensionado', value: 1}]
const opCert = [{label: 'Seguridad Social', value: 0}, {label: 'Cesantías', value: 1}]
const opRep = [{label: 'Sin Valores', value: 0}, {label: 'Con Valores', value: 1}]

const submitReporte = async () => {
  loading.value = true
  showLoading('Enviando reporte...')
  try {
    const payload = {
      contratistaId: authStore.user?._id,
      pagina: formData.pagina,
      dia: Number(formData.dia),
      ano: Number(formData.ano),
      mes_inicio: formData.mes_inicio,
      mes_final: formData.mes_final || formData.mes_inicio,
      usted_es: Number(formData.usted_es),
      numero_planilla: formData.numero_planilla || 'N/A',
      pago_planilla: formData.pago_planilla || new Date(),
      periodo_salud: `${formData.ano}-${formData.mes_inicio}`,
      valor_planilla: Number(formData.valor_planilla),
      tipo_certificado: Number(formData.tipo_certificado),
      tipo_reporte: Number(formData.tipo_reporte)
    }
    const res = await postData('/reportes/crear', payload)
    notifySuccess(res.msg)
    formData.pagina = ''
  } catch (e) {
    notifyError(e)
  } finally {
    loading.value = false
    hideLoading()
  }
}
</script>

<style scoped>
.report-layout { width: 100%; max-width: 1000px; }
.opacity-90 { opacity: 0.9; }
.gap-sm { gap: 8px; }
</style>
