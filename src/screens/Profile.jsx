import { useRef, useState } from 'react'
import { addDays, weekdayInitial } from '../lib/dates.js'
import { currentStreak, exportProgress, parseImport } from '../lib/progress.js'
import { strength } from '../lib/srs.js'
import { DownloadIcon, UploadIcon } from '../components/Icons.jsx'

// Sauvegarde dans un fichier, et restauration (sur un autre téléphone, après avoir vidé le navigateur…).
function Backup({ progress, today, onRestore }) {
  const input = useRef(null)
  const [status, setStatus] = useState(null)

  const download = () => {
    const blob = new Blob([exportProgress(progress)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `be-better-progression-${today}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus('Sauvegarde téléchargée. Garde ce fichier en lieu sûr.')
  }

  const restore = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const data = parseImport(await file.text())
      const levels = Object.keys(data.completedLevels).length
      if (!window.confirm(`Remplacer ta progression actuelle par cette sauvegarde (${levels} niveau${levels > 1 ? 'x' : ''} validé${levels > 1 ? 's' : ''}) ?`)) return
      onRestore(data)
      setStatus('Progression restaurée.')
    } catch (err) {
      setStatus(err instanceof SyntaxError ? 'Ce fichier est illisible.' : err.message)
    }
  }

  return (
    <section className="list-section">
      <h2 className="section-title">Sauvegarde</h2>
      <p className="muted">Ta progression reste sur cet appareil. Télécharge-la de temps en temps pour ne rien perdre, ou pour la retrouver sur un autre téléphone.</p>
      <div className="backup">
        <button className="btn btn-ghost" onClick={download}><DownloadIcon size={16} /> Télécharger</button>
        <button className="btn btn-ghost" onClick={() => input.current?.click()}><UploadIcon size={16} /> Restaurer</button>
        <input ref={input} type="file" accept="application/json,.json" hidden onChange={restore} />
      </div>
      {status && <p className="backup-status muted" role="status">{status}</p>}
    </section>
  )
}

export default function Profile({ levels, progress, today, actions }) {
  const learned = Object.values(progress.cards)
  const buckets = [1, 2, 3].map((level) => learned.filter((s) => strength(s.box).level === level).length)
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const levelsDone = Object.keys(progress.completedLevels).length

  const stats = [
    { label: 'Série actuelle', value: currentStreak(progress.streak, today), unit: 'j' },
    { label: 'Meilleure série', value: progress.streak.best, unit: 'j' },
    { label: 'Expérience', value: progress.xp, unit: 'XP' },
    { label: 'Cartes apprises', value: learned.length },
    { label: 'Niveaux validés', value: levelsDone, unit: `/ ${levels.levels.length}` },
    { label: 'Cartes ancrées', value: buckets[2] },
  ]

  const reset = () => {
    if (window.confirm('Effacer toute ta progression ? Cette action est définitive.')) actions.reset()
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

      <Backup progress={progress} today={today} onRestore={actions.replace} />

      <section className="list-section about">
        <h2 className="section-title">Sources</h2>
        <p className="muted">
          Textes : Wikipédia (CC BY-SA 4.0). Images : Wikimedia Commons, auteur et licence sous chaque image.
          Faits, dates et lieux : Wikidata (CC0). Fond de carte : Natural Earth (domaine public).
          Les 30 premières cartes sont rédigées pour Be Better.
          Ta progression reste uniquement sur cet appareil.
        </p>
        <button className="btn btn-danger" onClick={reset}>Réinitialiser ma progression</button>
      </section>
    </div>
  )
}
