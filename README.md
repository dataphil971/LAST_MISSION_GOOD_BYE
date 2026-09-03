# LAST MISSION — GOOD BYE

Une courte expérience narrative en pixel art : **la dernière journée d'un Data
Analyst**. Le jeu sert de message d'au revoir — on le lance depuis un lien
dans un mail, on y passe environ cinq minutes, et on repart avec l'adresse de
la personne qui l'a écrit.

> Philippe arrive en pensant qu'être Data Analyst consiste surtout à faire des
> graphiques. Douze missions plus tard, il comprend que son métier consiste
> surtout à comprendre, relier, fiabiliser, expliquer… et parfois demander à
> quelqu'un pourquoi un bouton ne marche pas.

![Écran-titre](docs/screens/01-titre.png)

## Où jouer

| | Lien | Pour qui |
| --- | --- | --- |
| **Aperçu privé** | https://claude.ai/code/artifact/22cff97f-9289-4112-a685-f77279de036c | moi seul, sauf partage explicite |
| **GitHub Pages** | https://dataphil971.github.io/LAST_MISSION_GOOD_BYE/ | tout le monde — *à activer* |
| **Hors ligne** | `dist/last-mission.html` | à joindre à un message |

⚠️ **L'aperçu privé est privé.** Envoyé tel quel, il ne s'ouvrira pas chez le
destinataire : il faut d'abord le partager depuis le menu de partage de la
page. C'est un lien de relecture, pas un lien de diffusion.

**Le lien de diffusion, c'est GitHub Pages.** Il faut l'activer une fois :
*Settings → Pages → Source : GitHub Actions*. Le workflow
(`.github/workflows/pages.yml`) est déjà en place et rejoue le parcours
complet avant chaque publication. Tant que Pages n'est pas activé, le job
échoue et l'URL ci-dessus renvoie une 404.

Pour retrouver l'aperçu privé plus tard : `/artifacts` dans le terminal
Claude Code (`o` ouvre, `c` copie le lien), <kbd>Ctrl</kbd>+<kbd>]</kbd> pour
rouvrir le dernier, ou la galerie sur claude.ai/code/artifacts.

## État : prototype jouable (tranche verticale)

Ce dépôt contient une **tranche verticale complète** — l'expérience va du
premier écran jusqu'aux liens de contact, sans trou :

| Acte | Contenu | État |
| --- | --- | --- |
| Premiers pas | extérieur 08:43, accueil, ascenseur, plateau | jouable |
| Comprendre | **Mission 01 · ATLAS** + bouton magique n°1 | jouable |
| Ellipse | missions 02 → 10 en accéléré | montage |
| Transmettre | **Mission 11 · SENTINEL** — agent de gouvernance, bonnes pratiques, bouton magique n°4 | jouable |
| Ellipse | mission 12, bilan de stage | montage |
| Quitter | fermeture des applications, trajet inverse, coucher de soleil, discours | jouable |
| Post-générique | « 2 h 03 de trajet », écran de contact | jouable |

Les quatre liens de contact sont fonctionnels. Ce qui reste à produire est
listé dans [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) : les dix missions
restantes et les vrais sprites Aseprite.

L'écran-titre propose quatre entrées : **JOUER**, **MODE RAPIDE**,
**ALLER À LA FIN** — qui saute directement au coucher de soleil, au message
d'au revoir et aux contacts, pour les gens pressés — et **MISSIONS**, qui
ouvre la sélection des douze niveaux. Une mission lancée depuis cet écran y
revient au lieu d'embarquer le joueur dans la suite de la journée.

| | |
| --- | --- |
| ![Sélection des missions](docs/screens/02-missions.png) | ![Extérieur](docs/screens/03-exterieur.png) |
| ![Mission Atlas](docs/screens/06-mission-atlas.png) | ![Mission Sentinel](docs/screens/07-sentinel.png) |
| ![Bilan de stage](docs/screens/08-bilan.png) | ![Coucher de soleil](docs/screens/10-coucher-de-soleil.png) |
| ![Générique](docs/screens/11-generique.png) | ![Contacts](docs/screens/13-contacts.png) |

## Lancer le jeu en local

Les modules ES imposent un serveur : ouvrir `index.html` par double-clic ne
fonctionnera pas.

```bash
python -m http.server 8123          # puis http://127.0.0.1:8123
```

Le build mono-fichier, lui, s'ouvre depuis le disque — aucun serveur, aucun
appel réseau, tout est embarqué :

```bash
node tools/build_single.mjs         # → dist/last-mission.html (~210 Ko)
```

### Commandes

