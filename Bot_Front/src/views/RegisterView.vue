<template>
  <q-layout view="hHh lpR fFf" class="sena-layout">

    <!-- ───────────── HEADER ───────────── -->
    <q-header class="sena-header" bordered>
      <div class="header-inner row items-center justify-between no-wrap">

        <!-- Logo -->
        <div class="row items-center gap-logo">
          <div class="logo-icon-wrap">
            <span class="material-symbols-outlined logo-icon-sym">health_and_safety</span>
          </div>
          <span class="logo-text">SENA Salud</span>
        </div>

        <!-- Nav + CTA -->
        <div class="row items-center no-wrap gap-nav">
          <nav class="nav-links row items-center gt-sm">
            <a href="#" class="nav-link">Inicio</a>
            <a href="#" class="nav-link">Nosotros</a>
            <a href="#" class="nav-link">Contacto</a>
          </nav>
          <q-btn
            label="Iniciar Sesión"
            no-caps
            unelevated
            class="login-btn"
          />
        </div>
      </div>
    </q-header>

    <!-- ───────────── PAGE ───────────── -->
    <q-page-container>
      <q-page class="sena-page flex flex-center">
        <div class="page-inner column items-center full-width">

          <!-- Title block -->
          <div class="title-block text-center">
            <h1 class="page-title">Registro de Usuario</h1>
            <p class="page-subtitle">
              Selecciona tu rol en la plataforma para continuar con el proceso de
              registro y acceder a las funcionalidades correspondientes.
            </p>
          </div>

          <!-- Role Cards Grid -->
          <div class="cards-grid row q-col-gutter-xl full-width justify-center">

            <!-- Card: Usuario (Beneficiario) -->
            <div class="col-12 col-md-6">
              <a href="#" class="role-card column">
                <div class="card-visual flex flex-center">
                  <span class="material-symbols-outlined card-icon">person</span>
                </div>
                <div class="card-body column flex-1 q-pa-lg">
                  <h3 class="card-title">Usuario (Beneficiario)</h3>
                  <p class="card-desc flex-1">
                    Regístrate como usuario para gestionar tus pagos de salud,
                    subir comprobantes, consultar estados de trámite y hacer
                    seguimiento a tus beneficios.
                  </p>
                  <div class="card-cta row items-center">
                    Seleccionar este rol
                    <span class="material-symbols-outlined cta-arrow">arrow_forward</span>
                  </div>
                </div>
                <div class="card-ring" />
              </a>
            </div>

            <!-- Card: Supervisor -->
            <div class="col-12 col-md-6">
              <a href="#" class="role-card column">
                <div class="card-visual flex flex-center">
                  <span class="material-symbols-outlined card-icon">shield_person</span>
                </div>
                <div class="card-body column flex-1 q-pa-lg">
                  <h3 class="card-title">Supervisor</h3>
                  <p class="card-desc flex-1">
                    Regístrate como supervisor para revisar comprobantes, aprobar
                    pagos, generar reportes y hacer seguimiento integral a los
                    beneficiarios a tu cargo.
                  </p>
                  <div class="card-cta row items-center">
                    Seleccionar este rol
                    <span class="material-symbols-outlined cta-arrow">arrow_forward</span>
                  </div>
                </div>
                <div class="card-ring" />
              </a>
            </div>

          </div>

          <!-- Login hint -->
          <div class="login-hint text-center">
            <p class="hint-text">
              ¿Ya tienes una cuenta?
              <a href="#" class="hint-link">Inicia sesión aquí</a>
            </p>
          </div>

        </div>
      </q-page>
    </q-page-container>

    <!-- ───────────── FOOTER ───────────── -->
    <q-footer class="sena-footer" bordered>
      <div class="footer-inner row items-center justify-between flex-wrap">

        <div class="row items-center gap-footer-logo">
          <span class="material-symbols-outlined footer-logo-icon">health_and_safety</span>
          <span class="footer-brand">SENA Salud</span>
        </div>

        <div class="row items-center gap-footer-links flex-wrap justify-center">
          <a href="#" class="footer-link">Términos y Condiciones</a>
          <a href="#" class="footer-link">Política de Privacidad</a>
          <a href="#" class="footer-link">Ayuda</a>
        </div>

        <p class="footer-copy">© 2023 Proyecto SENA. Todos los derechos reservados.</p>
      </div>
    </q-footer>

  </q-layout>
</template>

<script setup>
// No logic needed — pure presentational page
</script>

