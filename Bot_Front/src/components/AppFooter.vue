<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-top">
        <div class="footer-info">
          <p class="footer-text">
            © 2026 <strong>CertBot</strong>. Todos los derechos reservados.
          </p>
          <p class="footer-location">Bogotá, Colombia</p>
        </div>
        <div class="footer-links">
          <a href="#" class="footer-link">Términos y Condiciones</a>
          <a href="#" class="footer-link">Política de Privacidad</a>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="accent-bar"></div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  background: var(--sena-white);
  padding: 40px 0 20px;
  margin-top: 60px;
  border-top: 1px solid var(--sena-gray-300);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.footer-text {
  margin: 0;
  color: var(--sena-gray-700);
}

.footer-location {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--sena-gray-700);
  opacity: 0.8;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-link {
  color: var(--sena-gray-700);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer-link:hover {
  color: var(--sena-green);
}

.accent-bar {
  height: 4px;
  background: var(--sena-green);
  width: 100px;
  margin: 30px auto 0;
  border-radius: 2px;
}
</style>
