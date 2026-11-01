import { useEffect, useState } from 'react'
import { CARD_BY_ID } from './data/cards.js'
import { LEVEL_BY_ID } from './data/levels.js'
import { todayKey } from './lib/dates.js'
import { useProgress } from './lib/progress.js'
import { dueCardIds } from './lib/srs.js'
import TabBar from './components/TabBar.jsx'
import Roadmap from './screens/Roadmap.jsx'
import LevelScreen from './screens/LevelScreen.jsx'
import CardDetail from './screens/CardDetail.jsx'
import LevelQuiz from './screens/LevelQuiz.jsx'
import ReviewTab from './screens/ReviewTab.jsx'
import ReviewSession from './screens/ReviewSession.jsx'
import Library from './screens/Library.jsx'
import Profile from './screens/Profile.jsx'

export default function App() {
  const [progress, actions] = useProgress()
  const [tab, setTab] = useState('path')
  // Pile d'écrans au-dessus des onglets. Synchronisée avec l'historique du navigateur
  // pour que le bouton « retour » du téléphone fonctionne.
  const [stack, setStack] = useState([{ name: 'home' }])
  const route = stack[stack.length - 1]
  const today = todayKey()
  const due = dueCardIds(progress.cards, today)

  useEffect(() => {
    history.replaceState({ depth: 0 }, '')
    const onPop = (e) => setStack((s) => s.slice(0, (e.state?.depth ?? 0) + 1))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (route.name !== 'home' || tab !== 'path') window.scrollTo(0, 0)
  }, [route, tab])

  const push = (next) => {
    history.pushState({ depth: stack.length }, '')
    setStack((s) => [...s, next])
  }
  const back = () => history.back()
  const home = () => history.go(-(stack.length - 1))

  const openCard = (cardId) => push({ name: 'card', cardId, mode: 'browse' })

  let screen
  switch (route.name) {
    case 'level':
      screen = (
        <LevelScreen
          level={LEVEL_BY_ID[route.levelId]}
          progress={progress}
          onOpenCard={(cardId) => push({ name: 'card', cardId, mode: 'learn', levelId: route.levelId })}
          onBack={back}
        />
      )
      break
    case 'card':
      screen = (
        <CardDetail
          key={route.cardId}
          card={CARD_BY_ID[route.cardId]}
          mode={route.mode}
          progress={progress}
          onStartQuiz={() => {
            actions.markRead(route.cardId)
            push({ name: 'quiz', levelId: route.levelId, cardId: route.cardId })
          }}
          onBack={back}
          onOpenCard={openCard}
          onToggleFavorite={actions.toggleFavorite}
        />
      )
      break
    case 'quiz':
      screen = (
        <LevelQuiz level={LEVEL_BY_ID[route.levelId]} card={CARD_BY_ID[route.cardId]} progress={progress}
          actions={actions} onBack={back} onHome={home} />
      )
      break
    case 'review':
      screen = <ReviewSession due={due} actions={actions} onBack={back} />
      break
    default:
      screen = (
        <>
          {tab === 'path' && (
            <Roadmap
              progress={progress}
              today={today}
              dueCount={due.length}
              onOpenLevel={(levelId) => push({ name: 'level', levelId })}
              onOpenReview={() => push({ name: 'review' })}
            />
          )}
          {tab === 'review' && (
            <ReviewTab progress={progress} today={today} due={due} onStart={() => push({ name: 'review' })} onOpenCard={openCard} />
          )}
          {tab === 'library' && <Library progress={progress} onOpenCard={openCard} />}
          {tab === 'me' && <Profile progress={progress} today={today} onReset={actions.reset} />}
          <TabBar tab={tab} onChange={setTab} dueCount={due.length} />
        </>
      )
  }

  return <div className={`app ${route.name === 'home' ? 'with-tabs' : ''}`}>{screen}</div>
}
