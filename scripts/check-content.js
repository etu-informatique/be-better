// Vérifie la cohérence du contenu : identifiants, thèmes, liens « voir aussi », questions.
// Usage : npm run check-content
import { readFileSync } from 'node:fs'
import { HANDWRITTEN_CARDS } from '../src/data/handwritten.js'
import { LEVEL_COUNT } from '../src/data/levels.js'
import { THEMES } from '../src/data/themes.js'

const wiki = JSON.parse(readFileSync(new URL('../src/data/generated/wiki.json', import.meta.url), 'utf8'))
const CARDS = [...HANDWRITTEN_CARDS, ...wiki.cards]
const ids = new Set(CARDS.map((c) => c.id))
const errors = []
const seen = new Set()

for (const card of CARDS) {
  const where = `carte « ${card.id} »`
  if (seen.has(card.id)) errors.push(`${where} : identifiant en double`)
  seen.add(card.id)
  if (!THEMES[card.theme]) errors.push(`${where} : thème inconnu « ${card.theme} »`)
  for (const field of ['title', 'teaser', 'wiki']) if (!card[field]) errors.push(`${where} : champ « ${field} » manquant`)
  if (!card.summary?.length) errors.push(`${where} : résumé vide`)
  for (const id of card.related ?? []) if (!ids.has(id)) errors.push(`${where} : « voir aussi » inconnu « ${id} »`)
  if (card.questions?.length !== 3) errors.push(`${where} : ${card.questions?.length ?? 0} question(s) au lieu de 3`)
  card.questions?.forEach((q, i) => {
    if (q.type === 'qcm' && (q.choices?.length < 2 || q.answer >= q.choices.length || new Set(q.choices).size !== q.choices.length)) {
      errors.push(`${where}, question ${i + 1} : QCM invalide (choix manquants ou en double)`)
    }
    if (q.type === 'vf' && typeof q.answer !== 'boolean') errors.push(`${where}, question ${i + 1} : vrai/faux sans réponse booléenne`)
    if (!q.explain) errors.push(`${where}, question ${i + 1} : explication manquante`)
  })
}

if (CARDS.length < LEVEL_COUNT) errors.push(`${CARDS.length} cartes pour ${LEVEL_COUNT} niveaux : il en faut au moins autant`)

if (errors.length) {
  console.error(`✗ ${errors.length} problème(s) :\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
const withImage = CARDS.filter((c) => c.image || wiki.images[c.id]).length
console.log(`✓ Contenu valide : ${CARDS.length} cartes (${withImage} avec image), ${LEVEL_COUNT} niveaux, ${Object.keys(THEMES).length} thèmes.`)
