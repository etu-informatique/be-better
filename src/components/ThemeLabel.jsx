import { THEMES } from '../data/themes.js'

export default function ThemeLabel({ themeId, light = false }) {
  const theme = THEMES[themeId]
  return (
    <span className={`theme-label ${light ? 'light' : ''}`} style={{ '--c': theme.color }}>
      <i aria-hidden="true" />
      {theme.name}
    </span>
  )
}
