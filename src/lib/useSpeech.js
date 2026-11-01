import { useCallback, useEffect, useState } from 'react'
import { sentences } from './text.js'

// Lecture à voix haute avec la synthèse vocale du téléphone : gratuite, et sans connexion
// avec les voix installées. Le texte est lu phrase par phrase (certains navigateurs coupent
// les longues lectures) ; `onBlockEnd(i)` est appelé quand le bloc i a été lu en entier.
export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (blocks, onBlockEnd) => {
      if (!supported) return
      const synth = window.speechSynthesis
      synth.cancel()
      const voice = synth.getVoices().find((v) => v.lang?.toLowerCase().startsWith('fr'))
      const queue = blocks.flatMap((text, block) => {
        const parts = sentences(text)
        return parts.map((part, i) => ({ part, block, last: i === parts.length - 1 }))
      })
      queue.forEach(({ part, block, last }, n) => {
        const u = new SpeechSynthesisUtterance(part)
        u.lang = 'fr-FR'
        if (voice) u.voice = voice
        u.rate = 1
        u.onend = () => {
          if (last) onBlockEnd?.(block)
          if (n === queue.length - 1) setSpeaking(false)
        }
        synth.speak(u)
      })
      setSpeaking(queue.length > 0)
    },
    [supported],
  )

  // On coupe la voix en quittant l'écran.
  useEffect(() => stop, [stop])

  return { supported, speaking, speak, stop }
}
