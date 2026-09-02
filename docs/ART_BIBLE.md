# Bible d'art

Règles appliquées par le code (`src/data/palette.js`, `tools/rig.py`,
`src/scenes/backdrops.js`). Toute contribution graphique doit passer les
quatre tests de validation en fin de document.

## Grammaire visuelle

L'inspiration est une **grammaire**, pas un style à copier : personnages
relativement petits devant des décors beaucoup plus riches, composition
atmosphérique par plans, couleurs chaudes, contours teintés, animation
volontairement parcimonieuse, importance des temps morts.

> Les personnages sont dessinés comme des sprites ; le fond est dessiné comme
> une peinture, mais avec uniquement des pixels.

Concrètement : clusters de pixels plutôt que du bruit, contours locaux teintés
plutôt que du noir pur, très peu de dithering, profondeur construite par plans.

## Résolution

| | |
| --- | --- |
| Canvas logique | 384 × 216 |
| Agrandissement | facteur **entier** uniquement |
| Plein HD | ×5 = 1920 × 1080 exactement |
| Filtrage | nearest-neighbour (`imageSmoothingEnabled = false`) |
| Sous-pixel | interdit — toute position dessinée est arrondie |

## Personnage : trois échelles

| Mode | Cellule | Zone réellement occupée | Pivot | Usage |
| --- | --- | --- | --- | --- |
| Gameplay | 48 × 64 | ~25 × 46 | (24, 60) | exploration |
| Cutscene | 64 × 80 | ~25 × 46 | (32, 76) | gags, interactions |
| Portrait | 128 × 128 | 80–100 | — | dialogues émotionnels (à produire) |

Le point capital : **48 × 64 est la cellule, pas la taille du personnage**. Un
personnage ne doit pas être agrandi simplement parce que de la place est
disponible. La ligne de sol est identique pour toutes les locomotions.

## Le casque comme second visage

Le casque de chantier jaune est la signature absolue du héros. Il est
légèrement surdimensionné pour survivre à la réduction, et il joue plus que le
corps.

| Émotion | Animation du casque | Paramètre du rig |
| --- | --- | --- |
| neutre | respiration verticale ±1 px | `bob` |
| surprise | bond de 2 px puis retombée | `helmet_dy: -2` |
| confusion | inclinaison de 1 px | `helmet_tilt: 1` |
| dépit | descend vers les sourcils | `helmet_dy: +2` |
| réflexion | main sous le rebord, légère levée | `helmet_dy: -1` |
| réussite | remise droite | `adjust_helmet` |
| « 2 h de trajet » | descend lentement jusqu'aux yeux | `helmet_dy: +3` |

## Palette verrouillée

Palette de projet originale, inspirée de familles chromatiques observées — ce
n'est pas une extraction d'assets existants.

| Rôle | Hex | Usage |
| --- | --- | --- |
| `outline_deep` | `#211820` | contour général très sombre |
| `outline_warm` | `#35252A` | contour intérieur, contour de peau |
| `helmet_light` | `#FFE76A` | reflet casque |
| `helmet_base` | `#F0C94F` | jaune principal |
| `helmet_shadow` | `#C99231` | volume |
| `helmet_deep` | `#73501F` | contour du casque |
| `skin_light` \* | `#F0BB96` | peau lumière |
| `skin_base` \* | `#CE896A` | peau base |
| `skin_shadow` \* | `#925543` | peau ombre |
| `shirt_light` | `#6E8996` | tenue |
| `shirt_base` | `#435D6B` | tenue |
| `shirt_shadow` | `#293D49` | tenue |
| `trouser_base` | `#333A46` | pantalon |
| `trouser_shadow` | `#222832` | pantalon |
| `shoe` | `#3B302C` | chaussures |
| `ui_panel` | `#2E1F2A` | panneaux |
| `ui_shadow` | `#241820` | profondeur UI |
| `ui_border` | `#6C4034` | cadres |
| `ui_cell` | `#6F6255` | cellule claire |
| `ui_cell_dark` | `#51483F` | cellule sombre |
| `text_cream` | `#F2E9CF` | texte principal |
| `text_muted` | `#D2C5A6` | texte secondaire |
| `accent_orange` | `#D38437` | titres, XP |
| `sunset_gold` | `#F1B55F` | scène finale |
| `sunset_coral` | `#D57A62` | horizon |
| `sunset_mauve` | `#76546B` | transition |
| `night_blue` | `#31415E` | ombres du soir |
| `success` | `#80A66D` | succès discret |
| `error` | `#B85F58` | erreur |

