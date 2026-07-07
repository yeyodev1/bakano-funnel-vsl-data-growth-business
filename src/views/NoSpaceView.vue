<script setup lang="ts">
import { ref, onMounted } from 'vue'

const LOGO = 'https://res.cloudinary.com/dpuody0df/image/upload/v1775587085/bakano/logos/bakano-light.png'
const BAKANOLOGY_URL = 'https://bakanology.com/'

const hoursLeft = ref(0)

onMounted(() => {
  const bkDisqAt = localStorage.getItem('bk_disq_at')
  if (bkDisqAt) {
    const elapsed = Date.now() - Number(bkDisqAt)
    const remaining = 24 * 60 * 60 * 1000 - elapsed
    if (remaining > 0) {
      hoursLeft.value = Math.ceil(remaining / 3_600_000)
    }
  }
})
</script>

<template>
  <div class="nospace">

    <!-- TOP BAR -->
    <header class="nospace__topbar">
      <img :src="LOGO" alt="Bakano" class="nospace__logo" />
    </header>

    <!-- MAIN CONTENT -->
    <main class="nospace__main">

      <!-- COOLDOWN BANNER -->
      <div v-if="hoursLeft > 0" class="nospace__cooldown-banner">
        <i class="fa-solid fa-clock"></i>
        Ya enviaste una solicitud. Podrás intentarlo de nuevo en {{ hoursLeft }}h
      </div>

      <!-- ICON -->
      <div class="nospace__icon-wrap">
        <i class="fa-solid fa-heart nospace__heart-icon"></i>
      </div>

      <!-- HEADING -->
      <h1 class="nospace__title">Todavía no es el momento, y está bien</h1>

      <p class="nospace__subtitle">
        Trabajar con nuestra agencia requiere ciertas condiciones para garantizar resultados reales.
        Hoy tu negocio no cumple el perfil que necesitamos para darte el impacto que mereces.
        <br /><br />
        Pero eso no significa que no puedas crecer. Al contrario.
      </p>

      <!-- ACADEMY CARD -->
      <div class="nospace__academy-card">

        <div class="nospace__academy-badge">
          <i class="fa-solid fa-graduation-cap"></i>
          Bakanology — Academia
        </div>

        <h2 class="nospace__academy-title">
          Aprende exactamente lo que hacemos en la agencia
        </h2>

        <p class="nospace__academy-body">
          Bakanology es nuestra academia donde enseñamos la metodología
          <strong>Data Growth Business™</strong> paso a paso. Lo mismo que aplicamos
          con nuestros clientes, ahora disponible para que lo implementes tú mismo en tu negocio.
        </p>

        <ul class="nospace__checks">
          <li>
            <i class="fa-solid fa-check"></i>
            Estrategia de datos para tomar decisiones sin adivinar
          </li>
          <li>
            <i class="fa-solid fa-check"></i>
            Cómo abrir mercado sin depender de la viralidad
          </li>
          <li>
            <i class="fa-solid fa-check"></i>
            Sistemas de ventas predecibles y escalables
          </li>
          <li>
            <i class="fa-solid fa-check"></i>
            La misma metodología que usamos con nuestros clientes de agencia
          </li>
        </ul>

        <a :href="BAKANOLOGY_URL" target="_blank" rel="noopener noreferrer" class="btn btn--primary">
          <i class="fa-solid fa-arrow-right"></i>
          Ir a Bakanology
        </a>

      </div>

      <!-- BACK LINK -->
      <RouterLink to="/" class="btn btn--ghost">
        <i class="fa-solid fa-arrow-left"></i>
        Volver al inicio
      </RouterLink>

    </main>

    <!-- FOOTER -->
    <footer class="nospace__footer">
      <div class="footer__links">
        <RouterLink to="/politicas-privacidad">Política de Privacidad</RouterLink>
        <span class="footer__sep">·</span>
        <RouterLink to="/aviso-legal">Aviso Legal</RouterLink>
      </div>
      <p class="footer__copy">© {{ new Date().getFullYear() }} NEGOCIOS DEL PACIFICO. Todos los derechos reservados.</p>
    </footer>

  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.nospace {
  min-height: 100vh;
  background-color: #0a0712;
  color: colors.$white;
  display: flex;
  flex-direction: column;
  align-items: center;

  // ── TOP BAR ──────────────────────────────────────────
  &__topbar {
    width: 100%;
    padding: 1.25rem 2rem;
    display: flex;
    justify-content: center;
    background: rgba(#0a0712, 0.95);
    border-bottom: 1px solid rgba(colors.$BAKANO-PURPLE, 0.2);
  }

  &__logo {
    height: 36px;
    width: auto;
  }

  // ── MAIN ─────────────────────────────────────────────
  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 4rem 1.5rem 3rem;
    max-width: 640px;
    width: 100%;
    gap: 1.25rem;
  }

  // ── COOLDOWN BANNER ───────────────────────────────────
  &__cooldown-banner {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    padding: 0.6rem 1.25rem;
    border-radius: 999px;
    background: rgba(colors.$BAKANO-PINK, 0.1);
    border: 1px solid rgba(colors.$BAKANO-PINK, 0.35);
    font-family: fonts.$font-interface;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(colors.$BAKANO-PINK, 0.9);
    letter-spacing: 0.01em;

    i { font-size: 0.85rem; }
  }

  // ── ICON ─────────────────────────────────────────────
  &__icon-wrap {
    width: 88px;
    height: 88px;
    border-radius: 50%;
    background: rgba(colors.$BAKANO-PURPLE, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1.5px solid rgba(colors.$BAKANO-PURPLE, 0.3);
    margin-bottom: 0.5rem;
  }

  &__heart-icon {
    font-size: 2.75rem;
    color: rgba(colors.$BAKANO-PURPLE, 0.85);
    line-height: 1;
  }

  // ── HEADING ──────────────────────────────────────────
  &__title {
    font-family: fonts.$font-principal;
    font-weight: 800;
    font-size: clamp(1.6rem, 4vw, 2.25rem);
    line-height: 1.2;
    margin: 0;
    color: colors.$white;
  }

  &__subtitle {
    font-family: fonts.$font-secondary;
    font-size: 1.05rem;
    color: rgba(colors.$white, 0.6);
    margin: 0;
    line-height: 1.7;
  }

  // ── ACADEMY CARD ─────────────────────────────────────
  &__academy-card {
    width: 100%;
    background: rgba(colors.$BAKANO-PURPLE, 0.08);
    border: 1.5px solid rgba(colors.$BAKANO-PURPLE, 0.45);
    border-radius: 16px;
    padding: 2rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    box-shadow:
      0 0 40px rgba(colors.$BAKANO-PURPLE, 0.14),
      0 0 10px rgba(colors.$BAKANO-PURPLE, 0.08);
    text-align: center;
    margin-top: 0.5rem;
  }

  &__academy-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.35rem 0.9rem;
    border-radius: 999px;
    background: rgba(colors.$BAKANO-PURPLE, 0.18);
    border: 1px solid rgba(colors.$BAKANO-PURPLE, 0.4);
    font-family: fonts.$font-interface;
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(colors.$BAKANO-PURPLE, 1);
    letter-spacing: 0.04em;
    text-transform: uppercase;

    i { font-size: 0.75rem; }
  }

  &__academy-title {
    font-family: fonts.$font-principal;
    font-weight: 800;
    font-size: clamp(1.2rem, 3vw, 1.55rem);
    color: colors.$white;
    margin: 0;
    line-height: 1.25;
  }

  &__academy-body {
    font-family: fonts.$font-secondary;
    font-size: 0.95rem;
    color: rgba(colors.$white, 0.6);
    margin: 0;
    line-height: 1.75;

    strong {
      color: rgba(colors.$white, 0.85);
      font-weight: 600;
    }
  }

  // ── CHECKS ───────────────────────────────────────────
  &__checks {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    text-align: left;
    width: 100%;

    li {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-family: fonts.$font-secondary;
      font-size: 0.9rem;
      color: rgba(colors.$white, 0.7);
      line-height: 1.5;

      i {
        margin-top: 0.2rem;
        font-size: 0.8rem;
        color: colors.$BAKANO-GREEN;
        flex-shrink: 0;
      }
    }
  }

  // ── FOOTER ───────────────────────────────────────────
  &__footer {
    width: 100%;
    padding: 2rem 1.5rem;
    text-align: center;
    border-top: 1px solid rgba(colors.$BAKANO-PURPLE, 0.15);
  }
}

