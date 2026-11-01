// Le contenu (cartes et paquets des niveaux) est publié dans public/content/ par `npm run generate-cards`,
// en fichiers de 25 niveaux. L'app télécharge le sommaire, puis les fichiers jusqu'au niveau en cours :
// les cartes apprises s'y trouvent toutes. Le service worker les garde pour le hors-ligne.
import { useSyncExternalStore } from 'react'
import { buildLevels } from './levels.js'

const BASE = import.meta.env.BASE_URL

const store = {
  manifest: null,
  levels: null,
  cards: new Map(), // id -> carte
  decks: new Map(), // numéro de niveau -> identifiants des cartes du paquet
  levelOfCard: new Map(), // id -> numéro du niveau où la carte est proposée
  requests: new Map(), // fichier -> promesse de chargement
  version: 0,
}
const listeners = new Set()

function changed() {
  store.version += 1
  for (const listener of listeners) listener()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Re-rend le composant appelant quand du contenu arrive.
export const useContentVersion = () => useSyncExternalStore(subscribe, () => store.version)

async function getJson(path) {
  const res = await fetch(`${BASE}content/${path}`)
  if (!res.ok) throw new Error(`Contenu indisponible (${res.status}) : ${path}`)
  return res.json()
}

export async function loadManifest() {
  if (store.manifest) return store.manifest
  store.manifest = await getJson('manifest.json')
  store.levels = buildLevels(store.manifest.levelCount)
  changed()
  return store.manifest
}

function loadChunk(file) {
  if (!store.requests.has(file)) {
    const request = getJson(file).then(({ levels }) => {
      for (const level of levels) {
        store.decks.set(level.number, level.cards.map((c) => c.id))
        for (const card of level.cards) {
          store.cards.set(card.id, card)
          store.levelOfCard.set(card.id, level.number)
        }
      }
      changed()
    })
    request.catch(() => store.requests.delete(file)) // un nouvel essai reste possible
    store.requests.set(file, request)
  }
  return store.requests.get(file)
}

// Charge tous les fichiers nécessaires pour les niveaux 1 à `upTo`.
export async function ensureLevels(upTo) {
  const m = await loadManifest()
  const needed = Math.min(m.chunks.length, Math.ceil(Math.max(1, upTo) / m.levelsPerChunk))
  await Promise.all(m.chunks.slice(0, needed).map(loadChunk))
}

export const isLevelLoaded = (number) => store.decks.has(number)
export const getLevels = () => store.levels
export const getCard = (id) => store.cards.get(id)
export const getDeck = (level) => (store.decks.get(level.number) ?? []).map(getCard).filter(Boolean)
export const levelOfCard = (id) => store.levelOfCard.get(id)
export const themeTotals = () => store.manifest?.perTheme ?? {}

export const wikiUrl = (card) => `https://fr.wikipedia.org/wiki/${encodeURIComponent(card.wiki)}`
export const imageCreditUrl = (image) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.file)}`
