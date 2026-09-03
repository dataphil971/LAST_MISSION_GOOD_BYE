# Game design

Synthèse opérationnelle du rapport de conception. Ce fichier fait foi pour la
production ; le rapport reste la source narrative.

## Le pitch, et pourquoi il tient

Le mauvais arc serait « Philippe accomplit douze tâches puis part ».
Le bon arc est une **transformation de posture** :

| Début | Milieu | Fin |
| --- | --- | --- |
| épaules rentrées | posture neutre | posture ouverte |
| longues hésitations | essais rapides | gestes courts |
| réaction forte aux erreurs | soupir contrôlé | sourire devant l'erreur |
| demande de l'aide | raisonne avec un collègue | aide quelqu'un |

## Les missions sont des souvenirs

Philippe ne refait pas douze projets pendant sa dernière journée : ce serait
narrativement artificiel. **La journée finale est le présent** ; les missions
sont déclenchées par un objet, un écran, un lieu ou un PNJ, puis se referment
sur un « souvenir ajouté ». C'est ce qui permet de raconter plusieurs mois en
cinq minutes sans casser l'unité de temps.

## Tonalité

- 60 % chaleureux / nostalgique
- 25 % humour de bureau / auto-dérision
- 15 % valorisation professionnelle

Deux pièges symétriques : trop corporate (le jeu devient un CV animé), trop
comique (Philippe passe pour incompétent). **On rit avec Philippe, jamais de
Philippe.**

## Les cinq actes

| Acte | Fonction | Contenu | Émotion |
| --- | --- | --- | --- |
| Premiers pas | présenter Philippe et l'espace | arrivée, accueil, ascenseur, plateau | curiosité |
| Comprendre | montrer les difficultés | premières missions BI, bouton magique | auto-dérision |
| Relier | montrer la montée en compétence | missions intermédiaires, déjeuner | confiance |
| Transmettre | montrer l'autonomie | Data Engineering, CI/CD, gouvernance | maîtrise |
| Quitter | clôturer humainement | PC fermé, trajet inverse, coucher de soleil | gratitude |

Le trajet du soir rejoue **exactement** celui du matin, en sens inverse :
bureau → plateau → couloir → ascenseur → RDC → accueil → extérieur. Cette
symétrie donne inconsciemment la sensation d'avoir bouclé une aventure.

## Les douze missions

Noms de code fictifs. Aucun intitulé, système ou personne réels.

| # | Code | Objectif narratif | Gimmick | Durée | État |
| --- | --- | --- | --- | --- | --- |
| 01 | ATLAS | moderniser un rapport BI complexe | puzzle spatial de blocs | 30 s | **fait** |
| 02 | IRIS | transformer des données documentaires en décision | associer question / variable / visuel | 35 s | à faire |
| 03 | ECHO | comprendre qui utilise réellement un service | enquête reliant des identifiants | 35 s | à faire |
| 04 | LEDGER | retrouver ce qui manque dans un catalogue | jeu des différences | 25 s | à faire |
| 05 | BRIDGE | reconstruire des liens techniques | assembler deux fragments | 20 s | à faire |
| 06 | VERDANT | migrer un référentiel sans casser | déplacer des connexions, jauge de régression | 35 s | à faire |
| 07 | HORIZON | enrichir un modèle sémantique | puzzle en étoile fait/dimension | 30 s | à faire |
| 08 | PULSE | fiabiliser un baromètre multi-campagnes | mini-boss en trois phases | 45 s | à faire |
| 09 | SAFEPATH | construire une chaîne Data Engineering | convoyeur, la caméra suit la donnée | 35 s | à faire |
| 10 | BEACON | surveiller commits et anomalies | classer des événements dans le temps | 30 s | à faire |
| 11 | SENTINEL | prototyper un agent de gouvernance | audit de bonnes pratiques + bouton magique **inversé** | 40 s | **fait** |
| 12 | RELAY | rendre une ingestion évolutive | gérer un changement de schéma | 40 s | à faire |

Deux missions comptent plus que les autres : **PULSE**, le seul mini-boss, que
Philippe résout **seul** (aucun collègue n'appuie sur le bouton — c'est le
point de bascule) ; et **RELAY**, dont le thème n'est pas « résoudre un
problème » mais « construire quelque chose qui peut évoluer après ton départ ».

## Le running gag du bouton

Quatre occurrences, pas une de plus. C'est un arc, pas une blague répétée.

| # | Mission | Situation | Sens |
| --- | --- | --- | --- |
| 1 | ATLAS | Philippe bloque longtemps ; un collègue arrive, appuie sur `[ACTUALISER]`, tout marche | il subit |
| 2 | ECHO | Philippe essaie d'abord, échoue ; le collègue clique juste à côté | il anticipe mal |
| 3 | VERDANT | « ATTENDS. » Il observe, il clique, ça marche | premier vrai moment d'autonomie |
| 4 | SENTINEL | un PNJ est bloqué ; **Philippe** passe derrière et clique | il transmet |

