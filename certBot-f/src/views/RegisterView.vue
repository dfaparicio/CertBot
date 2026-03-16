<template>
  <q-layout view="hHh lpR fFf" class="register-page">
    
    <q-header elevated class="register-header">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="header-brand" style="display: flex; flex-direction: column; justify-content: center;">
          <h1 class="header-title" style="margin:0 !important; padding:0 !important; line-height: 0.85 !important; font-size: 1.5rem; font-weight: 900; color: var(--sena-navy);">Cert<span style="color: var(--sena-green);">Bot</span></h1>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-top: 2px !important; line-height: 1;">Sistema de Gestión y Revisión de Pagos</span>
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="flex flex-center">
        
        <transition name="fade-up" appear>
          <div class="register-container">
            <div class="register-card">
              <div class="card-accent-bar"></div>
              <div class="register-hero">
                <h1>Registro de Contratista</h1>
                <p>Cree su cuenta para gestionar sus pagos de seguridad social</p>
              </div>

              <div class="q-pa-xl">
                <q-form @submit="onSubmit" class="row q-col-gutter-lg">
                  
                  <div class="col-12">
                    <div class="form-section-title">Información Personal</div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Nombre(s)</div>
                    <q-input v-model="formData.nombre" outlined placeholder="Ej: Juan" dense lazy-rules :rules="[val => !!val || 'El nombre es obligatorio']">
                      <template v-slot:prepend><q-icon name="person" color="grey-7" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Apellidos</div>
                    <q-input v-model="formData.apellidos" outlined placeholder="Ej: Pérez" dense lazy-rules :rules="[val => !!val || 'Los apellidos son obligatorios']">
                      <template v-slot:prepend><q-icon name="person_outline" color="grey-7" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 q-mt-md">
                    <div class="form-section-title">Información de Identidad</div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Tipo de Documento</div>
                    <q-select v-model="formData.tipo_documento" outlined :options="opcionesDocumento" emit-value map-options dense lazy-rules :rules="[val => !!val || 'Requerido']">
                      <template v-slot:prepend><q-icon name="badge" color="grey-7" /></template>
                    </q-select>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Número de Identificación</div>
                    <q-input v-model="formData.numero_documento" outlined placeholder="Ej: 1020304050" dense mask="##########" lazy-rules :rules="[val => !!val || 'Requerido']">
                      <template v-slot:prepend><q-icon name="numbers" color="grey-7" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Fecha de Expedición</div>
                    <q-input v-model="formData.fecha_expedicion" type="date" outlined dense lazy-rules :rules="[val => !!val || 'Requerido']">
                      <template v-slot:prepend><q-icon name="calendar_today" color="grey-7" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 q-mt-md">
                    <div class="form-section-title">Salud y Afiliación</div>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Entidad de Salud (EPS)</div>
                    <q-select v-model="formData.eps" outlined :options="opcionesEPS" emit-value map-options dense lazy-rules :rules="[val => !!val || 'Requerido']">
                      <template v-slot:prepend><q-icon name="health_and_safety" color="grey-7" /></template>
                    </q-select>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Tipo de Afiliado</div>
                    <q-select 
                      v-model="formData.tipo_afiliado" 
                      outlined 
                      :options="opcionesAfiliado" 
                      emit-value 
                      map-options 
                      dense 
                      lazy-rules 
                      :rules="[val => val !== null && val !== '' || 'Requerido']"
                    >
                      <template v-slot:prepend><q-icon name="group" color="grey-7" /></template>
                    </q-select>
                  </div>

                  <div class="col-12 q-mt-md">
                    <div class="form-section-title">Credenciales de Acceso</div>
                  </div>

                  <div class="col-12">
                    <div class="input-label">Correo Electrónico</div>
                    <q-input 
                      v-model="formData.correo" 
                      outlined 
                      placeholder="correo@ejemplo.com" 
                      dense 
                      lazy-rules 
                      :rules="[val => /.+@.+\..+/.test(val) || 'Email inválido']"
                    >
                      <template v-slot:prepend><q-icon name="email" color="grey-7" /></template>
                      <template v-slot:append>
                        <q-btn-dropdown flat dense round dropdown-icon="alternate_email" color="grey-7">
                          <q-list>
                            <q-item v-for="domain in ['@gmail.com', '@outlook.com', '@sena.edu.co', '@hotmail.com']" :key="domain" clickable v-close-popup @click="completarCorreo(domain)">
                              <q-item-section>
                                <q-item-label>{{ domain }}</q-item-label>
                              </q-item-section>
                            </q-item>
                          </q-list>
                        </q-btn-dropdown>
                      </template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Contraseña</div>
                    <q-input v-model="formData.password" :type="showPassword ? 'text' : 'password'" outlined placeholder="••••••••" dense lazy-rules :rules="[val => val.length >= 6 || 'Mínimo 6 caracteres']">
                      <template v-slot:prepend><q-icon name="lock" color="grey-7" /></template>
                      <template v-slot:append><q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" color="grey-6" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 col-md-6">
                    <div class="input-label">Confirmar Contraseña</div>
                    <q-input v-model="confirmPassword" :type="showPassword ? 'text' : 'password'" outlined placeholder="••••••••" dense lazy-rules :rules="[val => val === formData.password || 'No coinciden']">
                      <template v-slot:prepend><q-icon name="lock_reset" color="grey-7" /></template>
                    </q-input>
                  </div>

                  <div class="col-12 q-mt-lg">
                    <q-btn type="submit" class="full-width btn-register-submit" no-caps :loading="loading" label="Completar Registro">
                      <template v-slot:loading><q-spinner-dots /></template>
                    </q-btn>
                  </div>

                  <div class="col-12 login-redirect">
                    <p class="text-grey-7">¿Ya tienes una cuenta? <router-link to="/login" class="login-link">Inicia Sesión aquí</router-link></p>
                  </div>
                </q-form>
              </div>
            </div>
          </div>
        </transition>

      </q-page>
    </q-page-container>

    <AppFooter />

  </q-layout>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { postData } from '../services/api'
