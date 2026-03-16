import { createRouter, createWebHistory } from 'vue-router'
import { useMainStore } from '../store/store'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ReportRegisterView from '../views/ReportRegisterView.vue'
import SupervisorControlView from '../views/SupervisorControlView.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { public: true }
  },
  {
    path: '/reports',
    name: 'reports',
    component: ReportRegisterView
  },
  {
    path: '/supervisor',
    name: 'supervisor',
    component: SupervisorControlView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const store = useMainStore()
  const isLoggedIn = !!store.user
  const isSupervisor = isLoggedIn && !store.user.numero_documento // Los contratistas tienen numero_documento

  // 1. Si la ruta es pública (Login/Register)
  if (to.meta.public) {
    if (isLoggedIn) {
      // Si ya está logueado, lo mandamos a su respectiva página
      return next(isSupervisor ? '/supervisor' : '/reports')
    }
    return next()
  }

  // 2. Si la ruta es privada y NO está logueado
  if (!isLoggedIn) {
    return next('/login')
  }

  // 3. Protección de rutas por "rol"
  if (to.path === '/supervisor' && !isSupervisor) {
    return next('/reports') // Un contratista no puede entrar a supervisor
  }

  if (to.path === '/reports' && isSupervisor) {
    return next('/supervisor') // Un supervisor no necesita el formulario de reportes
  }

  next()
})

export default router

