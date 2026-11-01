// La roadmap : une suite de niveaux regroupés en chapitres de 10. Leur nombre dépend du contenu
// généré (un niveau par paquet de cartes) ; chaque niveau propose son propre paquet.
export const DECK_SIZE = 5
const LEVELS_PER_CHAPTER = 10

const CHAPTER_TITLES = [
  'Premiers pas', 'Les fondations', 'Curiosités', 'Grands esprits', 'Horizons',
  'Le monde ancien', 'Découvertes', 'Chefs-d’œuvre', 'Les rouages du monde', 'Au fil du temps',
  'Terres et océans', 'Idées qui changent tout', 'Inventions', 'Voix et langues', 'L’atelier des sciences',
  'Héritages', 'Grandes questions', 'Explorations', 'Le savoir en partage', 'Sommets',
  'Empires et royaumes', 'Le corps et la vie', 'Pensées d’ailleurs', 'Mesurer le monde', 'Scènes et écrans',
  'Routes et échanges', 'Le ciel et les étoiles', 'Révolutions', 'Mots et récits', 'Bâtisseurs',
  'Sons et silences', 'La cité', 'Matière et énergie', 'Rivages', 'Les inventeurs',
  'Croyances', 'Chiffres et formes', 'Mémoires', 'Le vivant', 'Nouveaux mondes',
]

export function buildLevels(count) {
  const levels = Array.from({ length: count }, (_, i) => ({
    id: `niveau-${i + 1}`,
    number: i + 1,
    chapter: Math.floor(i / LEVELS_PER_CHAPTER),
  }))
  const chapters = Array.from({ length: Math.ceil(count / LEVELS_PER_CHAPTER) }, (_, i) => ({
    id: `chapitre-${i + 1}`,
    number: i + 1,
    title: CHAPTER_TITLES[i] ?? `Chapitre ${i + 1}`,
    levels: levels.slice(i * LEVELS_PER_CHAPTER, (i + 1) * LEVELS_PER_CHAPTER),
  }))
  return { levels, chapters, byId: Object.fromEntries(levels.map((l) => [l.id, l])) }
}
