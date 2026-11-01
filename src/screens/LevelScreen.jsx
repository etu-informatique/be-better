import { useRef, useState } from 'react'
import { CARD_BY_ID } from '../data/cards.js'
import { THEME_LIST } from '../data/themes.js'
import { suggestions } from '../lib/progress.js'
import TopBar from '../components/TopBar.jsx'
import ThemeLabel from '../components/ThemeLabel.jsx'
import CardVisual from '../components/CardVisual.jsx'
import { ArrowIcon } from '../components/Icons.jsx'

function DeckCard({ card, onOpen }) {
  return (
    <button className="deck-card" onClick={() => onOpen(card.id)}>
      <CardVisual card={card} />
      <span className="deck-shade" />
      <span className="deck-top"><ThemeLabel themeId={card.theme} light /></span>
      <span className="deck-bottom">
        <span className="deck-title">{card.title}</span>
        <span className="deck-teaser">{card.teaser}</span>
        <span className="deck-cta">Lire la carte <ArrowIcon size={16} /></span>
      </span>
    </button>
  )
}

export default function LevelScreen({ level, progress, onOpenCard, onBack }) {
  const done = progress.completedLevels[level.id]
  const [themeId, setThemeId] = useState(null)
  const [active, setActive] = useState(0)
  const track = useRef(null)
  const cards = done ? [CARD_BY_ID[done.cardId]] : suggestions(progress, themeId)

  const onScroll = () => {
    const el = track.current
    const first = el?.firstElementChild
    if (first) setActive(Math.round(el.scrollLeft / (first.offsetWidth + 12)))
  }

  const chooseTheme = (id) => {
    setThemeId(id)
    setActive(0)
    track.current?.scrollTo({ left: 0 })
  }

  return (
    <div className="screen screen-level">
      <TopBar title={`Niveau ${level.number}`} onBack={onBack} />

      <header className="level-head">
        <h1 className="display">{done ? 'Ta carte de ce niveau' : 'Choisis ta carte'}</h1>
        <p className="muted">
          {done
            ? 'Niveau validé. Tu peux relire la carte ou refaire son quiz.'
            : 'Fais défiler, ouvre celle qui t’intrigue. Le quiz portera sur elle.'}
        </p>
      </header>

      {!done && (
        <div className="filters" role="tablist" aria-label="Thèmes">
          <button role="tab" aria-selected={!themeId} className={!themeId ? 'active' : ''} onClick={() => chooseTheme(null)}>
            Pour toi
          </button>
          {THEME_LIST.map((t) => (
            <button key={t.id} role="tab" aria-selected={themeId === t.id} className={themeId === t.id ? 'active' : ''}
              style={{ '--c': t.color }} onClick={() => chooseTheme(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      )}

      {cards.length ? (
        <>
          <div className="deck" ref={track} onScroll={onScroll}>
            {cards.map((card) => <DeckCard key={card.id} card={card} onOpen={onOpenCard} />)}
          </div>
          {cards.length > 1 && <p className="deck-count">{Math.min(active + 1, cards.length)} / {cards.length}</p>}
        </>
      ) : (
        <p className="empty">Tu as appris toutes les cartes de ce thème. Choisis-en un autre.</p>
      )}
    </div>
  )
}
