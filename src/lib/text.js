// Découpe un texte français en phrases, sans couper après une abréviation comme « av. J.-C. » ou « M. ».
// Partagé par l'app (lecture à voix haute) et le générateur de cartes.
const ABBREVIATION = /(?:\b(?:av|apr|J\.-C|env|cf|M|Mme|Mgr|Dr|St|Ste|vol|p|n°|art|ca|etc)|\b[A-Z])\.$/u

export function sentences(text) {
  const out = []
  for (const piece of text.split(/(?<=[.!?…])\s+(?=[A-ZÀ-ÖØ-Þ«“"(])/u)) {
    if (out.length && ABBREVIATION.test(out[out.length - 1])) out[out.length - 1] += ' ' + piece
    else out.push(piece)
  }
  return out
}