// ── BUTTONS ──────────────────────────────────────────
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 2rem;
  border-radius: 8px;
  font-family: fonts.$font-accent;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.25s ease;
  text-decoration: none;

  &--primary {
    background: colors.$BAKANO-PURPLE;
    border: 1.5px solid colors.$BAKANO-PURPLE;
    color: colors.$white;
    width: 100%;
    justify-content: center;
    font-size: 1rem;
    padding: 0.95rem 2rem;
    margin-top: 0.25rem;

    &:hover {
      background: rgba(colors.$BAKANO-PURPLE, 0.85);
      border-color: rgba(colors.$BAKANO-PURPLE, 0.85);
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(colors.$BAKANO-PURPLE, 0.35);
    }
  }

  &--ghost {
    background: transparent;
    border: 1.5px solid rgba(colors.$white, 0.2);
    color: rgba(colors.$white, 0.55);
    margin-top: 0.25rem;

    &:hover {
      border-color: rgba(colors.$white, 0.5);
      color: colors.$white;
      background: rgba(colors.$white, 0.04);
    }
  }
}

// ── FOOTER INTERNALS ──────────────────────────────────
.footer {
  &__links {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;

    a {
      font-family: fonts.$font-interface;
      font-size: 0.8rem;
      color: rgba(colors.$white, 0.4);
      text-decoration: none;
      transition: color 0.2s;

      &:hover { color: colors.$white; }
    }
  }

  &__sep {
    color: rgba(colors.$white, 0.2);
  }

  &__copy {
    font-family: fonts.$font-interface;
    font-size: 0.75rem;
    color: rgba(colors.$white, 0.25);
    margin: 0;
  }
}
</style>
