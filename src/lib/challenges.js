// Défis qui mélangent plusieurs cartes déjà apprises : ils obligent à relier les connaissances
// entre elles (chronologie, sujets et descriptions, thèmes).
import { getCard } from '../data/content.js'
import { THEMES } from '../data/themes.js'

const formatYear = (y) => (y < 0 ? `${-y} av. J.-C.` : String(y))

function sample(list, n) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function chronology(cards) {
  const dated = cards.filter((c) => c.when)
  const picked = []
  for (const c of sample(dated, dated.length)) {
    if (picked.every((p) => Math.abs(p.when.from - c.when.from) >= 5)) picked.push(c)
    if (picked.length === 4) break
  }
  if (picked.length < 3) return null
  const sorted = [...picked].sort((a, b) => a.when.from - b.when.from)
  return {
    label: 'Défi : chronologie',
    question: {
      type: 'order',
      q: 'Remets ces sujets dans l’ordre chronologique, du plus ancien au plus récent.',
      items: picked.map((c) => c.title),
      answer: sorted.map((c) => c.title),
      explain: sorted.map((c) => `${c.title} (${formatYear(c.when.from)})`).join(', puis ') + '.',
    },
  }
}

function matching(cards) {
  const picked = sample(cards.filter((c) => c.teaser.length <= 90), 4)
  if (picked.length < 4) return null
  return {
    label: 'Défi : associations',
    question: {
      type: 'match',
      q: 'Relie chaque sujet à sa description.',
      pairs: picked.map((c) => ({ left: c.title, right: c.teaser })),
      explain: picked.map((c) => `${c.title} : ${c.teaser.charAt(0).toLowerCase()}${c.teaser.slice(1)}`).join(' · '),
    },
  }
}

function oddOneOut(cards) {
  const byTheme = {}
  for (const c of cards) (byTheme[c.theme] ??= []).push(c)
  const themes = Object.keys(byTheme).filter((t) => byTheme[t].length >= 3)
  if (!themes.length) return null
  const theme = sample(themes, 1)[0]
  const others = cards.filter((c) => c.theme !== theme)
  if (!others.length) return null
  const intruder = sample(others, 1)[0]
  const group = sample(byTheme[theme], 3)
  return {
    label: 'Défi : l’intrus',
    question: {
      type: 'qcm',
      q: `Lequel de ces sujets n’appartient pas au thème ${THEMES[theme].name} ?`,
      choices: [intruder.title, ...group.map((c) => c.title)],
      answer: 0,
      explain: `${intruder.title} appartient au thème ${THEMES[intruder.theme].name}.`,
    },
  }
}

// Jusqu'à `max` défis différents, tirés des cartes apprises (il en faut au moins 4).
export function buildChallenges(learnedIds, max = 2) {
  const cards = learnedIds.map(getCard).filter(Boolean)
  if (cards.length < 4) return []
  return sample([chronology, matching, oddOneOut], 3)
    .map((make) => make(cards))
    .filter(Boolean)
    .slice(0, max)
}
