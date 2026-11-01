import { CARD_BY_ID, imageCreditUrl, wikiUrl } from '../data/cards.js'
import { strength } from '../lib/srs.js'
import { frTypo } from '../lib/typo.js'
import { useReadingProof } from '../lib/useReadingProof.js'
import TopBar from '../components/TopBar.jsx'
import ThemeLabel from '../components/ThemeLabel.jsx'
import CardVisual from '../components/CardVisual.jsx'
import { ExternalIcon, StarIcon } from '../components/Icons.jsx'

// mode « learn » : lecture dans un niveau, avec preuve de lecture avant le quiz ;
// « browse » : consultation libre depuis la bibliothèque ou les révisions.
export default function CardDetail({ card, mode, progress, onStartQuiz, onBack, onOpenCard, onToggleFavorite }) {
  const learning = mode === 'learn'
  const alreadyRead = Boolean(progress.readCards[card.id])
  const { track, read, total, complete } = useReadingProof(learning && !alreadyRead)
  const unlocked = alreadyRead || complete
  const favorite = Boolean(progress.favorites[card.id])
  const srs = progress.cards[card.id]
  const blocks = [...card.summary.map((text) => ({ kind: 'p', text }))]
  if (card.facts?.length) blocks.push({ kind: 'facts', items: card.facts })
  if (card.why) blocks.push({ kind: 'why', text: card.why })
  const related = (card.related ?? []).filter((id) => progress.cards[id] || progress.readCards[id])

  const blockClass = (i) => (learning ? `tracked ${unlocked || read.has(i) ? 'is-read' : ''}` : '')

  return (
    <div className="screen screen-card">
      <div className="card-hero">
        <CardVisual card={card} eager />
        <span className="hero-shade" />
        <TopBar
          title=""
          onBack={onBack}
          close={learning}
          right={
            <button className={`icon-btn ${favorite ? 'fav' : ''}`} onClick={() => onToggleFavorite(card.id)}
              aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={favorite}>
              <StarIcon filled={favorite} />
            </button>
          }
        />
        <div className="hero-text">
          <ThemeLabel themeId={card.theme} light />
          <h1 className="hero-title">{card.title}</h1>
          {srs && <span className="hero-strength">Mémoire : {strength(srs.box).label.toLowerCase()}</span>}
        </div>
      </div>
      {card.image && (
        <a className="image-credit" href={imageCreditUrl(card.image)} target="_blank" rel="noreferrer">
          Image : {card.image.author} · {card.image.license} · Wikimedia Commons
        </a>
      )}

      <article className="card-body">
        <p className="card-lead">{frTypo(card.teaser)}</p>

        {blocks.map((b, i) =>
          b.kind === 'p' ? (
            <p key={i} ref={track(i)} className={`card-text ${blockClass(i)}`}>{frTypo(b.text)}</p>
          ) : b.kind === 'facts' ? (
            <section key={i} ref={track(i)} className={`facts ${blockClass(i)}`}>
              <h2>À retenir</h2>
              <ul>{b.items.map((f) => <li key={f}>{frTypo(f)}</li>)}</ul>
            </section>
          ) : (
            <section key={i} ref={track(i)} className={`why ${blockClass(i)}`}>
              <h2>Pourquoi c’est important</h2>
              <p>{frTypo(b.text)}</p>
            </section>
          ),
        )}

        {related.length > 0 && (
          <section className="related">
            <h2>Voir aussi</h2>
            <div className="related-list">
              {related.map((id) => (
                <button key={id} className="related-chip" onClick={() => onOpenCard(id)}>{CARD_BY_ID[id].title}</button>
              ))}
            </div>
          </section>
        )}

        <a className="source-link" href={card.revid ? `${wikiUrl(card)}?oldid=${card.revid}` : wikiUrl(card)} target="_blank" rel="noreferrer">
          {card.source === 'wikipedia'
            ? <>Texte : Wikipédia, « {card.title} », licence CC BY-SA 4.0. Faits : Wikidata.</>
            : <>Pour aller plus loin : l’article Wikipédia</>}
          <ExternalIcon size={14} />
        </a>
      </article>

      {learning && (
        <div className="sticky-cta">
          {!unlocked && (
            <div className="reading-meter" aria-live="polite">
              <span className="reading-bar"><span style={{ width: `${total ? (read.size / total) * 100 : 0}%` }} /></span>
              <span>Lecture {read.size} / {total}</span>
            </div>
          )}
          <button className="btn btn-primary btn-block" disabled={!unlocked} onClick={onStartQuiz}>
            {unlocked ? 'Passer au quiz' : 'Lis chaque partie pour débloquer le quiz'}
          </button>
        </div>
      )}
    </div>
  )
}
