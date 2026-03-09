<template>
  <div class="input-group">
    <label v-if="label" class="input-label">{{ label }}</label>
    
    <q-select
      v-if="type === 'select'"
      v-bind="$attrs"
      outlined
      dense
      class="custom-input"
    >
      <!-- Paso de slots de forma explícita y segura -->
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </q-select>

    <q-input
      v-else
      v-bind="$attrs"
      outlined
      dense
      class="custom-input"
      :type="type"
    >
      <!-- Paso de slots de forma explícita y segura -->
      <template v-if="$slots.prepend" #prepend>
        <slot name="prepend" />
      </template>
      <template v-if="$slots.append" #append>
        <slot name="append" />
      </template>
    </q-input>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  type: {
    type: String,
    default: 'text'
  }
})
</script>

<style scoped>
.input-group {
  margin-bottom: 24px;
  width: 100%;
}

.input-label {
  display: block;
  font-size: 11px;
  font-weight: 800;
  color: #555;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.custom-input :deep(.q-field__control) {
  border-radius: 8px;
  background-color: #fff;
}

.custom-input :deep(.q-field--outlined .q-field__control:before) {
  border-color: #d0d0d0;
}
</style>
