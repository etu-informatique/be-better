import { useState } from 'react'
import { PASS_SCORE, XP } from '../lib/progress.js'
import Quiz from '../components/Quiz.jsx'
import Results from '../components/Results.jsx'

// Les 3 questions portent toutes sur la carte lue.
export default function LevelQuiz({ level, card, progress, actions, onBack, onHome }) {
  const [attempt, setAttempt] = useState(0)
  const [outcome, setOutcome] = useState(null)
  const items = card.questions.map((question) => ({ card, question }))

  const finish = (results) => {
    const score = results.filter((r) => r.correct).length
    const passed = score >= PASS_SCORE
    const firstTime = !progress.completedLevels[level.id]
    const xp = passed && firstTime ? score * XP.levelCorrect + XP.levelBonus : 0
    if (passed) actions.completeLevel(level, card.id, results, xp)
    setOutcome({ results, score, passed, xp, firstTime })
  }

  if (!outcome) {
    return (
      <div className="screen">
        <Quiz key={attempt} items={items} label={`Niveau ${level.number} · ${card.title}`} onFinish={finish} onExit={onBack} />
      </div>
    )
  }

  const { results, score, passed, xp, firstTime } = outcome
  return (
    <div className="screen">
      {passed ? (
        <Results
          eyebrow={`Niveau ${level.number}`}
          title={score === results.length ? 'Sans faute' : 'Niveau validé'}
          message={
            firstTime
              ? `« ${card.title} » rejoint ta bibliothèque. La carte reviendra en révision demain pour s’ancrer dans ta mémoire.`
              : 'Belle révision : ce niveau était déjà validé.'
          }
          results={results}
          xp={xp}
          showCards={false}
        >
          <button className="btn btn-primary btn-block" onClick={onHome}>Retour au parcours</button>
        </Results>
      ) : (
        <Results
          eyebrow={`Niveau ${level.number}`}
          title="Presque"
          message={`Il faut au moins ${PASS_SCORE} bonnes réponses sur ${results.length}. Relis la carte, puis retente ta chance.`}
          results={results}
          xp={0}
          showCards={false}
        >
          <button className="btn btn-primary btn-block" onClick={onBack}>Relire la carte</button>
          <button className="btn btn-ghost btn-block" onClick={() => { setOutcome(null); setAttempt((a) => a + 1) }}>
            Réessayer le quiz
          </button>
        </Results>
      )}
    </div>
  )
}
