# Be Better

Micro-apprentissage de culture générale, **100 % gratuit** : à chaque niveau, tu choisis une carte parmi 5,
tu la lis (ou tu l'écoutes), puis tu réponds à 3 questions sur elle. Les cartes reviennent ensuite en
révision espacée. Une PWA (React + Vite) installable sur téléphone, qui fonctionne hors-ligne.

## Le principe

1. **Parcours** : des centaines de niveaux en chapitres de 10, qui se lisent de bas en haut.
2. **Choix de la carte** : chaque niveau a son propre paquet de 5 cartes de thèmes différents,
   jamais reproposées ailleurs. Chaque carte a pour fond l'image de son article Wikipédia.
3. **Lecture prouvée** : le quiz ne se débloque que lorsque chaque partie de la carte est restée à l'écran
   assez longtemps (environ la moitié d'une lecture normale), ou a été écoutée jusqu'au bout.
4. **Lecture à voix haute** : avec la synthèse vocale du téléphone, gratuite et hors-ligne.
5. **Quiz** : 3 questions sur la carte lue, avec une explication après chaque réponse. 2 sur 3 valident le niveau.
6. **Révisions** : chaque carte revient après 1, 3, 7, 14, 30 puis 60 jours, suivie de défis qui mélangent
   les cartes apprises (remettre dans l'ordre chronologique, relier sujets et descriptions, trouver l'intrus).
7. **Bibliothèque** : par thème, **frise chronologique** et **carte du monde** des cartes apprises, favoris.
8. **Suivi et sauvegarde** : série de jours, objectif de 3 cartes par jour, état de la mémoire, et
   sauvegarde de la progression dans un fichier (à restaurer sur un autre appareil).

La progression est enregistrée dans le navigateur (`localStorage`), sans compte.

## Le contenu, gratuit et sourcé

- **30 cartes rédigées à la main** (`src/data/handwritten.js`) ouvrent le parcours.
- **Les autres sont générées** par `npm run generate-cards`, sans IA ni service payant :
  - les sujets viennent des listes Wikimédia des articles
    [« que toute Wikipédia devrait avoir »](https://meta.wikimedia.org/wiki/List_of_articles_every_Wikipedia_should_have)
    (1 000 puis 10 000 sujets), au plus 260 par thème pour garder des thèmes équilibrés ;
  - le texte est l'introduction de l'article Wikipédia en français (CC BY-SA 4.0, source sur chaque carte) ;
  - l'image est celle de l'article (Wikimedia Commons, auteur et licence affichés) ;
  - dates, lieux, auteurs et liens entre sujets viennent de Wikidata (CC0) ;
  - les questions ne portent que sur ce que la carte affiche (date à compléter, sujet masqué dans sa définition,
    bonne description, auteur, pays…). Une carte qui ne permet pas 3 questions fiables est écartée.
- Le contenu est publié dans `public/content/` : un sommaire et des fichiers de 25 niveaux,
  que l'app télécharge au fur et à mesure de la progression.

Le script met ses téléchargements en cache dans `scripts/wiki/.cache/` et fait une requête par seconde,
pour respecter les API gratuites de Wikimédia.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:5173, ou depuis un téléphone sur le même Wi-Fi l'adresse « Network » affichée.

```bash
npm run generate-cards                     # régénère le contenu (environ 15 min la première fois)
npm run generate-cards -- --per-theme 400  # plus de cartes par thème
npm run check-content                      # vérifie le contenu
npm run build                              # version compilée dans dist/
```

## Mise en ligne

Chaque push sur `main` publie l'app sur GitHub Pages (workflow `.github/workflows/deploy.yml`).
Sur le téléphone, ouvrir l'adresse GitHub Pages puis « Ajouter à l'écran d'accueil ».

## Structure

```
src/
  data/        thèmes, cartes rédigées, niveaux, chargement du contenu
  lib/         progression, répétition espacée, défis, preuve de lecture, voix, dates
  components/  quiz, frise, carte du monde, visuel de carte, navigation
  screens/     parcours, choix de carte, carte, quiz, révisions, bibliothèque, profil
scripts/
  wiki/        générateur de contenu (Wikimédia, Wikidata, Wikipédia)
  check-content.js
public/
  content/     contenu généré (sommaire + niveaux)
```

## Crédits

Textes : Wikipédia (CC BY-SA 4.0). Images : Wikimedia Commons (licence indiquée sur chaque carte).
Données : Wikidata (CC0). Fond de carte : Natural Earth via `world-atlas` (domaine public).
