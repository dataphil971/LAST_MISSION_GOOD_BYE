# Pipeline d'assets — Aseprite → PNG/JSON → moteur

## Principe

Le moteur ne connaît que des **tags** (`hero/gp/walk/side`) et un **pivot**.
Il lit un PNG accompagné d'un JSON au format Aseprite `json-array`. Les
spritesheets actuelles sont des placeholders générés par script, mais elles
exposent déjà les tags, les cellules et les pivots définitifs.

**Remplacer les fichiers d'`assets/` par de vrais exports Aseprite ne demande
aucune modification de code.**

## Le piège à éviter

Ne jamais demander à une IA « génère-moi 250 frames cohérentes dans un grand
spritesheet ». La stratégie qui tient :

```
A. Turnaround canonique du personnage   → validé
B. Expressions canon                    → validé
C. Poses clés                           → validé
D. Une animation à la fois              → nettoyage
E. Assemblage Aseprite                  → export PNG + JSON
```

L'IA produit de la matière graphique contrôlée. **Aseprite reste la source de
vérité du spritesheet.**

Prérequis absolu avant l'étape A : la photo de référence. Sans elle, la
silhouette, le casque, la posture et l'architecture du sprite peuvent être
verrouillés, mais pas le visage, les cheveux ni la carnation.

## Atlas attendus

| Fichier | Cellule | Pivot | Contenu |
| --- | --- | --- | --- |
| `assets/hero/hero_gameplay.png` + `.json` | 48 × 64 | (24, 60) | locomotion, bureau, réactions |
| `assets/hero/hero_cutscene.png` + `.json` | 64 × 80 | (32, 76) | bouton magique, téléphone, finale |
| `assets/npc/npc_office.png` + `.json` | 48 × 64 | (24, 60) | PNJ, 4 profils |

## Tags utilisés par le moteur

Héros, gameplay :

```
hero/gp/idle/front      hero/gp/idle/back      hero/gp/idle/side
hero/gp/walk/front      hero/gp/walk/back      hero/gp/walk/side
hero/gp/sit             hero/gp/type           hero/gp/think
hero/gp/confused        hero/gp/error          hero/gp/adjust_helmet
hero/gp/wave            hero/gp/point
hero/gp/backpack/idle   hero/gp/backpack/walk
```

Héros, cinématique :

```
hero/cs/magic/press     hero/cs/magic/receive
hero/cs/phone           hero/cs/phone_shock
hero/cs/goodbye         hero/cs/sunset_turn     hero/cs/sit_window
```

PNJ — pour chaque profil `reception`, `tutor`, `bi07`, `peer` :

```
npc/<profil>/idle       npc/<profil>/idle_side
npc/<profil>/walk       npc/<profil>/talk       npc/<profil>/press
```

La correspondance clé ↔ tag est centralisée dans `src/scenes/cast.js`.

## Convention de nommage des fichiers sources

Pour ne pas disséminer une identité personnelle dans le code, le nom technique
du personnage est `hero`, jamais le prénom affiché.

```
hero_gp_idle_down_f000.png
hero_gp_walk_right_f003.png
hero_cs_magic_receive_f004.png
npc_bi_07_magic_press_f002.png
```

## Export Aseprite

Le fichier de travail reste en `.aseprite`. Les animations sont délimitées par
des **tags**, et le pivot est stocké dans une **slice** nommée `pivot`.

```bash
aseprite -b hero.aseprite \
  --sheet assets/hero/hero_gameplay.png \
  --data  assets/hero/hero_gameplay.json \
  --format json-array \
  --list-tags --list-slices
```

Le moteur lit `meta.frameTags` pour les animations et `meta.slices[pivot]`
pour l'ancrage. Si la slice est absente, le pivot vaut (0, 0) et tout se
décale : vérifier ce point en premier si un sprite « flotte ».

## Placeholders

```bash
python tools/gen_sprites.py
```

`tools/rig.py` contient un rig paramétrique (pose, casque, membres,
respiration) et `tools/png.py` un encodeur PNG en Python pur — aucune
dépendance à installer. Ces placeholders respectent la palette, les cellules,
les pivots et les contours teintés définis dans [ART_BIBLE.md](ART_BIBLE.md).

Ils ne sont **pas** l'art final : ils tiennent la place, et servent de
référence de mesure (largeur d'épaules, hauteur du casque, ligne de sol) pour
le dessin définitif.

## Moodboard

`docs/moodboard/` regroupe les références de travail. **Leur contenu image
n'est pas versionné** : une référence sert à regarder, pas à être
redistribuée. Voir [moodboard/README.md](moodboard/README.md) pour les deux
raisons — licence (filigrane commercial) et cohérence technique (les rendus
« faux pixel art » suréchantillonnés violent la Bible d'art).
