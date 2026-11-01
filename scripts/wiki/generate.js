// Génère le contenu de Be Better à partir de sources gratuites et fiables :
//   - les listes Wikimédia des articles « que toute Wikipédia devrait avoir » (1 000 puis 10 000 sujets) ;
//   - Wikidata (descriptions, dates, lieux, liens entre sujets… sous licence CC0) ;
//   - Wikipédia en français (introductions, CC BY-SA 4.0) et ses images (Wikimedia Commons).
// Aucune IA, aucun service payant. Usage : npm run generate-cards [-- --per-theme 260]
//
// Sortie : public/content/manifest.json et des fichiers levels-XXX.json (25 niveaux chacun),
// que l'app télécharge au fur et à mesure de la progression.
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HANDWRITTEN_CARDS } from '../../src/data/handwritten.js'
import { DECK_SIZE } from '../../src/data/levels.js'
import { buildDecks } from '../../src/lib/decks.js'
import { capitalize } from './lib.js'
import { CONTINENTS, DATE_PROPS, LABEL_PROPS, LINK_PROPS, buildCard, groupKey, imageWithCredit, whenOf } from './build.js'
import { fetchClaims, fetchEntities, fetchImageCredits, fetchPages, fetchTopics } from './sources.js'

const here = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(here, '../../public/content')
const LEVELS_PER_CHUNK = 25
const MAX_RELATED = 4

const argValue = (name, fallback) => {
  const i = process.argv.indexOf(name)
  return i === -1 ? fallback : Number(process.argv[i + 1])
}
const PER_THEME = argValue('--per-theme', 260)

const log = (...a) => console.log(...a)
const count = (map, key) => (map[key] = (map[key] ?? 0) + 1)

