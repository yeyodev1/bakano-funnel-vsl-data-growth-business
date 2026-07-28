<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { getStoredFbParams } from '@/utils/fbclid'
import {
  REVENUE_LABELS,
  REVENUE_OPTIONS,
  ROLE_LABELS,
  ROLE_OPTIONS,
  qualifiesAsHighValueLead,
} from '@/utils/qualification'

const contactStore = useContactStore()

const props = defineProps<{ open: boolean; nombre: string }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'done'): void }>()

const router = useRouter()
const submitting = ref(false)
const touched = ref(false)

// ── Wizard paso a paso ──────────────────────────────────────────────────────
const step = ref(1)
const TOTAL_STEPS = 6
const modalEl = ref<HTMLElement | null>(null)
let advanceTimer: ReturnType<typeof setTimeout> | null = null

const scrollModalTop = () => {
  modalEl.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const autoAdvance = () => {
  if (step.value >= TOTAL_STEPS) return
  if (advanceTimer) clearTimeout(advanceTimer)
  advanceTimer = setTimeout(() => {
    step.value += 1
    scrollModalTop()
  }, 280)
}

const prevStep = () => {
  if (step.value <= 1) return
  if (advanceTimer) clearTimeout(advanceTimer)
  step.value -= 1
  scrollModalTop()
}

const form = ref({
  vertical: '',
  rol: '',
  facturacion: '',
  ubicacion: '',
  objetivo: '',
  mejora: '',
  consent: false,
})

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

const currentStepHasValue = () => {
  switch (step.value) {
    case 1: return !!form.value.vertical
    case 2: return !!form.value.rol
    case 3: return !!form.value.facturacion
    case 4: return !!form.value.ubicacion
    case 5: return !!form.value.objetivo
    default: return false
  }
}

const nextStep = () => {
  step.value += 1
  scrollModalTop()
}

const verticalLabel: Record<string, string> = {
  producto: 'Producto',
  gastronomia: 'Gastronomía',
  servicio: 'Servicio',
}

const isValid = () =>
  !!form.value.vertical &&
  !!form.value.rol &&
  !!form.value.facturacion &&
  !!form.value.ubicacion &&
  !!form.value.objetivo &&
  wordCount(form.value.mejora) >= 15 &&
  form.value.consent

const IS_DEV = window.location.hostname === 'localhost'

const handleSubmit = async () => {
  touched.value = true
  if (!isValid()) return
  submitting.value = true

  const contact = contactStore.get()
  const califica = qualifiesAsHighValueLead(
    form.value.rol,
    form.value.facturacion,
    form.value.objetivo,
  )

  const etiquetas = [
    'funnel-bakano',
    'step-2-cualificacion',
    califica ? 'califica' : 'no-califica',
    califica ? 'lead-calificado-20k' : 'nutricion-sub-20k',
    `vertical-${form.value.vertical}`,
    `rol-${form.value.rol}`,
    `facturacion-${form.value.facturacion.replace(/[<>]/g, '')}`,
    `ubicacion-${form.value.ubicacion}`,
    `objetivo-${form.value.objetivo}`,
  ]

  const ubicacionLabel: Record<string, string> = {
    guayaquil: 'Guayaquil / Samborondón',
    otra: 'Otra ciudad / extranjero',
  }
  const objetivoLabel: Record<string, string> = {
    viral: 'Aumentar seguidores y hacerse viral',
    facturacion: 'Abrir mercado y aumentar facturación con datos',
    ventas: 'Profesionalizar ventas y captación',
  }

  const nota = `${califica ? '✅ LEAD CALIFICADO' : '❌ NO CALIFICA'} — Bakano Funnel
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${contact.nombre} ${contact.apellido}
🏢 Negocio: ${contact.negocio}
🏷️ Vertical: ${verticalLabel[form.value.vertical] ?? form.value.vertical}
Rol: ${ROLE_LABELS[form.value.rol] ?? form.value.rol}
📧 ${contact.email}
📱 ${contact.telefono}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Facturación: ${REVENUE_LABELS[form.value.facturacion] ?? form.value.facturacion}
📍 Ubicación: ${ubicacionLabel[form.value.ubicacion] ?? form.value.ubicacion}
🎯 Objetivo: ${objetivoLabel[form.value.objetivo] ?? form.value.objetivo}
💡 Mejora: ${form.value.mejora}
━━━━━━━━━━━━━━━━━━━━━━━━
📊 Resultado: ${califica ? '🟢 AGENDA CITA' : '🔴 RECHAZADO'}
🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
🔑 event_id: ${`schedule_${Date.now()}_bk`}`

  const payload = {
    nombre: contact.nombre || props.nombre,
    apellido: contact.apellido,
    negocio: contact.negocio,
    vertical: form.value.vertical,
    rol: form.value.rol,
    email: contact.email,
    telefono: contact.telefono,
    facturacion: form.value.facturacion,
    ubicacion: form.value.ubicacion,
    objetivo: form.value.objetivo,
    mejora: form.value.mejora,
    califica,
    qualification_status: califica ? 'qualified_20k_owner' : 'nurture',
    event_name: califica ? 'Lead' : 'QualificationCompleted',
    resultado: califica ? 'AGENDA' : 'RECHAZADO',
    etiquetas,
    nota,
    timestamp: new Date().toISOString(),
    ...getStoredFbParams(),
  }
  console.info('[Bakano Agenda]', payload)

  const scheduleEventId = `schedule_${Date.now()}_${Math.random().toString(36).slice(2)}`

  // Reemplazar el event_id temporal de la nota con el real
  const finalPayload = {
    ...payload,
    nota: payload.nota.replace(/schedule_\d+_bk/, scheduleEventId),
    event_id: scheduleEventId,
  }

  await fetch(
    'https://services.leadconnectorhq.com/hooks/pEFChujwCCaMWBNbZYD1/webhook-trigger/69dc0e5f-e2c0-4e9f-9625-10a708787d59',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalPayload),
    },
  ).catch(() => {})

  if (califica) {
    // Solo los decisores que superan $20k entrenan la optimización de leads.
    ;(window as any).fbq?.(
      'track',
      'Lead',
      {
        content_name: 'lead-calificado-20k',
        role: form.value.rol,
        revenue_range: form.value.facturacion,
      },
      { eventID: scheduleEventId },
    )
  }

  localStorage.setItem(
    'bk_qualification',
    JSON.stringify({
      rol: form.value.rol,
      facturacion: form.value.facturacion,
      califica,
      timestamp: Date.now(),
    }),
  )

  submitting.value = false
  emit('close')
  if (califica) {
    router.push('/agendar')
  } else {
    if (!IS_DEV) localStorage.setItem('bk_disq_at', String(Date.now()))
    router.push('/sin-espacio')
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (advanceTimer) clearTimeout(advanceTimer)
})

