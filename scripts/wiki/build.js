// Fabrication d'une carte (texte, points à retenir, questions) à partir des données récupérées.
import { capitalize, cleanExtract, rngFor, sentences, shortSummary } from './lib.js'
import {
  FACT_PROPERTIES, descriptionQuestion, descriptionTrueFalseQuestion, factQuestion, termBlankQuestion,
  titleFromDescriptionQuestion, yearBlankQuestion, yearSpots, yearTrueFalseQuestion,
} from './questions.js'

export const DATE_PROPS = ['P569', 'P570', 'P571', 'P585', 'P580', 'P582']
export const LABEL_PROPS = Object.keys(FACT_PROPERTIES)
// Liens entre sujets : influences, maîtres et élèves, parties d'un tout, auteurs, lieux, mouvements…
export const LINK_PROPS = [
  'P737', 'P1066', 'P802', 'P361', 'P527', 'P50', 'P170', 'P86', 'P84', 'P57', 'P61', 'P138',
  'P17', 'P36', 'P30', 'P19', 'P20', 'P27', 'P135', 'P140', 'P101', 'P800', 'P279', 'P1269',
]
// Wikidata connaît aussi « Eurasie » ou « Amériques » : on s'en tient aux continents classiques,
// pour qu'un leurre ne soit jamais une autre bonne réponse.
export const CONTINENTS = new Set(['Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Antarctique', 'Asie', 'Europe', 'Océanie'])

// Les dates SPARQL suivent la numérotation astronomique (l'an 0 existe) : « -0469 » = 470 av. J.-C.
const yearOf = (iso) => {
  const m = iso?.match(/^([+-]?)(\d+)-/)
  if (!m) return null
  return m[1] === '-' ? -(Number(m[2]) + 1) : Number(m[2])
}
const formatYear = (y) => (y < 0 ? `${-y} av. J.-C.` : String(y))

// Repère dans le temps, pour la frise : la vie d'une personne, la durée d'un événement, ou une date.
export function whenOf(claims) {
  const birth = yearOf(claims.P569?.[0])
  if (birth != null) {
    const death = yearOf(claims.P570?.[0])
    return death != null ? { from: birth, to: death } : { from: birth }
  }
  const start = yearOf(claims.P580?.[0])
  if (start != null) {
    const end = yearOf(claims.P582?.[0])
    return end != null ? { from: start, to: end } : { from: start }
  }
  const date = yearOf(claims.P585?.[0] ?? claims.P571?.[0])
  return date != null ? { from: date } : null
}

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
  for (const prop of LABEL_PROPS) {
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

export const groupKey = (theme, claims) => `${theme}:${claims.P569 ? 'person' : 'thing'}`

export function buildCard(topic, entity, page, claims, pools, credits) {
  const title = page.title
  const summary = shortSummary(cleanExtract(page.extract))
  if (summary.join(' ').length < 160) return { dropped: 'texte trop court' }
  const description = entity.description
  const firstSentence = sentences(summary[0])[0]
  const teaser = description ? capitalize(description) : firstSentence.length <= 110 ? firstSentence : null
  if (!teaser) return { dropped: 'pas de description' }

  const rng = rngFor(topic.qid)
  // Les rubriques « langues » mélangent langues et œuvres : une œuvre a un auteur.
  const theme = topic.theme === 'langues' && claims.P50 ? 'litterature' : topic.theme
  const card = { id: `wd-${topic.qid}`, qid: topic.qid, theme, title, teaser, summary }
  const { facts, factValues, birth } = buildFacts(claims, theme)

  const spots = yearSpots(summary)
  const distinctSpots = spots.filter((s, i) => spots.findIndex((o) => o.year === s.year) === i)
  // Leurres du même genre (une personne contre des personnes, une notion contre des notions)
  const group = pools.groups[groupKey(topic.theme, claims)]
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

  return {
    card: {
      ...card,
      facts,
      related: [],
      wiki: title.replaceAll(' ', '_'),
      revid: page.revid,
      image: imageWithCredit(page.image, credits),
      when: whenOf(claims),
      coords: claims.coords ?? null,
      questions,
      source: 'wikipedia',
    },
  }
}

export const imageWithCredit = (image, credits) =>
  image ? { ...image, ...(credits[image.file] ?? { author: 'Auteur inconnu', license: 'voir Wikimedia Commons' }) } : null
