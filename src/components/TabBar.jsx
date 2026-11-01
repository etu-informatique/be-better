import { BookIcon, BrainIcon, MapIcon, UserIcon } from './Icons.jsx'

const TABS = [
  { id: 'path', label: 'Parcours', Icon: MapIcon },
  { id: 'review', label: 'Révisions', Icon: BrainIcon },
  { id: 'library', label: 'Bibliothèque', Icon: BookIcon },
  { id: 'me', label: 'Moi', Icon: UserIcon },
]

export default function TabBar({ tab, onChange, dueCount }) {
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      {TABS.map(({ id, label, Icon }) => (
        <button key={id} className={`tab ${tab === id ? 'active' : ''}`} onClick={() => onChange(id)}
          aria-current={tab === id ? 'page' : undefined}>
          <span className="tab-icon">
            <Icon size={22} />
            {id === 'review' && dueCount > 0 && <span className="badge">{dueCount}</span>}
          </span>
          <span className="tab-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
