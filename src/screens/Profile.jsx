import { LEVELS } from '../data/levels.js'
import { addDays, weekdayInitial } from '../lib/dates.js'
import { currentStreak } from '../lib/progress.js'
import { strength } from '../lib/srs.js'

export default function Profile({ progress, today, onReset }) {
  const learned = Object.values(progress.cards)
  const buckets = [1, 2, 3].map((level) => learned.filter((s) => strength(s.box).level === level).length)
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const levelsDone = Object.keys(progress.completedLevels).length

  const stats = [
    { label: 'Série actuelle', value: currentStreak(progress.streak, today), unit: 'j' },
    { label: 'Meilleure série', value: progress.streak.best, unit: 'j' },
    { label: 'Expérience', value: progress.xp, unit: 'XP' },
    { label: 'Cartes apprises', value: learned.length },
    { label: 'Niveaux validés', value: levelsDone, unit: `/ ${LEVELS.length}` },
    { label: 'Cartes ancrées', value: buckets[2] },
  ]

  const reset = () => {
    if (window.confirm('Effacer toute ta progression ? Cette action est définitive.')) onReset()
  }

  return (
    <div className="screen">
      <header className="page-head">
        <h1 className="display">Moi</h1>
        <p className="muted">Un peu chaque jour, c’est ce qui fait la différence.</p>
      </header>

      <section className="week" aria-label="Activité des 7 derniers jours">
        {week.map((day) => {
          const d = progress.days[day]
          const active = d && (d.cards > 0 || d.reviews > 0)
          return (
            <div key={day} className={`week-day ${active ? 'active' : ''} ${day === today ? 'today' : ''}`}>
              <span className="week-dot" />
              <span className="week-label">{weekdayInitial(day)}</span>
            </div>
          )
        })}
      </section>

      <div className="stat-grid">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <span className="stat-value">{s.value}{s.unit && <small> {s.unit}</small>}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {learned.length > 0 && (
        <section className="list-section">
          <h2 className="section-title">Ta mémoire</h2>
          <div className="memory-bar" role="img"
            aria-label={`${buckets[0]} fragiles, ${buckets[1]} en progrès, ${buckets[2]} ancrées`}>
            {buckets.map((n, i) => n > 0 && <span key={i} className={`s${i + 1}`} style={{ flex: n }} />)}
          </div>
          <div className="memory-legend">
            <span><i className="s1" /> Fragiles {buckets[0]}</span>
            <span><i className="s2" /> En progrès {buckets[1]}</span>
            <span><i className="s3" /> Ancrées {buckets[2]}</span>
          </div>
        </section>
      )}

      <section className="list-section about">
        <h2 className="section-title">Sources</h2>
        <p className="muted">
          Textes : Wikipédia (CC BY-SA 4.0). Images : Wikimedia Commons, auteur et licence sous chaque image.
          Faits et dates : Wikidata (CC0). Les 30 premières cartes sont rédigées pour Be Better.
          Ta progression reste uniquement sur cet appareil.
        </p>
        <button className="btn btn-danger" onClick={reset}>Réinitialiser ma progression</button>
      </section>
    </div>
  )
}
