<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-logo">
        <div class="header-brand">
          <h1 class="header-title">Cert<span>Bot</span></h1>
          <span class="header-subtitle">Sistema de Gestión y Revisión de Pagos</span>
        </div>
      </div>
      
      <div class="header-actions">
        <slot name="actions">
          <div class="header-user" v-if="userName">
            <span class="user-name">{{ userName }}</span>
            <q-avatar size="36px" class="bg-sena-green text-white">
              {{ userName.charAt(0).toUpperCase() }}
            </q-avatar>
          </div>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  userName: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.app-header {
  background: #FFFFFF;
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.header-brand {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.header-title {
  margin: 0 !important;
  padding: 0 !important;
  line-height: 0.85 !important; /* Ajuste extremo para eliminar espacio vertical */
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--sena-navy);
  letter-spacing: -0.03em;
}

.header-title span {
  color: var(--sena-green);
}

.header-subtitle {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 700;
  line-height: 1;
  margin-top: 2px !important; /* Control manual del espacio */
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 12px;
  background: var(--bg-app);
  border-radius: 50px;
  border: 1px solid var(--border-color);
}

.user-name {
  font-weight: 700;
  color: var(--sena-navy);
  font-size: 0.875rem;
}

.bg-sena-green {
  background-color: var(--sena-green) !important;
}

@media (max-width: 600px) {
  .user-name { display: none; }
  .header-title { font-size: 1.4rem; }
}
</style>
