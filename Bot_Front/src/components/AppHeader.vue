<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-logo">
        <div class="logo-box">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Sena_Colombia_logo.svg/1024px-Sena_Colombia_logo.svg.png" alt="Logo" class="logo-img">
        </div>
        <div class="header-brand">
          <h1 class="header-title">CertBot</h1>
          <span class="header-subtitle">Gestión de Aportes</span>
        </div>
      </div>
      
      <div class="header-actions">
        <slot name="actions">
          <div class="header-user" v-if="userName">
            <span class="user-name">{{ userName }}</span>
            <q-avatar size="36px" color="primary" text-color="white">
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
  userName: String
})
</script>

<style scoped>
.app-header {
  background: var(--sena-white);
  border-bottom: 2px solid var(--sena-green);
  padding: 12px 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-box {
  width: 48px;
  height: 48px;
}

.logo-img {
  width: 100%;
  height: auto;
}

.header-brand {
  display: flex;
  flex-direction: column;
}

.header-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--sena-gray-900);
  line-height: 1;
}

.header-subtitle {
  font-size: 0.8rem;
  color: var(--sena-green);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-weight: 600;
  color: var(--sena-gray-700);
}
</style>
