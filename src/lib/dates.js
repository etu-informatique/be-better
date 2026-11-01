// Les jours sont stockés en clés locales « AAAA-MM-JJ » : simples à comparer et à sérialiser.
const pad = (n) => String(n).padStart(2, '0')

export const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const fromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const addDays = (key, n) => {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return todayKey(d)
}

export const daysBetween = (from, to) => Math.round((fromKey(to) - fromKey(from)) / 86400000)

export function relativeDay(key, today) {
  const n = daysBetween(today, key)
  if (n <= 0) return 'aujourd’hui'
  if (n === 1) return 'demain'
  if (n < 7) return `dans ${n} jours`
  return fromKey(key).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export const weekdayInitial = (key) =>
  fromKey(key).toLocaleDateString('fr-FR', { weekday: 'narrow' }).toUpperCase()
