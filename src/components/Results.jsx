import { CARD_BY_ID } from '../data/cards.js'
import { CheckIcon, CloseIcon } from './Icons.jsx'

export default function Results({ eyebrow, title, message, results, xp, showCards = true, children }) {
  const score = results.filter((r) => r.correct).length
  return (
    <div className="results">
      <div className="results-hero">
        <p className="eyebrow">{eyebrow}</p>
        <p className="results-score">{score}<span> / {results.length}</span></p>
        <h2>{title}</h2>
        <p className="muted">{message}</p>
        {xp > 0 && <p className="xp-line">+{xp} points d’expérience</p>}
      </div>

      {showCards && (
        <ul className="results-list">
          {results.map((r, i) => (
            <li key={i} className={r.correct ? 'good' : 'bad'}>
              {r.correct ? <CheckIcon size={18} /> : <CloseIcon size={18} />}
              <span>{CARD_BY_ID[r.cardId].title}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="results-actions">{children}</div>
    </div>
  )
}