import AppFooter from '../components/AppFooter.vue'

const $q = useQuasar()
const router = useRouter()
const loading = ref(false)
const showPassword = ref(false)
const confirmPassword = ref('')

const formData = reactive({ 
  nombre: '', 
  apellidos: '', 
  tipo_documento: '', 
  numero_documento: '', 
  fecha_expedicion: '', 
  eps: '', 
  tipo_afiliado: '', 
  correo: '', 
  password: '' 
})

const opcionesDocumento = [{ label: 'Cédula de Ciudadanía', value: 'CC' }, { label: 'Cédula de Extranjería', value: 'CE' }, { label: 'Pasaporte', value: 'PA' }]
const opcionesEPS = [{ label: 'Sura', value: 'Sura' }, { label: 'Sanitas', value: 'Sanitas' }, { label: 'Compensar', value: 'Compensar' }, { label: 'Nueva E.P.S', value: 'Nueva E.P.S' }, { label: 'Salud Total', value: 'Salud Total' }, { label: 'Famisanar', value: 'Famisanar' }]
const opcionesAfiliado = [{ label: 'Cotizante', value: 'Cotizante' }, { label: 'Pensionado', value: 'Pensionado' }]

const completarCorreo = (domain) => {
  const parts = formData.correo.split('@')
  formData.correo = parts[0] + domain
}

const onSubmit = async () => {
  loading.value = true
  try {
    const payload = {
      ...formData,
      numero_documento: String(formData.numero_documento),
      tipo_afiliado: formData.tipo_afiliado
    }
    const res = await postData('/auth/registro', payload)
    if (res.ok) {
      $q.notify({ type: 'positive', message: '¡Registro exitoso!', position: 'top-right' })
      router.push('/login')
    }
  } catch (error) {
    const msg = error.response?.data?.msg || 'Error en el registro.'
    $q.notify({ type: 'negative', message: msg, position: 'top-right' })
  } finally { loading.value = false }
}
</script>

<style scoped>
@import "../styles/register.css";
</style>
