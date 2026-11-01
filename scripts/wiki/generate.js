// Génère les cartes de Be Better à partir de sources gratuites et fiables :
//   - la liste Wikimédia des « articles que toute Wikipédia devrait avoir » (les sujets) ;
//   - Wikidata (descriptions, dates, auteurs, pays… sous licence CC0) ;
//   - Wikipédia en français (introductions, sous licence CC BY-SA 4.0) et ses images (Wikimedia Commons).
// Aucune IA, aucun service payant. Usage : npm run generate-cards
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HANDWRITTEN_CARDS as HANDWRITTEN } from '../../src/data/handwritten.js'
import { capitalize, chunk, cleanExtract, fetchJson, rngFor, sentences, shortSummary, shuffle, stripHtml } from './lib.js'
import {
  FACT_PROPERTIES, descriptionQuestion, descriptionTrueFalseQuestion, factQuestion, termBlankQuestion,
  titleFromDescriptionQuestion, yearBlankQuestion, yearSpots, yearTrueFalseQuestion,
} from './questions.js'

const here = dirname(fileURLToPath(import.meta.url))
const OUTPUT = join(here, '../../src/data/generated/wiki.json')
const LIST_PAGE = 'List_of_articles_every_Wikipedia_should_have'

// Rubriques de la liste Wikimédia (commentaires des titres) → thèmes de l'app
const SECTION_THEMES = [
  [/philosophers|religious figures|^philosophy|^religion/i, 'philo'],
  [/politicians|explorers|war and military|history|prehistoric|medieval|early modern/i, 'histoire'],
  [/inventors|psychology|astronomy|biolog|organisms|anatomy|health|diseases|chemistry|earth science|physics|^science/i, 'sciences'],
  [/composers|^music/i, 'musique'],
  [/artists|film|architecture|^arts/i, 'arts'],
  [/authors/i, 'litterature'],
  [/language and literature/i, 'langues'],
  [/business and economics/i, 'economie'],
  [/family|politics|law|international organizations|social issues|social sciences|agriculture|food|beverages|recreation/i, 'societe'],
  [/measurements|weight|^time|mathematics/i, 'maths'],
  [/technology|communication|electronics|computer|energy|materials|transportation|weapons/i, 'techno'],
  [/geography|continents|africa|asia|europe|america|oceania|bodies of water|mountains/i, 'geo'],
]

const DATE_PROPS = ['P569', 'P570', 'P571', 'P585', 'P580', 'P582']
// Wikidata connaît aussi « Eurasie » ou « Amériques » : on s'en tient aux continents classiques,
// pour qu'un leurre ne soit jamais une autre bonne réponse.
const CONTINENTS = new Set(['Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Antarctique', 'Asie', 'Europe', 'Océanie'])
const ENTITY_PROPS = Object.keys(FACT_PROPERTIES)

const log = (...a) => console.log(...a)

