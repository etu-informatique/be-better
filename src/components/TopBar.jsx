import { BackIcon, CloseIcon } from './Icons.jsx'

export default function TopBar({ title, onBack, close = false, right }) {
  return (
    <header className="topbar">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label={close ? 'Fermer' : 'Retour'}>
          {close ? <CloseIcon /> : <BackIcon />}
        </button>
      ) : (
        <span className="icon-btn-spacer" />
      )}
      <h1 className="topbar-title">{title}</h1>
      {right ?? <span className="icon-btn-spacer" />}
    </header>
  )
}
