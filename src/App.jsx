import { useEffect, useState } from 'react'
import { ensureLevels, getCard, getLevels, isLevelLoaded, useContentVersion } from './data/content.js'
import { todayKey } from './lib/dates.js'
import { currentLevelNumber, useProgress } from './lib/progress.js'
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

function Splash({ error, onRetry }) {
  return (
    <div className="splash">
      <span className="wordmark">Be Better</span>
      {error ? (
        <>
          <p className="muted">Impossible de charger les cartes. Vérifie ta connexion.</p>
          <button className="btn btn-primary" onClick={onRetry}>Réessayer</button>
        </>
      ) : (
        <p className="muted">Chargement des cartes…</p>
      )}
    </div>
  )
}

export default function App() {
  const [progress, actions] = useProgress()
  useContentVersion()
  const [tab, setTab] = useState('path')
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  // Pile d'écrans au-dessus des onglets. Synchronisée avec l'historique du navigateur
  // pour que le bouton « retour » du téléphone fonctionne.
  const [stack, setStack] = useState([{ name: 'home' }])
  const route = stack[stack.length - 1]
  const today = todayKey()
  const current = currentLevelNumber(progress)
  const levels = getLevels()

  // On charge les niveaux jusqu'au suivant du niveau en cours : toutes les cartes apprises y sont.
  useEffect(() => {
    setLoadError(null)
    ensureLevels(current + 1).catch((e) => setLoadError(e.message))
  }, [current, attempt])

  useEffect(() => {
    history.replaceState({ depth: 0 }, '')
    const onPop = (e) => setStack((s) => s.slice(0, (e.state?.depth ?? 0) + 1))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (route.name !== 'home' || tab !== 'path') window.scrollTo(0, 0)
  }, [route, tab])

  const ready = levels && isLevelLoaded(Math.min(current, levels.levels.length))
  if (!ready) return <Splash error={loadError} onRetry={() => setAttempt((a) => a + 1)} />

  const due = dueCardIds(progress.cards, today).filter(getCard)

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
          level={levels.byId[route.levelId]}
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
          card={getCard(route.cardId)}
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
        <LevelQuiz level={levels.byId[route.levelId]} card={getCard(route.cardId)} progress={progress}
          actions={actions} onBack={back} onHome={home} />
      )
      break
    case 'review':
      screen = <ReviewSession due={due} progress={progress} actions={actions} onBack={back} />
      break
    default:
      screen = (
        <>
          {tab === 'path' && (
            <Roadmap
              levels={levels}
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
          {tab === 'me' && <Profile levels={levels} progress={progress} today={today} actions={actions} />}
          <TabBar tab={tab} onChange={setTab} dueCount={due.length} />
        </>
      )
  }

  return <div className={`app ${route.name === 'home' ? 'with-tabs' : ''}`}>{screen}</div>
}
