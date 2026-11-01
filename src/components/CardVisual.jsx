import { THEMES } from '../data/themes.js'

// Fond d'une carte : l'image de l'article Wikipédia, ou à défaut la couleur du thème
// avec l'initiale du sujet en grand.
export default function CardVisual({ card, className = '', eager = false }) {
  const theme = THEMES[card.theme]
  return (
    <div className={`card-visual ${className}`} style={{ '--c': theme.color }}>
      {card.image ? (
        <img src={card.image.src} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" />
      ) : (
        <span className="card-initial" aria-hidden="true">{card.title.charAt(0)}</span>
      )}
    </div>
  )
}
