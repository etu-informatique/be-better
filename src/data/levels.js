// La roadmap : une suite de niveaux regroupés en chapitres de 10.
// À chaque niveau, on choisit librement une carte parmi celles qu'on n'a pas encore apprises.
export const LEVEL_COUNT = 200
const LEVELS_PER_CHAPTER = 10

const CHAPTER_TITLES = [
  'Premiers pas', 'Les fondations', 'Curiosités', 'Grands esprits', 'Horizons',
  'Le monde ancien', 'Découvertes', 'Chefs-d’œuvre', 'Les rouages du monde', 'Au fil du temps',
  'Terres et océans', 'Idées qui changent tout', 'Inventions', 'Voix et langues', 'L’atelier des sciences',
  'Héritages', 'Grandes questions', 'Explorations', 'Le savoir en partage', 'Sommets',
]

export const LEVELS = Array.from({ length: LEVEL_COUNT }, (_, i) => ({
  id: `niveau-${i + 1}`,
  number: i + 1,
  chapter: Math.floor(i / LEVELS_PER_CHAPTER),
}))

export const CHAPTERS = Array.from({ length: Math.ceil(LEVEL_COUNT / LEVELS_PER_CHAPTER) }, (_, i) => ({
  id: `chapitre-${i + 1}`,
  number: i + 1,
  title: CHAPTER_TITLES[i] ?? `Chapitre ${i + 1}`,
  levels: LEVELS.slice(i * LEVELS_PER_CHAPTER, (i + 1) * LEVELS_PER_CHAPTER),
}))

export const LEVEL_BY_ID = Object.fromEntries(LEVELS.map((l) => [l.id, l]))
