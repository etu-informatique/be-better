// Vérifie le contenu publié dans public/content/ : sommaire, paquets, cartes, questions, liens.
// Usage : npm run check-content
import { readFileSync } from 'node:fs'
import { THEMES } from '../src/data/themes.js'

const dir = new URL('../public/content/', import.meta.url)
const read = (file) => JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
const manifest = read('manifest.json')
const levels = manifest.chunks.flatMap((file) => read(file).levels)
const cards = levels.flatMap((l) => l.cards)
const ids = new Set(cards.map((c) => c.id))
const errors = []

levels.forEach((level, i) => {
  if (level.number !== i + 1) errors.push(`niveau ${i + 1} : numéro ${level.number} inattendu`)
  if (level.cards.length !== manifest.deckSize) errors.push(`niveau ${level.number} : ${level.cards.length} carte(s) au lieu de ${manifest.deckSize}`)
})
if (levels.length !== manifest.levelCount) errors.push(`${levels.length} niveaux trouvés, ${manifest.levelCount} annoncés`)
if (ids.size !== cards.length) errors.push('une carte apparaît dans plusieurs niveaux')

for (const card of cards) {
  const where = `carte « ${card.id} »`
  if (!THEMES[card.theme]) errors.push(`${where} : thème inconnu « ${card.theme} »`)
  for (const field of ['title', 'teaser', 'wiki']) if (!card[field]) errors.push(`${where} : champ « ${field} » manquant`)
  if (!card.summary?.length) errors.push(`${where} : résumé vide`)
  for (const r of card.related ?? []) {
    if (!ids.has(r.id) || !r.title || !r.level) errors.push(`${where} : lien « voir aussi » invalide (${r.id})`)
  }
  if (card.coords && (Math.abs(card.coords[0]) > 90 || Math.abs(card.coords[1]) > 180)) errors.push(`${where} : coordonnées invalides`)
  if (card.questions?.length !== 3) errors.push(`${where} : ${card.questions?.length ?? 0} question(s) au lieu de 3`)
  card.questions?.forEach((q, i) => {
    if (q.type === 'qcm' && (q.choices?.length < 2 || q.answer >= q.choices.length || new Set(q.choices).size !== q.choices.length)) {
      errors.push(`${where}, question ${i + 1} : QCM invalide (choix manquants ou en double)`)
    }
    if (q.type === 'vf' && typeof q.answer !== 'boolean') errors.push(`${where}, question ${i + 1} : vrai/faux sans réponse booléenne`)
    if (!q.explain) errors.push(`${where}, question ${i + 1} : explication manquante`)
  })
}

if (errors.length) {
  console.error(`✗ ${errors.length} problème(s) :\n- ${errors.slice(0, 50).join('\n- ')}`)
  process.exit(1)
}
const mixed = levels.filter((l) => new Set(l.cards.map((c) => c.theme)).size === l.cards.length).length
console.log(`✓ Contenu valide : ${manifest.levelCount} niveaux, ${cards.length} cartes, ${manifest.chunks.length} fichiers.`)
console.log(`  ${mixed} paquets avec ${manifest.deckSize} thèmes différents · images ${cards.filter((c) => c.image).length} · dates ${cards.filter((c) => c.when).length} · lieux ${cards.filter((c) => c.coords).length} · liens ${cards.filter((c) => c.related.length).length}`)
