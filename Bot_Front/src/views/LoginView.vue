<template>
  <q-layout view="hHh lpR fFf" class="login-page">
    
    <q-header elevated class="login-header">
      <q-toolbar class="q-px-lg q-py-sm">
        <div class="header-brand" style="display: flex; flex-direction: column; justify-content: center;">
          <h1 class="header-title" style="margin:0 !important; padding:0 !important; line-height: 0.85 !important; font-size: 1.5rem; font-weight: 900; color: var(--sena-navy);">Cert<span style="color: var(--sena-green);">Bot</span></h1>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700; margin-top: 2px !important; line-height: 1;">Sistema de Gestión y Revisión de Pagos</span>
        </div>
        <q-space />
        <div class="gt-sm row q-gutter-md">
          <q-btn flat no-caps label="Inicio" class="text-weight-medium" />
          <q-btn flat no-caps label="Ayuda" class="text-weight-medium" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="flex flex-center q-pa-md">
        
        <transition name="fade" mode="out-in">
          <div v-if="!selectedRole" class="selection-container" key="selection">
            <div class="text-center q-mb-xl">
              <h1 class="text-h3 text-weight-bolder text-sena-blue q-mb-md">
                ¿Cómo desea ingresar?
              </h1>
              <p class="text-h6 text-grey-7">
                Seleccione su perfil para acceder a la plataforma de gestión de pagos.
              </p>
            </div>

            <div class="row q-col-gutter-xl justify-center">
              <div class="col-12 col-md-5">
                <q-card class="role-card no-shadow" bordered @click="selectRole('contratista')">
                  <div class="role-icon-container">
                    <q-icon name="person" class="role-icon" />
                  </div>
                  <q-card-section class="q-pa-lg text-center">
                    <div class="text-h5 text-weight-bold text-sena-blue q-mb-sm">Soy Contratista</div>
                    <p class="text-grey-7">Suba sus comprobantes y consulte el estado de sus pagos de salud.</p>
                    <q-btn flat color="primary" label="Ingresar" no-caps icon-right="arrow_forward" />
                  </q-card-section>
                </q-card>
              </div>

              <div class="col-12 col-md-5">
                <q-card class="role-card no-shadow" bordered @click="selectRole('supervisor')">
                  <div class="role-icon-container">
                    <q-icon name="shield" class="role-icon" />
                  </div>
                  <q-card-section class="q-pa-lg text-center">
                    <div class="text-h5 text-weight-bold text-sena-blue q-mb-sm">Soy Supervisor</div>
                    <p class="text-grey-7">Revise, valide y gestione los reportes de seguridad social a su cargo.</p>
                    <q-btn flat color="primary" label="Ingresar" no-caps icon-right="arrow_forward" />
                  </q-card-section>
                </q-card>
              </div>
            </div>
            
            <div class="text-center q-mt-xl">
              <p class="text-grey-7">
                ¿Aún no tienes cuenta? 
                <q-btn flat no-caps label="Regístrate aquí" color="primary" class="text-weight-bold" to="/register" />
              </p>
            </div>
          </div>

          <div v-else class="login-card-wrapper" key="login">
            <div class="login-card">
              <div class="card-accent-bar"></div>
              <div class="q-pa-xl">
                
                <q-btn flat dense icon="arrow_back" label="Volver" class="back-button q-mb-lg" @click="selectedRole = null" />

                <div class="q-mb-xl">
                  <h2 class="text-h4 text-weight-bolder text-sena-blue q-mb-xs">Iniciar Sesión</h2>
                  <p class="text-grey-7 text-weight-medium">
                    Ingresando como <span class="text-sena-primary text-weight-bold text-uppercase">{{ selectedRole }}</span>
                  </p>
                </div>

                <q-form @submit="onLogin" class="q-gutter-md">
                  <div class="login-input-field">
                    <div class="text-weight-bold q-mb-xs text-sena-blue">Correo Electrónico</div>
                    <q-input v-model="loginForm.correo" outlined placeholder="ejemplo@sena.edu.co" lazy-rules :rules="[val => !!val || 'El correo es obligatorio']" bg-color="white">
                      <template v-slot:prepend><q-icon name="email" color="grey-6" /></template>
                    </q-input>
                  </div>

                  <div class="login-input-field">
                    <div class="row items-center justify-between q-mb-xs">
                      <div class="text-weight-bold text-sena-blue">Contraseña</div>
                      <q-btn flat dense no-caps label="¿Olvidó su contraseña?" color="primary" size="sm" />
                    </div>
                    <q-input v-model="loginForm.password" outlined :type="showPassword ? 'text' : 'password'" placeholder="••••••••" lazy-rules :rules="[val => !!val || 'La contraseña es obligatoria']" bg-color="white">
                      <template v-slot:prepend><q-icon name="lock" color="grey-6" /></template>
                      <template v-slot:append><q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" color="grey-6" /></template>
                    </q-input>
                  </div>

                  <div class="q-mt-lg">
                    <q-btn type="submit" class="full-width btn-primary-sena" no-caps :loading="loading" label="Entrar al Sistema">
                      <template v-slot:loading><q-spinner-facebook /></template>
                    </q-btn>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { postData } from '../services/api'
import { useMainStore } from '../store/store'
import AppFooter from '../components/AppFooter.vue'

const $q = useQuasar()
const router = useRouter()
const store = useMainStore()

const selectedRole = ref(null)
const showPassword = ref(false)
const loading = ref(false)

const loginForm = reactive({ correo: '', password: '' })

const selectRole = (role) => { selectedRole.value = role }

const onLogin = async () => {
  loading.value = true
  const endpoint = selectedRole.value === 'supervisor' ? '/auth/login' : '/auth/login-contratista'
  try {
    const data = await postData(endpoint, loginForm)
    if (data.ok) {
      store.token = data.token
      store.user = data.supervisor || data.contratista
      $q.notify({ type: 'positive', message: '¡Bienvenido(a)!', position: 'top-right' })
      router.push(selectedRole.value === 'supervisor' ? '/supervisor' : '/reports')
    }
  } catch (error) {
    const errorMsg = error.response?.data?.msg || 'Error de credenciales.'
    $q.notify({ type: 'negative', message: errorMsg, position: 'top-right' })
  } finally { loading.value = false }
}
</script>

<style scoped>
@import "../styles/login.css";
</style>
