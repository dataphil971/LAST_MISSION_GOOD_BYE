"""Rig pixel-art parametrique du heros et des PNJ (placeholders de production).

Regles appliquees (cf. docs/ART_BIBLE.md) :
  - resolution native, aucun anti-aliasing, aucun pixel semi-transparent ;
  - cellule 48x64 en gameplay, pivot bas-centre (24, 60) ;
  - corps ~25 px de large et 46 px de haut casque compris : on ne remplit
    JAMAIS toute la cellule ;
  - rampes de 3 a 4 tons par matiere ;
  - contours teintes par matiere, jamais #000000.
"""

# --------------------------------------------------------------------------
# Palette projet (identique a src/data/palette.js)
# --------------------------------------------------------------------------
P = {
    "outline_deep": "#211820",
    "outline_warm": "#35252A",
    "helmet_light": "#FFE76A",
    "helmet_base": "#F0C94F",
    "helmet_shadow": "#C99231",
    "helmet_deep": "#73501F",
    "skin_light": "#F0BB96",
    "skin_base": "#CE896A",
    "skin_shadow": "#925543",
    "shirt_light": "#6E8996",
    "shirt_base": "#435D6B",
    "shirt_shadow": "#293D49",
    "trouser_base": "#333A46",
    "trouser_shadow": "#222832",
    "shoe": "#3B302C",
    "hair_base": "#4A382F",
    "hair_shadow": "#2A1F1B",
    "logo_dark": "#211820",   # losange de la marque, jamais du noir pur
    "logo_orange": "#E4761F",
    "ui_panel": "#2E1F2A",
    "ui_border": "#6C4034",
    "phone_screen": "#8FB8C9",
}

# Contour attribue a chaque matiere : ni noir pur, ni contour unique global.
OUTLINE_OF = {
    "helmet_light": "helmet_deep",
    "helmet_base": "helmet_deep",
    "helmet_shadow": "helmet_deep",
    "helmet_deep": "helmet_deep",
    "skin_light": "outline_warm",
    "skin_base": "outline_warm",
    "skin_shadow": "outline_warm",
}
DEFAULT_OUTLINE = "outline_deep"

# Priorite de la matiere qui gagne le contour quand plusieurs se touchent.
_PRIORITY = ["helmet_", "skin_", "hair_", "shirt_", "trouser_", "shoe"]


def rgba(name):
    h = P[name].lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


