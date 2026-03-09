<template>
  <div class="custom-card" :class="{ 'card--no-padding': noPadding }">
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 class="card-title">{{ title }}</h3>
      </slot>
    </div>
    <div class="card-body">
      <slot></slot>
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  noPadding: Boolean
})
</script>

<style scoped>
.custom-card {
  background: var(--sena-white);
  border-radius: var(--sena-radius);
  box-shadow: var(--sena-shadow);
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid var(--sena-gray-300);
}

.card--no-padding .card-body {
  padding: 0;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--sena-gray-300);
  background: var(--sena-gray-100);
}

.card-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--sena-gray-900);
}

.card-body {
  padding: 24px;
}

.card-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--sena-gray-300);
  background: var(--sena-gray-100);
}
</style>
