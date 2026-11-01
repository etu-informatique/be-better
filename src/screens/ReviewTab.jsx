import { CARD_BY_ID } from '../data/cards.js'
import { relativeDay } from '../lib/dates.js'
import { INTERVALS, strength } from '../lib/srs.js'
import CardRow from '../components/CardRow.jsx'

export default function ReviewTab({ progress, today, due, onStart, onOpenCard }) {
  const learned = Object.entries(progress.cards)
  const upcoming = learned.filter(([, s]) => s.due > today).sort((a, b) => a[1].due.localeCompare(b[1].due))

  return (
    <div className="screen">
      <header className="page-head">
        <h1 className="display">Révisions</h1>
        <p className="muted">
          Chaque carte revient au moment où tu allais l’oublier : après {INTERVALS.slice(0, 4).join(', ')} jours, puis de plus en plus rarement.
        </p>
      </header>

      {learned.length === 0 ? (
        <p className="empty">Valide ton premier niveau : sa carte apparaîtra ici dès demain.</p>
      ) : due.length > 0 ? (
        <section className="review-hero">
          <p className="review-count">{due.length}</p>
          <p>carte{due.length > 1 ? 's' : ''} à réviser aujourd’hui</p>
          <button className="btn btn-primary btn-block" onClick={onStart}>Commencer la révision</button>
        </section>
      ) : (
        <p className="empty">Tout est à jour. Prochaine révision {upcoming[0] ? relativeDay(upcoming[0][1].due, today) : 'bientôt'}.</p>
      )}

      {upcoming.length > 0 && (
        <section className="list-section">
          <h2 className="section-title">À venir</h2>
          <ul className="card-list">
            {upcoming.map(([id, s]) => (
              <CardRow key={id} card={CARD_BY_ID[id]} sub={relativeDay(s.due, today)} badge={strength(s.box)}
                onOpen={() => onOpenCard(id)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
