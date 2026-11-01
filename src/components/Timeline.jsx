import CardVisual from './CardVisual.jsx'

const ERAS = [
  { name: 'Préhistoire', until: -3000 },
  { name: 'Antiquité', until: 476 },
  { name: 'Moyen Âge', until: 1492 },
  { name: 'Époque moderne', until: 1789 },
  { name: 'XIXᵉ siècle', until: 1914 },
  { name: 'XXᵉ et XXIᵉ siècles', until: Infinity },
]

const formatYear = (y) => (y < 0 ? `${-y} av. J.-C.` : String(y))
const formatWhen = (w) => (w.to != null && w.to !== w.from ? `${formatYear(w.from)} – ${formatYear(w.to)}` : formatYear(w.from))

// Frise chronologique des cartes apprises : chaque époque, et les sujets qui s'y placent.
export default function Timeline({ cards, onOpenCard }) {
  const dated = cards.filter((c) => c.when).sort((a, b) => a.when.from - b.when.from)
  const undated = cards.length - dated.length
  if (!dated.length) {
    return <p className="empty">Les cartes que tu apprends se placeront ici, de la Préhistoire à aujourd’hui.</p>
  }
  const groups = ERAS.map((era, i) => ({
    ...era,
    cards: dated.filter((c) => c.when.from < era.until && c.when.from >= (ERAS[i - 1]?.until ?? -Infinity)),
  })).filter((g) => g.cards.length)

  return (
    <div className="timeline">
      {groups.map((g) => (
        <section key={g.name} className="era">
          <h2 className="era-name display">{g.name}</h2>
          <ol>
            {g.cards.map((c) => (
              <li key={c.id}>
                <button className="moment" onClick={() => onOpenCard(c.id)}>
                  <span className="moment-year">{formatWhen(c.when)}</span>
                  <span className="moment-main">
                    <span className="moment-title">{c.title}</span>
                    <span className="moment-sub">{c.teaser}</span>
                  </span>
                  <CardVisual card={c} className="row-thumb" />
                </button>
              </li>
            ))}
          </ol>
        </section>
      ))}
      {undated > 0 && <p className="muted timeline-note">{undated} carte{undated > 1 ? 's' : ''} sans date ne figure{undated > 1 ? 'nt' : ''} pas sur la frise.</p>}
    </div>
  )
}
