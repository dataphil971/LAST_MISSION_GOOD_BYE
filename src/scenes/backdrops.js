// Scenographie : les decors sont PEINTS (en pixels), les personnages sont
// des sprites. C est la grammaire visuelle retenue dans le rapport :
// personnage modeste devant un environnement genereux, lumiere par zones de
// couleur, composition par plans, presque pas de dithering.
//
// Tout est procedural et deterministe (hash sur les coordonnees) : aucun
// scintillement d une frame a l autre, et zero octet d assets de fond.

import { C, D } from '../data/palette.js';

export const GROUND = 178;

function h2(x, y, s = 0) {
  let n = (x * 374761393 + y * 668265263 + s * 1442695040888963407) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Ciel en bandes franches : pas de degrade lisse, des aplats. */
function skyBands(ctx, bands, top = 0, bottom = GROUND) {
  const total = bands.reduce((a, b) => a + b.weight, 0);
  let y = top;
  for (const b of bands) {
    const h = Math.round((bottom - top) * b.weight / total);
    px(ctx, 0, y, 384, h, b.color);
    y += h;
  }
  if (y < bottom) px(ctx, 0, y, 384, bottom - y, bands[bands.length - 1].color);
}

/** Grain par clusters : quelques pixels groupes, jamais du bruit uniforme. */
function grain(ctx, x0, y0, w, h, color, density, seed) {
  ctx.fillStyle = color;
  for (let y = y0; y < y0 + h; y += 2) {
    for (let x = x0; x < x0 + w; x += 2) {
      if (h2(x, y, seed) < density) ctx.fillRect(x, y, 2, 1);
    }
  }
}

// ---------------------------------------------------------------------
// EXTERIEUR -- 08:43, dernier jour. Le batiment mange le cadre.
// ---------------------------------------------------------------------
export function drawExterior(ctx, t, opts = {}) {
  const evening = !!opts.evening;
  if (evening) {
    skyBands(ctx, [
      { color: C.night_blue, weight: 3 },
      { color: C.sunset_mauve, weight: 2 },
      { color: C.sunset_coral, weight: 2 },
      { color: C.sunset_gold, weight: 1 },
    ], 0, 150);
  } else {
    skyBands(ctx, [
      { color: D.sky_dawn_high, weight: 4 },
      { color: D.sky_dawn_mid, weight: 2 },
      { color: D.sky_dawn_low, weight: 1 },
    ], 0, 150);
  }

  // plan 3 : ville lointaine, silhouettes basses et desaturees
  for (let i = 0; i < 14; i++) {
    const x = i * 29 - 8;
    const w = 18 + Math.floor(h2(i, 3) * 12);
    const hgt = 24 + Math.floor(h2(i, 7) * 34);
    // les blocs descendent jusqu au sol : sans cela, une bande de ciel
    // reste coincee entre la ville et le trottoir et se lit comme un mur
    px(ctx, x, 150 - hgt, w, hgt + (GROUND - 150), evening ? '#3B3550' : '#6D7186');
    for (let wy = 150 - hgt + 4; wy < 146; wy += 6) {
      for (let wx = x + 3; wx < x + w - 3; wx += 5) {
        if (h2(wx, wy, 11) < (evening ? 0.5 : 0.18)) {
          px(ctx, wx, wy, 2, 2, evening ? D.window_lit : D.window_cold);
        }
      }
    }
  }

  // plan 2 : LE batiment. Il occupe la moitie droite et sort du cadre.
  const bx = 150;
  const bw = 250;
  px(ctx, bx, 26, bw, GROUND - 26, D.facade_base);
  px(ctx, bx, 26, 6, GROUND - 26, D.facade_light);
  px(ctx, bx + bw - 30, 26, 30, GROUND - 26, D.facade_shadow);
  px(ctx, bx, 26, bw, 3, D.facade_deep);
  px(ctx, bx, 30, bw, 2, D.facade_light);
  grain(ctx, bx + 8, 34, bw - 40, 120, D.facade_shadow, 0.10, 2);

  // trames de fenetres : 4 etages, quelques bureaux deja allumes
  for (let row = 0; row < 4; row++) {
    const wy = 40 + row * 26;
    for (let col = 0; col < 7; col++) {
      const wx = bx + 14 + col * 32;
      px(ctx, wx - 1, wy - 1, 24, 18, D.facade_deep);
      const lit = h2(col, row, evening ? 21 : 5) < (evening ? 0.55 : 0.3);
      px(ctx, wx, wy, 22, 16, lit ? D.window_lit : D.window_cold);
      px(ctx, wx, wy, 22, 3, lit ? '#F7D08A' : '#8FB8C9');
      px(ctx, wx + 10, wy, 1, 16, D.facade_deep);
    }
  }

  // entree : c est le seuil que Philippe franchit deux fois dans le jeu
  const ex = bx + 30;
  px(ctx, ex - 4, GROUND - 54, 68, 54, D.facade_deep);
  px(ctx, ex, GROUND - 50, 60, 50, evening ? '#4A4258' : D.screen_dim);
  px(ctx, ex + 28, GROUND - 50, 3, 50, D.facade_deep);
  px(ctx, ex + 2, GROUND - 48, 24, 20, evening ? D.window_lit : '#A9C6D2');
  px(ctx, ex + 33, GROUND - 48, 24, 20, evening ? D.window_lit : '#A9C6D2');
  px(ctx, ex - 8, GROUND - 58, 76, 5, D.facade_light);
  px(ctx, ex - 8, GROUND - 53, 76, 2, D.facade_shadow);

  // sol : trottoir, bordure, ombre portee du batiment
  px(ctx, 0, GROUND, 384, 216 - GROUND, D.ground_base);
  px(ctx, 0, GROUND, 384, 2, D.ground_light);
  px(ctx, 0, GROUND + 12, 384, 26, D.ground_deep);
  grain(ctx, 0, GROUND + 2, 384, 34, D.ground_light, 0.06, 9);
  ctx.globalAlpha = 0.25;
  px(ctx, bx - 40, GROUND, 384, 10, C.outline_deep);
  ctx.globalAlpha = 1;

  // plan 1 : mobilier urbain a gauche, pour cadrer l arrivee du personnage
  drawPlanter(ctx, 30, GROUND, evening);
  drawPlanter(ctx, 112, GROUND, evening);
  px(ctx, 78, GROUND - 46, 3, 46, D.facade_shadow);
  px(ctx, 74, GROUND - 52, 11, 7, evening ? D.window_lit : '#8A8398');
  px(ctx, 76, GROUND - 50, 7, 3, evening ? C.sunset_gold : '#C6C0D0');
}

function drawPlanter(ctx, x, ground, evening) {
  px(ctx, x, ground - 12, 26, 12, D.desk_shadow);
  px(ctx, x, ground - 12, 26, 2, D.desk_base);
  for (let i = 0; i < 5; i++) {
    const lx = x + 3 + i * 5;
    const lh = 10 + Math.floor(h2(i, x) * 8);
    px(ctx, lx, ground - 12 - lh, 4, lh, i % 2 ? D.plant : D.plant_dark);
    if (!evening) px(ctx, lx, ground - 12 - lh, 2, 3, '#7A9A66');
  }
}

// ---------------------------------------------------------------------
// ACCUEIL
// ---------------------------------------------------------------------
export function drawLobby(ctx, t) {
  px(ctx, 0, 0, 384, GROUND, D.wall_base);
  px(ctx, 0, 0, 384, 30, D.wall_shadow);
  px(ctx, 0, 30, 384, 2, D.wall_light);
  grain(ctx, 0, 32, 384, 120, D.wall_light, 0.05, 4);

  // baie vitree a gauche : la lumiere du matin entre par la
  px(ctx, 8, 34, 96, 96, D.facade_deep);
  px(ctx, 11, 37, 90, 90, '#A9C6D2');
  px(ctx, 11, 37, 90, 26, '#C7DAE1');
  px(ctx, 55, 37, 2, 90, D.facade_deep);
  px(ctx, 11, 80, 90, 2, D.facade_deep);
  ctx.globalAlpha = 0.16;
  px(ctx, 14, 130, 120, 48, '#F7D08A');
  ctx.globalAlpha = 1;

  // panneau d identite volontairement abstrait : aucun logo reel
  px(ctx, 150, 40, 92, 30, D.facade_shadow);
  px(ctx, 152, 42, 88, 26, C.ui_panel);
  px(ctx, 158, 50, 10, 10, C.accent_orange);
  px(ctx, 172, 52, 30, 3, C.text_muted);
  px(ctx, 172, 58, 46, 3, C.ui_cell_dark);

  // comptoir d accueil
  px(ctx, 148, GROUND - 40, 104, 40, D.desk_shadow);
  px(ctx, 148, GROUND - 40, 104, 4, D.desk_light);
  px(ctx, 152, GROUND - 34, 96, 30, D.desk_base);
  px(ctx, 160, GROUND - 30, 18, 12, C.ui_panel);
  px(ctx, 162, GROUND - 28, 14, 8, D.screen_on);

  drawPlanter(ctx, 290, GROUND, false);

  // portes d ascenseur au fond a droite
  px(ctx, 320, GROUND - 74, 52, 74, D.facade_deep);
  px(ctx, 323, GROUND - 71, 46, 71, '#7E7480');
  px(ctx, 346, GROUND - 71, 1, 71, D.facade_deep);
  px(ctx, 330, GROUND - 80, 32, 6, C.ui_panel);
  px(ctx, 344, GROUND - 79, 4, 4, C.accent_orange);

  px(ctx, 0, GROUND, 384, 216 - GROUND, D.floor_base);
  px(ctx, 0, GROUND, 384, 2, D.floor_light);
  for (let x = 0; x < 384; x += 24) px(ctx, x, GROUND + 2, 1, 36, D.floor_shadow);
}

// ---------------------------------------------------------------------
// ASCENSEUR -- le sas entre deux mondes, en debut et en fin de partie
// ---------------------------------------------------------------------
export function drawElevator(ctx, t) {
  px(ctx, 0, 0, 384, 216, D.wall_shadow);
  px(ctx, 60, 18, 264, 160, D.wall_base);
  px(ctx, 60, 18, 264, 3, D.wall_light);
  px(ctx, 60, 175, 264, 3, D.floor_shadow);
  grain(ctx, 64, 24, 256, 150, D.wall_light, 0.04, 6);

  // main courante
  px(ctx, 74, 120, 236, 3, D.desk_base);
  px(ctx, 74, 123, 236, 1, D.desk_shadow);

  // afficheur d etage
  px(ctx, 168, 30, 48, 16, C.ui_shadow);
  px(ctx, 170, 32, 44, 12, C.ui_panel);
}

/** Les portes sont un plan a part : le personnage se tient DERRIERE. */
export function drawElevatorDoors(ctx, doorOpen = 0) {
  const open = Math.round(doorOpen * 60);
  px(ctx, 132 - open, 52, 60, 126, '#8A8091');
  px(ctx, 192 + open, 52, 60, 126, '#7E7480');
  px(ctx, 132 - open, 52, 60, 2, '#9C93A4');
  px(ctx, 192 + open, 52, 60, 2, '#9C93A4');
  px(ctx, 186 - open, 52, 6, 126, D.facade_deep);
  px(ctx, 192 + open, 52, 6, 126, D.facade_deep);
}

// ---------------------------------------------------------------------
// PLATEAU -- l open space. Poste de Philippe au centre.
// ---------------------------------------------------------------------
export function drawFloor(ctx, t, opts = {}) {
  const evening = !!opts.evening;
  px(ctx, 0, 0, 384, GROUND, evening ? '#463C42' : D.wall_base);
  px(ctx, 0, 0, 384, 26, D.wall_shadow);
  grain(ctx, 0, 26, 384, 110, D.wall_light, 0.04, 8);

  // fenetres du plateau : la lumiere raconte l heure qu il est
  for (let i = 0; i < 3; i++) {
    const wx = 18 + i * 128;
    px(ctx, wx, 30, 104, 74, D.facade_deep);
    px(ctx, wx + 3, 33, 98, 68, evening ? C.sunset_coral : '#A9C6D2');
    px(ctx, wx + 3, 33, 98, 22, evening ? C.sunset_gold : '#C7DAE1');
    px(ctx, wx + 51, 33, 2, 68, D.facade_deep);
    if (evening) px(ctx, wx + 3, 55, 98, 8, C.sunset_mauve);
  }
  ctx.globalAlpha = evening ? 0.22 : 0.14;
  px(ctx, 0, 120, 384, 58, evening ? C.sunset_gold : '#F7D08A');
  ctx.globalAlpha = 1;

  // rangee de bureaux du fond, et les gens qui y travaillent
  for (let i = 0; i < 4; i++) {
    const dx = 12 + i * 96;
    const seat = evening ? EVENING_SEATS[i] : DAY_SEATS[i];
    if (seat) drawBackWorker(ctx, dx, t, i, evening);
    px(ctx, dx, 112, 76, 5, D.desk_base);
    px(ctx, dx + 4, 117, 68, 10, D.desk_shadow);
    px(ctx, dx + 24, 96, 28, 17, C.ui_shadow);
    px(ctx, dx + 26, 98, 24, 13, evening ? D.screen_dim : D.screen_on);
    if (seat) drawBackScreen(ctx, dx + 28, 100, t, i, evening);
    px(ctx, dx + 35, 113, 6, 3, C.ui_panel);
  }

  px(ctx, 0, GROUND - 40, 384, 40, D.floor_base);
  px(ctx, 0, GROUND - 40, 384, 2, D.floor_light);
  px(ctx, 0, GROUND, 384, 216 - GROUND, D.floor_shadow);
  for (let x = 0; x < 384; x += 32) px(ctx, x, GROUND - 38, 1, 76, D.floor_shadow);

  drawPlanter(ctx, 350, GROUND, evening);
}

// ---------------------------------------------------------------------
// LE FOND DU PLATEAU -- rang C de docs/NPC_CAST.md
//
// Quatre postes, des gens dessus. Aucun sprite, aucun octet d'asset : une
// tete, des epaules, deux mains sur un clavier, peints comme le reste du
// decor. C'est la moitie de la sensation de vie du plateau, et ca coute
// vingt lignes.
//
// Tout est fonction du temps, jamais d'un tirage : les captures restent
// reproductibles et rien ne scintille. Le decalage par nombre d'or evite
// que les quatre respirent en choeur -- un open space synchronise est la
// chose la moins credible qu'on puisse dessiner.
// ---------------------------------------------------------------------

// Un poste vide raconte autant qu'un poste occupe : quelqu'un est en
// reunion. Le soir, il n'en reste qu'un -- et c'est ce qui dit l'heure.
const DAY_SEATS = [true, true, false, true];
const EVENING_SEATS = [false, true, false, false];

// Ce sont les collegues du casting, pas des inconnus : memes tenues, memes
// cheveux que leurs sprites (tools/rig.py). On doit pouvoir dire « tiens,
// elle est a son poste » sans qu'aucun nom ne soit affiche nulle part.
const BACK_TEAM = [
  // BI_01 : sweat bleu, cheveux courts noirs
  { shirt: '#3D5680', shade: '#283A57', hair: '#3A3140', skin: '#CB926B',
    tail: 0 },
  // BI_06 : sarcelle, cheveux longs attaches -- la queue depasse du dossier
  { shirt: '#467468', shade: '#2C4A44', hair: '#3A3140', skin: '#CB926B',
    tail: 5 },
  // BI_02 : ocre, cheveux longs
  { shirt: '#A2703B', shade: '#6B4826', hair: '#463641', skin: '#B87F5C',
    tail: 7 },
  // DE_03 : mauve, coupe tres courte
  { shirt: '#5D5480', shade: '#3B3557', hair: '#3A3140', skin: '#84523A',
    tail: 0 },
];

/** Une personne assise a un poste du fond, vue de dos par-dessus l ecran. */
function drawBackWorker(ctx, dx, t, i, evening) {
  const w = BACK_TEAM[i % BACK_TEAM.length];
  const cx = dx + 38;                            // l axe de l ecran
  // Respiration : un pixel, mais tenu une seconde entiere. Un pixel qui
  // clignote une image sur deux ne respire pas, il tremble.
  const cycle = 5.5 + i * 0.7;                   // jamais deux au meme rythme
  const bob = ((t + i * 1.7) % cycle) < 1.1 ? 1 : 0;
  const y = bob;

  px(ctx, cx - 6, 93 + y, 12, 20, w.shirt);      // epaules et dos
  px(ctx, cx - 6, 93 + y, 4, 20, w.shade);
  px(ctx, cx - 2, 92 + y, 4, 3, w.skin);         // la nuque
  px(ctx, cx - 3, 86 + y, 6, 7, w.skin);         // la tete
  px(ctx, cx - 4, 84 + y, 8, 4, w.hair);         // les cheveux
  px(ctx, cx - 4, 88 + y, 2, 4, w.hair);
  px(ctx, cx + 3, 88 + y, 1, 3, w.hair);
  if (w.tail) px(ctx, cx - 5, 87 + y, 2, w.tail, w.hair);   // la queue

  if (evening) return;
  // la main sur la souris, a cote de l ecran : c est ce petit pixel qui
  // fait la difference entre « quelqu un est assis la » et « quelqu un
  // travaille ». Deux fois par seconde, pas quatre -- au-dela, ca vibre.
  const tap = ((t * 1.8 + i) % 1) < 0.5 ? 0 : 1;
  px(ctx, dx + 56, 110, 4, 2, C.ui_cell_dark);   // la souris
  px(ctx, dx + 56, 108 + tap, 4, 2, w.skin);     // la main dessus
}

/** Le contenu d'un ecran du fond : trois lignes qui changent lentement. */
function drawBackScreen(ctx, x, y, t, i, evening) {
  if (evening) return;
  const step = Math.floor(t / 2.5) + i;
  for (let r = 0; r < 3; r++) {
    const wdt = 6 + ((step + r * 2) % 4) * 4;
    px(ctx, x, y + r * 4, wdt, 2, r === 0 ? C.sunset_gold : D.screen_dim);
  }
}

/** Le poste de Philippe, dessine par-dessus le plateau (plan 1). */
export function drawDesk(ctx, x, screen = 'dashboard', t = 0) {
  const y = GROUND;
  px(ctx, x, y - 30, 84, 5, D.desk_light);
  px(ctx, x + 2, y - 25, 80, 4, D.desk_base);
  px(ctx, x + 6, y - 21, 6, 21, D.desk_shadow);
  px(ctx, x + 72, y - 21, 6, 21, D.desk_shadow);
  // ecran
  px(ctx, x + 22, y - 62, 44, 32, C.ui_shadow);
  px(ctx, x + 24, y - 60, 40, 28, C.ui_panel);
  px(ctx, x + 40, y - 30, 8, 5, C.ui_shadow);
  drawScreenContent(ctx, x + 25, y - 59, 38, 26, screen, t);
  // clavier + tasse
  px(ctx, x + 26, y - 29, 30, 4, C.ui_cell_dark);
  px(ctx, x + 62, y - 33, 8, 8, C.ui_cell);
  px(ctx, x + 70, y - 31, 3, 4, C.ui_cell);
}

/** Fauteuil de bureau vu de profil. Personne ne s'assoit dans le vide. */
export function drawChair(ctx, x, y) {
  ctx.fillStyle = C.ui_cell_dark;
  ctx.fillRect(x - 4, y - 44, 7, 24);        // dossier
  ctx.fillStyle = C.ui_cell;
  ctx.fillRect(x - 4, y - 44, 3, 24);
  ctx.fillStyle = C.ui_cell_dark;
  ctx.fillRect(x - 6, y - 22, 24, 5);        // assise
  ctx.fillStyle = C.ui_shadow;
  ctx.fillRect(x - 6, y - 17, 24, 2);
  ctx.fillRect(x + 3, y - 15, 4, 11);        // colonne
  ctx.fillRect(x - 5, y - 4, 21, 3);         // pietement
  ctx.fillRect(x - 5, y - 1, 3, 2);
  ctx.fillRect(x + 13, y - 1, 3, 2);
}

export function drawScreenContent(ctx, x, y, w, h, kind, t) {
  if (kind === 'off') { px(ctx, x, y, w, h, '#1C1620'); return; }
  px(ctx, x, y, w, h, D.screen_dim);
  if (kind === 'dashboard') {
    px(ctx, x, y, w, 4, C.accent_orange);
    px(ctx, x + 2, y + 6, 10, 7, D.screen_on);
    px(ctx, x + 14, y + 6, 10, 7, D.screen_on);
    px(ctx, x + 26, y + 6, 10, 7, D.screen_on);
    for (let i = 0; i < 6; i++) {
      const bh = 3 + ((i * 5 + Math.floor(t * 2)) % 9);
      px(ctx, x + 3 + i * 5, y + h - 3 - bh, 3, bh, C.sunset_gold);
    }
  } else if (kind === 'error') {
    const blink = Math.floor(t * 4) % 2 === 0;
    px(ctx, x, y, w, h, blink ? '#3A2028' : D.screen_dim);
    px(ctx, x + 4, y + 6, w - 8, 3, C.error);
    px(ctx, x + 4, y + 12, w - 8, 3, C.error);
    px(ctx, x + 4, y + 18, w - 14, 3, C.error);
  } else if (kind === 'ok') {
    px(ctx, x + 6, y + 8, w - 12, 4, C.success);
    px(ctx, x + 6, y + 15, w - 20, 4, C.success);
  }
}

// ---------------------------------------------------------------------
// COUCHER DE SOLEIL -- le plan qui doit rendre Philippe petit
// ---------------------------------------------------------------------
export function drawSunset(ctx, t) {
  skyBands(ctx, [
    { color: C.night_blue, weight: 4 },
    { color: C.sunset_mauve, weight: 3 },
    { color: C.sunset_coral, weight: 2 },
    { color: C.sunset_gold, weight: 1 },
  ], 0, 150);

  // le soleil bas, gros, a moitie mange par la ligne d horizon
  const sunX = 96;
  const sunY = 134;
  const R = 27;
  for (let dy = -R; dy <= R; dy++) {
    const half = Math.round(Math.sqrt(R * R - dy * dy));
    const d = Math.abs(dy) / R;
    const col = d > 0.72 ? C.sunset_coral : (d > 0.38 ? C.sunset_gold : '#FFE9B0');
    px(ctx, sunX - half, sunY + dy, half * 2, 1, col);
  }

  // silhouette de la ville, tres sombre : on ne regarde plus les details.
  // Les blocs qui masqueraient le soleil sont volontairement plus bas :
  // c est lui le sujet du plan.
  for (let i = 0; i < 16; i++) {
    const x = i * 26 - 10;
    const w = 16 + Math.floor(h2(i, 13) * 12);
    const nearSun = x + w > sunX - 26 && x < sunX + 26;
    const hgt = nearSun ? 10 + Math.floor(h2(i, 17) * 6)
      : 18 + Math.floor(h2(i, 17) * 40);
    px(ctx, x, 150 - hgt, w, hgt + 4, '#2C2740');
    for (let wy = 150 - hgt + 5; wy < 148; wy += 7) {
      for (let wx = x + 3; wx < x + w - 3; wx += 6) {
        if (h2(wx, wy, 23) < 0.35) px(ctx, wx, wy, 2, 2, C.sunset_gold);
      }
    }
  }

  // le batiment, maintenant loin derriere lui
  px(ctx, 250, 78, 96, 76, '#241F33');
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (h2(col, row, 29) < 0.6) {
        px(ctx, 258 + col * 22, 86 + row * 17, 12, 9, C.sunset_gold);
      }
    }
  }

  px(ctx, 0, 150, 384, 66, '#2A2438');
  px(ctx, 0, 150, 384, 2, '#3E3550');
  grain(ctx, 0, 154, 384, 60, '#3E3550', 0.05, 31);

  // reflet du soleil : un miroitement qui s effiloche, pas un aplat
  for (let i = 0; i < 11; i++) {
    const w = Math.max(4, 32 - i * 3 - Math.floor(h2(i, 41) * 6));
    ctx.globalAlpha = Math.max(0.03, 0.16 - i * 0.013);
    px(ctx, sunX - w / 2, 152 + i * 5, w, 1, C.sunset_gold);
  }
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------
// TRANSPORT -- ecran final, paysage qui defile, casque pose a cote
// ---------------------------------------------------------------------
export function drawTransport(ctx, t) {
  px(ctx, 0, 0, 384, 216, '#241C28');
  px(ctx, 0, 0, 384, 22, '#2E2534');
  px(ctx, 0, 152, 384, 64, '#1E1822');

  // fenetre : le paysage defile lentement, en trois plans
  const wx = 24;
  const wy = 30;
  const ww = 336;
  const wh = 96;
  px(ctx, wx - 4, wy - 4, ww + 8, wh + 8, '#3A3040');
  px(ctx, wx, wy, ww, wh, C.night_blue);
  px(ctx, wx, wy, ww, 30, '#3E4A6B');
  px(ctx, wx, wy + 30, ww, 10, C.sunset_mauve);

  ctx.save();
  ctx.beginPath();
  ctx.rect(wx, wy, ww, wh);
  ctx.clip();
  for (let layer = 0; layer < 2; layer++) {
    const speed = layer === 0 ? 8 : 26;
    const base = wy + wh - (layer === 0 ? 34 : 12);
    const off = (t * speed) % 64;
    for (let i = -1; i < 8; i++) {
      const x = wx + i * 64 - off;
      const hgt = layer === 0 ? 20 + (i % 3) * 8 : 12 + (i % 2) * 6;
      px(ctx, x, base - hgt, 26, hgt + 20, layer === 0 ? '#2E2A44' : '#221E33');
      if (layer === 0 && i % 2 === 0) px(ctx, x + 6, base - hgt - 6, 3, 8, '#2E2A44');
    }
  }
  px(ctx, wx, wy + wh - 12, ww, 12, '#1C1828');
  ctx.restore();

  // interieur : tablette sous la vitre, banquette, barre verticale
  px(ctx, 0, 126, 384, 6, '#3A3040');
  px(ctx, 300, 22, 4, 104, '#3A3040');
  px(ctx, 52, 140, 152, 46, '#3E3346');       // dossier
  px(ctx, 52, 140, 152, 3, '#4C4056');
  px(ctx, 44, 184, 168, 8, '#4A3E52');        // assise
  px(ctx, 44, 192, 168, 4, '#2A2434');
  px(ctx, 240, 148, 92, 30, '#332B3C');       // banquette du fond, plan 2
  px(ctx, 240, 148, 92, 2, '#3E3550');
  px(ctx, 234, 178, 104, 6, '#413649');
  px(ctx, 234, 184, 104, 3, '#241E2C');
}
