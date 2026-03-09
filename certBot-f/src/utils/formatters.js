/**
 * Formatea un número a pesos colombianos para mostrar en el Front
 */
export const formatCOP = (value) => {
  if (!value) return '$ 0'
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(value)
}

/**
 * Limpia un string de moneda para enviarlo como Number al Backend
 */
export const unformatCOP = (value) => {
  if (typeof value === 'number') return value
  return Number(value.replace(/[^0-9.-]+/g, ""))
}
