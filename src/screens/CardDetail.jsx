import { getCard, imageCreditUrl, wikiUrl } from '../data/content.js'
import { currentLevelNumber } from '../lib/progress.js'
import { strength } from '../lib/srs.js'
import { frTypo } from '../lib/typo.js'
import { useReadingProof } from '../lib/useReadingProof.js'
import { useSpeech } from '../lib/useSpeech.js'
import TopBar from '../components/TopBar.jsx'
import ThemeLabel from '../components/ThemeLabel.jsx'
import CardVisual from '../components/CardVisual.jsx'
import { CheckIcon, ExternalIcon, LockIcon, SpeakerIcon, StarIcon, StopIcon } from '../components/Icons.jsx'

const blockText = (b) => (b.kind === 'facts' ? b.items.map((f) => f.replace(' : ', ', ')).join('. ') : b.text)

// mode « learn » : lecture dans un niveau, avec preuve de lecture avant le quiz ;
// « browse » : consultation libre depuis la bibliothèque ou les révisions.
export default function CardDetail({ card, mode, progress, onStartQuiz, onBack, onOpenCard, onToggleFavorite }) {
  const learning = mode === 'learn'
  const alreadyRead = Boolean(progress.readCards[card.id])
  const { track, mark, read, total, complete } = useReadingProof(learning && !alreadyRead)
  const speech = useSpeech()
  const unlocked = alreadyRead || complete
  const favorite = Boolean(progress.favorites[card.id])
  const srs = progress.cards[card.id]
  const blocks = [...card.summary.map((text) => ({ kind: 'p', text }))]
  if (card.facts?.length) blocks.push({ kind: 'facts', items: card.facts })
  if (card.why) blocks.push({ kind: 'why', text: card.why })
  // Une carte liée s'ouvre si on l'a lue, ou si son niveau est déjà passé (elle était dans un paquet
  // déjà vu) ; sinon on indique à quel niveau on la découvrira.
  const related = card.related ?? []
  const current = currentLevelNumber(progress)
  const canOpen = (r) => progress.cards[r.id] || progress.readCards[r.id] || (r.level < current && getCard(r.id))

  const listen = () => {
    if (speech.speaking) return speech.stop()
    speech.speak([`${card.title}. ${card.teaser}.`, ...blocks.map(blockText)], (i) => i > 0 && mark(i - 1))
  }

  const isRead = (i) => learning && (unlocked || read.has(i))
  const blockClass = (i) => (isRead(i) ? 'is-read' : '')
  const readMark = (i) => isRead(i) && <CheckIcon size={14} className="read-mark" />

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
        {speech.supported && (
          <button className={`listen ${speech.speaking ? 'on' : ''}`} onClick={listen}>
            {speech.speaking ? <StopIcon size={16} /> : <SpeakerIcon size={16} />}
            {speech.speaking ? 'Arrêter la lecture' : 'Écouter la carte'}
          </button>
        )}

        {blocks.map((b, i) =>
          b.kind === 'p' ? (
            <p key={i} ref={track(i)} className={`card-text ${blockClass(i)}`}>{frTypo(b.text)}</p>
          ) : b.kind === 'facts' ? (
            <section key={i} ref={track(i)} className={`facts ${blockClass(i)}`}>
              <h2 className="block-title">À retenir {readMark(i)}</h2>
              <dl>
                {b.items.map((fact, n) => {
                  // « 14 juillet 1789 : prise de la Bastille » → étiquette + contenu
                  const at = fact.indexOf(' : ')
                  const label = at > 0 ? fact.slice(0, at) : String(n + 1).padStart(2, '0')
                  const value = at > 0 ? fact.slice(at + 3) : fact
                  return (
                    <div key={fact} className="fact">
                      <dt>{label}</dt>
                      <dd>{frTypo(value.charAt(0).toUpperCase() + value.slice(1))}</dd>
                    </div>
                  )
                })}
              </dl>
            </section>
          ) : (
            <section key={i} ref={track(i)} className={`why ${blockClass(i)}`}>
              <h2 className="block-title">Pourquoi c’est important {readMark(i)}</h2>
              <p>{frTypo(b.text)}</p>
            </section>
          ),
        )}

        {related.length > 0 && (
          <section className="related">
            <h2 className="block-title">Voir aussi</h2>
            <div className="related-list">
              {related.map((r) =>
                canOpen(r) ? (
                  <button key={r.id} className="related-chip" onClick={() => onOpenCard(r.id)}>{r.title}</button>
                ) : (
                  <span key={r.id} className="related-chip locked">
                    <LockIcon size={13} /> {r.title}{r.level ? ` · niveau ${r.level}` : ''}
                  </span>
                ),
              )}
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
