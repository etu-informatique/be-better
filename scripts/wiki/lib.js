// Outils partagés par le générateur : requêtes HTTP avec cache disque, hasard déterministe, texte.
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const CACHE_DIR = join(here, '.cache')
const USER_AGENT = 'BeBetter/0.1 (application educative gratuite; generation de cartes de culture generale)'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// GET ou POST JSON, avec cache disque (les relances sont instantanées) et quelques tentatives.
export async function fetchJson(url, { body, cache = true } = {}) {
  const key = createHash('sha1').update(url + (body ?? '')).digest('hex')
  const file = join(CACHE_DIR, `${key}.json`)
  if (cache) {
    try {
      return JSON.parse(await readFile(file, 'utf8'))
    } catch {
      // pas encore en cache
    }
  }
  for (let attempt = 1; ; attempt++) {
    await politeDelay()
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json, application/sparql-results+json',
        ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body,
    })
    if (res.ok) {
      const json = await res.json()
      await mkdir(CACHE_DIR, { recursive: true })
      await writeFile(file, JSON.stringify(json))
      return json
    }
    if (attempt >= 8 || (res.status < 500 && res.status !== 429)) {
      throw new Error(`HTTP ${res.status} pour ${url.slice(0, 120)}`)
    }
    const retryAfter = Number(res.headers.get('retry-after'))
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 3000 * attempt
    console.log(`    serveur occupé (${res.status}), nouvel essai dans ${Math.round(wait / 1000)} s…`)
    await sleep(wait)
  }
}

// Une requête à la fois, espacées d'au moins une seconde : les API Wikimédia sont gratuites, restons polis.
let lastRequest = 0
async function politeDelay() {
  const wait = lastRequest + 1000 - Date.now()
  if (wait > 0) await sleep(wait)
  lastRequest = Date.now()
}

export const chunk = (list, size) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size))

// Générateur pseudo-aléatoire déterministe : le même sujet produit toujours les mêmes questions.
export function rngFor(seed) {
  let h = 2166136261
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const pick = (rng, list) => list[Math.floor(rng() * list.length)]

export function shuffle(rng, list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

export const stripHtml = (s) =>
  (s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, '’')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// Nettoie l'introduction Wikipédia en texte brut (restes de modèles, prononciations…).
export function cleanExtract(text) {
  return text
    .replace(/\[[^\]]*\]/g, '')
    // parenthèses en écriture non latine ou en alphabet phonétique (« en russe : Пушкин, /ˈpuʂkʲɪn/ »)
    .replace(/\s*\([^()]*[^\u0000-ɏ -⁯€ «»’ᵉʳ][^()]*\)/gu, '')
    // prononciations entre barres obliques : « (/futbol/) »
    .replace(/\s*\(\s*\/[^)]*\/\s*\)/g, '')
    // mots isolés en caractères chinois, japonais ou coréens
    .replace(/\s*[　-ヿ㐀-鿿가-힯豈-﫿]+/gu, '')
    .replace(/\(\s*(?:[,;:–-]\s*)*\)/g, '')
    .replace(/\(\s*[,;]\s*/g, '(')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// Découpe en phrases (suffisant pour du texte encyclopédique français), sans couper après
// une abréviation comme « av. J.-C. » ou « M. ».
const ABBREVIATION = /(?:\b(?:av|apr|J\.-C|env|cf|M|Mme|Mgr|Dr|St|Ste|vol|p|n°|art|ca|etc)|\b[A-Z])\.$/u
export function sentences(text) {
  const out = []
  for (const piece of text.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«“"(])/u)) {
    if (out.length && ABBREVIATION.test(out[out.length - 1])) out[out.length - 1] += ' ' + piece
    else out.push(piece)
  }
  return out
}

// Garde les premiers paragraphes, dans une limite de longueur, en coupant entre deux phrases.
export function shortSummary(extract, maxChars = 700) {
  const paragraphs = extract.split('\n').map((p) => p.trim()).filter((p) => p.length > 40)
  const out = []
  let total = 0
  for (const p of paragraphs) {
    if (total + p.length <= maxChars) {
      out.push(p)
      total += p.length
      continue
    }
    if (out.length === 0 || total < maxChars * 0.5) {
      let kept = ''
      for (const s of sentences(p)) {
        if (total + kept.length + s.length > maxChars && kept) break
        kept += (kept ? ' ' : '') + s
      }
      if (kept) out.push(kept)
    }
    break
  }
  return out
}