async function main() {
  log('1/7 Sujets (listes Wikimédia)…')
  const topics = await fetchTopics()
  log(`    ${topics.length} sujets`)

  log('2/7 Wikidata (articles en français, descriptions)…')
  const entities = await fetchEntities(topics.map((t) => t.qid))

  log('3/7 Cartes rédigées : correspondance avec Wikidata…')
  const handwrittenTitles = HANDWRITTEN_CARDS.map((c) => c.wiki.replaceAll('_', ' '))
  const handwrittenPages = await fetchPages(handwrittenTitles)
  const handwrittenQids = new Set(Object.values(handwrittenPages).map((p) => p.qid).filter(Boolean))

  // Candidats : par thème, d'abord la liste de base, puis la liste étendue, avec une marge
  // pour remplacer les sujets qui seront écartés.
  const byTheme = {}
  for (const t of topics) {
    t.frTitle = entities[t.qid]?.title
    if (!t.frTitle || handwrittenQids.has(t.qid) || handwrittenTitles.includes(t.frTitle)) continue
    ;(byTheme[t.theme] ??= []).push(t)
  }
  const candidates = Object.values(byTheme).flatMap((list) =>
    list.sort((a, b) => a.rank - b.rank).slice(0, Math.ceil(PER_THEME * 1.3)),
  )
  log(`    ${candidates.length} candidats retenus (au plus ${PER_THEME} cartes par thème)`)

  log('4/7 Wikidata (dates, lieux, auteurs, liens)…')
  const claims = await fetchClaims([...candidates.map((t) => t.qid), ...handwrittenQids], {
    labelProps: LABEL_PROPS, dateProps: DATE_PROPS, linkProps: LINK_PROPS,
  })

  log('5/7 Wikipédia (introductions et images)…')
  const pages = await fetchPages(candidates.map((t) => t.frTitle))

  log('6/7 Crédits des images…')
  const credits = await fetchImageCredits(
    [...Object.values(pages), ...Object.values(handwrittenPages)].map((p) => p.image?.file).filter(Boolean),
  )

  log('7/7 Cartes, liens et niveaux…')
  // Réserves de mauvaises réponses : descriptions et titres par thème et par genre, valeurs par propriété.
  const pools = { groups: {}, themeTeasers: {}, themeTitles: {}, values: {} }
  for (const t of candidates) {
    const group = (pools.groups[groupKey(t.theme, claims[t.qid])] ??= { teasers: [], titles: [] })
    const d = entities[t.qid].description
    if (d && d.length <= 90) {
      group.teasers.push(capitalize(d))
      ;(pools.themeTeasers[t.theme] ??= []).push(capitalize(d))
    }
    group.titles.push(t.frTitle)
    ;(pools.themeTitles[t.theme] ??= []).push(t.frTitle)
    for (const prop of LABEL_PROPS) for (const v of claims[t.qid][prop] ?? []) (pools.values[prop] ??= new Set()).add(v)
  }
  for (const group of Object.values(pools.groups)) group.teasers = [...new Set(group.teasers)]
  pools.values.P30 = CONTINENTS

  const generated = []
  const kept = {}
  const dropped = {}
  for (const t of candidates) {
    if ((kept[t.theme] ?? 0) >= PER_THEME) continue
    const page = pages[t.frTitle]
    if (!page) {
      count(dropped, 'article introuvable')
      continue
    }
    const result = buildCard(t, entities[t.qid], page, claims[t.qid], pools, credits)
    if (!result.card) {
      count(dropped, result.dropped)
      continue
    }
    generated.push(result.card)
    count(kept, t.theme)
  }

  const handwritten = HANDWRITTEN_CARDS.map((c) => {
    const page = handwrittenPages[c.wiki.replaceAll('_', ' ')]
    const claim = (page?.qid && claims[page.qid]) || {}
    return {
      ...c,
      qid: page?.qid ?? null,
      image: imageWithCredit(page?.image, credits),
      // Une date écrite à la main l'emporte (la carte « chute du mur » vise 1989, pas la construction)
      when: c.when ?? whenOf(claim),
      coords: claim.coords ?? null,
      source: 'handwritten',
    }
  })

  // « Voir aussi » : les liens Wikidata entre deux sujets présents dans l'app, dans les deux sens.
  const all = [...handwritten, ...generated]
  const idByQid = Object.fromEntries(all.filter((c) => c.qid).map((c) => [c.qid, c.id]))
  const links = Object.fromEntries(all.map((c) => [c.id, new Set(c.related)]))
  for (const c of all) {
    for (const target of claims[c.qid]?.links ?? []) {
      const other = idByQid[target]
      if (!other || other === c.id) continue
      links[c.id].add(other)
      links[other].add(c.id)
    }
  }

  // Un paquet de cartes par niveau ; on ne garde que les paquets complets.
  const decks = buildDecks(all, Infinity, DECK_SIZE).filter((d) => d.length === DECK_SIZE)
  const byId = Object.fromEntries(all.map((c) => [c.id, c]))
  const levelOf = {}
  decks.forEach((deck, i) => deck.forEach((id) => (levelOf[id] = i + 1)))

  // Chaque lien emporte le titre et le niveau de la carte liée : l'app peut l'annoncer
  // (« à découvrir au niveau 37 ») sans avoir chargé ce niveau.
  for (const c of all) {
    c.related = [...links[c.id]]
      .filter((id) => levelOf[id])
      .slice(0, MAX_RELATED)
      .map((id) => ({ id, title: byId[id].title, level: levelOf[id] }))
  }

  await rm(CONTENT_DIR, { recursive: true, force: true })
  await mkdir(CONTENT_DIR, { recursive: true })
  const chunks = []
  for (let start = 0; start < decks.length; start += LEVELS_PER_CHUNK) {
    const file = `levels-${String(start / LEVELS_PER_CHUNK + 1).padStart(3, '0')}.json`
    const levels = decks.slice(start, start + LEVELS_PER_CHUNK).map((deck, i) => ({
      number: start + i + 1,
      cards: deck.map((id) => byId[id]),
    }))
    await writeFile(join(CONTENT_DIR, file), JSON.stringify({ levels }))
    chunks.push(file)
  }
  const perTheme = {}
  for (const id of Object.keys(levelOf)) count(perTheme, byId[id].theme)
  await writeFile(
    join(CONTENT_DIR, 'manifest.json'),
    JSON.stringify({
      generatedAt: new Date().toISOString().slice(0, 10),
      levelCount: decks.length,
      deckSize: DECK_SIZE,
      levelsPerChunk: LEVELS_PER_CHUNK,
      chunks,
      cardCount: decks.length * DECK_SIZE,
      perTheme,
    }, null, 2),
  )

  log(`\n✓ ${all.length} cartes (${handwritten.length} rédigées, ${generated.length} générées) → ${decks.length} niveaux, ${chunks.length} fichiers dans public/content/`)
  log(`  par thème : ${Object.entries(perTheme).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  const dealt = Object.keys(levelOf).map((id) => byId[id])
  log(`  avec image : ${dealt.filter((c) => c.image).length} · datées : ${dealt.filter((c) => c.when).length} · localisées : ${dealt.filter((c) => c.coords).length} · avec « voir aussi » : ${dealt.filter((c) => c.related.length).length}`)
  log(`  écartées : ${Object.entries(dropped).map(([k, v]) => `${k} ${v}`).join(', ') || 'aucune'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
