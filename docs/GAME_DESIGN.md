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
| 11 | SENTINEL | prototyper un agent de gouvernance | bouton magique **inversé** | 40 s | à faire |
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

Implémenté dans `src/scenes/mission_atlas.js` (occurrence 1) : coupure de la
musique, zoom ×2 exact, bouton ridiculement évident, et le plan tient sur la
réaction de Philippe après le succès.

## Règles d'UX non négociables

- La cinématique ne doit **jamais** devenir une prison : `Tab` passe la scène,
  `Espace` maintenu accélère, `Échap` ouvre le menu.
- Entre deux plans scénarisés, le joueur reprend la main et marche lui-même.
- L'écran-titre annonce la durée (« environ 5 minutes »). Un collègue doit
  savoir dans quoi il s'engage avant de cliquer, pas après.
- Deux rythmes : normal (7–9 min à terme) et rapide (4–5 min).

## Reste à produire

1. **URL LinkedIn** dans `src/config.js` — seul champ manquant pour diffuser.
2. **Sprites Aseprite** en remplacement des placeholders (voir PIPELINE.md).
   La pose « assis près de la fenêtre, casque posé à côté » mérite un vrai
   dessin : c'est le dernier plan du jeu.
3. **Missions 02 → 12.** Chaque mission est une scène autonome ; `mission_atlas.js`
   sert de gabarit (intro → gimmick → récompense → retour au présent).
4. **Pause déjeuner** : le rapport insiste — aucune compétence, aucun KPI,
   juste des conversations. C'est le rappel que le souvenir du stage vient
   aussi des personnes.
5. **PNJ manquants** : la carte complète compte 7 profils BI, 6 Data
   Engineering, 5 produit. Le prototype en expose 4.
