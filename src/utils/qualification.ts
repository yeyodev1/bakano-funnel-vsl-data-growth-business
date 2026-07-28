export const ROLE_OPTIONS = [
  { value: 'dueno', label: 'Dueño/a' },
  { value: 'socio', label: 'Socio/a' },
  { value: 'director', label: 'Director/a o gerente' },
  { value: 'empleado', label: 'Empleado/a' },
] as const

export const REVENUE_OPTIONS = [
  { value: '<10k', label: 'Menos de $10,000 USD' },
  { value: '10k-20k', label: 'Entre $10,000 y $20,000 USD' },
  { value: '20k-50k', label: 'Entre $20,000 y $50,000 USD' },
  { value: '50k-100k', label: 'Entre $50,000 y $100,000 USD' },
  { value: '>100k', label: 'Más de $100,000 USD' },
] as const

export const ROLE_LABELS = Object.fromEntries(
  ROLE_OPTIONS.map((option) => [option.value, option.label]),
)
export const REVENUE_LABELS = Object.fromEntries(
  REVENUE_OPTIONS.map((option) => [option.value, option.label]),
)

const DECISION_MAKER_ROLES = new Set(['dueno', 'socio'])
const QUALIFIED_REVENUE = new Set(['20k-50k', '50k-100k', '>100k'])

export function qualifiesAsHighValueLead(
  role: string,
  revenue: string,
  objective: string,
): boolean {
  return DECISION_MAKER_ROLES.has(role) && QUALIFIED_REVENUE.has(revenue) && objective !== 'viral'
}
