import { useEffect, useMemo, useState } from 'react'
import { addDays, todayKey } from './dates.js'
import { reviewCard, scheduleNew } from './srs.js'

const STORAGE_KEY = 'be-better:v2'

// Bonnes réponses nécessaires (sur 3) pour valider un niveau
export const PASS_SCORE = 2
export const DAILY_GOAL = 3
export const XP = { levelCorrect: 10, levelBonus: 20, reviewCorrect: 5 }

const initialProgress = () => ({
  completedLevels: {}, // levelId -> { cardId, date, best }
  readCards: {}, // cardId -> true, une fois la lecture prouvée
  cards: {}, // cardId -> état de répétition espacée (cartes apprises)
  favorites: {}, // cardId -> true
  xp: 0,
  streak: { count: 0, best: 0, last: null },
  days: {}, // AAAA-MM-JJ -> { cards, reviews }
})

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? { ...initialProgress(), ...JSON.parse(raw) } : initialProgress()
  } catch {
    return initialProgress()
  }
}

function save(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // stockage indisponible (navigation privée…) : l'app reste utilisable pour la session
  }
}

function touchStreak(streak, today) {
  if (streak.last === today) return streak
  const count = streak.last === addDays(today, -1) ? streak.count + 1 : 1
  return { count, best: Math.max(streak.best, count), last: today }
}

export const currentStreak = (streak, today) =>
  streak.last === today || streak.last === addDays(today, -1) ? streak.count : 0

function bumpDay(days, today, field, n) {
  const day = days[today] || { cards: 0, reviews: 0 }
  return { ...days, [today]: { ...day, [field]: day[field] + n } }
}

// Les niveaux se débloquent dans l'ordre : le premier non validé est le niveau « en cours ».
export function levelStates(progress, levels) {
  const current = levels.findIndex((l) => !progress.completedLevels[l.id])
  return Object.fromEntries(
    levels.map((l, i) => [l.id, progress.completedLevels[l.id] ? 'done' : i === current ? 'current' : 'locked']),
  )
}

// Numéro du niveau en cours (les niveaux sont validés dans l'ordre).
export const currentLevelNumber = (progress) => Object.keys(progress.completedLevels).length + 1

// Sauvegarde : la progression tient dans un petit fichier JSON qu'on peut réimporter
// sur un autre appareil ou après avoir vidé le navigateur.
const EXPORT_FORMAT = 'be-better-progression'

export const exportProgress = (progress) =>
  JSON.stringify({ format: EXPORT_FORMAT, version: 2, exportedAt: new Date().toISOString(), progress }, null, 1)

export function parseImport(text) {
  const data = JSON.parse(text)
  const p = data?.progress
  if (data?.format !== EXPORT_FORMAT || !p || typeof p.completedLevels !== 'object' || typeof p.cards !== 'object') {
    throw new Error('Ce fichier n’est pas une sauvegarde Be Better.')
  }
  return { ...initialProgress(), ...p }
}

export function useProgress() {
  const [progress, setProgress] = useState(load)

  useEffect(() => {
    save(progress)
  }, [progress])

  const actions = useMemo(
    () => ({
      markRead: (cardId) =>
        setProgress((p) => (p.readCards[cardId] ? p : { ...p, readCards: { ...p.readCards, [cardId]: true } })),

      toggleFavorite: (cardId) =>
        setProgress((p) => {
          const favorites = { ...p.favorites }
          if (favorites[cardId]) delete favorites[cardId]
          else favorites[cardId] = true
          return { ...p, favorites }
        }),

      completeLevel: (level, cardId, results, xp) =>
        setProgress((p) => {
          const today = todayKey()
          const score = results.filter((r) => r.correct).length
          const previous = p.completedLevels[level.id]
          if (previous) {
            const completedLevels = { ...p.completedLevels, [level.id]: { ...previous, best: Math.max(previous.best, score) } }
            return { ...p, completedLevels }
          }
          return {
            ...p,
            cards: p.cards[cardId] ? p.cards : { ...p.cards, [cardId]: scheduleNew(today) },
            xp: p.xp + xp,
            completedLevels: { ...p.completedLevels, [level.id]: { cardId, date: today, best: score } },
            streak: touchStreak(p.streak, today),
            days: bumpDay(p.days, today, 'cards', 1),
          }
        }),

      recordReview: (results, xp) =>
        setProgress((p) => {
          const today = todayKey()
          const cards = { ...p.cards }
          for (const r of results) if (cards[r.cardId]) cards[r.cardId] = reviewCard(cards[r.cardId], r.correct, today)
          return {
            ...p,
            cards,
            xp: p.xp + xp,
            streak: touchStreak(p.streak, today),
            days: bumpDay(p.days, today, 'reviews', results.length),
          }
        }),

      reset: () => setProgress(initialProgress()),
      replace: (progress) => setProgress(progress),
    }),
    [],
  )

  return [progress, actions]
}
