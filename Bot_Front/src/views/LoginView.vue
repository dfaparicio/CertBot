<template>
  <q-layout view="hHh lpR fFf">

    <!-- ═══════════ HEADER ═══════════ -->
    <q-header class="sena-header" bordered>
      <div class="header-inner">
        <div class="logo-row">
          <div class="logo-icon-box">
            <svg class="logo-svg" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"/>
            </svg>
          </div>
          <div>
            <div class="brand-name">SENA <span>Health</span></div>
            <div class="brand-sub-caption">Sistema de Pagos</div>
          </div>
        </div>
        <span class="header-right-text gt-sm">Servicio Nacional de Aprendizaje</span>
      </div>
    </q-header>

    <!-- ═══════════ PAGE ═══════════ -->
    <q-page-container>
      <q-page class="sena-page">
        <div class="login-wrapper">

          <!-- Card -->
          <div class="login-card">
            <div class="card-top-bar"></div>
            <div class="card-body">

              <div class="card-title-block">
                <div class="card-title">Iniciar Sesión</div>
                <div class="card-subtitle">Bienvenido al sistema de pagos de salud SENA</div>
              </div>

              <div class="form-space">

                <!-- Email -->
                <div class="field-wrap">
                  <label class="field-label" for="inp-email">Correo Electrónico</label>
                  <div class="input-relative">
                    <span class="mat-icon input-icon-left">mail</span>
                    <input id="inp-email" v-model="email" class="sena-input" type="email" placeholder="ejemplo@sena.edu.co"/>
                  </div>
                </div>

                <!-- Password -->
                <div class="field-wrap">
                  <div class="label-row">
                    <label class="field-label" for="inp-password">Contraseña</label>
                    <a href="#" class="forgot-link">¿Olvidó su contraseña?</a>
                  </div>
                  <div class="input-relative">
                    <span class="mat-icon input-icon-left">lock</span>
                    <input id="inp-password" v-model="password" class="sena-input has-right" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"/>
                    <button class="eye-toggle" type="button" @click="showPassword = !showPassword">
                      <span class="mat-icon">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>

                <!-- Remember -->
                <div class="check-row">
                  <input id="inp-remember" v-model="remember" class="sena-check" type="checkbox"/>
                  <label for="inp-remember" class="check-label">Recordarme en este dispositivo</label>
                </div>

                <!-- Submit -->
                <button class="submit-btn" type="button">
                  <span>Iniciar Sesión</span>
                  <span class="mat-icon submit-icon">login</span>
                </button>

              </div>

              <div class="card-bottom">
                <p class="card-bottom-text">
                  ¿No tiene una cuenta?
                  <a href="#" class="card-bottom-link">Solicite acceso aquí</a>
                </p>
              </div>

            </div>
          </div>

          <!-- SSL -->
          <div class="ssl-row">
            <span class="mat-icon ssl-icon">verified_user</span>
            Conexión Segura SSL
          </div>

        </div>
      </q-page>
    </q-page-container>

    <!-- ═══════════ FOOTER ═══════════ -->
    <q-footer class="sena-footer" bordered>
      <div class="footer-inner">
        <div class="footer-left">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6VuiFPRj4KiCOI4KatNkTkhC9XEYiNopyy4HbbSTZEBwDNd3dtNV5VuIpWdO9Tr8b_gkXja82X3P4xtWdZHt9nkTVfjgRWWKSCk9Noc67uvOuvxTmOoVpo8t9sgCvvY38TuPb-Rfrn56byi7BqhPALTsLDZXzdxc-exYEITkJyewvarFZ88Yy_P_hgSMsMf1vB_iKRogW3Qp20Kn0biC8knScYJ7Ntgf3o4UmmlqjMqrlbMEOh9SeTc6gmYQBjugsAWCH7SOe_Hfn" alt="Logo SENA" class="footer-logo"/>
          <div class="footer-copy-block gt-sm">
            <p>© 2024 SENA Health Payments.</p>
            <p>Todos los derechos reservados.</p>
          </div>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">Términos y Condiciones</a>
          <a href="#" class="footer-link">Política de Privacidad</a>
          <a href="#" class="footer-link">Soporte Técnico</a>
        </div>
      </div>
    </q-footer>

  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
// Importamos Axios y Pinia usando la estructura que dejó Diego
import { postData } from '../services/api'
import { useAuthStore } from '../store/auth'

const $q = useQuasar()
const router = useRouter()
const authStore = useAuthStore()

// --- 1. Las variables de tu Mockup ---
const email        = ref('')
const password     = ref('')
const remember     = ref(false)
const showPassword = ref(false)

// Variable extra para que el botón muestre que está cargando
const loading = ref(false)

