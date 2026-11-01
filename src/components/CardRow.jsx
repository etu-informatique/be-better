import CardVisual from './CardVisual.jsx'
import { StarIcon } from './Icons.jsx'

// Ligne de liste : vignette de la carte, titre, sous-titre, état de mémoire.
export default function CardRow({ card, sub, badge, favorite, onOpen }) {
  return (
    <li>
      <button className="card-row" onClick={onOpen}>
        <CardVisual card={card} className="row-thumb" />
        <span className="row-main">
          <span className="row-title">{card.title}</span>
          <span className="row-sub">{sub ?? card.teaser}</span>
        </span>
        {favorite && <StarIcon size={16} filled className="row-fav" />}
        {badge && <span className={`strength s${badge.level}`}>{badge.label}</span>}
      </button>
    </li>
  )
}
