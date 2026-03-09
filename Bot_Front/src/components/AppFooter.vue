<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Sección Izquierda: Marca -->
      <div class="footer-section brand-info">
        <h2 class="footer-brand-title">Cert<span>Bot</span></h2>
        <p class="footer-tagline">Sistema de Gestión y Revisión de Pagos</p>
      </div>

      <!-- Sección Central: Enlaces Rápidos -->
      <div class="footer-section links-grid">
        <div class="link-group">
          <a href="#" class="footer-link">Términos y Condiciones</a>
          <a href="#" class="footer-link">Política de Privacidad</a>
          <a href="#" class="footer-link">Soporte Técnico</a>
        </div>
      </div>

      <!-- Sección Derecha: Copyright -->
      <div class="footer-section copyright-info">
        <div class="copyright-text">
          &copy; {{ new Date().getFullYear() }} CertBot Digital.
          <span class="block-sm">Todos los derechos reservados.</span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
// No props needed for basic footer
</script>

<style scoped>
.app-footer {
  background: #FFFFFF;
  border-top: 1px solid var(--border-color);
  padding: 40px 0 30px 0;
  width: 100%;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
}

.footer-section {
  display: flex;
  flex-direction: column;
}

/* Marca */
.footer-brand-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 900;
  color: var(--sena-navy);
  line-height: 1;
  letter-spacing: -0.02em;
}

.footer-brand-title span {
  color: var(--sena-green);
}

.footer-tagline {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  margin-top: 4px;
}

/* Enlaces */
.link-group {
  display: flex;
  gap: 24px;
}

.footer-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.footer-link:hover {
  color: var(--sena-green);
  text-decoration: underline;
}

/* Copyright */
.copyright-info {
  text-align: right;
}

.copyright-text {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 500;
  line-height: 1.4;
}

.block-sm {
  display: block;
}

@media (max-width: 768px) {
  .footer-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 24px;
  }
  
  .copyright-info {
    text-align: center;
  }
  
  .link-group {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
