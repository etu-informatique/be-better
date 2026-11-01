// Toutes les cartes, dans l'ordre du programme : d'abord les cartes rédigées à la main,
// puis celles générées depuis Wikipédia et Wikidata (npm run generate-cards).
import { HANDWRITTEN_CARDS } from './handwritten.js'
import wiki from './generated/wiki.json'

export const CARDS = [
  ...HANDWRITTEN_CARDS.map((c) => ({ ...c, image: wiki.images[c.id] ?? null, source: 'handwritten' })),
  ...wiki.cards,
]

export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]))

export const wikiUrl = (card) => `https://fr.wikipedia.org/wiki/${encodeURIComponent(card.wiki)}`

export const imageCreditUrl = (image) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(image.file)}`