// 1. Les sujets : chaque entrée « # [[d:Q123|Nom]] », rangée sous sa rubrique.
async function fetchTopics() {
  const url = `https://meta.wikimedia.org/w/api.php?action=parse&page=${LIST_PAGE}&prop=wikitext&format=json&formatversion=2`
  const text = (await fetchJson(url)).parse.wikitext
  const topics = []
  const headings = {}
  for (const line of text.split('\n')) {
    const h = line.match(/^(=+).*<!--\s*(.*?)\s*-->/)
    if (h) {
      const depth = h[1].length
      headings[depth] = h[2]
      for (const d of Object.keys(headings)) if (Number(d) > depth) delete headings[d]
      continue
    }
    const item = line.match(/\[\[d:(Q\d+)\|/)
    if (!item) continue
    const path = Object.keys(headings).sort((a, b) => b - a).map((d) => headings[d])
    const theme = path.map((s) => SECTION_THEMES.find(([re]) => re.test(s))?.[1]).find(Boolean)
    if (!theme) log(`  rubrique non classée : ${path.join(' > ')}`)
    else topics.push({ qid: item[1], theme })
  }
  return topics
}

// 2. Wikidata : titre de l'article français, libellé et description.
async function fetchEntities(qids) {
  const out = {}
  for (const ids of chunk(qids, 50)) {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join('|')}&props=labels|descriptions|sitelinks&languages=fr&sitefilter=frwiki&format=json`
    Object.assign(out, (await fetchJson(url)).entities)
  }
  return out
}

// 3. Wikidata (SPARQL) : dates, auteurs, pays… avec leurs libellés en français.
async function fetchClaims(qids) {
  const claims = Object.fromEntries(qids.map((q) => [q, {}]))
  const values = qids.map((q) => `wd:${q}`).join(' ')
  for (const prop of [...DATE_PROPS, ...ENTITY_PROPS]) {
    const query = `SELECT ?item ?v ?vLabel WHERE { VALUES ?item { ${values} } ?item wdt:${prop} ?v . SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". } }`
    const res = await fetchJson('https://query.wikidata.org/sparql', { body: `format=json&query=${encodeURIComponent(query)}` })
    for (const b of res.results.bindings) {
      const qid = b.item.value.split('/').pop()
      const label = b.vLabel?.value
      const entry = DATE_PROPS.includes(prop) ? b.v.value : label
      if (!entry || /^Q\d+$/.test(entry)) continue // valeur sans libellé français
      ;(claims[qid][prop] ??= []).includes(entry) || claims[qid][prop].push(entry)
    }
  }
  return claims
}

// 4. Wikipédia : introduction en texte brut, image principale, révision (pour l'attribution).
async function fetchPages(titles) {
  const pages = {}
  for (const batch of chunk(titles, 20)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', redirects: '1',
      prop: 'extracts|pageimages|revisions', exintro: '1', explaintext: '1', exlimit: '20',
      piprop: 'thumbnail|name', pithumbsize: '800', pilimit: '20', rvprop: 'ids',
      titles: batch.join('|'),
    })
    const res = await fetchJson(`https://fr.wikipedia.org/w/api.php?${params}`)
    const rename = {}
    for (const n of res.query.normalized ?? []) rename[n.to] = n.from
    for (const r of res.query.redirects ?? []) rename[r.to] = rename[r.from] ?? r.from
    for (const p of res.query.pages) {
      if (p.missing) continue
      pages[rename[p.title] ?? p.title] = {
        title: p.title,
        extract: p.extract ?? '',
        revid: p.revisions?.[0]?.revid,
        image: p.thumbnail ? { src: p.thumbnail.source, file: p.pageimage } : null,
      }
    }
  }
  return pages
}

// 5. Crédits des images (auteur et licence), affichés sous chaque image.
async function fetchImageCredits(files) {
  const credits = {}
  for (const batch of chunk([...new Set(files)], 50)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
      iiprop: 'extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName',
      titles: batch.map((f) => `File:${f}`).join('|'),
    })
    const res = await fetchJson(`https://fr.wikipedia.org/w/api.php?${params}`)
    const rename = {}
    for (const n of res.query.normalized ?? []) rename[n.to] = n.from
    for (const p of res.query.pages) {
      const meta = p.imageinfo?.[0]?.extmetadata
      if (!meta) continue
      const file = (rename[p.title] ?? p.title).replace(/^File:/, '')
      credits[file] = {
        author: stripHtml(meta.Artist?.value).slice(0, 80) || 'Auteur inconnu',
        license: stripHtml(meta.LicenseShortName?.value) || 'voir Wikimedia Commons',
      }
    }
  }
  return credits
}

const yearOf = (iso) => {
  const m = iso?.match(/^([+-]?)(\d+)-/)
  if (!m) return null
  return m[1] === '-' ? -Number(m[2]) : Number(m[2])
}
const formatYear = (y) => (y < 0 ? `${-y} av. J.-C.` : String(y))

