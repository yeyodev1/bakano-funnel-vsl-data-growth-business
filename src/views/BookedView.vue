<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BookedHeader from '@/components/booked/BookedHeader.vue'
import BookedHero from '@/components/booked/BookedHero.vue'
import BookedSteps from '@/components/booked/BookedSteps.vue'
import BookedTeam from '@/components/booked/BookedTeam.vue'
import BookedFooter from '@/components/booked/BookedFooter.vue'

const router = useRouter()

onMounted(() => {
  const isDev = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  const bookedAt = Number(localStorage.getItem('bk_booked_at'))
  const hasRecentBooking = bookedAt > 0 && Date.now() - bookedAt < 24 * 60 * 60 * 1000
  if (!isDev && !hasRecentBooking) router.replace('/')
})

/**
 * BookedView.vue
 * Main orchestrator for the booking confirmation page.
 * Implements premium atmospheric effects and manages data flow.
 */

// Asset local: misma foto que el funnel, sin depender del CDN
import LUIS_PHOTO from '@/assets/team/luis.webp'

const DENISSE_PHOTO =
  'https://res.cloudinary.com/dpuody0df/image/upload/v1775587088/bakano/team/denisse.webp'

/**
 * Recuperar el nombre del contacto desde localStorage para una experiencia personalizada.
 */
const contactName = computed(() => {
  try {
    const stored = localStorage.getItem('bk_contact')
    if (!stored) return ''
    return JSON.parse(stored).nombre ?? ''
  } catch {
    return ''
  }
})

/**
 * Pasos definidos para la sección de post-agendamiento.
 */
const nextSteps = [
  {
    icon: 'envelope',
    title: 'Revisa tu correo',
    body: 'Encontrarás los detalles de la sesión: enlace de reunión, fecha y hora confirmada.',
  },
  {
    icon: 'whatsapp',
    title: 'Un asesor te contactará por WhatsApp',
    body: 'Un miembro del equipo Bakano te escribirá para confirmar la cita y resolver cualquier duda.',
  },
  {
    icon: 'chart-line',
    title: 'Prepara tus métricas',
    body: 'Ten a mano las cifras actuales de tu negocio: facturación, canales de venta y crecimiento reciente.',
  },
]

/**
 * Equipo de fundadores que lideran las asesorías.
 */
const team = [
  {
    name: 'Luis Reyes',
    role: 'Co-fundador & CEO',
    photo: LUIS_PHOTO,
  },
  {
    name: 'Denisse Quimi',
    role: 'Co-fundadora & CMO',
    photo: DENISSE_PHOTO,
  },
]
</script>

<template>
  <main class="booked-view">
    <!-- CAPA ATMOSFÉRICA (Fondo Premium) -->
    <div class="booked-view__bg" aria-hidden="true">
      <div class="glow-orb glow-orb--1"></div>
      <div class="glow-orb glow-orb--2"></div>
      <div class="glow-orb glow-orb--3"></div>
      <div class="grain-overlay"></div>
    </div>

    <!-- ESTRUCTURA DE COMPONENTES -->
    <BookedHeader />

    <div class="booked-view__content">
      <!-- CONTENEDOR CENTRAL: Gestiona el ancho máximo y el padding lateral -->
      <div class="booked-view__container">
        <!-- Sección Hero: Confirmación Visual -->
        <BookedHero :contact-name="contactName" />

        <!-- Sección Pasos: Guía de Usuario -->
        <BookedSteps :steps="nextSteps" />

        <!-- Sección Equipo: Social Proof Humano -->
        <BookedTeam :team="team" />

        <!-- DISCLAIMER (Nota de responsabilidad) -->
        <section class="booked-view__disclaimer">
          <div class="disclaimer-icon">
            <i class="fa-solid fa-circle-info"></i>
          </div>
          <p>
            Los resultados no son típicos ni garantizados. La metodología Data Growth Business
            depende de la madurez operativa y disposición de cada negocio.
          </p>
        </section>
      </div>
    </div>

    <!-- PIE DE PÁGINA -->
    <BookedFooter />
  </main>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

.booked-view {
  position: relative;
  min-height: 100vh;
  background-color: #050308; // Color negro profundo para mayor contraste
  color: colors.$white;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;

  // Fondo atmosférico con orbes y gradientes
  &__bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 10% 20%, rgba(colors.$BAKANO-PURPLE, 0.04) 0%, transparent 50%),
      radial-gradient(circle at 90% 80%, rgba(colors.$BAKANO-PINK, 0.04) 0%, transparent 50%);

    .grain-overlay {
      position: absolute;
      inset: 0;
      background-image: url('https://res.cloudinary.com/dpuody0df/image/upload/v1775587085/bakano/utils/grain.png');
      opacity: 0.03;
      pointer-events: none;
    }
  }

  &__content {
    position: relative;
    z-index: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  &__container {
    width: 100%;
    max-width: 720px;
    padding: 0 1.5rem; // Gutter lateral uniforme en mobile
    box-sizing: border-box; // Garantiza que el padding se reste del 100% de la pantalla
    display: flex;
    flex-direction: column;
    align-items: center;

    @media (min-width: 768px) {
      padding: 0 2rem; // Mayor respiro en tablets/desktop
    }
  }

  &__disclaimer {
    width: 100%; // Toma el 100% del container (que ya tiene padding)
    padding: 1.25rem 1.5rem;
    margin: 1.5rem 0 3.5rem;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    backdrop-filter: blur(4px);

    .disclaimer-icon {
      flex-shrink: 0;
      color: rgba(colors.$BAKANO-PURPLE, 0.6);
      font-size: 1.1rem;
      margin-top: 0.1rem;
    }

    p {
      @include fonts.body-font(400);
      font-size: 0.82rem;
      color: rgba(colors.$white, 0.35);
      margin: 0;
      line-height: 1.7;
    }

    @media (min-width: 768px) {
      margin-bottom: 6rem;
      padding: 1.75rem 2.25rem;
      gap: 1.25rem;

      p {
        font-size: 0.9rem;
      }
    }
  }
}

// Estilado de Orbes (Glow Atmospheric Effects)
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.25;
  will-change: transform;
  animation: float-ambient 25s infinite alternate ease-in-out;

  &--1 {
    width: 450px;
    height: 450px;
    background: colors.$BAKANO-PURPLE;
    top: -150px;
    left: -200px;
  }

  &--2 {
    width: 550px;
    height: 550px;
    background: colors.$BAKANO-PINK;
    bottom: -150px;
    right: -250px;
    animation-delay: -7s;
  }

  &--3 {
    width: 320px;
    height: 320px;
    background: colors.$BAKANO-GREEN;
    top: 30%;
    right: 15%;
    opacity: 0.08;
    animation-duration: 18s;
    animation-delay: -3s;
  }
}

@keyframes float-ambient {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
  33% {
    transform: translate(60px, 40px) scale(1.1) rotate(5deg);
  }
  66% {
    transform: translate(-40px, 80px) scale(0.9) rotate(-3deg);
  }
  100% {
    transform: translate(0, 0) scale(1) rotate(0deg);
  }
}
</style>
