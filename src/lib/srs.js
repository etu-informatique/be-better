// Répétition espacée façon Leitner : chaque bonne réponse fait monter la carte d'une « boîte »
// et repousse sa prochaine révision ; une erreur la renvoie à la boîte 0 (révision demain).
import { addDays } from './dates.js'

export const INTERVALS = [1, 3, 7, 14, 30, 60]

export const scheduleNew = (today) => ({ box: 0, due: addDays(today, INTERVALS[0]), lapses: 0, learnedAt: today })

export function reviewCard(state, correct, today) {
  if (!correct) return { ...state, box: 0, due: addDays(today, INTERVALS[0]), lapses: state.lapses + 1 }
  const box = Math.min(state.box + 1, INTERVALS.length - 1)
  return { ...state, box, due: addDays(today, INTERVALS[box]) }
}

export const dueCardIds = (cards, today) =>
  Object.entries(cards)
    .filter(([, s]) => s.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id)

export function strength(box) {
  if (box >= 4) return { label: 'Ancrée', level: 3 }
  if (box >= 2) return { label: 'En progrès', level: 2 }
  return { label: 'Fragile', level: 1 }
}