// --- 2. La lógica del Login ---
const onSubmit = async () => {
  loading.value = true

  try {
    // Usamos la función postData de Diego y quitamos las llaves de { data }
    const data = await postData('/auth/login', {
      correo: email.value,
      password: password.value,
    })

    // Mensaje verde de éxito
    $q.notify({
      type: 'positive',
      message: data.message || '¡Sesión iniciada correctamente!',
      position: 'top',
    })

    // ... (el resto del código de Pinia y el catch quedan exactamente igual)

    // Usamos Pinia para guardar el token 
    // (Asumo que Diego llamó a la función 'setToken' o 'login' en su auth.js)
    if (authStore.setToken) {
      authStore.setToken(data.token)
    } else {
      localStorage.setItem('token', data.token) // Respaldo temporal
    }

    // Redirigimos a la pantalla principal
    router.push('/')
    
  } catch (error) {
    // Si la contraseña está mal o el servidor falla, sale la alerta roja
    const mensaje = error.response?.data?.message || 'Credenciales incorrectas o error del servidor.'
    $q.notify({
      type: 'negative',
      message: mensaje,
      position: 'top',
    })
  } finally {
    // Apagamos el estado de carga del botón
    loading.value = false
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

.mat-icon {
  font-family: 'Material Symbols Outlined';
  font-weight: normal; font-style: normal; font-size: 20px;
  line-height: 1; letter-spacing: normal; text-transform: none;
  display: inline-block; white-space: nowrap; -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

:deep(.sena-header) { background: #ffffff !important; border-bottom: 1px solid #e2e8f0 !important; box-shadow: none !important; color: #0f172a !important; }
.header-inner { max-width: 1280px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
.logo-row { display: flex; align-items: center; gap: 12px; }
.logo-icon-box { background: #135bec !important; padding: 8px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.logo-svg { width: 32px; height: 32px; color: #ffffff; display: block; }
.brand-name { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #135bec !important; line-height: 1.2; }
.brand-name span { color: #334155 !important; }
.brand-sub-caption { font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; font-weight: 600; color: #64748b; margin-top: 2px; }
.header-right-text { font-size: 14px; color: #64748b; }

:deep(.sena-page) { background: linear-gradient(135deg, rgba(19,91,236,0.05) 0%, transparent 60%) !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 24px 16px; }

.login-wrapper { width: 100%; max-width: 448px; display: flex; flex-direction: column; align-items: center; }

.login-card { width: 100%; background: #ffffff !important; border-radius: 12px !important; box-shadow: 0 20px 25px -5px rgba(0,0,0,.10), 0 8px 10px -6px rgba(0,0,0,.10) !important; border: 1px solid #e2e8f0 !important; overflow: hidden; }
.card-top-bar { height: 8px; background: #135bec !important; width: 100%; display: block; }
.card-body { padding: 32px; }
.card-title-block { text-align: center; margin-bottom: 32px; }
.card-title { font-size: 24px; font-weight: 700; color: #0f172a; line-height: 1.2; }
.card-subtitle { font-size: 14px; color: #64748b; margin-top: 8px; }

.form-space { display: flex; flex-direction: column; gap: 24px; }
.field-wrap { display: flex; flex-direction: column; gap: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #334155; }
.label-row { display: flex; align-items: center; justify-content: space-between; }
.forgot-link { font-size: 12px; font-weight: 500; color: #135bec !important; text-decoration: none; }
.forgot-link:hover { text-decoration: underline; }

.input-relative { position: relative; }
.input-icon-left { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 20px !important; pointer-events: none; }
.sena-input { width: 100%; padding: 12px 16px 12px 40px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff !important; font-family: 'Public Sans', sans-serif; font-size: 14px; color: #0f172a; outline: none; transition: border-color .2s, box-shadow .2s; -webkit-appearance: none; appearance: none; }
.sena-input.has-right { padding-right: 48px; }
.sena-input::placeholder { color: #94a3b8; }
.sena-input:focus { border-color: #135bec !important; box-shadow: 0 0 0 3px rgba(19,91,236,.15) !important; }

.eye-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none !important; border: none !important; box-shadow: none !important; cursor: pointer; color: #94a3b8; padding: 0; display: flex; align-items: center; transition: color .2s; }
.eye-toggle:hover { color: #475569; }

.check-row { display: flex; align-items: center; gap: 8px; }
.sena-check { width: 16px; height: 16px; accent-color: #135bec; cursor: pointer; flex-shrink: 0; }
.check-label { font-size: 14px; color: #475569; cursor: pointer; }

.submit-btn { width: 100%; background: #135bec !important; color: #ffffff !important; font-family: 'Public Sans', sans-serif !important; font-size: 16px !important; font-weight: 700 !important; padding: 12px 16px !important; border-radius: 8px !important; border: none !important; box-shadow: 0 4px 6px -1px rgba(19,91,236,.30) !important; cursor: pointer; display: flex !important; align-items: center !important; justify-content: center !important; gap: 8px; transition: background .2s; text-transform: none !important; letter-spacing: normal !important; }
.submit-btn:hover { background: #0f4fd4 !important; }
.submit-icon { font-size: 18px !important; }

.card-bottom { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center; }
.card-bottom-text { font-size: 14px; color: #64748b; margin: 0; }
.card-bottom-link { color: #135bec !important; font-weight: 700; text-decoration: none; }
.card-bottom-link:hover { text-decoration: underline; }

.ssl-row { margin-top: 32px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12px; color: #94a3b8; }
.ssl-icon { font-size: 16px !important; color: #94a3b8 !important; }

:deep(.sena-footer) { background: #ffffff !important; border-top: 1px solid #e2e8f0 !important; color: #334155 !important; }
.footer-inner { max-width: 1280px; margin: 0 auto; padding: 32px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
.footer-left { display: flex; align-items: center; gap: 24px; }
.footer-logo { height: 40px; opacity: .7; filter: grayscale(1); display: block; }
.footer-copy-block { font-size: 12px; color: #64748b; border-left: 1px solid #e2e8f0; padding-left: 24px; line-height: 1.6; }
.footer-copy-block p { margin: 0; }
.footer-links { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
.footer-link { font-size: 12px; font-weight: 500; color: #64748b; text-decoration: none; transition: color .2s; }
.footer-link:hover { color: #135bec !important; }
</style>