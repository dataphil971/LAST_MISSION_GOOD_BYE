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
    "glass_frame": "#574F63",   # monture : assez claire pour ne pas faire masque
    "bag_base": "#463A48",
    "bag_strap": "#332A36",
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
_PRIORITY = ["helmet_", "skin_", "npc_skin_", "hair_", "npc_hair_",
             "shirt_", "npc_shirt_", "trouser_", "shoe"]


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
    "skin": ("skin_light", "skin_base", "skin_shadow"),
    "trousers": ("trouser_base", "trouser_shadow"),
    "shoes": "shoe",
    "sleeves": "long",
    "collar": False,
    "style": "short",
    "build": "regular",
    "height": 0,
    "logo": False,
    "glasses": False,
    "arm": "side",
    "bag": False,
}

# Carrure : une epaule d un pixel, pas plus. A cette taille, deux pixels
# transforment un collegue en armoire.
BUILD = {"slim": -1, "regular": 0, "broad": 2}

# La taille se prend dans les jambes : la ligne de sol ne bouge pas, le haut
# du corps monte. Deux pixels se voient de loin, quatre feraient dessin
# anime -- et la cellule de 64 px ne les tiendrait plus.


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


def _register_skin(values):
    """Carnation : trois tons, contour teinte peau comme celui du heros."""
    if values is None:
        return ("skin_light", "skin_base", "skin_shadow")
    keys = _register_ramp("npc_skin", values)
    for k in keys:
        OUTLINE_OF.setdefault(k, "outline_warm")
    return keys


def npc_skin(shirt, hair=("#4A382F", "#2A1F1B"), skin=None, style="short",
             build="regular", logo=False, trousers=None, height=0,
             shoes=None, sleeves="long", collar=False, glasses=False,
             arm="side", bag=False):
    """Un PNJ : une tenue, une coiffure, une carnation, une carrure.

    Le heros porte un casque, les PNJ portent des cheveux -- mais un casque
    en moins ne suffit pas a distinguer seize personnes. Ce sont ces quatre
    leviers combines qui font la silhouette (cf. docs/NPC_CAST.md), et la
    regle de casting se verifie a la generation : jamais la meme coiffure
    avec la meme tenue.
    """
    return {
        "helmet": False,
        "shirt": _register_ramp("npc_shirt", shirt),
        "hair": _register_ramp("npc_hair", hair),
        "skin": _register_skin(skin),
        "trousers": (_register_ramp("npc_trouser", trousers) if trousers
                     else ("trouser_base", "trouser_shadow")),
        "shoes": (_register_ramp("npc_shoe", (shoes,))[0] if shoes else "shoe"),
        "sleeves": sleeves,
        "collar": collar,
        "glasses": glasses,
        "arm": arm,          # side | pocket | cross
        "bag": bag,
        "style": style,
        "build": build,
        "height": height,
        "logo": logo,
    }


# Carnations. Le casting est majoritairement clair de peau ; deux profils
# s en ecartent, et aucune personnalite n en decoule -- la carnation sert la
# lisibilite du groupe, jamais le caractere (brief, section 2).
SKIN_FAIR = ("#F0BB96", "#CE896A", "#925543")     # celle du heros
SKIN_PALE = ("#F8D6B8", "#E0A98C", "#A9705A")     # plus claire encore
SKIN_WARM = ("#EFC29C", "#CB926B", "#8C5A41")
SKIN_OLIVE = ("#E2AF87", "#B87F5C", "#7D5238")
SKIN_DEEP = ("#B27A55", "#84523A", "#4F2F21")

HAIR_BLACK = ("#3A3140", "#241E2A")
HAIR_DARK = ("#463641", "#2C2230")