function buildFacts(claims, theme) {
  const facts = []
  const factValues = {}
  const birth = yearOf(claims.P569?.[0])
  const death = yearOf(claims.P570?.[0])
  const start = yearOf(claims.P580?.[0])
  const end = yearOf(claims.P582?.[0])
  const date = yearOf(claims.P571?.[0] ?? claims.P585?.[0])
  if (birth != null) facts.push(`Vie : ${formatYear(birth)}${death != null ? ` – ${formatYear(death)}` : ''}`)
  else if (start != null && end != null) facts.push(`Période : ${formatYear(start)} – ${formatYear(end)}`)
  else if (date != null) facts.push(`Date : ${formatYear(date)}`)
  for (const prop of ENTITY_PROPS) {
    if (facts.length >= 3) break
    // « Pays » n'a de sens que pour un lieu ou un monument (sinon : « l'euro se trouve en Irlande »)
    if (prop === 'P17' && (birth != null || !['geo', 'arts'].includes(theme))) continue
    const value = prop === 'P30' ? claims.P30?.find((v) => CONTINENTS.has(v)) : claims[prop]?.[0]
    if (!value || Object.values(factValues).includes(value)) continue
    facts.push(`${FACT_PROPERTIES[prop].label} : ${value}`)
    factValues[prop] = value
  }
  return { facts, factValues, birth }
}

function buildCard(topic, entity, page, claims, pools, credits) {
  const title = page.title
  const summary = shortSummary(cleanExtract(page.extract))
  if (summary.join(' ').length < 160) return { dropped: 'texte trop court' }
  const description = entity.descriptions?.fr?.value
  const firstSentence = sentences(summary[0])[0]
  const teaser = description ? capitalize(description) : firstSentence.length <= 110 ? firstSentence : null
  if (!teaser) return { dropped: 'pas de description' }

  const rng = rngFor(topic.qid)
  // La rubrique « langues et littérature » mélange langues et œuvres : une œuvre a un auteur.
  const theme = topic.theme === 'langues' && claims.P50 ? 'litterature' : topic.theme
  const card = { id: `wd-${topic.qid}`, qid: topic.qid, theme, title, teaser, summary }
  const { facts, factValues, birth } = buildFacts(claims, theme)

  const spots = yearSpots(summary)
  const distinctSpots = spots.filter((s, i) => spots.findIndex((o) => o.year === s.year) === i)
  // Leurres du même genre (une personne contre des personnes, une notion contre des notions)
  const group = pools.groups[`${topic.theme}:${claims.P569 ? 'person' : 'thing'}`]
  const otherTeasers = group.teasers.length >= 6 ? group.teasers : pools.themeTeasers[topic.theme]
  const otherTitles = group.titles.length >= 6 ? group.titles : pools.themeTitles[topic.theme]
  const candidates = []
  if (distinctSpots[0]) candidates.push(yearBlankQuestion(rng, distinctSpots[0]))
  for (const [prop, value] of Object.entries(factValues)) {
    candidates.push(factQuestion(rng, card, prop, value, pools.values[prop], `${FACT_PROPERTIES[prop].label} : ${value}.`))
  }
  candidates.push(termBlankQuestion(rng, card, otherTitles))
  if (birth != null && birth > 0 && !distinctSpots.some((s) => s.year === birth)) {
    candidates.push({
      ...yearBlankQuestion(rng, { sentence: String(birth), year: birth, index: 0 }),
      kind: 'birth',
      q: `En quelle année est né·e : ${title} ?`,
      explain: facts[0] + '.',
    })
  }
  if (description) candidates.push(descriptionQuestion(rng, card, otherTeasers))
  if (distinctSpots[1]) candidates.push(yearBlankQuestion(rng, distinctSpots[1]))
  const tfSpot = distinctSpots[2] ?? distinctSpots[1]
  if (tfSpot) candidates.push(yearTrueFalseQuestion(rng, tfSpot))
  if (description) candidates.push(titleFromDescriptionQuestion(rng, card, otherTitles))
  if (description) candidates.push(descriptionTrueFalseQuestion(rng, card, otherTeasers))

  const questions = []
  const kinds = new Set()
  for (const q of candidates) {
    if (!q || kinds.has(q.kind) || questions.length >= 3) continue
    kinds.add(q.kind)
    questions.push(q)
  }
  if (questions.length < 3) return { dropped: 'moins de 3 questions' }
  for (const q of questions) delete q.kind

  const image = page.image && { ...page.image, ...(credits[page.image.file] ?? { author: 'Auteur inconnu', license: 'voir Wikimedia Commons' }) }
  return { card: { ...card, facts, related: [], wiki: title.replaceAll(' ', '_'), revid: page.revid, image, questions, source: 'wikipedia' } }
}

