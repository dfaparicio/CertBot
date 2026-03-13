import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMainStore = defineStore('store', () => {
  // Estado para autenticación
  const token = ref('')
  const user = ref(null)

  // Estado para la UI si fuera necesario (puedes añadir más aquí)
  const isDrawerOpen = ref(true)

  const logout = () => {
    token.value = ''
    user.value = null
    // El plugin de persistencia se encargará de limpiar el localStorage automáticamente
    // al detectar que el estado ha vuelto a sus valores iniciales.
  }

  return { token, user, isDrawerOpen, logout }
}, {
  persist: true // Activando pinia-plugin-persistedstate
})
