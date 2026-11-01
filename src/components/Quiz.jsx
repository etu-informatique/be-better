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

// Prépare l'ordre d'affichage une fois pour toutes (options mélangées).
function prepare(item) {
  const { question } = item
  if (question.type === 'vf') {
    return { ...item, options: [{ text: 'Vrai', correct: question.answer === true }, { text: 'Faux', correct: question.answer === false }] }
  }
  if (question.type === 'order') return { ...item, items: shuffle(question.items) }
  if (question.type === 'match') return { ...item, rights: shuffle(question.pairs.map((p) => p.right)) }
  return { ...item, options: shuffle(question.choices.map((text, i) => ({ text, correct: i === question.answer }))) }
}

function ChoiceQuestion({ item, answered, onAnswer }) {
  const [picked, setPicked] = useState(null)
  const pick = (i) => {
    if (answered) return
    setPicked(i)
    onAnswer(item.options[i].correct)
  }
  return (
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
  )
}

// Chronologie : on touche les sujets dans l'ordre ; toucher à nouveau retire le sujet.
function OrderQuestion({ item, answered, onAnswer }) {
  const [order, setOrder] = useState([])
  const toggle = (text) => {
    if (answered) return
    setOrder((o) => (o.includes(text) ? o.filter((t) => t !== text) : [...o, text]))
  }
  const complete = order.length === item.items.length
  return (
    <>
      <div className="options">
        {item.items.map((text) => {
          const rank = order.indexOf(text)
          const right = answered && item.question.answer[rank] === text
          return (
            <button key={text} className={`option option-rank ${answered ? (right ? 'is-correct' : 'is-wrong') : rank >= 0 ? 'is-picked' : ''}`}
              onClick={() => toggle(text)} disabled={answered}>
              <span className="rank">{rank >= 0 ? rank + 1 : ''}</span>
              <span>{text}</span>
            </button>
          )
        })}
      </div>
      {!answered && (
        <button className="btn btn-primary btn-block validate" disabled={!complete}
          onClick={() => onAnswer(order.every((t, i) => item.question.answer[i] === t))}>
          {complete ? 'Valider l’ordre' : `Touche les sujets dans l’ordre (${order.length} / ${item.items.length})`}
        </button>
      )}
    </>
  )
}

// Associations : on touche un sujet, puis sa description.
function MatchQuestion({ item, answered, onAnswer }) {
  const { pairs } = item.question
  const [links, setLinks] = useState({}) // sujet -> description
  const [selected, setSelected] = useState(null)
  const chooseRight = (right) => {
    if (answered || selected == null) return
    setLinks((l) => {
      const next = Object.fromEntries(Object.entries(l).filter(([, r]) => r !== right))
      next[selected] = right
      return next
    })
    setSelected(null)
  }
  const numberOf = (left) => pairs.findIndex((p) => p.left === left) + 1
  const leftOf = (right) => Object.keys(links).find((l) => links[l] === right)
  const complete = Object.keys(links).length === pairs.length
  const isRight = (left) => pairs.find((p) => p.left === left).right === links[left]
  return (
    <>
      <div className="match">
        <div className="match-col">
          {pairs.map(({ left }) => (
            <button key={left} className={`option ${selected === left ? 'is-picked' : ''} ${answered ? (isRight(left) ? 'is-correct' : 'is-wrong') : ''}`}
              onClick={() => !answered && setSelected(left)} disabled={answered}>
              <span className="rank">{numberOf(left)}</span>
              <span>{left}</span>
            </button>
          ))}
        </div>
        <div className="match-col">
          {item.rights.map((right) => {
            const left = leftOf(right)
            return (
              <button key={right} className={`option option-small ${left ? 'is-linked' : ''}`} onClick={() => chooseRight(right)}
                disabled={answered || selected == null}>
                <span className="rank">{left ? numberOf(left) : ''}</span>
                <span>{right}</span>
              </button>
            )
          })}
        </div>
      </div>
      {!answered && (
        <button className="btn btn-primary btn-block validate" disabled={!complete}
          onClick={() => onAnswer(pairs.every((p) => links[p.left] === p.right))}>
          {complete ? 'Valider' : selected ? 'Touche maintenant sa description' : 'Touche un sujet, puis sa description'}
        </button>
      )}
    </>
  )
}

const VIEWS = { order: OrderQuestion, match: MatchQuestion }

// items : [{ card?, label?, question }] — appelle onFinish([{ cardId, label, correct }]) à la fin.
export default function Quiz({ items, label, onFinish, onExit }) {
  const [prepared] = useState(() => items.map(prepare))
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(null)
  const [results, setResults] = useState([])

  const item = prepared[index]
  const isLast = index === prepared.length - 1
  const answered = correct !== null
  const View = VIEWS[item.question.type] ?? ChoiceQuestion

  const answer = (ok) => {
    setCorrect(ok)
    setResults((r) => [...r, { cardId: item.card?.id ?? null, label: item.card ? undefined : item.label, correct: ok }])
  }

  const next = () => {
    if (isLast) return onFinish(results)
    setIndex(index + 1)
    setCorrect(null)
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
        <p className="eyebrow">{item.card ? label : item.label}</p>
        {item.card && <ThemeLabel themeId={item.card.theme} />}
        <h2 className="quiz-question">{frTypo(item.question.q)}</h2>
        <View item={item} answered={answered} onAnswer={answer} />
      </div>

      {answered && (
        <div className={`feedback ${correct ? 'good' : 'bad'}`} role="status">
          <p className="feedback-title">{correct ? 'Bonne réponse' : 'Pas tout à fait'}</p>
          <p className="feedback-text">{frTypo(item.question.explain)}</p>
          {item.card && <p className="feedback-source">Carte : {item.card.title}</p>}
          <button className="btn btn-primary btn-block" onClick={next} autoFocus>
            {isLast ? 'Voir le résultat' : 'Question suivante'}
          </button>
        </div>
      )}
    </div>
  )
}