// Ordre du programme : on alterne les thèmes pour que chaque série de suggestions soit variée.
function interleave(cards) {
  const byTheme = {}
  for (const c of cards) (byTheme[c.theme] ??= []).push(c)
  const queues = Object.values(byTheme).map((list) => shuffle(rngFor(list[0].theme), list))
  const out = []
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift())
  return out
}

async function main() {
  log('1/5 Sujets (liste Wikimédia)…')
  const handwrittenTitles = new Set(HANDWRITTEN.map((c) => c.wiki.replaceAll('_', ' ')))
  let topics = await fetchTopics()
  log(`    ${topics.length} sujets`)

  log('2/5 Wikidata (titres, descriptions)…')
  const entities = await fetchEntities(topics.map((t) => t.qid))
  topics = topics.filter((t) => {
    const fr = entities[t.qid]?.sitelinks?.frwiki?.title
    t.frTitle = fr
    return fr && !handwrittenTitles.has(fr)
  })
  log(`    ${topics.length} sujets avec un article en français (hors cartes déjà écrites)`)

  log('3/5 Wikidata (dates, auteurs, pays…)…')
  const claims = await fetchClaims(topics.map((t) => t.qid))

  log('4/5 Wikipédia (introductions et images)…')
  const pages = await fetchPages([...topics.map((t) => t.frTitle), ...handwrittenTitles])

  log('5/5 Crédits des images…')
  const credits = await fetchImageCredits(Object.values(pages).map((p) => p.image?.file).filter(Boolean))

  // Réserves de mauvaises réponses : descriptions et titres par thème et par genre
  // (personne ou notion), valeurs par propriété Wikidata.
  const pools = { groups: {}, themeTeasers: {}, themeTitles: {}, values: {} }
  for (const t of topics) {
    const groupKey = `${t.theme}:${claims[t.qid].P569 ? 'person' : 'thing'}`
    const group = (pools.groups[groupKey] ??= { teasers: [], titles: [] })
    const d = entities[t.qid].descriptions?.fr?.value
    if (d && d.length <= 90) {
      group.teasers.push(capitalize(d))
      ;(pools.themeTeasers[t.theme] ??= []).push(capitalize(d))
    }
    group.titles.push(t.frTitle)
    ;(pools.themeTitles[t.theme] ??= []).push(t.frTitle)
    for (const prop of ENTITY_PROPS) for (const v of claims[t.qid][prop] ?? []) (pools.values[prop] ??= new Set()).add(v)
  }
  pools.values.P30 = CONTINENTS
  for (const group of Object.values(pools.groups)) group.teasers = [...new Set(group.teasers)]

  const cards = []
  const dropped = {}
  for (const t of topics) {
    const page = pages[t.frTitle]
    if (!page) {
      dropped['article introuvable'] = (dropped['article introuvable'] ?? 0) + 1
      continue
    }
    const result = buildCard(t, entities[t.qid], page, claims[t.qid], pools, credits)
    if (result.card) cards.push(result.card)
    else dropped[result.dropped] = (dropped[result.dropped] ?? 0) + 1
  }

  const handwrittenImages = {}
  for (const c of HANDWRITTEN) {
    const img = pages[c.wiki.replaceAll('_', ' ')]?.image
    if (img) handwrittenImages[c.id] = { ...img, ...(credits[img.file] ?? { author: 'Auteur inconnu', license: 'voir Wikimedia Commons' }) }
  }

  const ordered = interleave(cards)
  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(
    OUTPUT,
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), cards: ordered, images: handwrittenImages }, null, 1),
  )

  const perTheme = {}
  for (const c of ordered) perTheme[c.theme] = (perTheme[c.theme] ?? 0) + 1
  log(`\n✓ ${ordered.length} cartes générées → src/data/generated/wiki.json`)
  log(`  par thème : ${Object.entries(perTheme).map(([k, v]) => `${k} ${v}`).join(', ')}`)
  log(`  avec image : ${ordered.filter((c) => c.image).length} ; images des cartes écrites : ${Object.keys(handwrittenImages).length}/${HANDWRITTEN.length}`)
  log(`  écartées : ${Object.entries(dropped).map(([k, v]) => `${k} ${v}`).join(', ') || 'aucune'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
