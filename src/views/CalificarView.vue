<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactStore } from '@/stores/contact'
import { getStoredFbParams } from '@/utils/fbclid'

const router = useRouter()
const contactStore = useContactStore()

const step = ref(1)
const submitting = ref(false)
const touched = ref(false)

const COUNTRIES = [
  { dial: '+593', label: '+593 Ecuador' },
  { dial: '+57', label: '+57 Colombia' },
  { dial: '+51', label: '+51 Perú' },
  { dial: '+52', label: '+52 México' },
  { dial: '+1', label: '+1 EE. UU.' },
  { dial: '+34', label: '+34 España' },
  { dial: '+54', label: '+54 Argentina' },
  { dial: '+56', label: '+56 Chile' },
  { dial: '+58', label: '+58 Venezuela' },
  { dial: '+507', label: '+507 Panamá' },
  { dial: '+502', label: '+502 Guatemala' },
  { dial: '+506', label: '+506 Costa Rica' },
  { dial: '+598', label: '+598 Uruguay' },
  { dial: '+591', label: '+591 Bolivia' },
  { dial: '+595', label: '+595 Paraguay' },
  { dial: '+503', label: '+503 El Salvador' },
]

const contact = ref({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  dial: '+593',
  negocio: '',
})

const form = ref({
  vertical: '',
  facturacion: '',
  ubicacion: '',
  objetivo: '',
  mejora: '',
  consent: false,
})

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

const verticalLabel: Record<string, string> = {
  producto: 'Producto',
  gastronomia: 'Gastronomía',
  servicio: 'Servicio',
}

const billingOptions = computed(() => {
  if (form.value.vertical === 'servicio') {
    return [
      { value: '<10k', label: 'Menos de $10,000 USD' },
      { value: '10k-20k', label: 'Entre $10,000 y $20,000 USD' },
      { value: '>20k', label: 'Más de $20,000 USD' },
    ]
  }
  return [
    { value: '<15k', label: 'Menos de $15,000 USD' },
    { value: '15k-30k', label: 'Entre $15,000 y $30,000 USD' },
    { value: '>30k', label: 'Más de $30,000 USD' },
  ]
})

const contactValid = computed(() =>
  contact.value.nombre.trim().length >= 2 &&
  contact.value.apellido.trim().length >= 2 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value.email.trim()) &&
  contact.value.telefono.trim().length >= 6 &&
  contact.value.negocio.trim().length >= 2
)

const formValid = computed(() =>
  !!form.value.vertical &&
  !!form.value.facturacion &&
  !!form.value.ubicacion &&
  !!form.value.objetivo &&
  wordCount(form.value.mejora) >= 15 &&
  form.value.consent
)

const canContinue = computed(() => {
  if (step.value === 1) return contactValid.value
  return formValid.value
})

const nextStep = () => {
  touched.value = true
  if (step.value === 1 && contactValid.value) {
    step.value = 2
    touched.value = false
  }
}

const qualifies = () => {
  if (form.value.objetivo === 'viral') return false
  if (form.value.vertical === 'servicio') {
    if (form.value.facturacion === '<10k') return false
  } else {
    if (form.value.facturacion === '<15k') return false
  }
  return true
}

