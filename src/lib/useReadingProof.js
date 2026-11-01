import { useCallback, useEffect, useRef, useState } from 'react'

// Preuve de lecture, sans IA : chaque bloc de texte doit rester visible à l'écran pendant
// un temps proportionnel à sa longueur (environ la moitié d'une lecture normale).
// Faire défiler vite ne suffit donc pas ; le minuteur s'arrête si l'app passe en arrière-plan.
// Un bloc écouté jusqu'au bout avec la lecture à voix haute compte aussi comme lu (`mark`).
const MS_PER_WORD = 120
const MIN_MS = 2000
const MAX_MS = 15000
const TICK = 250

export const requiredMs = (text) => Math.min(MAX_MS, Math.max(MIN_MS, text.trim().split(/\s+/).length * MS_PER_WORD))

export function useReadingProof(enabled) {
  const blocks = useRef([])
  const done = useRef(new Set())
  const [read, setRead] = useState(() => new Set())
  const [count, setCount] = useState(0)

  // À passer en `ref` de chaque bloc : <p ref={track(0)}>…
  const track = useCallback(
    (index) => (el) => {
      blocks.current[index] = el
      setCount((c) => Math.max(c, index + 1))
    },
    [],
  )

  const mark = useCallback((index) => {
    if (done.current.has(index)) return
    done.current.add(index)
    setRead(new Set(done.current))
  }, [])

  useEffect(() => {
    if (!enabled || count === 0) return
    const els = blocks.current.slice(0, count)
    const needed = els.map((el) => requiredMs(el?.textContent ?? ''))
    const spent = els.map(() => 0)
    const visible = els.map(() => false)

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = els.indexOf(entry.target)
          if (i === -1) continue
          // Visible = au moins 60 % du bloc à l'écran, ou la moitié de l'écran occupée par un long bloc
          visible[i] =
            entry.isIntersecting &&
            (entry.intersectionRatio >= 0.6 || entry.intersectionRect.height >= window.innerHeight * 0.5)
        }
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    )
    els.forEach((el) => el && observer.observe(el))

    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      els.forEach((_, i) => {
        if (!visible[i] || done.current.has(i)) return
        spent[i] += TICK
        if (spent[i] >= needed[i]) mark(i)
      })
    }, TICK)

    return () => {
      observer.disconnect()
      clearInterval(timer)
    }
  }, [enabled, count, mark])

  return { track, mark, read, total: count, complete: count > 0 && read.size >= count }
}
