// Fabrication de questions sans IA. Règle d'or : la réponse doit se trouver sur la carte
// (dans le texte, la description affichée ou les points à retenir), sinon on ne pose pas la question.
import { capitalize, pick, sentences, shuffle } from './lib.js'

const THIS_YEAR = new Date().getFullYear()
const MONTHS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre'
// Mots qui annoncent une date (« en 1789 », « le 14 juillet 1789 », « vers 1503 »…)
const BEFORE_YEAR = new RegExp(`(?:\\b(?:en|vers|depuis|dès|de|du|des|au|le|à|et|entre|jusqu['’]en|l['’]an|${MONTHS})\\s|[–-]\\s?|\\()$`, 'i')
// Unités qui montrent qu'un nombre n'est pas une année (« 1500 mètres »)
const AFTER_NOT_YEAR = /^\s*(?:km|m\b|mètres|kilomètres|habitants|personnes|espèces|%|kg|tonnes|millions|milliards|°|euros|dollars|ans\b|années|langues|pages|mots|av\.|avant)/i

// Repère les années (de 100 à aujourd'hui) dans une phrase.
function yearsIn(sentence) {
  const found = []
  // (?<!\d\s) écarte les nombres écrits avec une espace des milliers, comme « 1 500 »
  for (const m of sentence.matchAll(/(?<![\d,.])(?<!\d\s)(\d{3,4})(?![\d,])/g)) {
    const year = Number(m[1])
    if (year < 100 || year > THIS_YEAR) continue
    const before = sentence.slice(Math.max(0, m.index - 20), m.index)
    const after = sentence.slice(m.index + m[1].length, m.index + m[1].length + 14)
    if (!BEFORE_YEAR.test(before) || AFTER_NOT_YEAR.test(after)) continue
    found.push({ year, index: m.index })
  }
  return found
}

// Fenêtre de texte lisible autour de la position (les phrases trop longues sont raccourcies).
function windowAround(sentence, index, length) {
  if (sentence.length <= 170) return { text: sentence, start: 0 }
  let start = Math.max(0, index - 90)
  let end = Math.min(sentence.length, index + length + 70)
  if (start > 0) {
    const space = sentence.indexOf(' ', start)
    start = space === -1 ? start : space + 1
  }
  if (end < sentence.length) {
    const space = sentence.lastIndexOf(' ', end)
    end = space > index + length ? space : end
  }
  return { text: (start > 0 ? '… ' : '') + sentence.slice(start, end) + (end < sentence.length ? ' …' : ''), start: start - (start > 0 ? 2 : 0) }
}

function yearDistractors(rng, year) {
  const offsets = [pick(rng, [3, 4, 5, 6, 8, 9]), pick(rng, [11, 14, 17, 22, 26, 30]), pick(rng, [41, 55, 68, 80, 97, 120])]
  return offsets.map((o) => {
    let y = rng() < 0.5 ? year - o : year + o
    if (y > THIS_YEAR) y = year - o
    return y
  })
}

// Toutes les occurrences d'années du résumé, chacune avec sa phrase.
export function yearSpots(summary) {
  const spots = []
  for (const paragraph of summary) {
    for (const s of sentences(paragraph)) {
      for (const { year, index } of yearsIn(s)) spots.push({ sentence: s, year, index })
    }
  }
  return spots
}

export function yearBlankQuestion(rng, spot) {
  const len = String(spot.year).length
  const { text, start } = windowAround(spot.sentence, spot.index, len)
  const at = spot.index - start
  const blanked = text.slice(0, at) + '____' + text.slice(at + len)
  return {
    type: 'qcm',
    kind: 'year-blank',
    q: `Complète : « ${blanked} »`,
    choices: [String(spot.year), ...yearDistractors(rng, spot.year).map(String)],
    answer: 0,
    explain: `Le texte dit : « ${text} »`,
  }
}

export function yearTrueFalseQuestion(rng, spot) {
  const len = String(spot.year).length
  const { text, start } = windowAround(spot.sentence, spot.index, len)
  const at = spot.index - start
  const truth = rng() < 0.5
  const shown = truth ? text : text.slice(0, at) + yearDistractors(rng, spot.year)[0] + text.slice(at + len)
  return {
    type: 'vf',
    kind: 'year-tf',
    q: `Vrai ou faux ? « ${shown} »`,
    answer: truth,
    explain: truth ? 'C’est exactement ce que dit la carte.' : `La bonne date est ${spot.year} : « ${text} »`,
  }
}

