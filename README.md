# Be Better

Micro-apprentissage de culture générale, **100 % gratuit** : à chaque niveau, tu choisis une carte,
tu la lis, puis tu réponds à 3 questions sur elle. Les cartes reviennent ensuite en révision espacée.
Une PWA (React + Vite) installable sur téléphone, qui fonctionne hors-ligne.

## Le principe

1. **Parcours** : 200 niveaux en chapitres de 10, qui se lisent de bas en haut. L'écran s'ouvre sur le niveau en cours.
2. **Choix de la carte** : à chaque niveau, des cartes défilent (une par thème, ou celles du thème que tu choisis).
   Chaque carte a pour fond l'image de son article Wikipédia.
3. **Lecture prouvée** : le quiz ne se débloque que lorsque chaque partie de la carte est restée à l'écran
   assez longtemps (environ la moitié d'une lecture normale, selon la longueur). Faire défiler vite ne suffit pas,
   et le minuteur s'arrête si l'app passe en arrière-plan. Chaque partie lue est marquée dans la marge.
4. **Quiz** : 3 questions sur la carte lue, avec une explication après chaque réponse. 2 bonnes réponses sur 3 valident le niveau.
5. **Révisions** : chaque carte apprise revient après 1, 3, 7, 14, 30 puis 60 jours. Une erreur la renvoie au lendemain.
6. **Suivi** : série de jours, objectif de 3 cartes par jour, bibliothèque par thème, favoris, état de la mémoire.

La progression est enregistrée dans le navigateur (`localStorage`), sans compte.

## Le contenu, gratuit et sourcé

- **30 cartes rédigées à la main** (`src/data/handwritten.js`) ouvrent le parcours.
- **Les autres cartes sont générées** par `npm run generate-cards`, sans IA ni service payant :
  - les sujets viennent de la liste Wikimédia
    [« articles que toute Wikipédia devrait avoir »](https://meta.wikimedia.org/wiki/List_of_articles_every_Wikipedia_should_have) (1 000 sujets) ;
  - le texte est l'introduction de l'article Wikipédia en français (CC BY-SA 4.0, source affichée sur chaque carte) ;
  - l'image est celle de l'article (Wikimedia Commons, auteur et licence affichés) ;
  - les dates, auteurs, pays… viennent de Wikidata (CC0) ;
  - les questions sont construites à partir de ce que la carte affiche (une date à compléter dans le texte,
    la bonne description, l'auteur ou le pays), avec des leurres tirés des autres sujets.
    Une carte qui ne permet pas 3 questions fiables est écartée.

Le script met ses téléchargements en cache dans `scripts/wiki/.cache/` et fait une requête par seconde,
pour respecter les API gratuites de Wikimédia. Le résultat est écrit dans `src/data/generated/wiki.json`.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173, ou depuis un téléphone sur le même Wi-Fi l'adresse « Network » affichée.

```bash
npm run generate-cards   # régénère les cartes depuis Wikipédia et Wikidata
npm run check-content    # vérifie les cartes (3 questions chacune, thèmes, liens)
npm run build            # version compilée dans dist/
```

Pour installer l'app sur un téléphone, il faut la mettre en ligne en HTTPS (Netlify, Vercel ou GitHub Pages, gratuits),
puis « Ajouter à l'écran d'accueil ».

## Structure

```
src/
  data/        thèmes, cartes rédigées, cartes générées, niveaux
  lib/         progression, répétition espacée, preuve de lecture, dates
  components/  quiz, résultats, visuel de carte, barres de navigation, icônes
  screens/     parcours, choix de carte, carte, quiz, révisions, bibliothèque, profil
scripts/
  wiki/        générateur de cartes (Wikimédia, Wikidata, Wikipédia)
  check-content.js
public/        icônes de l'app (régénérables avec `npm run generate-pwa-assets`)
```

## Idées pour la suite

- Liste étendue de Wikimédia (10 000 sujets) pour aller bien au-delà de 200 niveaux
- Nouveaux types de questions : remettre des dates dans l'ordre, relier des paires
- Notifications quotidiennes, mode audio
- Comptes et synchronisation entre appareils
