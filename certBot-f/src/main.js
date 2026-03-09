import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { Quasar, Notify, Loading } from 'quasar'

// 1. IMPORTAR CSS DE QUASAR PRIMERO (CRÍTICO)
import 'quasar/dist/quasar.css'

// 2. IMPORTAR ICONOS DESDE @QUASAR/EXTRAS
import '@quasar/extras/material-icons/material-icons.css'
import '@quasar/extras/material-symbols-outlined/material-symbols-outlined.css'
import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'

// 3. NUESTROS ESTILOS
import './styles/variables.css'
import './style.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
app.use(router)

app.use(Quasar, {
  plugins: { Notify, Loading },
  config: {
    brand: {
      primary: '#39A900',
      secondary: '#FF6B00'
    }
  }
})

app.mount('#app')
