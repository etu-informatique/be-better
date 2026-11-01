// Récupération des données gratuites : listes Wikimédia, Wikidata, Wikipédia, Wikimedia Commons.
import { chunk, fetchJson, stripHtml } from './lib.js'

const META_API = 'https://meta.wikimedia.org/w/api.php'
const BASE_LIST = 'List_of_articles_every_Wikipedia_should_have'

// Liste de base (1 000 sujets) : les rubriques sont nommées dans des commentaires HTML.
const BASE_THEMES = [
  [/philosophers|religious figures|^philosophy|^religion/i, 'philo'],
  [/politicians|explorers|war and military|history|prehistoric|medieval|early modern/i, 'histoire'],
  [/inventors|psychology|astronomy|biolog|organisms|anatomy|health|diseases|chemistry|earth science|physics|^science/i, 'sciences'],
  [/composers|^music/i, 'musique'],
  [/artists|film|architecture|^arts/i, 'arts'],
  [/authors/i, 'litterature'],
  [/language and literature/i, 'langues'],
  [/business and economics/i, 'economie'],
  [/family|politics|law|international organizations|social issues|social sciences|agriculture|food|beverages|recreation/i, 'societe'],
  [/measurements|weight|^time|mathematics/i, 'maths'],
  [/technology|communication|electronics|computer|energy|materials|transportation|weapons/i, 'techno'],
  [/geography|continents|africa|asia|europe|america|oceania|bodies of water|mountains/i, 'geo'],
]

// Liste étendue (10 000 sujets) : une page par domaine. Seules les pages qui mélangent plusieurs
// thèmes sont affinées d'après leurs sous-titres ; les autres prennent le thème de la page.
const EXPANDED_PAGES = {
  People: 'histoire',
  History: 'histoire',
  Geography: 'geo',
  Arts: 'arts',
  'Philosophy and religion': 'philo',
  'Anthropology, psychology and everyday life': 'societe',
  'Society and social sciences': 'societe',
  'Biology and health sciences': 'sciences',
  'Physical sciences': 'sciences',
  Technology: 'techno',
  Mathematics: 'maths',
}
const REFINED_PAGES = new Set(['People', 'Arts', 'Society and social sciences', 'Anthropology, psychology and everyday life'])
const HEADING_THEMES = [
  [/historian|politician|leader|monarch|ruler|military|criminal|explorer|activist/i, 'histoire'],
  [/econom|business|financ|money|trade|banking|industr/i, 'economie'],
  [/language|linguist|writing system|alphabet/i, 'langues'],
  [/writer|literature|poet|novel|playwright/i, 'litterature'],
  [/music|composer|musician/i, 'musique'],
  [/mathemat|statistic/i, 'maths'],
  [/philosoph|religio|mytholog|theolog|spiritual/i, 'philo'],
  [/painter|sculpt|architect|visual art|film|director|actor|actress|entertain|performing|danc|theat|photograph|painting|design/i, 'arts'],
  [/scientist|inventor|psycholog/i, 'sciences'],
  [/sport|athlet|recreation|game|food|cuisine|drink|beverage|cloth|fashion|holiday|family|education|law|politic|government|social|society/i, 'societe'],
]

const firstTheme = (rules, labels) => labels.map((s) => rules.find(([re]) => re.test(s))?.[1]).find(Boolean)

async function wikitext(page) {
  const url = `${META_API}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`
  return (await fetchJson(url)).parse.wikitext
}