class Cell:
    """Une cellule de spritesheet : grille de noms de couleurs, ou None."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.g = [[None] * w for _ in range(h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = c

    def get(self, x, y):
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.g[y][x]
        return None

    def rect(self, x0, y0, x1, y1, c):
        """Rectangle plein, bornes incluses."""
        for y in range(min(y0, y1), max(y0, y1) + 1):
            for x in range(min(x0, x1), max(x0, x1) + 1):
                self.set(x, y, c)

    def row(self, y, x0, x1, c):
        self.rect(x0, y, x1, y, c)

    def outline(self):
        """Contour selectif exterieur, teinte par la matiere voisine."""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] is not None:
                    continue
                mats = []
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    m = self.get(x + dx, y + dy)
                    if m:
                        mats.append(m)
                if not mats:
                    continue
                mats.sort(key=lambda m: next(
                    (i for i, p in enumerate(_PRIORITY) if m.startswith(p)), 99))
                add.append((x, y, OUTLINE_OF.get(mats[0], DEFAULT_OUTLINE)))
        for x, y, c in add:
            self.set(x, y, c)
        return self


# --------------------------------------------------------------------------
# Skins : le heros porte le casque, les PNJ portent des cheveux.
# --------------------------------------------------------------------------
HERO = {
    "helmet": True,
    "shirt": ("shirt_light", "shirt_base", "shirt_shadow"),
    "hair": ("hair_base", "hair_shadow"),
}


def _register_ramp(prefix, values):
    """Injecte des couleurs libres dans la palette et renvoie leurs cles."""
    keys = []
    for hexv in values:
        if hexv.startswith("#"):
            key = "%s_%s" % (prefix, hexv[1:].lower())
            P.setdefault(key, hexv)
            keys.append(key)
        else:
            keys.append(hexv)
    return tuple(keys)


def npc_skin(shirt, hair=("#4A382F", "#2A1F1B")):
    return {
        "helmet": False,
        "shirt": _register_ramp("npc_shirt", shirt),
        "hair": _register_ramp("npc_hair", hair),
    }


# Tenues PNJ : chaque profil garde une couleur secondaire identifiable.
NPC_SKINS = {
    "reception": npc_skin(("#B9866B", "#8E5B47", "#5E3A2E")),
    # le tuteur est jeune : corporate mais decontracte. Chemise bleue sans
    # cravate, cheveux bruns fournis -- surtout pas de gris.
    "tutor": npc_skin(("#7C93B5", "#4E6488", "#33415C"), ("#4A3527", "#2B1E16")),
    "bi07": npc_skin(("#93A86D", "#63784A", "#3D4A2C")),
    "peer": npc_skin(("#C08A79", "#96604F", "#5F3A30"), ("#2A2420", "#1B1714")),
}


# --------------------------------------------------------------------------
# Pose : tous les parametres d'animation passent par ce dictionnaire.
# --------------------------------------------------------------------------
def pose(**kw):
    p = dict(
        view="side",      # side | front | back
        flip=False,       # regarde vers la gauche
        bob=0,            # respiration / rebond de marche, en pixels
        helmet_dy=0,      # casque = second visage : -2 surprise, +2 depit
        helmet_tilt=0,    # inclinaison 1 px (confusion)
        arm_front=0,      # balancement du bras avant
        arm_back=0,
        leg_a=0,          # ecart des jambes
        leg_b=0,
        eyes="open",      # open | wide | closed | low
        sit=False,
        hand_up=False,    # bras leve (salut, attends, index tendu)
        hand_out=False,   # bras tendu vers l ecran (clic bouton magique)
        backpack=False,
        phone=False,
        bare=False,       # casque retire : la scene finale du transport
        base_y=58,        # ligne de sol : le bas des chaussures
        cx=24,            # axe vertical du corps
        skin=None,
    )
    p.update(kw)
    if p["skin"] is None:
        p["skin"] = HERO
    return p


def _eyes(c, x0, y, kind, spacing):
    """Yeux : 1 px neutre, 2 px ecarquilles, trait horizontal ferme."""
    if kind == "closed":
        c.row(y, x0, x0 + 1, "outline_warm")
        if spacing:
            c.row(y, x0 + spacing, x0 + spacing + 1, "outline_warm")
        return
    tone = "outline_warm" if kind == "low" else "outline_deep"
    c.set(x0, y, tone)
    if spacing:
        c.set(x0 + spacing, y, tone)
    if kind == "wide":
        c.set(x0, y + 1, tone)
        if spacing:
            c.set(x0 + spacing, y + 1, tone)


def _helmet_logo(c, cx, top):
    """Marque du casque : losange sombre, C orange, 7x5 px.

    A cette echelle, un logo doit etre construit pixel par pixel : les deux
    barres et le montant gauche du C sont ce qui le rend lisible a 1x. Le
    losange garde une bordure d au moins un pixel sur chaque rangee.
    """
    # Le losange descend vers le bord du casque : place tout en haut du dome,
    # sa pointe se confondrait avec la silhouette.
    y = top + 1
    c.rect(cx - 1, y, cx + 1, y, "logo_dark")
    c.rect(cx - 2, y + 1, cx + 2, y + 1, "logo_dark")
    c.rect(cx - 3, y + 2, cx + 3, y + 2, "logo_dark")
    c.rect(cx - 2, y + 3, cx + 2, y + 3, "logo_dark")
    c.rect(cx - 1, y + 4, cx + 1, y + 4, "logo_dark")
    c.rect(cx - 1, y + 1, cx + 1, y + 1, "logo_orange")   # barre haute du C
    c.set(cx - 1, y + 2, "logo_orange")                    # montant gauche
    c.rect(cx - 1, y + 3, cx + 1, y + 3, "logo_orange")    # barre basse


def _helmet_front(c, cx, top, sk, tilt, logo=True):
    """Casque jaune : dome + large bord. Signature graphique du heros."""
    if not sk["helmet"]:
        c.rect(cx - 7, top + 2, cx + 7, top + 5, sk["hair"][0])
        c.rect(cx - 7, top + 6, cx - 6, top + 8, sk["hair"][1])
        c.rect(cx + 6, top + 6, cx + 7, top + 8, sk["hair"][1])
        c.row(top + 1, cx - 5, cx + 5, sk["hair"][0])
        return
    t = tilt
    c.rect(cx - 6 + t, top, cx + 6 + t, top + 1, "helmet_base")
    c.row(top, cx - 4 + t, cx + 2 + t, "helmet_light")
    c.rect(cx - 7 + t, top + 2, cx + 7 + t, top + 4, "helmet_base")
    c.rect(cx - 6 + t, top + 2, cx - 3 + t, top + 3, "helmet_light")
    c.rect(cx + 4 + t, top + 2, cx + 7 + t, top + 4, "helmet_shadow")
    # bord (visiere) : deborde de chaque cote, c est lui qui porte la lecture
    c.rect(cx - 10 + t, top + 5, cx + 10 + t, top + 5, "helmet_base")
    c.rect(cx - 10 + t, top + 6, cx + 10 + t, top + 6, "helmet_shadow")
    c.row(top + 5, cx - 9 + t, cx - 4 + t, "helmet_light")
    if logo:
        _helmet_logo(c, cx + t, top)


def _helmet_side(c, cx, top, sk, tilt):
    if not sk["helmet"]:
        c.rect(cx - 6, top + 2, cx + 4, top + 5, sk["hair"][0])
        c.rect(cx - 6, top + 6, cx - 4, top + 9, sk["hair"][1])
        c.row(top + 1, cx - 4, cx + 3, sk["hair"][0])
        return
    t = tilt
    c.rect(cx - 5 + t, top, cx + 5 + t, top + 1, "helmet_base")
    c.row(top, cx - 4 + t, cx + 1 + t, "helmet_light")
    c.rect(cx - 6 + t, top + 2, cx + 6 + t, top + 4, "helmet_base")
    c.rect(cx - 6 + t, top + 2, cx - 3 + t, top + 3, "helmet_light")
    c.rect(cx + 4 + t, top + 2, cx + 6 + t, top + 4, "helmet_shadow")
    c.rect(cx - 8 + t, top + 5, cx + 9 + t, top + 5, "helmet_base")
    c.rect(cx - 8 + t, top + 6, cx + 9 + t, top + 6, "helmet_shadow")
    c.row(top + 5, cx - 7 + t, cx - 2 + t, "helmet_light")
    # de profil, la marque se decale vers l avant du casque
    _helmet_logo(c, cx + 1 + t, top)


def draw_character(cell, p):
    """Dessine un personnage complet dans la cellule, selon la pose."""
    sk = p["skin"]
    if p["bare"] and sk["helmet"]:
        sk = dict(sk, helmet=False)   # le casque est pose a cote de lui
    cx = p["cx"]
    base = p["base_y"] + p["bob"]

    if p["view"] in ("front", "back"):
        _draw_front(cell, p, sk, cx, base)
    else:
        _draw_side(cell, p, sk, cx, base)

    if p["flip"]:
        _flip(cell)
    return cell


def _flip(c):
    for y in range(c.h):
        c.g[y] = c.g[y][::-1]


# -- vue de face ------------------------------------------------------------
def _draw_front(c, p, sk, cx, base):
    back = p["view"] == "back"
    shoe_top = base - 3
    legs_top = base - 14
    torso_bot = legs_top - 1
    torso_top = torso_bot - 13
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    la, lb = p["leg_a"], p["leg_b"]
    c.rect(cx - 6 + la, legs_top, cx - 2 + la, shoe_top - 1, "trouser_base")
    c.rect(cx + 2 + lb, legs_top, cx + 6 + lb, shoe_top - 1, "trouser_shadow")
    c.rect(cx - 7 + la, shoe_top, cx - 1 + la, base, "shoe")
    c.rect(cx + 1 + lb, shoe_top, cx + 7 + lb, base, "shoe")

    c.rect(cx - 8, torso_top, cx + 8, torso_bot, sk["shirt"][1])
    c.rect(cx - 8, torso_top, cx - 5, torso_bot, sk["shirt"][0])
    c.rect(cx + 6, torso_top, cx + 8, torso_bot, sk["shirt"][2])
    c.rect(cx - 2, torso_top + 2, cx - 1, torso_bot - 2, sk["shirt"][2])

    for side, off in ((-1, p["arm_back"]), (1, p["arm_front"])):
        ax = cx + side * 10
        if side == 1 and p["hand_up"]:
            c.rect(ax - 1, torso_top - 6, ax + 1, torso_top + 3, sk["shirt"][1])
            c.rect(ax - 1, torso_top - 8, ax + 1, torso_top - 7, "skin_base")
        elif side == 1 and p["hand_out"]:
            c.rect(ax - 1, torso_top + 3, ax + 1, torso_top + 5, sk["shirt"][1])
            c.rect(ax + 2, torso_top + 4, ax + 5, torso_top + 5, "skin_base")
        else:
            tone = sk["shirt"][2] if side == -1 else sk["shirt"][0]
            c.rect(ax - 1, torso_top + off, ax + 1, torso_bot - 3 + off, tone)
            c.rect(ax - 1, torso_bot - 2 + off, ax + 1, torso_bot + off, "skin_base")

    c.rect(cx - 6, head_top, cx + 6, head_bot, "skin_base")
    c.rect(cx - 6, head_top, cx - 3, head_bot - 2, "skin_light")
    c.rect(cx + 4, head_top + 1, cx + 6, head_bot, "skin_shadow")
    if back:
        c.rect(cx - 6, head_top, cx + 6, head_top + 5, sk["hair"][0])
    else:
        _eyes(c, cx - 4, head_top + 4, p["eyes"], 7)
        c.row(head_bot - 1, cx - 2, cx + 1, "skin_shadow")

    # vu de dos, on ne voit pas la marque : elle est a l avant du casque
    _helmet_front(c, cx, helmet_top, sk, p["helmet_tilt"], logo=not back)
    if p["backpack"]:
        c.rect(cx - 11, torso_top + 2, cx - 9, torso_bot - 1, "ui_panel")
        c.rect(cx + 9, torso_top + 2, cx + 11, torso_bot - 1, "ui_panel")


# -- vue de profil (tourne vers la droite avant flip) -----------------------
def _draw_side(c, p, sk, cx, base):
    if p["sit"]:
        _draw_sit(c, p, sk, cx, base)
        return

    shoe_top = base - 3
    legs_top = base - 14
    torso_bot = legs_top - 1
    torso_top = torso_bot - 13
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    la, lb = p["leg_a"], p["leg_b"]
    c.rect(cx - 4 + lb, legs_top, cx + 0 + lb, shoe_top - 1, "trouser_shadow")
    c.rect(cx - 5 + lb, shoe_top, cx + 1 + lb, base, "shoe")
    c.rect(cx - 2 + la, legs_top, cx + 2 + la, shoe_top - 1, "trouser_base")
    c.rect(cx - 3 + la, shoe_top, cx + 4 + la, base, "shoe")

    c.rect(cx - 5, torso_top, cx + 5, torso_bot, sk["shirt"][1])
    c.rect(cx - 5, torso_top, cx - 3, torso_bot, sk["shirt"][2])
    c.rect(cx + 3, torso_top, cx + 5, torso_bot - 2, sk["shirt"][0])

    ax = cx + 2 + p["arm_front"]
    if p["hand_up"]:
        c.rect(ax, torso_top - 7, ax + 2, torso_top + 3, sk["shirt"][1])
        c.rect(ax, torso_top - 9, ax + 2, torso_top - 8, "skin_base")
    elif p["hand_out"]:
        c.rect(cx + 3, torso_top + 3, cx + 7, torso_top + 5, sk["shirt"][1])
        c.rect(cx + 8, torso_top + 3, cx + 10, torso_top + 5, "skin_base")
        c.set(cx + 11, torso_top + 4, "skin_light")
    elif p["phone"]:
        c.rect(cx + 2, torso_top + 3, cx + 4, torso_top + 6, sk["shirt"][1])
        c.rect(cx + 5, torso_top + 5, cx + 6, torso_top + 6, "skin_base")
        c.rect(cx + 5, torso_top + 1, cx + 7, torso_top + 4, "ui_panel")
        c.rect(cx + 6, torso_top + 2, cx + 6, torso_top + 3, "phone_screen")
    else:
        c.rect(ax, torso_top + 1, ax + 2, torso_bot - 3, sk["shirt"][1])
        c.rect(ax, torso_bot - 2, ax + 2, torso_bot, "skin_base")

    c.rect(cx - 5, head_top, cx + 5, head_bot, "skin_base")
    c.rect(cx - 1, head_top, cx + 3, head_bot - 3, "skin_light")
    c.rect(cx - 5, head_top, cx - 3, head_bot, "skin_shadow")
    c.rect(cx + 6, head_top + 3, cx + 6, head_top + 4, "skin_base")
    _eyes(c, cx + 2, head_top + 4, p["eyes"], 0)
    c.row(head_bot - 1, cx + 2, cx + 4, "skin_shadow")
    c.rect(cx - 6, head_top + 1, cx - 5, head_bot - 2, sk["hair"][0])

    _helmet_side(c, cx, helmet_top, sk, p["helmet_tilt"])
    if p["backpack"]:
        c.rect(cx - 9, torso_top + 1, cx - 6, torso_bot - 2, "ui_panel")
        c.rect(cx - 9, torso_top + 1, cx - 8, torso_top + 4, "ui_border")


def _draw_sit(c, p, sk, cx, base):
    """Assis de profil : cuisses horizontales, tibias verticaux."""
    hip = base - 13
    torso_bot = hip - 1
    torso_top = torso_bot - 12
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    c.rect(cx - 4, hip, cx + 7, hip + 2, "trouser_base")
    c.rect(cx - 4, hip + 3, cx + 7, hip + 3, "trouser_shadow")
    c.rect(cx + 4, hip + 4, cx + 7, base - 3, "trouser_shadow")
    c.rect(cx + 3, base - 2, cx + 9, base, "shoe")

    c.rect(cx - 5, torso_top, cx + 4, torso_bot, sk["shirt"][1])
    c.rect(cx - 5, torso_top, cx - 3, torso_bot, sk["shirt"][2])
    c.rect(cx + 2, torso_top, cx + 4, torso_bot - 2, sk["shirt"][0])

    reach = 6 + p["arm_front"]
    c.rect(cx + 2, torso_top + 4, cx + reach, torso_top + 6, sk["shirt"][1])
    c.rect(cx + reach + 1, torso_top + 5, cx + reach + 2, torso_top + 6, "skin_base")

    c.rect(cx - 5, head_top, cx + 5, head_bot, "skin_base")
    c.rect(cx - 1, head_top, cx + 3, head_bot - 3, "skin_light")
    c.rect(cx - 5, head_top, cx - 3, head_bot, "skin_shadow")
    c.rect(cx + 6, head_top + 3, cx + 6, head_top + 4, "skin_base")
    _eyes(c, cx + 2, head_top + 4, p["eyes"], 0)
    c.rect(cx - 6, head_top + 1, cx - 5, head_bot - 2, sk["hair"][0])
    _helmet_side(c, cx, helmet_top, sk, p["helmet_tilt"])
