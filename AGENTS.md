# Bakano Funnel — Agent Guide

## Commands
```bash
pnpm dev          # Vite dev server
pnpm type-check   # vue-tsc (only check, no build)
pnpm build        # type-check + vite build (parallel via run-p)
pnpm format       # prettier --write src/
pnpm preview      # vite preview
```

No test framework, no CI, no ESLint config exist.

## Conventions
- **No semicolons**, single quotes, 100 print width (Prettier enforced).
- **No emojis** — use FontAwesome 6 `<i class="fa-solid fa-...">` (loaded via CDN in `index.html`, not npm).
- **SCSS color variables** (`$BAKANO-PINK`, `$BAKANO-DARK`, etc.) are auto-injected into every `<style lang="scss">` block by Vite — no explicit `@use` needed in components.
- `@` alias works in both TS imports and SCSS paths (maps to `./src`).
- Node `^20.19.0 || >=22.12.0` required.

## Architecture
Single-page VSL funnel (not multi-section). Route flow in `src/router/index.ts`:
- `/` (alias `/registro-vsl-tr`) → `/ver-video` → `/agendar` → `/cita-confirmada`
- `/sin-espacio` = disqualification path
- `/calificar` = standalone qualification page (2-step: contact + vertical/billing/ubicacion/objetivo/mejora). Same webhooks as the modal flow.
- `/politicas-privacidad` and `/aviso-legal` = legal pages

SEO is dynamically set in the router's `afterEach` hook from each route's `meta` object (title, description, og tags, canonical). Edit route `meta` to change page SEO.

Obsolete file artifacts (not in router, do not use): `HomeView.vue`, `ThankYouView.vue`, `ToolsView.vue`.

Page transitions defined in `App.vue` (fade + slide, respects `prefers-reduced-motion`).

## localStorage keys
| Key | What | Written by |
|---|---|---|
| `bk_contact` | `{nombre, apellido, negocio, email, telefono, timestamp}` | RegistrationModal + VideoView guard. A Pinia store hydrates from it on init. |
| `bk_disq_at` | timestamp ms | CalendarModal on disqualify |
| `bk_booked_at` | timestamp ms | BookingView on confirm |
| `bk_fb` (sessionStorage) | `{fbclid, fbc, fbp, utm_*}` | `fbclid.ts` on FunnelView mount |

## Guards
- **FunnelView**: `bk_disq_at` < 24h → `/sin-espacio` (disabled on localhost).
- **VideoView**: no `bk_contact` → blocking overlay (disabled on localhost).
- **CalendarModal**: `objetivo = "viral"` → disqualify always. Otherwise, threshold depends on `vertical`: servicio min $10k (rejects `<10k`), producto/gastronomía min $15k (rejects `<15k`). Disqualify saves `bk_disq_at`.

## GHL integration
- **Tracker webhook**: hardcoded URL in `src/utils/ghl.ts` — `trackStage(etapa, data)`, silent on failure.
- **Calendar iframe**: `https://api.leadconnectorhq.com/widget/booking/dtpY2GCQjoOkpm8JUtYz` with `?firstName=&email=&phone=` from `bk_contact`. Booking confirmed via `postMessage(['msgsndr-booking-complete', {...}])`. Height auto-resizes via `postMessage({ type: 'booking-app', height: N })`.

## Vite quirks
- [`allowedHosts`](/Users/diegoreyes/projects/work/bakano/general/funnels-landings/bakano-funnel-traficker/vite.config.ts) includes an ngrok tunnel — add yours there for tunnel testing.
- `vite-plugin-vue-devtools` active in dev.
- `.env` is gitignored — local config is not committed.
- No Vitest/Cypress/Playwright configs exist.

## Existing reference file
`CLAUDE.md` has detailed funnel content, brand colors/fonts, and component listings. This file is the compact operational supplement — read both.