const handleSubmit = async () => {
  touched.value = true
  if (!formValid.value) return
  submitting.value = true

  const califica = qualifies()

  // 1 — Webhook de contacto
  const contactPayload = {
    nombre: contact.value.nombre.trim(),
    apellido: contact.value.apellido.trim(),
    email: contact.value.email.trim().toLowerCase(),
    telefono: `${contact.value.dial} ${contact.value.telefono.trim()}`,
    negocio: contact.value.negocio.trim(),
    timestamp: new Date().toISOString(),
    event_id: `lead_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    ...getStoredFbParams(),
  }

  await fetch('https://services.leadconnectorhq.com/hooks/pEFChujwCCaMWBNbZYD1/webhook-trigger/acf01034-9790-4a8f-a765-dfe9ae157e2d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contactPayload),
  }).catch(() => {})

  // 2 — Guardar contacto local
  contactStore.save({
    nombre: contact.value.nombre.trim(),
    apellido: contact.value.apellido.trim(),
    email: contact.value.email.trim().toLowerCase(),
    telefono: `${contact.value.dial} ${contact.value.telefono.trim()}`,
    negocio: contact.value.negocio.trim(),
  })

  // 3 — Webhook de calificación
  const scheduleEventId = `schedule_${Date.now()}_${Math.random().toString(36).slice(2)}`

  const facturacionLabel: Record<string, string> = {
    '<10k': 'Menos de $10,000 USD',
    '10k-20k': 'Entre $10,000 y $20,000 USD',
    '>20k': 'Más de $20,000 USD',
    '<15k': 'Menos de $15,000 USD',
    '15k-30k': 'Entre $15,000 y $30,000 USD',
    '>30k': 'Más de $30,000 USD',
  }
  const ubicacionLabel: Record<string, string> = {
    guayaquil: 'Guayaquil / Samborondón',
    otra: 'Otra ciudad / extranjero',
  }
  const objetivoLabel: Record<string, string> = {
    viral: 'Aumentar seguidores y hacerse viral',
    facturacion: 'Abrir mercado y aumentar facturación con datos',
    ventas: 'Profesionalizar ventas y captación',
  }

  const etiquetas = [
    'funnel-bakano',
    'calificar-directo',
    califica ? 'califica' : 'no-califica',
    `vertical-${form.value.vertical}`,
    `facturacion-${form.value.facturacion.replace(/[<>]/g, '')}`,
    `ubicacion-${form.value.ubicacion}`,
    `objetivo-${form.value.objetivo}`,
  ]

  const nota = `${califica ? '✅ LEAD CALIFICADO' : '❌ NO CALIFICA'} — Bakano Calificar Directo
━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${contact.value.nombre} ${contact.value.apellido}
🏢 Negocio: ${contact.value.negocio}
🏷️ Vertical: ${verticalLabel[form.value.vertical] ?? form.value.vertical}
📧 ${contact.value.email}
📱 ${contact.value.dial} ${contact.value.telefono}
━━━━━━━━━━━━━━━━━━━━━━━━
💰 Facturación: ${facturacionLabel[form.value.facturacion] ?? form.value.facturacion}
📍 Ubicación: ${ubicacionLabel[form.value.ubicacion] ?? form.value.ubicacion}
🎯 Objetivo: ${objetivoLabel[form.value.objetivo] ?? form.value.objetivo}
💡 Mejora: ${form.value.mejora}
━━━━━━━━━━━━━━━━━━━━━━━━
📊 Resultado: ${califica ? '🟢 AGENDA CITA' : '🔴 RECHAZADO'}
🕐 ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
🔑 event_id: ${scheduleEventId}`

  const qualPayload = {
    nombre: contact.value.nombre.trim(),
    apellido: contact.value.apellido.trim(),
    negocio: contact.value.negocio.trim(),
    vertical: form.value.vertical,
    email: contact.value.email.trim().toLowerCase(),
    telefono: `${contact.value.dial} ${contact.value.telefono.trim()}`,
    facturacion: form.value.facturacion,
    ubicacion: form.value.ubicacion,
    objetivo: form.value.objetivo,
    mejora: form.value.mejora,
    califica,
    resultado: califica ? 'AGENDA' : 'RECHAZADO',
    etiquetas,
    nota,
    timestamp: new Date().toISOString(),
    event_id: scheduleEventId,
    ...getStoredFbParams(),
  }

  await fetch('https://services.leadconnectorhq.com/hooks/pEFChujwCCaMWBNbZYD1/webhook-trigger/69dc0e5f-e2c0-4e9f-9625-10a708787d59', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(qualPayload),
  }).catch(() => {})

  // 4 — Meta Pixel
  ;(window as any).fbq?.('track', 'Lead',
    { content_name: 'cita-estrategica' },
    { eventID: contactPayload.event_id }
  )
  ;(window as any).fbq?.('track', 'CompleteRegistration',
    { content_name: 'cualificacion-step2', status: califica ? 'califica' : 'no-califica' },
    { eventID: scheduleEventId }
  )
  if (califica) {
    ;(window as any).fbq?.('track', 'Schedule',
      { content_name: 'cita-estrategica' },
      { eventID: scheduleEventId }
    )
  }

  submitting.value = false
  if (califica) {
    router.push('/agendar')
  } else {
    localStorage.setItem('bk_disq_at', String(Date.now()))
    router.push('/sin-espacio')
  }
}

const resetVertical = (v: string) => {
  form.value.vertical = v
  form.value.facturacion = ''
}
</script>

<template>
  <div class="calificar-page">
    <div class="calificar-card">

      <!-- Header -->
      <p class="calificar-eyebrow">{{ step === 1 ? 'Paso 1 de 2' : 'Paso 2 de 2' }}</p>
      <h1 class="calificar-title">
        <template v-if="step === 1">
          Cuéntanos sobre<br>
          <span class="calificar-accent">tu negocio</span>
        </template>
        <template v-else>
          Unos datos más<br>
          <span class="calificar-accent">para calificar</span>
        </template>
      </h1>
      <p class="calificar-subtitle">
        <template v-if="step === 1">Completa tus datos y descubre si tu negocio califica para una asesoría gratuita.</template>
        <template v-else>5 preguntas rápidas para asignarte al miembro del equipo ideal — 60 segundos.</template>
      </p>

      <!-- Step progress -->
      <div class="calificar-steps">
        <span class="calificar-step-dot" :class="{ active: step === 1, done: step > 1 }" />
        <span class="calificar-step-line" :class="{ done: step > 1 }" />
        <span class="calificar-step-dot" :class="{ active: step === 2 }" />
      </div>

      <!-- Step 1: Contacto -->
      <form v-if="step === 1" class="calificar-form" @submit.prevent="nextStep" novalidate>
        <div class="calificar-row">
          <div class="calificar-field">
            <label for="cal-nombre">Nombre</label>
            <input id="cal-nombre" v-model="contact.nombre" type="text" placeholder="Juan" autocomplete="given-name" />
          </div>
          <div class="calificar-field">
            <label for="cal-apellido">Apellido</label>
            <input id="cal-apellido" v-model="contact.apellido" type="text" placeholder="Pérez" autocomplete="family-name" />
          </div>
        </div>

        <div class="calificar-field">
          <label for="cal-email">Correo electrónico</label>
          <input id="cal-email" v-model="contact.email" type="email" placeholder="juan@empresa.com" autocomplete="email" />
        </div>

        <div class="calificar-field">
          <label>Teléfono</label>
          <div class="calificar-phone-wrap">
            <select v-model="contact.dial" class="calificar-dial">
              <option v-for="c in COUNTRIES" :key="c.dial" :value="c.dial">{{ c.label }}</option>
            </select>
            <input
              v-model="contact.telefono"
              type="tel"
              placeholder="98 493 4039"
              autocomplete="tel-national"
              class="calificar-phone-input"
            />
          </div>
        </div>

        <div class="calificar-field">
          <label for="cal-negocio">Nombre de la empresa</label>
          <input id="cal-negocio" v-model="contact.negocio" type="text" placeholder="Mi Empresa S.A." autocomplete="organization" />
        </div>

        <div class="calificar-actions">
          <button type="submit" class="calificar-btn" :disabled="!contactValid">
            CONTINUAR
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </form>

      <!-- Step 2: Calificación -->
      <form v-else class="calificar-form" @submit.prevent="handleSubmit" novalidate>

        <!-- Q0 -->
        <fieldset class="calificar-fieldset">
          <legend class="calificar-legend">
            <span class="calificar-q">01</span>
            ¿Cuál es el rubro de tu negocio?
          </legend>
          <div class="calificar-options">
            <label v-for="opt in [
              { value: 'producto', label: 'Producto' },
              { value: 'gastronomia', label: 'Gastronomía' },
              { value: 'servicio', label: 'Servicio' },
            ]" :key="opt.value" class="calificar-option" :class="{ selected: form.vertical === opt.value }">
              <input type="radio" :value="opt.value" @change="resetVertical(opt.value)" hidden />
              <span class="calificar-radio" aria-hidden="true" />
              <span class="calificar-opt-label">{{ opt.label }}</span>
            </label>
          </div>
          <span v-if="touched && !form.vertical" class="calificar-error">Selecciona una opción</span>
        </fieldset>

        <!-- Q1 -->
        <fieldset class="calificar-fieldset">
          <legend class="calificar-legend">
            <span class="calificar-q">02</span>
            ¿Cuál es tu facturación mensual actual?
          </legend>
          <div v-if="!form.vertical" class="calificar-prompt">Selecciona primero el rubro de tu negocio</div>
          <div v-else class="calificar-options">
            <label v-for="opt in billingOptions" :key="opt.value" class="calificar-option" :class="{ selected: form.facturacion === opt.value }">
              <input type="radio" :value="opt.value" v-model="form.facturacion" hidden />
              <span class="calificar-radio" aria-hidden="true" />
              <span class="calificar-opt-label">{{ opt.label }}</span>
            </label>
          </div>
          <span v-if="touched && !form.facturacion" class="calificar-error">Selecciona una opción</span>
        </fieldset>

        <!-- Q2 -->
        <fieldset class="calificar-fieldset">
          <legend class="calificar-legend">
            <span class="calificar-q">03</span>
            ¿Dónde está tu base de operaciones?
          </legend>
          <div class="calificar-options">
            <label v-for="opt in [
              { value: 'guayaquil', label: 'Guayaquil / Samborondón' },
              { value: 'otra', label: 'Otra ciudad de Ecuador o el extranjero' },
            ]" :key="opt.value" class="calificar-option" :class="{ selected: form.ubicacion === opt.value }">
              <input type="radio" :value="opt.value" v-model="form.ubicacion" hidden />
              <span class="calificar-radio" aria-hidden="true" />
              <span class="calificar-opt-label">{{ opt.label }}</span>
            </label>
          </div>
          <span v-if="touched && !form.ubicacion" class="calificar-error">Selecciona una opción</span>
        </fieldset>

        <!-- Q3 -->
        <fieldset class="calificar-fieldset">
          <legend class="calificar-legend">
            <span class="calificar-q">04</span>
            ¿Cuál es tu objetivo principal este año?
          </legend>
          <div class="calificar-options">
            <label v-for="opt in [
              { value: 'viral', label: 'Aumentar seguidores, likes y hacerme viral' },
              { value: 'facturacion', label: 'Abrir mercado y aumentar facturación con datos' },
              { value: 'ventas', label: 'Profesionalizar mi proceso de ventas y captación' },
            ]" :key="opt.value" class="calificar-option" :class="{ selected: form.objetivo === opt.value }">
              <input type="radio" :value="opt.value" v-model="form.objetivo" hidden />
              <span class="calificar-radio" aria-hidden="true" />
              <span class="calificar-opt-label">{{ opt.label }}</span>
            </label>
          </div>
          <span v-if="touched && !form.objetivo" class="calificar-error">Selecciona una opción</span>
        </fieldset>

        <!-- Q4 -->
        <fieldset class="calificar-fieldset">
          <legend class="calificar-legend">
            <span class="calificar-q">05</span>
            ¿Qué quisieras mejorar en tu negocio?
          </legend>
          <div class="calificar-textarea-wrap">
            <textarea
              v-model="form.mejora"
              class="calificar-textarea"
              :class="{ error: touched && wordCount(form.mejora) < 15 }"
              placeholder="Explícanos con tus propias palabras qué aspecto de tu negocio quieres mejorar y por qué es importante para ti..."
              rows="4"
              maxlength="1000"
            />
            <div class="calificar-textarea-footer">
              <span v-if="touched && wordCount(form.mejora) < 15" class="calificar-error">
                Escribe al menos 15 palabras (llevas {{ wordCount(form.mejora) }})
              </span>
              <span v-else class="calificar-word-hint">
                {{ wordCount(form.mejora) }} palabra{{ wordCount(form.mejora) !== 1 ? 's' : '' }}
                <span v-if="wordCount(form.mejora) >= 15" class="calificar-word-ok">
                  <i class="fa-solid fa-circle-check" />
                </span>
              </span>
            </div>
          </div>
        </fieldset>

        <!-- Consent -->
        <label class="calificar-consent" :class="{ 'has-error': touched && !form.consent }">
          <input type="checkbox" v-model="form.consent" hidden />
          <span class="calificar-consent-box" :class="{ checked: form.consent }" aria-hidden="true">
            <svg v-if="form.consent" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <span class="calificar-consent-text">
            Consiento que Bakano me contacte para ofrecerme sus servicios y acepto sus
            <RouterLink to="/politicas-privacidad" target="_blank" class="calificar-link">términos y condiciones</RouterLink>.
          </span>
        </label>

        <!-- Actions -->
        <div class="calificar-actions">
          <button type="button" class="calificar-btn calificar-btn--ghost" @click="step = 1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Atrás
          </button>
          <button type="submit" class="calificar-btn" :disabled="submitting">
            <svg v-if="submitting" class="calificar-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <template v-else>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </template>
            {{ submitting ? 'Verificando...' : 'CONFIRMAR Y VER DISPONIBILIDAD' }}
          </button>
        </div>
      </form>

    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/fonts.modules.scss' as *;

$dark: #0d0a18;
$border: rgba(255, 255, 255, 0.08);
$text-muted: rgba(255, 255, 255, 0.4);
$text-body: rgba(255, 255, 255, 0.7);

.calificar-page {
  min-height: 100vh;
  background: $dark;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.calificar-card {
  width: 100%;
  max-width: 520px;
  background: $dark;
  border: 1px solid rgba($BAKANO-PURPLE, 0.2);
  border-radius: 24px;
  padding: 48px 36px 40px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 40px 100px rgba(0,0,0,0.8),
    0 0 80px rgba($BAKANO-PURPLE, 0.08);

  @media (max-width: 540px) {
    padding: 44px 20px 36px;
    border-radius: 20px;
  }
}

.calificar-eyebrow {
  font-family: $font-accent;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 4px;
  color: $BAKANO-PURPLE;
  margin: 0 0 10px;
}

.calificar-title {
  font-family: $font-principal;
  font-size: clamp(1.5rem, 3.5vw, 1.9rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: $white;
  margin: 0 0 8px;
}

.calificar-accent {
  background: linear-gradient(110deg, $BAKANO-PINK, $BAKANO-PURPLE);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.calificar-subtitle {
  font-family: $font-secondary;
  font-size: 0.86rem;
  color: $text-muted;
  margin: 0 0 24px;
}

.calificar-steps {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;
}

.calificar-step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.15);
  transition: border-color 0.2s, background 0.2s;

  &.active {
    border-color: $BAKANO-PURPLE;
    background: $BAKANO-PURPLE;
  }

  &.done {
    border-color: $BAKANO-GREEN;
    background: $BAKANO-GREEN;
  }
}

.calificar-step-line {
  flex: 1;
  height: 2px;
  background: rgba(255,255,255,0.1);
  border-radius: 1px;
  transition: background 0.3s;

  &.done {
    background: $BAKANO-GREEN;
  }
}

.calificar-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.calificar-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr;
  }
}

.calificar-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-family: $font-interface;
    font-size: 0.74rem;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.5px;
  }

  input {
    width: 100%;
    box-sizing: border-box;
    background: rgba(255,255,255,0.04);
    border: 1px solid $border;
    border-radius: 10px;
    padding: 11px 14px;
    font-family: $font-secondary;
    font-size: 0.92rem;
    color: $white;
    outline: none;
    transition: border-color 0.2s, background 0.2s;

    &::placeholder { color: rgba(255,255,255,0.22); }

    &:focus {
      border-color: rgba($BAKANO-PURPLE, 0.5);
      background: rgba($BAKANO-PURPLE, 0.04);
    }
  }
}

.calificar-phone-wrap {
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid $border;
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: rgba($BAKANO-PURPLE, 0.5);
  }
}

.calificar-dial {
  background: none;
  border: none;
  border-right: 1px solid $border;
  padding: 11px 10px;
  font-family: $font-accent;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  min-width: 110px;

  option {
    background: #16111f;
    color: $white;
  }
}

.calificar-phone-input {
  flex: 1;
  min-width: 0;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 11px 12px !important;
  font-family: $font-secondary;
  font-size: 0.92rem;
  color: $white;
  outline: none !important;

  &::placeholder { color: rgba(255,255,255,0.22); }
}

// ── Qualification fields ──────────────────────────────────────────────────────

.calificar-fieldset {
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.calificar-legend {
  font-family: $font-interface;
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 2px;
}

.calificar-q {
  font-family: $font-accent;
  font-size: 0.65rem;
  font-weight: 700;
  color: $BAKANO-PURPLE;
  background: rgba($BAKANO-PURPLE, 0.12);
  border: 1px solid rgba($BAKANO-PURPLE, 0.2);
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 1px;
  flex-shrink: 0;
}

.calificar-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.calificar-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid $border;
  background: rgba(255,255,255,0.02);
  cursor: pointer;
  transition: border-color 0.18s, background 0.18s;

  &:hover {
    border-color: rgba($BAKANO-PURPLE, 0.3);
    background: rgba($BAKANO-PURPLE, 0.04);
  }

  &.selected {
    border-color: rgba($BAKANO-PURPLE, 0.5);
    background: rgba($BAKANO-PURPLE, 0.08);

    .calificar-radio {
      border-color: $BAKANO-PURPLE;

      &::after {
        opacity: 1;
        transform: scale(1);
      }
    }
  }
}

.calificar-radio {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
  position: relative;
  transition: border-color 0.18s;

  &::after {
    content: '';
    position: absolute;
    inset: 3px;
    border-radius: 50%;
    background: linear-gradient(135deg, $BAKANO-PINK, $BAKANO-PURPLE);
    opacity: 0;
    transform: scale(0.4);
    transition: opacity 0.18s, transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
}

.calificar-opt-label {
  font-family: $font-secondary;
  font-size: 0.86rem;
  color: $text-body;
  line-height: 1.4;
}

.calificar-prompt {
  font-family: $font-interface;
  font-size: 0.78rem;
  color: rgba(255,255,255,0.3);
  font-style: italic;
  padding: 14px 0 4px;
}

.calificar-error {
  font-family: $font-interface;
  font-size: 0.7rem;
  color: #ff6680;
  padding-left: 2px;
}

// ── Textarea ───────────────────────────────────────────────────────────────────

.calificar-textarea-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calificar-textarea {
  width: 100%;
  resize: vertical;
  min-height: 100px;
  padding: 12px 14px;
  box-sizing: border-box;
  font-family: $font-secondary;
  font-size: 0.86rem;
  color: rgba(255,255,255,0.85);
  background: rgba(255,255,255,0.03);
  border: 1px solid $border;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.18s, background 0.18s;
  line-height: 1.55;

  &::placeholder { color: rgba(255,255,255,0.22); }

  &:focus {
    border-color: rgba($BAKANO-PURPLE, 0.45);
    background: rgba($BAKANO-PURPLE, 0.04);
  }

  &.error { border-color: rgba(255, 80, 100, 0.3); }
}

.calificar-textarea-footer {
  display: flex;
  justify-content: flex-end;
  min-height: 16px;
}

.calificar-word-hint {
  font-family: $font-interface;
  font-size: 0.7rem;
  color: $text-muted;
  display: flex;
  align-items: center;
  gap: 5px;
}

.calificar-word-ok {
  color: $BAKANO-GREEN;
  font-size: 0.75rem;
}

// ── Consent ────────────────────────────────────────────────────────────────────

.calificar-consent {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;

  &.has-error .calificar-consent-box {
    border-color: rgba(255, 80, 100, 0.5);
  }
}

.calificar-consent-box {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
  margin-top: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.18s, background 0.18s;
  color: $white;

  &.checked {
    background: linear-gradient(135deg, $BAKANO-PINK, $BAKANO-PURPLE);
    border-color: transparent;
  }
}

.calificar-consent-text {
  font-family: $font-interface;
  font-size: 0.72rem;
  color: $text-muted;
  line-height: 1.55;
}

.calificar-link {
  color: rgba($BAKANO-PURPLE, 0.8);
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s;

  &:hover { color: $BAKANO-PURPLE; }
}

// ── Actions ────────────────────────────────────────────────────────────────────

.calificar-actions {
  display: flex;
  gap: 12px;
  margin-top: 4px;
}

.calificar-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 24px;
  font-family: $font-interface;
  font-size: 0.88rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: $white;
  background: linear-gradient(135deg, $BAKANO-PURPLE, $BAKANO-PINK);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba($BAKANO-PURPLE, 0.4);
  transition: transform 0.2s ease, box-shadow 0.25s ease, opacity 0.2s;
  text-decoration: none;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba($BAKANO-PURPLE, 0.55);
  }

  &:active:not(:disabled) { transform: translateY(0); }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &--ghost {
    background: transparent;
    border: 1px solid $border;
    color: $text-muted;
    box-shadow: none;
    flex: 0 0 auto;

    &:hover:not(:disabled) {
      border-color: rgba(255,255,255,0.2);
      color: $white;
      box-shadow: none;
    }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
.calificar-spinner { animation: spin 0.8s linear infinite; }
</style>
