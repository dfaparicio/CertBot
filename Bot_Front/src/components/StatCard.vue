<template>
  <div class="stat-card">
    <div class="stat-icon" :class="colorClass">
      <q-icon :name="icon" size="24px" />
    </div>
    <div class="stat-content">
      <span class="stat-label">{{ label }}</span>
      <h3 class="stat-value">{{ value }}</h3>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  colorClass: String
})
</script>

<style scoped>
.stat-card {
  background: white;
  padding: 20px;
  border-radius: var(--sena-radius);
  box-shadow: var(--sena-shadow);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--sena-gray-300);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--sena-gray-700);
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--sena-gray-900);
}

.icon-primary { background: #e8f5e9; color: #2e7d32; }
.icon-teal { background: #e0f2f1; color: #00695c; }
.icon-blue { background: #e3f2fd; color: #1565c0; }
.icon-orange { background: #fff3e0; color: #ef6c00; }
</style>
