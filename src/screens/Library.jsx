import { lazy, Suspense, useState } from 'react'
import { getCard, themeTotals } from '../data/content.js'
import { THEMES, THEME_LIST } from '../data/themes.js'
import { strength } from '../lib/srs.js'
import CardRow from '../components/CardRow.jsx'
import Timeline from '../components/Timeline.jsx'
import { BackIcon } from '../components/Icons.jsx'

// La carte du monde (et son fond de carte) n'est chargée qu'à l'ouverture de l'onglet.
const WorldMap = lazy(() => import('../components/WorldMap.jsx'))

const VIEWS = [
  { id: 'themes', label: 'Thèmes' },
  { id: 'timeline', label: 'Frise' },
  { id: 'map', label: 'Carte' },
  { id: 'favorites', label: 'Favoris' },
]

export default function Library({ progress, onOpenCard }) {
  const [themeId, setThemeId] = useState(null)
  const [view, setView] = useState('themes')
  const totals = themeTotals()
  const learned = Object.keys(progress.cards).map(getCard).filter(Boolean)
  const favorites = Object.keys(progress.favorites).map(getCard).filter(Boolean)
  const row = (c) => (
    <CardRow key={c.id} card={c} favorite={progress.favorites[c.id]}
      badge={progress.cards[c.id] && strength(progress.cards[c.id].box)} onOpen={() => onOpenCard(c.id)} />
  )

  if (themeId) {
    const mine = learned.filter((c) => c.theme === themeId)
    const left = (totals[themeId] ?? 0) - mine.length
    return (
      <div className="screen">
        <button className="back-link" onClick={() => setThemeId(null)}><BackIcon size={18} /> Tous les thèmes</button>
        <header className="page-head">
          <h1 className="display">{THEMES[themeId].name}</h1>
          <p className="muted">{mine.length} carte{mine.length > 1 ? 's' : ''} apprise{mine.length > 1 ? 's' : ''} · {left} à découvrir dans le parcours</p>
        </header>
        {mine.length ? <ul className="card-list">{mine.map(row)}</ul> : <p className="empty">Aucune carte apprise dans ce thème pour l’instant.</p>}
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="page-head">
        <h1 className="display">Bibliothèque</h1>
        <p className="muted">{learned.length} carte{learned.length > 1 ? 's' : ''} apprise{learned.length > 1 ? 's' : ''}</p>
      </header>

      <div className="segmented" role="tablist">
        {VIEWS.map((v) => (
          <button key={v.id} role="tab" aria-selected={view === v.id} className={view === v.id ? 'active' : ''} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      {view === 'themes' && (
        <div className="theme-grid">
          {THEME_LIST.map((theme) => {
            const total = totals[theme.id] ?? 0
            const count = learned.filter((c) => c.theme === theme.id).length
            return (
              <button key={theme.id} className="theme-tile" style={{ '--c': theme.color }} onClick={() => setThemeId(theme.id)}>
                <span className="tile-name">{theme.name}</span>
                <span className="tile-count">{count} / {total}</span>
                <span className="tile-bar"><span style={{ width: `${total ? (count / total) * 100 : 0}%` }} /></span>
              </button>
            )
          })}
        </div>
      )}
      {view === 'timeline' && <Timeline cards={learned} onOpenCard={onOpenCard} />}
      {view === 'map' && (
        <Suspense fallback={<p className="empty">Chargement de la carte…</p>}>
          <WorldMap cards={learned} onOpenCard={onOpenCard} />
        </Suspense>
      )}
      {view === 'favorites' &&
        (favorites.length ? <ul className="card-list">{favorites.map(row)}</ul> : <p className="empty">Touche l’étoile d’une carte pour la retrouver ici.</p>)}
    </div>
  )
}