// Parcourt une page de liste : chaque « [[d:Q123|…]] » avec la pile de titres qui le précède.
function* listItems(text, headingLabel) {
  const headings = {}
  for (const line of text.split('\n')) {
    const h = line.match(/^(=+)\s*(.*?)\s*=+\s*(?:<!--\s*(.*?)\s*-->)?\s*$/)
    if (h) {
      const depth = h[1].length
      headings[depth] = headingLabel(h[2], h[3])
      for (const d of Object.keys(headings)) if (Number(d) > depth) delete headings[d]
      continue
    }
    for (const m of line.matchAll(/\[\[d:(Q\d+)\|/g)) {
      yield { qid: m[1], path: Object.keys(headings).sort((a, b) => b - a).map((d) => headings[d]).filter(Boolean) }
    }
  }
}

export async function fetchTopics() {
  const topics = []
  const seen = new Set()
  const add = (qid, theme, rank) => {
    if (!theme || seen.has(qid)) return
    seen.add(qid)
    topics.push({ qid, theme, rank })
  }
  for (const { qid, path } of listItems(await wikitext(BASE_LIST), (_, comment) => comment)) {
    add(qid, firstTheme(BASE_THEMES, path), 0)
  }
  for (const [page, pageTheme] of Object.entries(EXPANDED_PAGES)) {
    const text = await wikitext(`${BASE_LIST}/Expanded/${page}`)
    for (const { qid, path } of listItems(text, (title) => title.replace(/[,\s\d]+$/, '').replace(/'''/g, ''))) {
      add(qid, (REFINED_PAGES.has(page) && firstTheme(HEADING_THEMES, path)) || pageTheme, 1)
    }
  }
  return topics
}

async function sparql(query) {
  return (await fetchJson('https://query.wikidata.org/sparql', { body: `format=json&query=${encodeURIComponent(query)}` })).results.bindings
}

const qidOf = (uri) => uri.split('/').pop()

// Wikidata : titre de l'article français et description, par lots de 2 000 sujets en une requête.
export async function fetchEntities(qids) {
  const out = {}
  for (const batch of chunk(qids, 2000)) {
    const rows = await sparql(`SELECT ?item ?title ?desc WHERE {
      VALUES ?item { ${batch.map((q) => `wd:${q}`).join(' ')} }
      OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://fr.wikipedia.org/> ; schema:name ?title . }
      OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc) = "fr") }
    }`)
    for (const b of rows) {
      out[qidOf(b.item.value)] = { title: b.title?.value, description: b.desc?.value }
    }
  }
  return out
}

// Wikidata (SPARQL), par lots : valeurs avec libellé français (auteur, pays…), dates brutes,
// coordonnées, et liens vers d'autres sujets (QID).
export async function fetchClaims(qids, { labelProps, dateProps, linkProps }) {
  const claims = Object.fromEntries(qids.map((q) => [q, { links: new Set() }]))
  for (const batch of chunk(qids, 700)) {
    const values = batch.map((q) => `wd:${q}`).join(' ')
    for (const prop of labelProps) {
      const rows = await sparql(`SELECT ?item ?vLabel WHERE { VALUES ?item { ${values} } ?item wdt:${prop} ?v . SERVICE wikibase:label { bd:serviceParam wikibase:language "fr". } }`)
      for (const b of rows) {
        const label = b.vLabel?.value
        if (!label || /^Q\d+$/.test(label)) continue // valeur sans libellé français
        const list = (claims[qidOf(b.item.value)][prop] ??= [])
        if (!list.includes(label)) list.push(label)
      }
    }
    for (const prop of dateProps) {
      for (const b of await sparql(`SELECT ?item ?v WHERE { VALUES ?item { ${values} } ?item wdt:${prop} ?v . }`)) {
        ;(claims[qidOf(b.item.value)][prop] ??= []).push(b.v.value)
      }
    }
    for (const b of await sparql(`SELECT ?item ?v WHERE { VALUES ?item { ${values} } ?item wdt:P625 ?v . }`)) {
      const m = b.v.value.match(/Point\(([-\d.]+) ([-\d.]+)\)/)
      const claim = claims[qidOf(b.item.value)]
      if (m && !claim.coords) claim.coords = [Number(m[2]), Number(m[1])] // [latitude, longitude]
    }
    const linkValues = linkProps.map((p) => `wdt:${p}`).join('|')
    for (const b of await sparql(`SELECT ?item ?v WHERE { VALUES ?item { ${values} } ?item ${linkValues} ?v . FILTER(isIRI(?v)) }`)) {
      claims[qidOf(b.item.value)].links.add(qidOf(b.v.value))
    }
  }
  return claims
}

// Wikipédia : introduction en texte brut, image principale, révision (pour l'attribution), QID.
export async function fetchPages(titles) {
  const pages = {}
  for (const batch of chunk(titles, 20)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', redirects: '1',
      prop: 'extracts|pageimages|revisions|pageprops', exintro: '1', explaintext: '1', exlimit: '20',
      piprop: 'thumbnail|name', pithumbsize: '800', pilimit: '20', rvprop: 'ids', ppprop: 'wikibase_item',
      titles: batch.join('|'),
    })
    const res = await fetchJson(`https://fr.wikipedia.org/w/api.php?${params}`)
    const rename = {}
    for (const n of res.query.normalized ?? []) rename[n.to] = n.from
    for (const r of res.query.redirects ?? []) rename[r.to] = rename[r.from] ?? r.from
    for (const p of res.query.pages) {
      if (p.missing) continue
      pages[rename[p.title] ?? p.title] = {
        title: p.title,
        extract: p.extract ?? '',
        revid: p.revisions?.[0]?.revid,
        qid: p.pageprops?.wikibase_item,
        image: p.thumbnail ? { src: p.thumbnail.source, file: p.pageimage } : null,
      }
    }
  }
  return pages
}

// Crédits des images (auteur et licence), affichés sous chaque image.
export async function fetchImageCredits(files) {
  const credits = {}
  for (const batch of chunk([...new Set(files)], 50)) {
    const params = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
      iiprop: 'extmetadata', iiextmetadatafilter: 'Artist|LicenseShortName',
      titles: batch.map((f) => `File:${f}`).join('|'),
    })
    const res = await fetchJson(`https://fr.wikipedia.org/w/api.php?${params}`)
    const rename = {}
    for (const n of res.query.normalized ?? []) rename[n.to] = n.from
    for (const p of res.query.pages) {
      const meta = p.imageinfo?.[0]?.extmetadata
      if (!meta) continue
      const file = (rename[p.title] ?? p.title).replace(/^File:/, '')
      credits[file] = {
        author: stripHtml(meta.Artist?.value).slice(0, 80) || 'Auteur inconnu',
        license: stripHtml(meta.LicenseShortName?.value) || 'voir Wikimedia Commons',
      }
    }
  }
  return credits
}