// « Le ____ est le processus… » : le sujet est masqué dans la première phrase de la carte.
export function termBlankQuestion(rng, card, otherTitles) {
  const base = card.title.replace(/\s*\(.*\)$/, '')
  if (base.length < 3) return null
  const first = sentences(card.summary[0])[0]
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu')
  const m = first.match(re)
  if (!m) return null
  const { text, start } = windowAround(first, m.index, m[0].length)
  const at = m.index - start
  const after = text.slice(at + m[0].length)
  // Les autres mentions du sujet dans la fenêtre sont masquées aussi.
  const blanked = text.slice(0, at) + '____' + after.replace(new RegExp(re.source, 'giu'), '____')
  const lower = m[0][0] === m[0][0].toLowerCase()
  const shape = (t) => (lower ? t.charAt(0).toLowerCase() + t.slice(1) : t)
  const wrong = shuffle(rng, otherTitles.map((t) => t.replace(/\s*\(.*\)$/, '')).filter((t) => t.toLowerCase() !== base.toLowerCase()))
  const choices = [...new Set([m[0], ...wrong.map(shape)])].slice(0, 4)
  if (choices.length < 4) return null
  return {
    type: 'qcm',
    kind: 'term-blank',
    q: `Complète : « ${blanked} »`,
    choices,
    answer: 0,
    explain: `Le texte dit : « ${text} »`,
  }
}

// « Quel sujet correspond à cette description ? »
export function titleFromDescriptionQuestion(rng, card, otherTitles) {
  const wrong = shuffle(rng, otherTitles.filter((t) => t !== card.title)).slice(0, 3)
  if (wrong.length < 3) return null
  return {
    type: 'qcm',
    kind: 'title-from-description',
    q: `Quel sujet correspond à cette description : « ${card.teaser} » ?`,
    choices: [card.title, ...wrong],
    answer: 0,
    explain: `${card.title} : ${card.teaser.charAt(0).toLowerCase() + card.teaser.slice(1)}.`,
  }
}

export function descriptionQuestion(rng, card, others) {
  const wrong = shuffle(rng, others.filter((d) => d.toLowerCase() !== card.teaser.toLowerCase())).slice(0, 3)
  if (wrong.length < 3) return null
  return {
    type: 'qcm',
    kind: 'description',
    q: `Qu’est-ce qui décrit le mieux : ${card.title} ?`,
    choices: [card.teaser, ...wrong],
    answer: 0,
    explain: `${card.title} : ${card.teaser.toLowerCase().startsWith(card.title.toLowerCase()) ? card.teaser : capitalize(card.teaser)}.`,
  }
}

export function descriptionTrueFalseQuestion(rng, card, others) {
  const truth = rng() < 0.5
  const shown = truth ? card.teaser : pick(rng, others.filter((d) => d.toLowerCase() !== card.teaser.toLowerCase()))
  if (!shown) return null
  return {
    type: 'vf',
    kind: 'description-tf',
    q: `Vrai ou faux ? ${card.title} : ${shown.charAt(0).toLowerCase() + shown.slice(1)}.`,
    answer: truth,
    explain: `${card.title} : ${card.teaser.charAt(0).toLowerCase() + card.teaser.slice(1)}.`,
  }
}

// Formulations des questions tirées de Wikidata, par propriété.
export const FACT_PROPERTIES = {
  P50: { label: 'Auteur', ask: (t) => `Qui est l’auteur de : ${t} ?` },
  P170: { label: 'Auteur', ask: (t) => `Qui est l’auteur de : ${t} ?` },
  P86: { label: 'Compositeur', ask: (t) => `Qui a composé : ${t} ?` },
  P84: { label: 'Architecte', ask: (t) => `Qui est l’architecte de : ${t} ?` },
  P57: { label: 'Réalisation', ask: (t) => `Qui a réalisé : ${t} ?` },
  P61: { label: 'Découverte', ask: (t) => `À qui attribue-t-on : ${t} ?` },
  P36: { label: 'Capitale', ask: (t) => `Quelle est la capitale de ce pays : ${t} ?` },
  P30: { label: 'Continent', ask: (t) => `Sur quel continent se trouve : ${t} ?` },
  P17: { label: 'Pays', ask: (t) => `Dans quel pays se trouve : ${t} ?` },
  P27: { label: 'Pays', ask: (t) => `Quel pays est associé à : ${t} ?` },
}

export function factQuestion(rng, card, prop, value, pool, explainText) {
  const wrong = shuffle(rng, [...pool].filter((v) => v !== value)).slice(0, 3)
  if (wrong.length < 3) return null
  return {
    type: 'qcm',
    kind: `fact-${prop}`,
    q: FACT_PROPERTIES[prop].ask(card.title),
    choices: [value, ...wrong],
    answer: 0,
    explain: explainText,
  }
}
