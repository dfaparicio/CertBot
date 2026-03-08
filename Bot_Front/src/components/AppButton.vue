<template>
  <q-btn
    v-bind="$attrs"
    :color="color === 'primary' ? 'primary' : color"
    :class="['custom-button', `button--${color}`]"
    unelevated
    no-caps
  >
    <slot></slot>
  </q-btn>
</template>

<script setup>
defineProps({
  color: {
    type: String,
    default: 'primary'
  }
})
</script>

<style scoped>
.custom-button {
  font-weight: 700;
  border-radius: 8px;
  transition: all 0.3s ease;
  padding: 8px 16px;
  letter-spacing: 0.5px;
}

/* Sobrescribir estilos de Quasar si es necesario */
.button--primary {
  background-color: var(--sena-green) !important;
  color: white !important;
}

.button--primary:hover {
  background-color: var(--sena-green-dark) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(57, 169, 0, 0.3);
}

.button--secondary {
  background-color: var(--sena-orange) !important;
  color: white !important;
}

.button--outline {
  border: 2px solid var(--sena-green) !important;
  color: var(--sena-green) !important;
  background: transparent !important;
}
</style>
