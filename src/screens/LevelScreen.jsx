import { CARD_BY_ID, deckFor } from '../data/cards.js'
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

// Chaque niveau a son propre paquet de cartes ; une fois le niveau validé, seule la carte choisie reste.
export default function LevelScreen({ level, progress, onOpenCard, onBack }) {
  const done = progress.completedLevels[level.id]
  const cards = (done ? [done.cardId] : deckFor(level)).map((id) => CARD_BY_ID[id])

  return (
    <div className="screen screen-level">
      <TopBar title={`Niveau ${level.number}`} onBack={onBack} />

      <header className="level-head">
        <h1 className="display">{done ? 'Ta carte de ce niveau' : 'Choisis ta carte'}</h1>
        <p className="muted">
          {done ? 'Niveau validé. Tu peux relire la carte ou refaire son quiz.' : 'Fais défiler et ouvre celle qui te plaît.'}
        </p>
      </header>

      <div className="deck">
        {cards.map((card) => <DeckCard key={card.id} card={card} onOpen={onOpenCard} />)}
      </div>
    </div>
  )
}