\* **Les trois couleurs de peau sont provisoires** et doivent être recalées sur
une photo de référence fiable. Tant que cette photo n'est pas validée, le
visage, les cheveux, la carnation et les proportions distinctives ne doivent
pas être figés : c'est précisément ainsi qu'on se retrouve avec un Philippe
légèrement différent d'une cinématique à l'autre.

## Contours

Jamais de `#000000`. Le contour est **teinté par la matière** qu'il borde :

| Matière | Contour |
| --- | --- |
| casque | `helmet_deep` |
| peau | `outline_warm` |
| tissu, pantalon, chaussures, cheveux | `outline_deep` |

Contours sélectifs uniquement : on ne détoure pas chaque volume interne.
`tools/rig.py` applique cette règle automatiquement (`Cell.outline()`).

## Animation

Retenue. Environ **1 pixel** de respiration : à cette échelle, deux pixels de
déplacement rendent déjà le personnage sautillant. Pour la comédie, on utilise
l'anticipation et les pauses plutôt que de grands mouvements.

Priorité P0 (gameplay et missions) — présentes dans le placeholder :
`idle_front/back/side`, `walk_front/back/side`, `sit`, `type`, `think`,
`confused`, `error`, `adjust_helmet`, `wave`, `point`, `backpack_idle/walk`.

Priorité P1 (arc final) — partiellement présentes : `magic_press`,
`magic_receive`, `phone`, `phone_shock`, `goodbye`, `sunset_turn`,
`sit_window`. Restent à produire : `listen`, `nod`, `small_victory`,
`thumbs_up`, `lunch_eat`, `drink`, `emotional_idle`.

Priorité P2 (confort) : `wink`, `laugh`, `facepalm`, `helmet_raise`,
`tired_walk`.

Il n'y a aucune raison de commencer par fabriquer 300 à 500 frames : on
produit P0, puis les P1 utilisées dans la finale, puis on enrichit.

## Décors

Les décors sont peints en code (`src/scenes/backdrops.js`), de façon
déterministe : un hash sur les coordonnées remplace le hasard, donc rien ne
scintille d'une image à l'autre. Ciels en **bandes franches** (aucun dégradé
lissé), grain par clusters de 2 px, profondeur par plans successifs.

Pour la scène finale, le rapport d'échelle prime : Philippe doit devenir petit
devant le bâtiment et le ciel. Le moment n'est plus « regardez mon
personnage », mais « regardez l'endroit qu'il est en train de quitter ».

## Les quatre tests de validation

Aucun asset ne part en production sans les passer.

**1. Test silhouette** — sprite entièrement noir, affiché à 1× :
Philippe reste-t-il reconnaissable ? Le casque est-il identifiable ? Les bras
se détachent-ils du torse ?

**2. Test pixel** — observer à 1×, 4× et 8× : doubles pixels, anticrénelage,
jaggies incohérents, pixels parasites, variations de palette, pivot qui saute.

**3. Test continuité** — d'une animation à l'autre : même casque, mêmes
cheveux, mêmes vêtements, même taille, même carnation, mêmes épaules.

**4. Test sécurité** — aucun nom interne, identifiant, URL interne, donnée
réelle, capture d'outil non nettoyée, ni personne identifiable sans accord.
Voir [SECURITY.md](SECURITY.md).

`node tools/screenshot.mjs` rend n'importe quelle scène en ligne de commande :
c'est l'outil de passage des tests 1 et 2 sans navigateur.
