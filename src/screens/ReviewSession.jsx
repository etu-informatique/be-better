import { useState } from 'react'
import { getCard } from '../data/content.js'
import { buildChallenges } from '../lib/challenges.js'
import { XP } from '../lib/progress.js'
import Quiz from '../components/Quiz.jsx'
import Results from '../components/Results.jsx'

const MAX_PER_SESSION = 10

// En révision, on tire une question au hasard parmi celles de la carte, pour varier les angles.
const pickQuestion = (card) => card.questions[Math.floor(Math.random() * card.questions.length)]

// Les cartes à réviser, puis jusqu'à 2 défis qui mélangent les cartes déjà apprises.
export default function ReviewSession({ due, progress, actions, onBack }) {
  const [items] = useState(() => [
    ...due.slice(0, MAX_PER_SESSION).map((id) => ({ card: getCard(id), question: pickQuestion(getCard(id)) })),
    ...buildChallenges(Object.keys(progress.cards), due.length ? 2 : 3),
  ])
  const [outcome, setOutcome] = useState(null)

  const finish = (results) => {
    const xp = results.filter((r) => r.correct).length * XP.reviewCorrect
    actions.recordReview(results, xp)
    setOutcome({ results, xp })
  }

  if (items.length === 0) {
    return (
      <div className="screen">
        <p className="empty">Rien à réviser pour l’instant.</p>
        <button className="btn btn-primary btn-block" onClick={onBack}>Retour</button>
      </div>
    )
  }

  if (!outcome) {
    return (
      <div className="screen">
        <Quiz items={items} label="Révision" onFinish={finish} onExit={onBack} />
      </div>
    )
  }

  const wrongCards = outcome.results.filter((r) => r.cardId && !r.correct).length
  const allRight = outcome.results.every((r) => r.correct)
  return (
    <div className="screen">
      <Results
        eyebrow="Révision"
        title={allRight ? 'Tout est resté' : 'Révision terminée'}
        message={
          wrongCards === 0
            ? 'Ces cartes reviendront dans plus longtemps : elles s’ancrent.'
            : `${wrongCards} carte${wrongCards > 1 ? 's reviendront' : ' reviendra'} dès demain pour être consolidée${wrongCards > 1 ? 's' : ''}.`
        }
        results={outcome.results}
        xp={outcome.xp}
      >
        <button className="btn btn-primary btn-block" onClick={onBack}>Terminer</button>
      </Results>
    </div>
  )
}
