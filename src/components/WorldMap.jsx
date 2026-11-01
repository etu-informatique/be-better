import { useEffect, useMemo, useState } from 'react'
import { geoEqualEarth, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import CardRow from './CardRow.jsx'

const WIDTH = 360
const HEIGHT = 190

// Carte du monde des cartes apprises qui ont un lieu (pays, villes, monuments, fleuves…).
// Le fond de carte (Natural Earth, domaine public) n'est chargé qu'à l'ouverture de cette vue.
export default function WorldMap({ cards, onOpenCard }) {
  const [land, setLand] = useState(null)
  const [selected, setSelected] = useState(null)
  const placed = cards.filter((c) => c.coords)

  useEffect(() => {
    import('world-atlas/land-110m.json').then((m) => {
      const topology = m.default ?? m
      setLand(feature(topology, topology.objects.land))
    })
  }, [])

  const { path, project } = useMemo(() => {
    const projection = geoEqualEarth().fitSize([WIDTH, HEIGHT], { type: 'Sphere' })
    return { path: geoPath(projection), project: ([lat, lon]) => projection([lon, lat]) }
  }, [])

  const card = placed.find((c) => c.id === selected)

  return (
    <div className="worldmap">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Carte du monde : ${placed.length} lieux appris`}>
        <path className="map-sphere" d={path({ type: 'Sphere' })} />
        {land && <path className="map-land" d={path(land)} />}
        {placed.map((c) => {
          const [x, y] = project(c.coords)
          return (
            <g key={c.id} className={`pin ${selected === c.id ? 'active' : ''}`} onClick={() => setSelected(c.id)}
              role="button" tabIndex={0} aria-label={c.title} onKeyDown={(e) => e.key === 'Enter' && setSelected(c.id)}>
              <circle cx={x} cy={y} r="9" className="pin-hit" />
              <circle cx={x} cy={y} r={selected === c.id ? 4.5 : 3.2} className="pin-dot" />
            </g>
          )
        })}
      </svg>
      {card ? (
        <ul className="card-list"><CardRow card={card} onOpen={() => onOpenCard(card.id)} /></ul>
      ) : (
        <p className="muted map-note">
          {placed.length
            ? `${placed.length} lieu${placed.length > 1 ? 'x' : ''} appris. Touche un point pour revoir la carte.`
            : 'Les lieux que tu découvres (pays, villes, monuments, fleuves…) apparaîtront ici.'}
        </p>
      )}
    </div>
  )
}
