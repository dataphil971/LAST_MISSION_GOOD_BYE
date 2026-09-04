"""Genere les spritesheets PLACEHOLDER du prototype.

Ces atlas ne sont pas l art definitif : ils tiennent la place des exports
Aseprite (cf. docs/PIPELINE.md) en respectant exactement les memes
contraintes -- taille de cellule, pivot, nombre de frames, noms de tags et
format JSON. Le jour ou les vrais sprites arrivent, on remplace les .png et
les .json : aucune ligne de code moteur ne bouge.

    python tools/gen_sprites.py

Sortie :
    assets/hero/hero_gameplay.png + .json    cellule 48x64, pivot (24, 60)
    assets/hero/hero_cutscene.png + .json    cellule 64x80, pivot (32, 76)
    assets/npc/npc_office.png   + .json      cellule 48x64, pivot (24, 60)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from png import write_rgba  # noqa: E402
import rig  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = 8

# Ecart des jambes, pose par pose : le cycle complet fait 8 temps et ne
# progresse jamais de plus d un pixel. Partage par le heros et les PNJ.
WALK_SWING = [(-2, 2), (-1, 1), (0, 0), (1, -1),
              (2, -2), (1, -1), (0, 0), (-1, 1)]


# --------------------------------------------------------------------------
# Cycles d animation : chaque entree renvoie la liste des poses d un tag.
# La regle de la Bible d art est respectee : 1 px de respiration maximum,
# et le casque joue plus que le corps.
# --------------------------------------------------------------------------
def hero_tags(cell_w, cell_h, base_y, cx):
    def p(**kw):
        kw.setdefault("base_y", base_y)
        kw.setdefault("cx", cx)
        return rig.pose(**kw)

    # Marche : 8 temps, jamais plus d un pixel d ecart entre deux poses.
    # A cette echelle, un saut de 2 px se voit immediatement et donne une
    # demarche sautillante. Le buste ne monte d un pixel qu au passage,
    # quand les deux jambes se croisent -- comme dans un vrai cycle.
    walk = []
    for a, b in WALK_SWING:
        walk.append(p(view="side", leg_a=a, leg_b=b, arm_front=-a,
                      bob=-1 if a == 0 else 0))

    walk_front = []
    for a, b in [(-1, 1), (0, 0), (1, -1), (0, 0)]:
        walk_front.append(p(view="front", leg_a=a, leg_b=b, arm_front=b,
                            arm_back=a, bob=-1 if a == 0 else 0))

    return {
        # -- locomotion -------------------------------------------------
        "hero/gp/idle/side": [
            p(view="side"), p(view="side", bob=-1),
            p(view="side"), p(view="side", eyes="closed"),
        ],
        "hero/gp/idle/front": [
            p(view="front"), p(view="front", bob=-1),
            p(view="front"), p(view="front", eyes="closed"),
        ],
        "hero/gp/idle/back": [p(view="back"), p(view="back", bob=-1)],
        "hero/gp/walk/side": walk,
        "hero/gp/walk/front": walk_front,
        "hero/gp/walk/back": [p(view="back", leg_a=a, leg_b=b)
                              for a, b in [(-1, 1), (0, 0), (1, -1), (0, 0)]],
        # -- bureau -----------------------------------------------------
        "hero/gp/sit": [p(view="side", sit=True),
                        p(view="side", sit=True, bob=-1)],
        "hero/gp/type": [p(view="side", sit=True, arm_front=a)
                         for a in (0, 1, 0, -1)],
        # -- reactions --------------------------------------------------
        "hero/gp/think": [p(view="side", helmet_dy=-1, arm_front=-1),
                          p(view="side", helmet_dy=-1, arm_front=-1, bob=-1)],
        "hero/gp/confused": [p(view="side", helmet_tilt=1, eyes="wide"),
                             p(view="side", helmet_tilt=1, eyes="wide", bob=-1)],
        "hero/gp/error": [p(view="front", helmet_dy=2, eyes="wide"),
                          p(view="front", helmet_dy=2, eyes="wide", bob=-1)],
        "hero/gp/adjust_helmet": [
            p(view="side", hand_up=True, helmet_dy=-1),
            p(view="side", hand_up=True, helmet_dy=0),
            p(view="side"),
        ],
        "hero/gp/wave": [
            p(view="front", hand_up=True), p(view="front", hand_up=True, bob=-1),
            p(view="front", hand_up=True), p(view="front"),
        ],
        "hero/gp/point": [p(view="side", hand_out=True),
                          p(view="side", hand_out=True, bob=-1)],
        # -- sac a dos (arrivee et depart) ------------------------------
        "hero/gp/backpack/idle": [p(view="side", backpack=True),
                                  p(view="side", backpack=True, bob=-1)],
        "hero/gp/backpack/walk": [
            p(view="side", backpack=True, leg_a=a, leg_b=b, arm_front=-a,
              bob=-1 if a == 0 else 0)
            for a, b in WALK_SWING
        ],
    }


def hero_cutscene_tags(base_y, cx):
    def p(**kw):
        kw.setdefault("base_y", base_y)
        kw.setdefault("cx", cx)
        return rig.pose(**kw)

    return {
        # bouton magique : anticipation, un seul clic, puis reaction tenue
        "hero/cs/magic/press": [
            p(view="side", hand_up=True, eyes="open"),
            p(view="side", hand_out=True, eyes="open"),
            p(view="side", hand_out=True, eyes="wide"),
            p(view="side", helmet_dy=-1, eyes="wide"),
        ],
        "hero/cs/magic/receive": [
            p(view="side", eyes="wide"),
            p(view="side", eyes="wide", helmet_dy=-2),
            p(view="side", eyes="wide", helmet_dy=-1),
            p(view="side", eyes="low", helmet_dy=1),
        ],
        "hero/cs/phone": [p(view="side", phone=True),
                          p(view="side", phone=True, bob=-1)],
        # 2 h 03 de trajet : le casque descend lentement jusqu aux yeux
        "hero/cs/phone_shock": [
            p(view="side", phone=True, eyes="wide"),
            p(view="side", phone=True, eyes="wide", helmet_dy=1),
            p(view="side", phone=True, eyes="low", helmet_dy=2),
            p(view="side", phone=True, eyes="low", helmet_dy=3),
        ],
        "hero/cs/goodbye": [
            p(view="front", hand_up=True), p(view="front", hand_up=True, bob=-1),
            p(view="front", hand_up=True), p(view="front", hand_up=True, bob=-1),
        ],
        # il s eloigne, s arrete, se retourne : il devient petit dans le cadre
        "hero/cs/sunset_turn": [
            p(view="back", backpack=True),
            p(view="back", backpack=True, bob=-1),
            p(view="side", backpack=True, flip=True),
            p(view="side", backpack=True, flip=True, eyes="closed"),
        ],
        # ecran final : le casque n est plus sur sa tete, il est pose a cote
        "hero/cs/sit_window": [
            p(view="side", sit=True, arm_front=-4, bare=True),
            p(view="side", sit=True, arm_front=-4, bare=True, bob=-1),
            p(view="side", sit=True, arm_front=-4, bare=True, eyes="closed"),
        ],
    }


def npc_tags(base_y, cx):
    tags = {}
    for name, skin in rig.NPC_SKINS.items():
        def p(**kw):
            kw.setdefault("base_y", base_y)
            kw.setdefault("cx", cx)
            kw.setdefault("skin", skin)
            return rig.pose(**kw)

        # rest=True : la posture propre au personnage (poches, bras croises,
        # sac) ne s applique qu au repos -- pendant la marche, les bras
        # balancent comme ceux de tout le monde.
        tags["npc/%s/idle" % name] = [p(view="front", rest=True),
                                      p(view="front", rest=True, bob=-1)]
        tags["npc/%s/idle_side" % name] = [p(view="side", rest=True),
                                           p(view="side", rest=True, bob=-1)]
        tags["npc/%s/walk" % name] = [
            p(view="side", leg_a=a, leg_b=b, arm_front=-a,
              bob=-1 if a == 0 else 0)
            for a, b in WALK_SWING
        ]
        # parler, c est ouvrir la bouche -- un PNJ qui cligne des yeux en
        # guise de dialogue a l air de dormir debout
        tags["npc/%s/talk" % name] = [p(view="front", rest=True),
                                      p(view="front", rest=True, mouth="open"),
                                      p(view="front", rest=True, mouth="open",
                                        bob=-1),
                                      p(view="front", rest=True)]
        tags["npc/%s/sit" % name] = [p(view="side", sit=True, rest=True),
                                     p(view="side", sit=True, rest=True,
                                       bob=-1)]
        # le geste du bouton magique : approche, index, retrait
        tags["npc/%s/press" % name] = [
            p(view="side", hand_up=True),
            p(view="side", hand_out=True),
            p(view="side"),
        ]
    return tags


# --------------------------------------------------------------------------
# Assemblage de l atlas + metadonnees au format Aseprite (json-array)
# --------------------------------------------------------------------------
def build(tags, cell_w, cell_h, pivot, png_path, json_path, image_name):
    order = list(tags.keys())
    frames, frame_tags, index = [], [], 0
    cells = []
    for tag in order:
        start = index
        for ps in tags[tag]:
            cell = rig.Cell(cell_w, cell_h)
            rig.draw_character(cell, ps)
            cell.outline()
            cells.append(cell)
            index += 1
        frame_tags.append({"name": tag, "from": start, "to": index - 1,
                           "direction": "forward"})

    total = len(cells)
    cols = min(COLS, total)
    rows = (total + cols - 1) // cols
    width, height = cols * cell_w, rows * cell_h

    transparent = (0, 0, 0, 0)
    pixels = [[transparent] * width for _ in range(height)]
    for i, cell in enumerate(cells):
        ox, oy = (i % cols) * cell_w, (i // cols) * cell_h
        for y in range(cell_h):
            for x in range(cell_w):
                name = cell.g[y][x]
                if name is not None:
                    pixels[oy + y][ox + x] = rig.rgba(name)
        frames.append({
            "filename": "%s %d.ase" % (image_name.split(".")[0], i),
            "frame": {"x": ox, "y": oy, "w": cell_w, "h": cell_h},
            "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": cell_w, "h": cell_h},
            "sourceSize": {"w": cell_w, "h": cell_h},
            "duration": 120,
        })

    write_rgba(png_path, width, height, pixels)

    meta = {
        "app": "tools/gen_sprites.py (placeholder)",
        "version": "1.0",
        "image": image_name,
        "format": "RGBA8888",
        "size": {"w": width, "h": height},
        "scale": "1",
        "frameTags": frame_tags,
        "slices": [{
            "name": "pivot", "color": "#0000ffff",
            "keys": [{"frame": 0,
                      "bounds": {"x": 0, "y": 0, "w": cell_w, "h": cell_h},
                      "pivot": {"x": pivot[0], "y": pivot[1]}}],
        }],
    }
    with open(json_path, "w", encoding="utf-8") as fh:
        json.dump({"frames": frames, "meta": meta}, fh, indent=1)
    return total, width, height


def check_cast_distinct():
    """Deux collegues ne partagent jamais coiffure ET tenue.

    C est la seule regle de casting qu une machine peut verifier : le reste
    (taille, posture, accessoire) se juge a l oeil sur la planche de
    tools/cast_sheet.mjs. Elle tourne a chaque generation parce qu un
    doublon se voit tres mal dans le code et tres bien dans le jeu.
    """
    seen = {}
    for name, sk in rig.NPC_SKINS.items():
        key = (sk["style"], sk["shirt"])
        if key in seen:
            raise SystemExit(
                "Casting : %s et %s partagent la coiffure %s et la meme tenue."
                % (seen[key], name, sk["style"]))
        seen[key] = name


def main():
    check_cast_distinct()
    out = []
    out.append(("hero_gameplay", build(
        hero_tags(48, 64, 58, 24), 48, 64, (24, 60),
        os.path.join(ROOT, "assets/hero/hero_gameplay.png"),
        os.path.join(ROOT, "assets/hero/hero_gameplay.json"),
        "hero_gameplay.png")))
    out.append(("hero_cutscene", build(
        hero_cutscene_tags(74, 32), 64, 80, (32, 76),
        os.path.join(ROOT, "assets/hero/hero_cutscene.png"),
        os.path.join(ROOT, "assets/hero/hero_cutscene.json"),
        "hero_cutscene.png")))
    out.append(("npc_office", build(
        npc_tags(58, 24), 48, 64, (24, 60),
        os.path.join(ROOT, "assets/npc/npc_office.png"),
        os.path.join(ROOT, "assets/npc/npc_office.json"),
        "npc_office.png")))
    for name, (n, w, h) in out:
        print("%-16s %3d frames  %dx%d" % (name, n, w, h))


if __name__ == "__main__":
    main()