watch(() => form.value.vertical, (v) => { if (v && step.value === 1) autoAdvance() })
watch(() => form.value.rol, (v) => { if (v && step.value === 2) autoAdvance() })
watch(() => form.value.facturacion, (v) => { if (v && step.value === 3) autoAdvance() })
watch(() => form.value.ubicacion, (v) => { if (v && step.value === 4) autoAdvance() })
watch(() => form.value.objetivo, (v) => { if (v && step.value === 5) autoAdvance() })

watch(
  () => props.open,
  (v) => {
    if (v) {
      step.value = 1
      touched.value = false
      submitting.value = false
      form.value = {
        vertical: '',
        rol: '',
        facturacion: '',
        ubicacion: '',
        objetivo: '',
        mejora: '',
        consent: false,
      }
    }
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="cal-fade">
      <div
        v-if="props.open"
        class="cal-overlay"
        @click.self="$emit('close')"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cal-title"
      >
        <div ref="modalEl" class="cal-modal">
          <button class="cal-close" @click="$emit('close')" aria-label="Cerrar">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <!-- ── CALIFICACIÓN ──────────────────────────────── -->
          <p class="cal-eyebrow">Paso final</p>
          <h2 id="cal-title" class="cal-title">
            Cuéntanos sobre<br />
            <span class="cal-accent">tu negocio</span>
          </h2>
          <p class="cal-subtitle">Una pregunta a la vez — 60 segundos.</p>

          <!-- ── Progreso ─────────────────────────────────────── -->
          <div class="cal-progress">
            <p class="cal-progress__label">Pregunta {{ step }} de {{ TOTAL_STEPS }}</p>
            <div
              class="cal-progress__track"
              role="progressbar"
              :aria-valuenow="step"
              aria-valuemin="1"
              :aria-valuemax="TOTAL_STEPS"
            >
              <div
                class="cal-progress__fill"
                :style="{ width: `${(step / TOTAL_STEPS) * 100}%` }"
              />
            </div>
          </div>

          <form class="cal-form" @submit.prevent="handleSubmit" novalidate>
            <Transition name="cal-step" mode="out-in">
              <!-- Paso 1: rubro -->
              <fieldset v-if="step === 1" key="q1" class="cal-fieldset">
                <legend class="cal-legend">
                  <span class="cal-q-num">01</span>
                  ¿Cuál es el rubro de tu negocio?
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in [
                      { value: 'producto', label: 'Producto' },
                      { value: 'gastronomia', label: 'Gastronomía' },
                      { value: 'servicio', label: 'Servicio' },
                    ]"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: form.vertical === opt.value }"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.vertical"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso 2: rol -->
              <fieldset v-else-if="step === 2" key="q2" class="cal-fieldset">
                <legend class="cal-legend">
                  <span class="cal-q-num">02</span>
                  ¿Cuál es tu rol en el negocio?
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in ROLE_OPTIONS"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: form.rol === opt.value }"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.rol"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso 3: facturación -->
              <fieldset v-else-if="step === 3" key="q3" class="cal-fieldset">
                <legend class="cal-legend">
                  <span class="cal-q-num">03</span>
                  ¿Cuál es tu facturación mensual actual?
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in REVENUE_OPTIONS"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: form.facturacion === opt.value }"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.facturacion"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso 4: ubicación -->
              <fieldset v-else-if="step === 4" key="q4" class="cal-fieldset">
                <legend class="cal-legend">
                  <span class="cal-q-num">04</span>
                  ¿Dónde está tu base de operaciones?
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in [
                      { value: 'guayaquil', label: 'Guayaquil / Samborondón' },
                      { value: 'otra', label: 'Otra ciudad de Ecuador o el extranjero' },
                    ]"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: form.ubicacion === opt.value }"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.ubicacion"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso 5: objetivo -->
              <fieldset v-else-if="step === 5" key="q5" class="cal-fieldset">
                <legend class="cal-legend">
                  <span class="cal-q-num">05</span>
                  ¿Cuál es tu objetivo principal este año?
                </legend>
                <div class="cal-options">
                  <label
                    v-for="opt in [
                      { value: 'viral', label: 'Aumentar seguidores, likes y hacerme viral' },
                      {
                        value: 'facturacion',
                        label: 'Abrir mercado y aumentar facturación con datos',
                      },
                      {
                        value: 'ventas',
                        label: 'Profesionalizar mi proceso de ventas y captación',
                      },
                    ]"
                    :key="opt.value"
                    class="cal-option"
                    :class="{ selected: form.objetivo === opt.value }"
                  >
                    <input
                      type="radio"
                      :value="opt.value"
                      v-model="form.objetivo"
                      hidden
                    />
                    <span class="cal-option__radio" aria-hidden="true" />
                    <span class="cal-option__label">{{ opt.label }}</span>
                  </label>
                </div>
              </fieldset>

              <!-- Paso 6: mejora + consentimiento -->
              <fieldset
                v-else-if="step === 6"
                key="q6"
                class="cal-fieldset"
                :class="{ 'has-error': touched && wordCount(form.mejora) < 15 }"
              >
                <legend class="cal-legend">
                  <span class="cal-q-num">06</span>
                  ¿Qué quisieras mejorar en tu negocio?
                </legend>
                <div class="cal-textarea-wrap">
                  <textarea
                    v-model="form.mejora"
                    class="cal-textarea"
                    :class="{ error: touched && wordCount(form.mejora) < 15 }"
                    placeholder="Explícanos con tus propias palabras qué aspecto de tu negocio quieres mejorar y por qué es importante para ti..."
                    rows="4"
                    maxlength="1000"
                  />
                  <div class="cal-textarea-footer">
                    <span v-if="touched && wordCount(form.mejora) < 15" class="cal-error">
                      Escribe al menos 15 palabras (llevas {{ wordCount(form.mejora) }})
                    </span>
                    <span v-else class="cal-word-hint">
                      {{ wordCount(form.mejora) }} palabra{{
                        wordCount(form.mejora) !== 1 ? 's' : ''
                      }}
                      <span v-if="wordCount(form.mejora) >= 15" class="cal-word-ok">
                        <i class="fa-solid fa-circle-check" />
                      </span>
                    </span>
                  </div>
                </div>

                <!-- Consent -->
                <label class="cal-consent" :class="{ 'has-error': touched && !form.consent }">
                  <input type="checkbox" v-model="form.consent" hidden />
                  <span
                    class="cal-consent__box"
                    :class="{ checked: form.consent }"
                    aria-hidden="true"
                  >
                    <svg
                      v-if="form.consent"
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span class="cal-consent__text">
                    Consiento que Bakano me contacte para ofrecerme sus servicios y acepto sus
                    <RouterLink to="/politicas-privacidad" target="_blank" class="cal-link"
                      >términos y condiciones</RouterLink
                    >.
                  </span>
                </label>
              </fieldset>
            </Transition>

            <!-- ── Navegación ──────────────────────────────────── -->
            <div class="cal-nav">
              <div class="cal-nav-row">
                <button
                  type="button"
                  class="cal-back"
                  @click="prevStep"
                  :class="{ invisible: step <= 1 }"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  Atrás
                </button>

                <button
                  v-if="step < TOTAL_STEPS && currentStepHasValue()"
                  type="button"
                  class="cal-next"
                  @click="nextStep"
                >
                  Siguiente
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              <button
                v-if="step === TOTAL_STEPS"
                class="cal-btn"
                type="submit"
                :disabled="submitting"
              >
                <svg
                  v-if="submitting"
                  class="cal-spinner"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <template v-else>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </template>
                {{ submitting ? 'Verificando...' : 'CONFIRMAR Y VER DISPONIBILIDAD' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
@use '@/styles/colorVariables.module.scss' as colors;
@use '@/styles/fonts.modules.scss' as fonts;

$dark: #0d0a18;
$dark2: #130f1e;
$border: rgba(255, 255, 255, 0.08);
$text-muted: rgba(255, 255, 255, 0.4);
$text-body: rgba(255, 255, 255, 0.7);

// ── Overlay ──────────────────────────────────────────────────────────────────
.cal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow-y: auto;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
.cal-modal {
  position: relative;
  width: 100%;
  max-width: 500px;
  background: $dark;
  border: 1px solid rgba(colors.$BAKANO-PURPLE, 0.2);
  border-radius: 24px;
  padding: 48px 36px 40px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 40px 100px rgba(0, 0, 0, 0.8),
    0 0 80px rgba(colors.$BAKANO-PURPLE, 0.08);
  max-height: 92vh;
  overflow-y: auto;

  @media (max-width: 540px) {
    padding: 44px 20px 36px;
    border-radius: 20px;
  }
}

.cal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid $border;
  background: rgba(255, 255, 255, 0.03);
  color: $text-muted;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.2s,
    color 0.2s;

  &:hover {
    border-color: rgba(colors.$BAKANO-PURPLE, 0.4);
    color: colors.$BAKANO-PURPLE;
  }
}

// ── Header ────────────────────────────────────────────────────────────────────
.cal-eyebrow {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: colors.$BAKANO-PURPLE;
  margin: 0 0 10px;
}

.cal-title {
  font-family: fonts.$font-principal;
  font-size: clamp(1.5rem, 3.5vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: colors.$white;
  margin: 0 0 8px;
}

.cal-accent {
  background: linear-gradient(110deg, colors.$BAKANO-PINK, colors.$BAKANO-PURPLE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.cal-subtitle {
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: $text-muted;
  margin: 0 0 28px;
}

// ── Form ──────────────────────────────────────────────────────────────────────
.cal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cal-prompt {
  font-family: fonts.$font-interface;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  padding: 14px 0 4px;
}

.cal-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cal-legend {
  font-family: fonts.$font-interface;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.cal-q-num {
  font-family: fonts.$font-accent;
  font-size: 0.65rem;
  font-weight: 700;
  color: colors.$BAKANO-PURPLE;
  background: rgba(colors.$BAKANO-PURPLE, 0.12);
  border: 1px solid rgba(colors.$BAKANO-PURPLE, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.cal-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cal-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid $border;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition:
    border-color 0.18s,
    background 0.18s;

  &:hover {
    border-color: rgba(colors.$BAKANO-PURPLE, 0.3);
    background: rgba(colors.$BAKANO-PURPLE, 0.04);
  }

  &.selected {
    border-color: rgba(colors.$BAKANO-PURPLE, 0.5);
    background: rgba(colors.$BAKANO-PURPLE, 0.08);

    .cal-option__radio {
      border-color: colors.$BAKANO-PURPLE;

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}

.cal-option__radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.18s;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: linear-gradient(135deg, colors.$BAKANO-PINK, colors.$BAKANO-PURPLE);
    opacity: 0;
    transform: scale(0.4);
    transition:
      opacity 0.18s,
      transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.cal-option__label {
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: $text-body;
  line-height: 1.4;
}

.cal-error {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: #ff6680;
  padding-left: 2px;
}

.has-error .cal-option {
  border-color: rgba(255, 80, 100, 0.15);
}

// ── Consent ───────────────────────────────────────────────────────────────────
.cal-consent {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;

  &.has-error .cal-consent__box {
    border-color: rgba(255, 80, 100, 0.5);
  }
}

.cal-consent__box {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    border-color 0.18s,
    background 0.18s;
  color: colors.$white;

  &.checked {
    background: linear-gradient(135deg, colors.$BAKANO-PINK, colors.$BAKANO-PURPLE);
    border-color: transparent;
  }
}

.cal-consent__text {
  font-family: fonts.$font-interface;
  font-size: 0.72rem;
  color: $text-muted;
  line-height: 1.55;
}

.cal-link {
  color: rgba(colors.$BAKANO-PURPLE, 0.8);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s;

  &:hover {
    color: colors.$BAKANO-PURPLE;
  }
}

// ── Button ────────────────────────────────────────────────────────────────────
.cal-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 24px;
  font-family: fonts.$font-interface;
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: colors.$white;
  background: linear-gradient(135deg, colors.$BAKANO-PURPLE, colors.$BAKANO-PINK);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(colors.$BAKANO-PURPLE, 0.4);
  transition:
    transform 0.2s ease,
    box-shadow 0.25s ease,
    opacity 0.2s;
  text-decoration: none;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(colors.$BAKANO-PURPLE, 0.55);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &--ghost {
    background: transparent;
    border: 1px solid $border;
    color: $text-muted;
    box-shadow: none;

    &:hover:not(:disabled) {
      border-color: rgba(255, 255, 255, 0.2);
      color: colors.$white;
      box-shadow: none;
    }
  }
}

// ── Textarea Q4 ───────────────────────────────────────────────────────────────
.cal-textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cal-textarea {
  width: 100%;
  resize: vertical;
  min-height: 100px;
  padding: 12px 14px;
  font-family: fonts.$font-secondary;
  font-size: 0.86rem;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid $border;
  border-radius: 12px;
  outline: none;
  transition:
    border-color 0.18s,
    background 0.18s;
  line-height: 1.55;
  box-sizing: border-box;

  &::placeholder {
    color: rgba(255, 255, 255, 0.22);
  }

  &:focus {
    border-color: rgba(colors.$BAKANO-PURPLE, 0.45);
    background: rgba(colors.$BAKANO-PURPLE, 0.04);
  }

  &.error {
    border-color: rgba(255, 80, 100, 0.3);
  }
}

.cal-textarea-footer {
  display: flex;
  justify-content: flex-end;
  min-height: 16px;
}

.cal-word-hint {
  font-family: fonts.$font-interface;
  font-size: 0.7rem;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 5px;
}

.cal-word-ok {
  color: colors.$BAKANO-GREEN;
  font-size: 0.75rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.cal-spinner {
  animation: spin 0.8s linear infinite;
}

// ── Transición ────────────────────────────────────────────────────────────────
.cal-fade-enter-active {
  transition: opacity 0.28s ease;

  .cal-modal {
    transition:
      opacity 0.28s ease,
      transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
  }
}

.cal-fade-leave-active {
  transition: opacity 0.2s ease;

  .cal-modal {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
}

.cal-fade-enter-from {
  opacity: 0;

  .cal-modal {
    opacity: 0;
    transform: scale(0.92) translateY(20px);
  }
}

.cal-fade-leave-to {
  opacity: 0;

  .cal-modal {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
}

// ── Wizard: progreso ──────────────────────────────────────────────────────────
.cal-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0 0 24px;
}

.cal-progress__label {
  font-family: fonts.$font-accent;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(colors.$BAKANO-PURPLE, 0.85);
  margin: 0;
}

.cal-progress__track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 99px;
  overflow: hidden;
}

.cal-progress__fill {
  height: 100%;
  background: linear-gradient(90deg, colors.$BAKANO-PURPLE, colors.$BAKANO-PINK);
  border-radius: 99px;
  transition: width 0.35s cubic-bezier(0.34, 1.2, 0.64, 1);
}

// ── Wizard: navegación ────────────────────────────────────────────────────────
.cal-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cal-nav-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.cal-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 8px 2px;
  font-family: fonts.$font-interface;
  font-size: 0.78rem;
  font-weight: 600;
  color: $text-muted;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: colors.$white;
  }
}

.cal-next {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  font-family: fonts.$font-interface;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: colors.$white;
  background: linear-gradient(135deg, colors.$BAKANO-PURPLE, colors.$BAKANO-PINK);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

.invisible {
  visibility: hidden;
}

// ── Wizard: transición entre pasos ────────────────────────────────────────────
.cal-step-enter-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.cal-step-leave-active {
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
}

.cal-step-enter-from {
  opacity: 0;
  transform: translateX(18px);
}

.cal-step-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
