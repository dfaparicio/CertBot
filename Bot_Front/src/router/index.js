import { createRouter, createWebHistory } from 'vue-router'
import PruebasView from '../views/PruebasView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import ReportRegisterView from '../views/ReportRegisterView.vue'
import SupervisorControlView from '../views/SupervisorControlView.vue'

const routes = [
  {
    path: '/',
    name: 'pruebas',
    component: PruebasView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
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

export default router