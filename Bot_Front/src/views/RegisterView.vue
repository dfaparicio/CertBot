<template>
  <q-layout view="hHh lpR fFf" class="app-page">
    <AppHeader />
    <q-page-container>
      <q-page class="flex flex-center q-pa-md bg-grey-2">
        <div class="content-container">
          <div class="text-center q-mb-xl">
            <h1 class="text-h3 text-weight-bolder text-grey-9 q-mb-xs">Registro de Contratista</h1>
            <p class="text-subtitle1 text-grey-7">Vincule su cuenta al sistema de gestión de salud.</p>
            <div class="header-line"></div>
          </div>

          <AppCard class="form-card">
            <q-form @submit.prevent="submitForm" class="row q-col-gutter-lg">
              
              <div class="col-12 col-sm-6">
                <AppInput 
                  v-model="formData.tipo_documento" 
                  type="select" 
                  label="Tipo de Documento" 
                  :options="opcionesDocumento" 
                  emit-value 
                  map-options 
                  :rules="[v => !!v || 'Campo requerido']"
                >
                  <template #prepend><q-icon name="badge" color="primary" /></template>
                </AppInput>
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.numero_documento" label="Número de Identificación" placeholder="Sin puntos ni comas" :rules="[v => !!v || 'Campo requerido']">
                  <template #prepend><q-icon name="numbers" color="primary" /></template>
                </AppInput>
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.fecha_expedicion" type="date" label="Fecha de Expedición" :rules="[v => !!v || 'Campo requerido']" />
              </div>

              <div class="col-12 col-sm-6">
                <AppInput 
                  v-model="formData.eps" 
                  type="select" 
                  label="Entidad de Salud (EPS)" 
                  :options="opcionesEPS" 
                  emit-value 
                  map-options
                  :rules="[v => !!v || 'Campo requerido']"
                >
                  <template #prepend><q-icon name="health_and_safety" color="primary" /></template>
                </AppInput>
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.tipo_afiliado" type="select" label="Tipo de Afiliado" :options="opcionesAfiliado" emit-value map-options :rules="[v => !!v || 'Campo requerido']" />
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.correo" type="email" label="Correo Electrónico" :rules="[v => /.+@.+\..+/.test(v) || 'Formato de email inválido']">
                  <template #prepend><q-icon name="email" color="primary" /></template>
                </AppInput>
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.password" type="password" label="Contraseña" :rules="[v => v.length >= 6 || 'Mínimo 6 caracteres']">
                  <template #prepend><q-icon name="lock" color="primary" /></template>
                </AppInput>
              </div>

              <div class="col-12 col-sm-6">
                <AppInput v-model="formData.confirmPassword" type="password" label="Confirmar Contraseña" :rules="[v => v === formData.password || 'Las contraseñas no coinciden']" />
              </div>

              <div class="col-12 flex justify-between items-center q-mt-lg">
                <router-link to="/login" class="text-primary text-weight-bold" style="text-decoration: none;">¿Ya tiene cuenta? Inicie Sesión</router-link>
                <AppButton type="submit" :loading="loading" size="lg" class="q-px-xl">FINALIZAR REGISTRO</AppButton>
              </div>
            </q-form>
          </AppCard>
        </div>
      </q-page>
    </q-page-container>
    <AppFooter />
  </q-layout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { postData } from '@/services/api'
import { notifySuccess, notifyError, showLoading, hideLoading } from '@/utils/notificaciones'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import AppCard from '@/components/AppCard.vue'
import AppInput from '@/components/AppInput.vue'
import AppButton from '@/components/AppButton.vue'

const router = useRouter()
const loading = ref(false)

const formData = reactive({
  tipo_documento: '', numero_documento: '', fecha_expedicion: '',
  eps: '', tipo_afiliado: '', correo: '', password: '', confirmPassword: ''
})

const opcionesDocumento = [
  { label: 'Cédula de Ciudadanía', value: 'CC' },
  { label: 'Cédula de Extranjería', value: 'CE' },
  { label: 'Pasaporte', value: 'PA' },
  { label: 'Permiso por Protección Temporal (PPT)', value: 'PPT' }
]

const opcionesEPS = [
  { label: 'EPS Sanitas', value: 'Sanitas' },
  { label: 'EPS Sura', value: 'Sura' },
  { label: 'Nueva EPS', value: 'Nueva EPS' },
  { label: 'Salud Total', value: 'Salud Total' },
  { label: 'Compensar', value: 'Compensar' },
  { label: 'Famisanar', value: 'Famisanar' },
  { label: 'Coosalud', value: 'Coosalud' },
  { label: 'Mutual Ser', value: 'Mutual Ser' },
  { label: 'Aliansalud', value: 'Aliansalud' }
]

const opcionesAfiliado = [
  { label: 'Cotizante', value: 'Cotizante' },
  { label: 'Pensionado', value: 'Pensionado' }
]

const submitForm = async () => {
  loading.value = true
  showLoading('Procesando registro...')
  try {
    const { confirmPassword, ...data } = formData
    const res = await postData('/auth/registro', data)
    notifySuccess(res.msg)
    router.push('/login')
  } catch (e) {
    notifyError(e)
  } finally {
    loading.value = false
    hideLoading()
  }
}
</script>

<style scoped>
.content-container { width: 100%; max-width: 850px; }
.form-card { border-top: 6px solid var(--sena-green); }
.header-line { width: 60px; height: 4px; background: var(--sena-green); margin: 10px auto; border-radius: 2px; }
</style>