La quatrième occurrence rejoue **le cadrage exact** de la première : même
zoom, même silence, même geste. Puis, hors champ : « J'ai toujours aucune idée
de pourquoi ça marche. » Le gag devient un payoff narratif.

Le plan est écrit une seule fois, dans `src/scenes/magic_button.js` :
coupure de la musique, zoom ×2 exact, bouton ridiculement évident, et l'on
tient sur la réaction. Les occurrences 1 (ATLAS) et 4 (SENTINEL) l'appellent
avec des rôles inversés. C'était la condition du payoff : écrites deux fois à
la main, les deux scènes auraient divergé et la quatrième serait tombée à
plat.

## Règles d'UX non négociables

- La cinématique ne doit **jamais** devenir une prison : `Tab` passe la scène,
  `Espace` maintenu accélère, `Échap` ouvre le menu.
- Entre deux plans scénarisés, le joueur reprend la main et marche lui-même.
- L'écran-titre annonce la durée (« environ 5 minutes »). Un collègue doit
  savoir dans quoi il s'engage avant de cliquer, pas après.
- Deux rythmes : normal (7–9 min à terme) et rapide (4–5 min).
- Une troisième entrée, **ALLER À LA FIN**, saute directement au coucher de
  soleil. Le but du jeu est que le message soit lu : mieux vaut un collègue
  pressé qui va droit au discours qu'un collègue qui ferme l'onglet.

## L'écran de bilan

À la fin du montage, une carte récapitule le stage — statistiques absurdes
révélées une à une, puis la chute : `RÉCOMPENSE : +1 Data Analyst`. Elle
arrive après « STAGE ▸ TERMINÉ » et avant le départ du bureau.

C'est le seul endroit où le jeu se permet un ton purement « jeu vidéo », et
c'est voulu : il ponctue les douze missions avant que le récit ne redevienne
sérieux pour la scène de départ. Le contenu est dans `T.recap`
(`src/data/script.js`) — les lignes se modifient sans toucher au code.

La jauge à cafés et les yeux utilisent deux glyphes ajoutés à la police
bitmap : `█` (bloc plein, l'espacement d'un pixel entre glyphes donne une
jauge segmentée) et un glyphe de sept colonnes pour la paire d'yeux, la
police n'ayant évidemment pas de couverture emoji.

## Plan de production des missions restantes

Le principe : **ne pas construire dix mini-jeux.** Les gimmicks du rapport se
ramènent à trois familles d'interaction. Deux kits neufs couvrent sept
missions — c'est tout le levier du projet.

| Kit | Ce qu'on fait | Missions couvertes |
| --- | --- | --- |
| **Liaison** | relier des nœuds, règles de validité, compteur d'erreurs | IRIS, ECHO, HORIZON, VERDANT |
| **Tri** | des cartes tombent, on les range dans N bacs | LEDGER, BEACON, RELAY |
| **Placement** *(fait, ATLAS)* | poser des blocs dans des zones | BRIDGE |
| **Audit** *(fait, SENTINEL)* | repérer les violations parmi des objets | — |
| — | travelling latéral, la caméra suit la donnée | SAFEPATH |
| — | composition des kits + cadre de boss | PULSE |

Ordre de construction :

1. **Kit Liaison**, puis IRIS, ECHO (gag n°2), HORIZON, VERDANT (gag n°3).
2. **Kit Tri**, puis LEDGER, BEACON, RELAY.
3. **BRIDGE** sur le kit de placement — 20 secondes de respiration entre deux
   morceaux denses.
4. **SAFEPATH**, la seule scène vraiment sur mesure.
5. **PULSE en dernier.** Ses trois phases sont exactement les kits déjà
   écrits, plus un cadre de boss : le construire à la fin, c'est l'obtenir
   presque gratuitement.

Deux disciplines à tenir. **La durée** : douze missions à leur durée annoncée
font six minutes, plus trois de récit — on tient la cible, à condition de
couper plutôt que d'ajouter. Une mission qui a besoin d'un tutoriel est trop
compliquée : chacune porte une idée, une seule. **La difficulté** : personne
ne doit échouer, l'erreur est comique (le BONK d'ATLAS, le faux positif de
SENTINEL), jamais punitive.

## Reste à produire

1. **Sprites Aseprite** en remplacement des placeholders (voir PIPELINE.md).
   La pose « assis près de la fenêtre, casque posé à côté » mérite un vrai
   dessin : c'est le dernier plan du jeu.
2. **Missions 02 → 10 et 12**, selon le plan ci-dessus. `mission_atlas.js` et
   `mission_sentinel.js` servent de gabarits (intro → gimmick → récompense →
   retour au présent).
3. **Pause déjeuner** : le rapport insiste — aucune compétence, aucun KPI,
   juste des conversations. C'est le rappel que le souvenir du stage vient
   aussi des personnes.
4. **PNJ manquants** : la carte complète compte 7 profils BI, 6 Data
   Engineering, 5 produit. Le prototype en expose 4.
