import { useEffect, useRef } from 'react'
import { getCard } from '../data/content.js'
import { DAILY_GOAL, currentStreak, levelStates } from '../lib/progress.js'
import { BoltIcon, BrainIcon, CheckIcon, FlameIcon, LockIcon } from '../components/Icons.jsx'

// La roadmap se lit de bas en haut : le niveau 1 tout en bas, on monte au fil des niveaux.
export default function Roadmap({ levels, progress, today, dueCount, onOpenLevel, onOpenReview }) {
  const states = levelStates(progress, levels.levels)
  const streak = currentStreak(progress.streak, today)
  const learnedToday = progress.days[today]?.cards ?? 0
  const currentRef = useRef(null)

  // À l'ouverture, on se place directement sur le niveau en cours.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="screen screen-roadmap">
      <header className="home-head">
        <span className="wordmark">Be Better</span>
        <div className="stats-inline">
          <span className={`stat ${streak > 0 ? 'on' : ''}`} title="Jours d’affilée"><FlameIcon size={16} /> {streak}</span>
          <span className="stat" title="Points d’expérience"><BoltIcon size={16} /> {progress.xp}</span>
        </div>
        <div className="today">
          <span className="today-label">Aujourd’hui</span>
          <span className="today-bar"><span style={{ width: `${Math.min(1, learnedToday / DAILY_GOAL) * 100}%` }} /></span>
          <span className="today-count">{Math.min(learnedToday, DAILY_GOAL)} / {DAILY_GOAL}</span>
          {dueCount > 0 && (
            <button className="today-review" onClick={onOpenReview}>
              <BrainIcon size={15} /> {dueCount} à réviser
            </button>
          )}
        </div>
      </header>

      <div className="road">
        <p className="road-end">D’autres niveaux arrivent…</p>
        {[...levels.chapters].reverse().map((chapter) => (
          <section key={chapter.id} className="chapter">
            <ol className="path">
              {[...chapter.levels].reverse().map((level) => {
                const state = states[level.id]
                const done = progress.completedLevels[level.id]
                const side = level.number % 2 ? 'left' : 'right'
                return (
                  <li key={level.id} className={`stop ${state} ${side}`} ref={state === 'current' ? currentRef : undefined}>
                    <button
                      className="node"
                      disabled={state === 'locked'}
                      onClick={() => onOpenLevel(level.id)}
                      aria-label={`Niveau ${level.number}${state === 'done' ? `, validé : ${getCard(done.cardId)?.title}` : state === 'locked' ? ', verrouillé' : ', à faire'}`}
                    >
                      {state === 'done' ? <CheckIcon size={22} /> : state === 'locked' ? <LockIcon size={18} /> : level.number}
                    </button>
                    <span className="stop-label">
                      <span className="stop-number">Niveau {level.number}</span>
                      {state === 'done' && <span className="stop-title">{getCard(done.cardId)?.title}</span>}
                      {state === 'current' && <span className="stop-title">Choisis ta carte</span>}
                    </span>
                  </li>
                )
              })}
            </ol>
            <div className="chapter-mark">
              <span className="eyebrow">Chapitre {chapter.number}</span>
              <h2 className="display">{chapter.title}</h2>
            </div>
          </section>
        ))}
        <p className="road-start">Départ</p>
      </div>
    </div>
  )
}
