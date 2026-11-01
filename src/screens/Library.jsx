import { useState } from 'react'
import { CARDS } from '../data/cards.js'
import { THEMES, THEME_LIST } from '../data/themes.js'
import { strength } from '../lib/srs.js'
import CardRow from '../components/CardRow.jsx'
import { BackIcon } from '../components/Icons.jsx'

export default function Library({ progress, onOpenCard }) {
  const [themeId, setThemeId] = useState(null)
  const [view, setView] = useState('themes')
  const learned = CARDS.filter((c) => progress.cards[c.id])
  const favorites = CARDS.filter((c) => progress.favorites[c.id])
  const row = (c) => (
    <CardRow key={c.id} card={c} favorite={progress.favorites[c.id]}
      badge={progress.cards[c.id] && strength(progress.cards[c.id].box)} onOpen={() => onOpenCard(c.id)} />
  )

  if (themeId) {
    const theme = THEMES[themeId]
    const all = CARDS.filter((c) => c.theme === themeId)
    const mine = all.filter((c) => progress.cards[c.id])
    return (
      <div className="screen">
        <button className="back-link" onClick={() => setThemeId(null)}><BackIcon size={18} /> Tous les thèmes</button>
        <header className="page-head">
          <h1 className="display">{theme.name}</h1>
          <p className="muted">{mine.length} carte{mine.length > 1 ? 's' : ''} apprise{mine.length > 1 ? 's' : ''} · {all.length - mine.length} à découvrir dans le parcours</p>
        </header>
        {mine.length ? <ul className="card-list">{mine.map(row)}</ul> : <p className="empty">Aucune carte apprise dans ce thème pour l’instant.</p>}
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="page-head">
        <h1 className="display">Bibliothèque</h1>
        <p className="muted">{learned.length} carte{learned.length > 1 ? 's' : ''} apprise{learned.length > 1 ? 's' : ''} sur {CARDS.length}</p>
      </header>

      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={view === 'themes'} className={view === 'themes' ? 'active' : ''} onClick={() => setView('themes')}>
          Thèmes
        </button>
        <button role="tab" aria-selected={view === 'favorites'} className={view === 'favorites' ? 'active' : ''} onClick={() => setView('favorites')}>
          Favoris ({favorites.length})
        </button>
      </div>

      {view === 'themes' ? (
        <div className="theme-grid">
          {THEME_LIST.map((theme) => {
            const all = CARDS.filter((c) => c.theme === theme.id)
            const count = all.filter((c) => progress.cards[c.id]).length
            return (
              <button key={theme.id} className="theme-tile" style={{ '--c': theme.color }} onClick={() => setThemeId(theme.id)}>
                <span className="tile-name">{theme.name}</span>
                <span className="tile-count">{count} / {all.length}</span>
                <span className="tile-bar"><span style={{ width: `${all.length ? (count / all.length) * 100 : 0}%` }} /></span>
              </button>
            )
          })}
        </div>
      ) : favorites.length ? (
        <ul className="card-list">{favorites.map(row)}</ul>
      ) : (
        <p className="empty">Touche l’étoile d’une carte pour la retrouver ici.</p>
      )}
    </div>
  )
}