Au doigt : toucher pour avancer, toucher le sol pour se déplacer, et deux
boutons à l'écran remplacent le clavier — le menu en haut à droite, **PASSER**
en bas à droite pendant les cinématiques.

| Touche | Effet |
| --- | --- |
| Clic / Espace | avancer le dialogue, valider |
| Espace maintenu | accélérer la frappe du texte |
| ← → (ou A/D, Q/D) | marcher |
| Tab | passer la cinématique en cours |
| Échap | menu : son, rythme, **retour à l'accueil**, reprendre |
| M | couper le son |
| F1 | affichage de debug |

`index.html#scene=sunset` ouvre directement un plan — pratique pour
travailler une scène sans rejouer le début.

## Structure

```
index.html            page hôte : canvas 384×216, agrandissement entier
src/
  config.js           liens de contact, rendu, rythme  ← le seul fichier à éditer avant diffusion
  main.js             chargement des atlas, table des scènes
  core/               moteur : boucle, scènes, entrées, atlas, audio, police, timeline
  data/               palette verrouillée, texte du jeu (script.js)
  ui/                 dialogues, bannières, notifications
  scenes/             décors procéduraux + mise en scène de chaque acte
assets/               spritesheets PNG + JSON au format Aseprite
tools/                génération des sprites, tests, captures, build mono-fichier
docs/                 game design, bible d'art, pipeline, sécurité
```

Aucune dépendance : pas de `npm install`, pas d'étape de build pour jouer.
Le `package.json` ne sert qu'à regrouper les scripts.

## Choix techniques

- **Canvas logique 384 × 216**, agrandi par facteur entier dès que le jeu
  tient deux fois dans la fenêtre — le cas de tout écran d'ordinateur
  (×5 = 1920 × 1080 exactement). En dessous, sur un téléphone, l'ajustement
  se fait au plus près : un facteur minimal de 1 débordait des 384 px sur un
  écran de 360, et le jeu se retrouvait coupé. `imageSmoothingEnabled = false`,
  toutes les positions dessinées sont arrondies : aucun sous-pixel.
- **Décors peints en pixels, personnages en sprites.** Les fonds sont générés
  proceduralement et de façon déterministe (hash sur les coordonnées) : zéro
  octet d'assets de décor, aucun scintillement entre deux images.
- **Police bitmap 5 × 7** écrite à la main, diacritiques français composés.
  Aucune police système, donc aucun anticrénelage.
- **Audio 100 % procédural** (WebAudio) : aucun fichier son dans le dépôt.
- **Mise en scène par générateurs** : une scène = un plan de tournage lisible
  (`yield dlg.say(...)`, `yield hero.walkTo(...)`), pas une machine à états.

## Outils

```bash
python tools/gen_sprites.py     # régénère les spritesheets placeholder
node tools/smoke_test.mjs       # joue le jeu en entier, sans navigateur
node tools/screenshot.mjs       # rend les captures de docs/screens/
node tools/build_single.mjs     # build mono-fichier
```

`tools/softcanvas.mjs` implémente un canvas 2D logiciel : c'est ce qui permet
de rendre le jeu et de faire de la QA visuelle en ligne de commande.

## Sécurité et anonymisation

Le dépôt ne contient **aucun** nom de projet interne, table, hostname,
identifiant de rapport, URL interne ni environnement.

Deux exceptions assumées, toutes deux documentées :

- **le logo sur le casque** identifie l'employeur — c'est la signature du
  personnage, et l'exception s'arrête au logo ;
- **le générique de fin nomme des personnes réelles**
  (`T.credits.roles` dans `src/data/script.js`). Leur accord est à obtenir
  avant diffusion — c'est le premier point de la checklist de publication.
Les douze missions portent des noms de code fictifs (ATLAS, IRIS, ECHO…), les
PNJ des identifiants anonymisés (`BI_07`, `PO_01`), et les données affichées
sont inventées. La règle complète et la checklist avant publication sont dans
[docs/SECURITY.md](docs/SECURITY.md) — à relire avant toute diffusion.

## Documentation

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — actes, douze missions, running gag, tonalité, reste à faire
- [docs/ART_BIBLE.md](docs/ART_BIBLE.md) — palette, cellules, pivots, contours, animations, tests de validation
- [docs/PIPELINE.md](docs/PIPELINE.md) — Aseprite → PNG/JSON → moteur, et comment remplacer les placeholders
- [docs/SECURITY.md](docs/SECURITY.md) — doctrine d'anonymisation

Le rendu graphique actuel utilise des **sprites placeholder générés par
script**. Ils respectent déjà la cellule, le pivot, la palette et les noms de
tags définitifs : remplacer les fichiers d'`assets/` par des exports Aseprite
ne demandera aucune modification de code.
