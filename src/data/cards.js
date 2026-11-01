// Toutes les cartes, dans l'ordre du programme : d'abord les cartes rédigées à la main,
// puis celles générées depuis Wikipédia et Wikidata (npm run generate-cards).
import { HANDWRITTEN_CARDS } from './handwritten.js'
import wiki from './generated/wiki.json'
import { DECK_SIZE, LEVELS } from './levels.js'
import { buildDecks } from '../lib/decks.js'

export const CARDS = [
  ...HANDWRITTEN_CARDS.map((c) => ({ ...c, image: wiki.images[c.id] ?? null, source: 'handwritten' })),
  ...wiki.cards,
]

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]))

// Le paquet de cartes proposé à chaque niveau (identifiants), propre à ce niveau.
const decks = buildDecks(CARDS, LEVELS.length, DECK_SIZE)
export const deckFor = (level) => decks[level.number - 1] ?? []

export const wikiUrl = (card) => `https://fr.wikipedia.org/wiki/${encodeURIComponent(card.wiki)}`

export const imageCreditUrl = (image) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.file)}`
