// Répartit les cartes en paquets, un par niveau :
//   - aucune carte n'apparaît dans deux niveaux ;
//   - les cartes d'un même paquet sont de thèmes différents ;
//   - les thèmes les plus fournis sont étalés sur tout le parcours ;
//   - dans chaque thème, l'ordre du programme est respecté (les cartes rédigées d'abord).
export function buildDecks(cards, levelCount, size) {
  const queues = new Map()
  for (const card of cards) {
    if (!queues.has(card.theme)) queues.set(card.theme, [])
    queues.get(card.theme).push(card.id)
  }

  const decks = []
  for (let level = 0; level < levelCount; level++) {
    // Les thèmes qui ont le plus de cartes restantes passent en premier.
    const themes = [...queues.keys()]
      .filter((t) => queues.get(t).length)
      .sort((a, b) => queues.get(b).length - queues.get(a).length)
    const deck = themes.slice(0, size).map((t) => queues.get(t).shift())
    // En fin de parcours, s'il reste moins de thèmes que de places, on complète quand même.
    for (const t of themes) {
      while (deck.length < size && queues.get(t).length) deck.push(queues.get(t).shift())
    }
    if (!deck.length) break
    decks.push(deck)
  }
  return decks
}