<style scoped>
/* ─── Google Fonts (add to index.html if not already present) ─── */
@import url('https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,100..900;1,100..900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* ─── CSS Variables ─── */
:root {
  --primary:     #39A900;
  --sena-blue:   #00324D;
  --bg-light:    #f6f6f8;
  --border:      #e2e8f0;
  --text-muted:  #475569;
  --text-gray:   #64748b;
  --text-faint:  #94a3b8;
}

/* ─── Layout ─── */
.sena-layout {
  font-family: 'Public Sans', sans-serif;
  background: var(--bg-light);
}

/* ─── Header ─── */
.sena-header {
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  color: var(--sena-blue);
  box-shadow: 0 1px 3px 0 rgba(0,0,0,.07);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-inner {
  max-width: 100%;
  padding: 0 40px;
  height: 64px;
}

.gap-logo { gap: 16px; }
.gap-nav  { gap: 32px; }

/* Logo */
.logo-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(57,169,0,.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-icon-sym {
  font-size: 22px !important;
  color: var(--primary);
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400;
}
.logo-text {
  color: var(--sena-blue);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.015em;
  white-space: nowrap;
}

/* Nav links */
.nav-links { gap: 36px; }
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color .2s;
}
.nav-link:hover { color: var(--primary); }

/* Login button */
.login-btn {
  background: var(--primary) !important;
  color: #ffffff !important;
  border-radius: 8px !important;
  height: 40px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  letter-spacing: 0.015em;
  min-width: 84px;
  white-space: nowrap;
  transition: background .2s !important;
}
.login-btn:hover { background: rgba(57,169,0,.9) !important; }

/* ─── Page ─── */
.sena-page {
  background: var(--bg-light);
  min-height: calc(100vh - 64px - 82px);
  padding: 48px 16px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.page-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}

/* Title */
.title-block {
  max-width: 672px;
  margin: 0 auto 48px;
}
.page-title {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  color: var(--sena-blue);
  letter-spacing: -0.015em;
  line-height: 1.1;
  margin: 0 0 16px;
}
.page-subtitle {
  font-size: 18px;
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

/* Cards grid */
.cards-grid {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

/* Role Card */
.role-card {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1);
  border: 1px solid var(--border);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  position: relative;
  transition: box-shadow .3s ease;
  height: 100%;
  cursor: pointer;
}
.role-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1);
}

/* Card top area (gradient) */
.card-visual {
  height: 192px;
  background: linear-gradient(135deg, #eff6ff 0%, rgba(57,169,0,.1) 100%);
  flex-shrink: 0;
}
.card-icon {
  font-size: 96px !important;
  color: var(--sena-blue);
  opacity: .8;
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400;
  transition: transform .3s ease;
}
.role-card:hover .card-icon { transform: scale(1.1); }

/* Card body */
.card-body { padding: 32px !important; }

.card-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--sena-blue);
  margin: 0 0 12px;
  transition: color .2s;
}
.role-card:hover .card-title { color: var(--primary); }

.card-desc {
  color: #475569;
  font-size: 15px;
  line-height: 1.65;
  margin: 0 0 24px;
}

.card-cta {
  color: var(--primary);
  font-weight: 600;
  font-size: 15px;
  gap: 8px;
  margin-top: auto;
}
.cta-arrow {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400;
  font-size: 20px !important;
  transition: transform .2s ease;
}
.role-card:hover .cta-arrow { transform: translateX(8px); }

/* Hover border ring */
.card-ring {
  position: absolute;
  inset: 0;
  border: 2px solid transparent;
  border-radius: 12px;
  pointer-events: none;
  transition: border-color .2s;
}
.role-card:hover .card-ring { border-color: var(--primary); }

/* Login hint */
.login-hint { margin-top: 48px; }
.hint-text {
  color: #64748b;
  font-size: 14px;
  margin: 0;
}
.hint-link {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}
.hint-link:hover { text-decoration: underline; }

/* ─── Footer ─── */
.sena-footer {
  background: #ffffff;
  border-top: 1px solid var(--border);
  color: var(--sena-blue);
}
.footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px;
  gap: 16px;
}
.gap-footer-logo  { gap: 8px; }
.gap-footer-links { gap: 24px; }

.footer-logo-icon {
  font-family: 'Material Symbols Outlined';
  font-variation-settings: 'FILL' 0, 'wght' 400;
  color: var(--primary);
  font-size: 22px !important;
}
.footer-brand {
  color: var(--sena-blue);
  font-weight: 700;
  font-size: 14px;
}
.footer-link {
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color .2s;
}
.footer-link:hover { color: var(--primary); }
.footer-copy {
  color: var(--text-faint);
  font-size: 14px;
  margin: 0;
}

/* ─── Material Symbols global reset ─── */
.material-symbols-outlined {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
</style>