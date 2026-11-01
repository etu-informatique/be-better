import { useState } from 'react'
import ThemeLabel from './ThemeLabel.jsx'
import { CheckIcon, CloseIcon } from './Icons.jsx'
import { frTypo } from '../lib/typo.js'

function shuffle(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Transforme une question en liste d'options mélangées, chacune sachant si elle est la bonne.
function prepare({ card, question }) {
  const options =
    question.type === 'vf'
      ? [{ text: 'Vrai', correct: question.answer === true }, { text: 'Faux', correct: question.answer === false }]
      : shuffle(question.choices.map((text, i) => ({ text, correct: i === question.answer })))
  return { card, question, options }
}

// items : [{ card, question }] — appelle onFinish([{ cardId, correct }]) à la fin.
export default function Quiz({ items, label, onFinish, onExit }) {
  const [prepared] = useState(() => items.map(prepare))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [results, setResults] = useState([])

  const item = prepared[index]
  const isLast = index === prepared.length - 1
  const answered = picked !== null
  const correct = answered && item.options[picked].correct

  const pick = (i) => {
    if (answered) return
    setPicked(i)
    setResults((r) => [...r, { cardId: item.card.id, correct: item.options[i].correct }])
  }

  const next = () => {
    if (isLast) return onFinish(results)
    setIndex(index + 1)
    setPicked(null)
  }

  return (
    <div className="quiz">
      <header className="quiz-head">
        <button className="icon-btn" onClick={onExit} aria-label="Quitter le quiz"><CloseIcon /></button>
        <div className="quiz-progress" role="progressbar" aria-valuemin={0} aria-valuemax={prepared.length}
          aria-valuenow={index + (answered ? 1 : 0)}>
          <span style={{ width: `${((index + (answered ? 1 : 0)) / prepared.length) * 100}%` }} />
        </div>
        <span className="quiz-count">{index + 1}/{prepared.length}</span>
      </header>

      <div className="quiz-body" key={index}>
        <p className="eyebrow">{label}</p>
        <ThemeLabel themeId={item.card.theme} />
        <h2 className="quiz-question">{frTypo(item.question.q)}</h2>

        <div className={`options ${item.question.type === 'vf' ? 'options-vf' : ''}`}>
          {item.options.map((opt, i) => {
            let state = ''
            if (answered && opt.correct) state = 'is-correct'
            else if (answered && i === picked) state = 'is-wrong'
            else if (answered) state = 'is-dimmed'
            return (
              <button key={opt.text} className={`option ${state}`} onClick={() => pick(i)} disabled={answered}>
                <span>{opt.text}</span>
                {state === 'is-correct' && <CheckIcon size={20} />}
                {state === 'is-wrong' && <CloseIcon size={20} />}
              </button>
            )
          })}
        </div>
      </div>

      {answered && (
        <div className={`feedback ${correct ? 'good' : 'bad'}`} role="status">
          <p className="feedback-title">{correct ? 'Bonne réponse' : 'Pas tout à fait'}</p>
          <p className="feedback-text">{frTypo(item.question.explain)}</p>
          <p className="feedback-source">Carte : {item.card.title}</p>
          <button className="btn btn-primary btn-block" onClick={next} autoFocus>
            {isLast ? 'Voir le résultat' : 'Question suivante'}
          </button>
        </div>
      )}
    </div>
  )
}
