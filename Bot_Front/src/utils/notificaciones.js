import { Notify, Loading, QSpinnerGears } from 'quasar'

/**
 * Muestra una notificación de éxito
 */
export const notifySuccess = (message) => {
  Notify.create({
    type: 'positive',
    message: message || 'Operación exitosa',
    position: 'top-right',
    icon: 'check_circle'
  })
}

/**
 * Muestra una notificación de error con manejo de respuesta de API
 */
export const notifyError = (error) => {
  const message = error.response?.data?.msg || error.message || 'Ocurrió un error inesperado'
  Notify.create({
    type: 'negative',
    message,
    position: 'top-right',
    icon: 'report_problem'
  })
}

/**
 * Control del Spinner global de Quasar
 */
export const showLoading = (message = 'Procesando...') => {
  Loading.show({
    spinner: QSpinnerGears,
    message,
    backgroundColor: 'green-10',
    messageColor: 'white'
  })
}

export const hideLoading = () => {
  Loading.hide()
}