# Tenues PNJ : chaque profil garde une couleur secondaire identifiable.
NPC_SKINS = {
    # Chaque profil combine six leviers : coiffure, taille, carrure, tenue,
    # pantalon, manches. La regle de casting -- jamais la meme coiffure avec
    # la meme tenue -- est verifiee a la generation par gen_sprites.py.
    "reception": npc_skin(
        ("#B9866B", "#8E5B47", "#5E3A2E"), ("#6B4A38", "#3F2A20"),
        style="bun", height=-1, collar=True,
        trousers=("#4A3B44", "#322730"), shoes="#4A3038"),

    # le tuteur est jeune : corporate mais decontracte. Chemise bleue sans
    # cravate, cheveux bruns fournis -- surtout pas de gris.
    "tutor": npc_skin(
        ("#7C93B5", "#4E6488", "#33415C"), ("#4A3527", "#2B1E16"),
        style="short", collar=True, arm="pocket"),

    # BI_07 : c est elle qui vient appuyer sur le bouton dans ATLAS. Coupe
    # mi-longue, lunettes -- et une grille de sudoku dans un coin de la tete.
    "bi07": npc_skin(
        ("#93A86D", "#63784A", "#3D4A2C"), ("#4A3A2E", "#2C231C"),
        skin=SKIN_WARM, style="mid", glasses=True, collar=True,
        trousers=("#3E4636", "#2A3025"), shoes="#33301F"),

    # DE_04 : grand, mince, bras croises -- et une salle de sport le soir.
    # Carnation claire, et un t-shirt gris plutot que corail : avec une
    # tenue proche du ton de peau, les bras nus et le torse se lisaient
    # comme une seule masse et le personnage paraissait plus fonce qu il
    # ne l est.
    "peer": npc_skin(
        ("#7B7A86", "#54525F", "#35343E"), ("#2A2420", "#1B1714"),
        skin=SKIN_PALE, style="short", height=2, build="slim", arm="cross",
        sleeves="short", trousers=("#4A3F3A", "#322A27"), shoes="#4B3A2E"),

    # Deux collegues asiatiques, et deux silhouettes qu on ne confond pas :
    # cheveux courts + sweat bleu marque pour l une, cheveux longs attaches
    # pour l autre. La difference se lit en silhouette, jamais au visage.
    "bi01": npc_skin(
        ("#5B79A8", "#3D5680", "#283A57"), HAIR_BLACK, skin=SKIN_WARM,
        style="short", height=-1, logo=True, bag=True,
        trousers=("#39434F", "#262D36"), shoes="#2C3340"),

    "bi06": npc_skin(
        ("#6FA096", "#467468", "#2C4A44"), HAIR_BLACK, skin=SKIN_WARM,
        style="tail", build="slim", sleeves="short",
        trousers=("#5A4A57", "#3A2F39"), shoes="#463445"),

    # BI_02 : celle qui vient demander un coup de main dans SENTINEL.
    "bi02": npc_skin(
        ("#D09A5C", "#A2703B", "#6B4826"), HAIR_DARK, skin=SKIN_OLIVE,
        style="long", height=-1, collar=True,
        trousers=("#3A4258", "#262C3D"), shoes="#2E3345"),

    # DE_03 : carnation plus sombre, aucun autre trait construit dessus.
    "de03": npc_skin(
        ("#8A7FA8", "#5D5480", "#3B3557"), HAIR_BLACK, skin=SKIN_DEEP,
        style="crop", height=1, build="broad", sleeves="short", collar=True,
        arm="pocket", trousers=("#4B4335", "#322D24"), shoes="#3E3628"),
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
        mouth="closed",   # closed | open -- la bouche parle, pas les yeux
        rest=False,       # pose au repos : la posture propre au PNJ s applique
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


def _glasses_front(c, cx, head_top):
    """Lunettes de face : deux cadres et un pont, six pixels en tout."""
    for x0 in (cx - 6, cx + 2):
        c.row(head_top + 3, x0, x0 + 3, "glass_frame")
        c.row(head_top + 5, x0, x0 + 3, "glass_frame")
        c.rect(x0, head_top + 4, x0, head_top + 4, "glass_frame")
        c.rect(x0 + 3, head_top + 4, x0 + 3, head_top + 4, "glass_frame")
    c.row(head_top + 4, cx - 2, cx + 1, "glass_frame")   # le pont, a hauteur d oeil


def _glasses_side(c, cx, head_top):
    """De profil : un verre, une branche jusqu a l oreille."""
    c.row(head_top + 3, cx + 1, cx + 5, "glass_frame")
    c.row(head_top + 5, cx + 1, cx + 5, "glass_frame")
    c.rect(cx + 5, head_top + 4, cx + 5, head_top + 4, "glass_frame")
    c.row(head_top + 3, cx - 3, cx, "glass_frame")


def _mouth(c, x0, x1, y, kind, ss):
    """Une bouche de deux pixels : fermee, c est une ombre ; ouverte, un trou."""
    if kind == "open":
        c.rect(x0, y, x1 - 1, y + 1, "outline_warm")
    else:
        c.row(y, x0, x1, ss)


def _helmet_logo(c, cx, top):
    """Marque du casque : losange sombre, C orange, 7x6 px.

    A cette echelle, une lettre se construit pixel par pixel. Le losange
    fait six rangees, ce qui laisse quatre rangees utiles a la lettre et
    garde partout une bordure d un pixel autour d elle. Le C occupe les
    quatre : barre haute, deux rangees de montant, barre basse.
    """
    c.rect(cx - 1, top, cx + 1, top, "logo_dark")
    c.rect(cx - 2, top + 1, cx + 2, top + 1, "logo_dark")
    c.rect(cx - 3, top + 2, cx + 3, top + 2, "logo_dark")
    c.rect(cx - 3, top + 3, cx + 3, top + 3, "logo_dark")
    c.rect(cx - 2, top + 4, cx + 2, top + 4, "logo_dark")
    c.rect(cx - 1, top + 5, cx + 1, top + 5, "logo_dark")

    c.rect(cx - 1, top + 1, cx + 1, top + 1, "logo_orange")   # barre haute
    c.set(cx - 1, top + 2, "logo_orange")                      # montant
    c.set(cx - 1, top + 3, "logo_orange")
    c.rect(cx - 1, top + 4, cx + 1, top + 4, "logo_orange")    # barre basse


# --------------------------------------------------------------------------
# Coiffures : c est ce qui remplace le casque chez les PNJ, et c est le
# levier de silhouette le plus lisible dont on dispose. Une coiffure se lit
# a 1x en negatif ; un visage, non (test silhouette, docs/ART_BIBLE.md).
# --------------------------------------------------------------------------
def _hair_side(c, cx, head_top, head_bot, sk):
    """Vue de profil, personnage tourne vers la droite.

    Regle : chaque style doit deborder du crane d au moins deux pixels dans
    une direction qui lui est propre. Deux pixels, c est le minimum qui se
    voit encore une fois le sprite reduit a un aplat.
    """
    h0, h1 = sk["hair"]
    style = sk.get("style", "short")

    if style == "crop":
        # tres court : la coiffure RETRECIT la tete, c est sa signature
        c.rect(cx - 6, head_top - 2, cx + 4, head_top, h0)
        c.rect(cx - 6, head_top + 1, cx - 5, head_top + 2, h1)
        return

    c.rect(cx - 6, head_top - 4, cx + 4, head_top, h0)        # calotte
    c.row(head_top - 5, cx - 4, cx + 2, h0)                   # sommet arrondi
    c.rect(cx - 6, head_top, cx - 4, head_top + 3, h1)        # nuque

    if style == "long":
        c.rect(cx - 9, head_top - 3, cx - 5, head_bot + 6, h1)
        c.rect(cx - 8, head_top - 3, cx - 7, head_bot + 2, h0)
        c.rect(cx + 4, head_top - 1, cx + 5, head_top + 2, h1)  # meche avant
    elif style == "mid":
        # carre : la masse s arrete a la machoire, elle deborde quand meme
        # de deux pixels a l arriere -- assez pour tenir en aplat
        c.rect(cx - 8, head_top - 3, cx - 5, head_bot + 1, h1)
        c.rect(cx - 7, head_top - 3, cx - 6, head_bot - 1, h0)
        c.rect(cx + 4, head_top - 1, cx + 5, head_top + 1, h1)
    elif style == "tail":
        c.rect(cx - 8, head_top - 1, cx - 7, head_top + 1, h0)    # le noeud
        c.rect(cx - 10, head_top + 2, cx - 8, head_bot + 4, h1)   # la queue
        c.set(cx - 9, head_top + 1, h0)
        c.set(cx - 10, head_bot + 5, h1)
    elif style == "bun":
        c.rect(cx - 10, head_top - 6, cx - 7, head_top - 3, h0)   # le chignon
        c.rect(cx - 10, head_top - 4, cx - 9, head_top - 3, h1)
        c.rect(cx - 7, head_top - 4, cx - 6, head_top - 2, h1)    # l attache
    elif style == "curly":
        for i, x in enumerate(range(cx - 8, cx + 6, 2)):
            c.rect(x, head_top - 6, x + 1, head_top - 5, h0 if i % 2 else h1)
        c.rect(cx - 8, head_top - 4, cx - 6, head_top + 3, h0)
        c.rect(cx + 4, head_top - 3, cx + 5, head_top - 1, h0)


def _hair_front(c, cx, head_top, head_bot, sk, back=False):
    """Vue de face ou de dos. De dos, la coiffure occupe tout le crane."""
    h0, h1 = sk["hair"]
    style = sk.get("style", "short")

    if style == "crop":
        c.rect(cx - 7, head_top - 2, cx + 7, head_top, h0)
        c.rect(cx - 7, head_top + 1, cx - 6, head_top + 1, h1)
        c.rect(cx + 6, head_top + 1, cx + 7, head_top + 1, h1)
        if back:
            c.rect(cx - 6, head_top, cx + 6, head_top + 4, h0)
        return

    c.rect(cx - 7, head_top - 4, cx + 7, head_top, h0)
    c.row(head_top - 5, cx - 5, cx + 5, h0)
    c.rect(cx - 7, head_top, cx - 6, head_top + 3, h1)
    c.rect(cx + 6, head_top, cx + 7, head_top + 3, h1)
    if back:
        c.rect(cx - 6, head_top, cx + 6, head_top + 5, h0)

    if style == "long":
        c.rect(cx - 9, head_top - 2, cx - 7, head_bot + 5, h1)
        c.rect(cx + 7, head_top - 2, cx + 9, head_bot + 5, h1)
        c.rect(cx - 9, head_top - 2, cx - 8, head_bot + 1, h0)
    elif style == "mid":
        c.rect(cx - 8, head_top - 2, cx - 7, head_bot + 1, h1)
        c.rect(cx + 7, head_top - 2, cx + 8, head_bot + 1, h1)
        c.rect(cx - 8, head_top - 2, cx - 8, head_bot - 1, h0)
    elif style == "tail":
        # la queue depasse d un seul cote : elle dit « attaches » d un coup
        c.rect(cx - 10, head_top + 2, cx - 8, head_bot + 3, h1)
        c.rect(cx - 9, head_top, cx - 8, head_top + 1, h0)
    elif style == "bun":
        c.rect(cx - 2, head_top - 8, cx + 2, head_top - 5, h0)
        c.row(head_top - 8, cx - 1, cx + 1, h1)
    elif style == "curly":
        for i, x in enumerate(range(cx - 9, cx + 9, 2)):
            c.rect(x, head_top - 6, x + 1, head_top - 5, h0 if i % 2 else h1)
        c.rect(cx - 9, head_top - 4, cx - 8, head_top + 3, h0)
        c.rect(cx + 8, head_top - 4, cx + 9, head_top + 3, h0)


def _sleeve_logo(c, cx, top):
    """De profil, la marque tombe a 3 px : on garde la tache, pas la lettre.

    Ecrire un C de trois pixels de haut donnerait une bouillie ; un carre
    sombre a coeur orange se lit comme un logo et ne ment sur rien.
    """
    c.rect(cx - 1, top, cx + 1, top + 2, "logo_dark")
    c.set(cx, top + 1, "logo_orange")


def _chest_logo(c, cx, top):
    """La marque sur un sweat, meme losange que sur le casque, 7x6 px.

    ATTENTION : c est la deuxieme et derniere apparition de la marque de
    l employeur dans le jeu (voir docs/SECURITY.md). Retirer les deux
    appels a _helmet_logo / _chest_logo suffit a la neutraliser.
    """
    _helmet_logo(c, cx, top)


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
    sl, sb, ss = sk["skin"]
    tb, tsd = sk["trousers"]
    shoe_top = base - 3
    legs_top = base - 14 - sk.get("height", 0)
    torso_bot = legs_top - 1
    torso_top = torso_bot - 13
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    la, lb = p["leg_a"], p["leg_b"]
    c.rect(cx - 6 + la, legs_top, cx - 2 + la, shoe_top - 1, tb)
    c.rect(cx + 2 + lb, legs_top, cx + 6 + lb, shoe_top - 1, tsd)
    c.rect(cx - 7 + la, shoe_top, cx - 1 + la, base, sk["shoes"])
    c.rect(cx + 1 + lb, shoe_top, cx + 7 + lb, base, sk["shoes"])

    bw = BUILD.get(sk.get("build", "regular"), 0)
    c.rect(cx - 8 - bw, torso_top, cx + 8 + bw, torso_bot, sk["shirt"][1])
    c.rect(cx - 8 - bw, torso_top, cx - 5, torso_bot, sk["shirt"][0])
    c.rect(cx + 6, torso_top, cx + 8 + bw, torso_bot, sk["shirt"][2])
    c.rect(cx - 2, torso_top + 2, cx - 1, torso_bot - 2, sk["shirt"][2])
    if sk.get("logo") and not back:
        _chest_logo(c, cx + 3, torso_top + 3)

    for side, off in ((-1, p["arm_back"]), (1, p["arm_front"])):
        ax = cx + side * (10 + bw)
        if side == 1 and p["hand_up"]:
            c.rect(ax - 1, torso_top - 6, ax + 1, torso_top + 3, sk["shirt"][1])
            c.rect(ax - 1, torso_top - 8, ax + 1, torso_top - 7, sb)
        elif side == 1 and p["hand_out"]:
            c.rect(ax - 1, torso_top + 3, ax + 1, torso_top + 5, sk["shirt"][1])
            c.rect(ax + 2, torso_top + 4, ax + 5, torso_top + 5, sb)
        elif p["rest"] and sk.get("arm") == "cross":
            # bras croises : le contour se resserre aux hanches et s epaissit
            # au thorax. C est le changement de silhouette le plus net qu on
            # puisse obtenir sans changer de sprite.
            tone = sk["shirt"][2] if side == -1 else sk["shirt"][0]
            c.rect(ax - 1, torso_top, ax + 1, torso_top + 4, tone)
            c.rect(cx - 7 - bw, torso_top + 5, cx + 7 + bw, torso_top + 7,
                   sk["shirt"][0])
            c.rect(cx - 7 - bw, torso_top + 5, cx - 6 - bw, torso_top + 6, sb)
            c.rect(cx + 6 + bw, torso_top + 5, cx + 7 + bw, torso_top + 6, sb)
        elif p["rest"] and sk.get("arm") == "pocket":
            # mains dans les poches : les bras s arretent haut et le bas du
            # corps devient une masse pleine
            tone = sk["shirt"][2] if side == -1 else sk["shirt"][0]
            c.rect(ax - 1, torso_top, ax + 1, torso_bot - 5, tone)
            c.rect(ax - 1, torso_bot - 4, ax + 1, torso_bot - 3, sb)
        else:
            tone = sk["shirt"][2] if side == -1 else sk["shirt"][0]
            # manches courtes : le bras redevient peau a mi-hauteur, ce qui
            # casse la colonne de tissu et se lit meme en silhouette
            cuff = (torso_top + off + 4 if sk.get("sleeves") == "short"
                    else torso_bot - 3 + off)
            c.rect(ax - 1, torso_top + off, ax + 1, cuff, tone)
            c.rect(ax - 1, cuff + 1, ax + 1, torso_bot + off, sb)

    if sk.get("bag"):
        # sac porte en bandouliere : la bosse a la hanche sort du gabarit,
        # donc elle survit a l aplat
        c.rect(cx - 12 - bw, torso_bot - 2, cx - 9 - bw, torso_bot + 5, "bag_base")
        c.rect(cx - 12 - bw, torso_bot - 2, cx - 11 - bw, torso_bot + 5, "bag_strap")
        for k in range(7):
            c.set(cx - 4 - k // 2, torso_top + 1 + k, "bag_strap")

    c.rect(cx - 8 - bw, torso_top, cx - 4, torso_top, sk["shirt"][2])
    c.rect(cx + 4, torso_top, cx + 8 + bw, torso_top, sk["shirt"][2])
    c.rect(cx - 1, torso_top - 1, cx + 1, torso_top, ss)          # le cou
    if sk.get("collar"):
        c.rect(cx - 3, torso_top + 1, cx - 2, torso_top + 2, sk["shirt"][0])
        c.rect(cx + 2, torso_top + 1, cx + 3, torso_top + 2, sk["shirt"][0])
        c.rect(cx - 1, torso_top + 1, cx + 1, torso_top + 1, ss)

    c.rect(cx - 6, head_top, cx + 6, head_bot, sb)
    c.rect(cx - 6, head_top, cx - 3, head_bot - 2, sl)
    c.rect(cx + 4, head_top + 1, cx + 6, head_bot, ss)
    if back:
        c.rect(cx - 6, head_top, cx + 6, head_top + 5, sk["hair"][0])
    else:
        _eyes(c, cx - 4, head_top + 4, p["eyes"], 7)
        _mouth(c, cx - 2, cx + 1, head_bot - 1, p["mouth"], ss)
        if sk.get("glasses"):
            _glasses_front(c, cx, head_top)

    # vu de dos, on ne voit pas la marque : elle est a l avant du casque
    if sk["helmet"]:
        _helmet_front(c, cx, helmet_top, sk, p["helmet_tilt"], logo=not back)
    else:
        _hair_front(c, cx, head_top, head_bot, sk, back)
    if p["backpack"]:
        c.rect(cx - 11, torso_top + 2, cx - 9, torso_bot - 1, "ui_panel")
        c.rect(cx + 9, torso_top + 2, cx + 11, torso_bot - 1, "ui_panel")


# -- vue de profil (tourne vers la droite avant flip) -----------------------
def _draw_side(c, p, sk, cx, base):
    if p["sit"]:
        _draw_sit(c, p, sk, cx, base)
        return

    shoe_top = base - 3
    sl, sb, ss = sk["skin"]
    tb, tsd = sk["trousers"]
    legs_top = base - 14 - sk.get("height", 0)
    torso_bot = legs_top - 1
    torso_top = torso_bot - 13
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    la, lb = p["leg_a"], p["leg_b"]
    c.rect(cx - 4 + lb, legs_top, cx + 0 + lb, shoe_top - 1, tsd)
    c.rect(cx - 5 + lb, shoe_top, cx + 1 + lb, base, sk["shoes"])
    c.rect(cx - 2 + la, legs_top, cx + 2 + la, shoe_top - 1, tb)
    c.rect(cx - 3 + la, shoe_top, cx + 4 + la, base, sk["shoes"])

    bw = BUILD.get(sk.get("build", "regular"), 0)
    c.rect(cx - 5 - bw, torso_top, cx + 5, torso_bot, sk["shirt"][1])
    c.rect(cx - 5 - bw, torso_top, cx - 3, torso_bot, sk["shirt"][2])
    c.rect(cx + 3, torso_top, cx + 5, torso_bot - 2, sk["shirt"][0])
    if sk.get("logo"):
        _sleeve_logo(c, cx + 4, torso_top + 2)

    ax = cx + 2 + p["arm_front"]
    if p["hand_up"]:
        c.rect(ax, torso_top - 7, ax + 2, torso_top + 3, sk["shirt"][1])
        c.rect(ax, torso_top - 9, ax + 2, torso_top - 8, sb)
    elif p["hand_out"]:
        c.rect(cx + 3, torso_top + 3, cx + 7, torso_top + 5, sk["shirt"][1])
        c.rect(cx + 8, torso_top + 3, cx + 10, torso_top + 5, sb)
        c.set(cx + 11, torso_top + 4, sl)
    elif p["phone"]:
        c.rect(cx + 2, torso_top + 3, cx + 4, torso_top + 6, sk["shirt"][1])
        c.rect(cx + 5, torso_top + 5, cx + 6, torso_top + 6, sb)
        c.rect(cx + 5, torso_top + 1, cx + 7, torso_top + 4, "ui_panel")
        c.rect(cx + 6, torso_top + 2, cx + 6, torso_top + 3, "phone_screen")
    elif p["rest"] and sk.get("arm") == "cross":
        c.rect(cx + 3, torso_top + 4, cx + 8, torso_top + 6, sk["shirt"][1])
        c.rect(cx + 7, torso_top + 4, cx + 8, torso_top + 5, sb)
    elif p["rest"] and sk.get("arm") == "pocket":
        c.rect(ax, torso_top + 1, ax + 2, torso_bot - 5, sk["shirt"][1])
        c.rect(ax, torso_bot - 4, ax + 2, torso_bot - 3, sb)
    else:
        cuff = torso_top + 5 if sk.get("sleeves") == "short" else torso_bot - 3
        c.rect(ax, torso_top + 1, ax + 2, cuff, sk["shirt"][1])
        c.rect(ax, cuff + 1, ax + 2, torso_bot, sb)

    if sk.get("bag"):
        c.rect(cx - 9 - bw, torso_bot - 2, cx - 6 - bw, torso_bot + 5, "bag_base")
        c.rect(cx - 9 - bw, torso_bot - 2, cx - 8 - bw, torso_bot + 5, "bag_strap")
        for k in range(7):
            c.set(cx - 2 - k // 2, torso_top + 1 + k, "bag_strap")

    c.rect(cx - 5 - bw, torso_top, cx - 2, torso_top, sk["shirt"][2])
    c.rect(cx, torso_top - 1, cx + 2, torso_top, ss)              # le cou
    if sk.get("collar"):
        c.rect(cx + 1, torso_top + 1, cx + 3, torso_top + 2, sk["shirt"][0])

    c.rect(cx - 5, head_top, cx + 5, head_bot, sb)
    c.rect(cx - 1, head_top, cx + 3, head_bot - 3, sl)
    c.rect(cx - 5, head_top, cx - 3, head_bot, ss)
    c.rect(cx + 6, head_top + 3, cx + 6, head_top + 4, sb)
    _eyes(c, cx + 2, head_top + 4, p["eyes"], 0)
    _mouth(c, cx + 2, cx + 4, head_bot - 1, p["mouth"], ss)
    if sk.get("glasses"):
        _glasses_side(c, cx, head_top)
    if sk["helmet"]:
        c.rect(cx - 6, head_top + 1, cx - 5, head_bot - 2, sk["hair"][0])
        _helmet_side(c, cx, helmet_top, sk, p["helmet_tilt"])
    else:
        _hair_side(c, cx, head_top, head_bot, sk)
    if p["backpack"]:
        c.rect(cx - 9, torso_top + 1, cx - 6, torso_bot - 2, "ui_panel")
        c.rect(cx - 9, torso_top + 1, cx - 8, torso_top + 4, "ui_border")


def _draw_sit(c, p, sk, cx, base):
    """Assis de profil : cuisses horizontales, tibias verticaux."""
    hip = base - 13
    sl, sb, ss = sk["skin"]
    tb, tsd = sk["trousers"]
    torso_bot = hip - 1
    torso_top = torso_bot - 12 - sk.get("height", 0)
    head_bot = torso_top - 1
    head_top = head_bot - 8
    helmet_top = head_top - 6 + p["helmet_dy"]

    c.rect(cx - 4, hip, cx + 7, hip + 2, tb)
    c.rect(cx - 4, hip + 3, cx + 7, hip + 3, tsd)
    c.rect(cx + 4, hip + 4, cx + 7, base - 3, tsd)
    c.rect(cx + 3, base - 2, cx + 9, base, sk["shoes"])

    c.rect(cx - 5, torso_top, cx + 4, torso_bot, sk["shirt"][1])
    c.rect(cx - 5, torso_top, cx - 3, torso_bot, sk["shirt"][2])
    c.rect(cx + 2, torso_top, cx + 4, torso_bot - 2, sk["shirt"][0])
    if sk.get("logo"):
        _sleeve_logo(c, cx + 3, torso_top + 2)

    reach = 6 + p["arm_front"]
    c.rect(cx + 2, torso_top + 4, cx + reach, torso_top + 6, sk["shirt"][1])
    c.rect(cx + reach + 1, torso_top + 5, cx + reach + 2, torso_top + 6, sb)

    c.rect(cx - 5, head_top, cx + 5, head_bot, sb)
    c.rect(cx - 1, head_top, cx + 3, head_bot - 3, sl)
    c.rect(cx - 5, head_top, cx - 3, head_bot, ss)
    c.rect(cx + 6, head_top + 3, cx + 6, head_top + 4, sb)
    _eyes(c, cx + 2, head_top + 4, p["eyes"], 0)
    _mouth(c, cx + 2, cx + 4, head_bot - 1, p["mouth"], ss)
    if sk.get("glasses"):
        _glasses_side(c, cx, head_top)
    if sk["helmet"]:
        c.rect(cx - 6, head_top + 1, cx - 5, head_bot - 2, sk["hair"][0])
        _helmet_side(c, cx, helmet_top, sk, p["helmet_tilt"])
    else:
        _hair_side(c, cx, head_top, head_bot, sk)
