// La rame continue de vivre pendant l'écran de contact.
//
// Philippe est assis, immobile : c'est lui le point émotionnel de la scène.
// Autour de lui, des gens montent, s'assoient, restent debout près de la
// barre, redescendent. Personne ne lui parle — le monde continue sans lui,
// ce qui est exactement le sujet du plan.
//
// Deux d'entre eux laissent échapper une pensée. Pas une réplique : une
// pensée, à côté de la tête, qui ne s'adresse à personne et n'attend pas de
// réponse. Elle ne se déclenche que pour les collègues dont le jeu a déjà
// montré la manie — sinon elle serait gratuite, donc gênante. Les autres
// vivent leur vie sans rien dire, et c'est très bien.
//
// Deux règles tenues ici :
//
//   1. Aucun tirage aléatoire. Un passage est une fonction du temps de
//      scène, comme les décors de backdrops.js : deux lectures de la même
//      seconde donnent la même image, donc tools/screenshot.mjs reste
//      reproductible et rien ne scintille.
//   2. Jamais plus de deux figurants à l'écran, et de longs silences entre
//      les passages. On doit découvrir quelqu'un, pas regarder un défilé.
//
// Voir docs/NPC_CAST.md pour la doctrine complète de la couche d'ambiance.

import { drawText } from '../core/font.js';
import { C } from '../data/palette.js';

// Deux profondeurs, et aucune mise à l'échelle — un sprite réduit casserait
// la grille (test n°2 de la Bible d'art). C'est la ligne de sol qui fait la
// distance : au fond, on marche entre les banquettes ; au premier plan, on
// passe entre Philippe et la caméra, donc devant lui.
const LANE = { back: 190, front: 214 };

const OFF_L = -20;                 // hors champ à gauche
const OFF_R = 404;                 // hors champ à droite
const SEATS = [266, 304];          // les deux places de la banquette du fond
const BAR = 300;                   // la barre verticale

// Un cycle complet. Personne ne reste assez longtemps sur cet écran pour le
// voir se répéter, mais il se répète proprement — sans apparition brutale.
// Les trajets sont espacés pour qu'il n'y ait jamais plus de deux figurants,
// et pour que deux passages n'occupent jamais la même place.
const CYCLE = 120;

const walk = (to, speed = 25) => ({ to, speed });
const hold = (key, dur, face = -1) => ({ key, dur, face });

// La partition. Chaque ligne est un trajet complet, entrée et sortie
// comprises ; les durées sont calculées, pas écrites à la main.
//
// Deux contraintes commandent les horaires. Un profil ne revient jamais moins
// de vingt secondes après sa sortie, sinon on reconnaît la tenue. Et deux
// silhouettes voisines en couleur ne se croisent jamais : à cette taille,
// elles passeraient pour la même personne.
const PASSAGES = [
  // Quelqu'un est déjà assis quand l'écran s'ouvre : la rame n'a pas attendu
  // Philippe pour être habitée. Elle descend une quarantaine de secondes
  // plus tard, sans que rien ne le souligne.
  { at: -14, who: 'bi06', from: OFF_R,
    steps: [walk(SEATS[0], 26), hold('sit', 40), walk(OFF_R, 26)] },

  // Une simple traversée. Elle rentre chez elle, il ne se passe rien.
  { at: 6, who: 'bi01', from: OFF_R, plane: 'front',
    steps: [walk(OFF_L, 26)] },

  // Monte, s'assoit, redescend quelques stations plus loin.
  { at: 30, who: 'bi02', from: OFF_R,
    steps: [walk(SEATS[1], 26), hold('sit', 30), walk(OFF_R, 26)] },

  // La même traversée, dans l'autre sens et vingt secondes plus tard.
  { at: 46, who: 'de03', from: OFF_L, plane: 'front',
    steps: [walk(OFF_R, 26)] },

  // Debout à la barre, le regard dans le vide. La grille de sudoku d'ATLAS
  // revient exactement ici : c'est un rappel, pas une blague neuve.
  { at: 70, who: 'bi07', from: OFF_R,
    steps: [walk(BAR, 25), hold('idleSide', 6, 1), walk(OFF_R, 25)],
    line: 'Bon. J\'en étais où, dans ma grille...', lineAt: [5.2, 9.6],
    lineSide: 'left' },

  // Il traverse, et il a déjà la tête à sa séance.
  { at: 92, who: 'peer', from: OFF_R, plane: 'front',
    steps: [walk(OFF_L, 24)],
    line: 'Alors... aujourd\'hui, pecs ou jambes ?', lineAt: [5.5, 10],
    lineSide: 'above' },
];

const TAGS = { walk: 'walk', sit: 'sit', idleSide: 'idle_side' };

/** Durée totale d'un passage, entrée et sortie comprises. */
function duration(p) {
  let x = p.from;
  let d = 0;
  for (const s of p.steps) {
    if (s.to === undefined) { d += s.dur; continue; }
    d += Math.abs(s.to - x) / s.speed;
    x = s.to;
  }
  return d;
}

/**
 * Où en est un figurant, `local` secondes après le début de son passage.
 * Renvoie null une fois le trajet terminé.
 */
function stateAt(p, local) {
  let x = p.from;
  let t = local;
  for (const s of p.steps) {
    if (s.to === undefined) {
      if (t < s.dur) return { x, key: s.key, flip: s.face < 0, fps: 3 };
      t -= s.dur;
      continue;
    }
    const dir = Math.sign(s.to - x);
    const span = Math.abs(s.to - x) / s.speed;
    if (t < span) {
      return { x: x + dir * s.speed * t, key: 'walk', flip: dir < 0, fps: 10 };
    }
    x = s.to;
    t -= span;
  }
  return null;
}

export class TransitCrowd {
  constructor(game) {
    this.atlas = game.assets.npc;
    this.plan = PASSAGES.map((p) => ({ ...p, dur: duration(p) }));
  }

  /**
   * Dessine la vie de la rame à l'instant t, pour un plan donné. Aucun état,
   * aucun hasard : `back` s'appelle avant Philippe, `front` après lui.
   */
  draw(ctx, t, plane = 'back') {
    if (!this.atlas) return;
    const live = [];
    for (const p of this.plan) {
      if ((p.plane || 'back') !== plane) continue;
      const local = (((t - p.at) % CYCLE) + CYCLE) % CYCLE;
      if (local >= p.dur) continue;
      const s = stateAt(p, local);
      if (s) live.push({ p, local, s });
    }

    // Plan 3 de la hiérarchie visuelle : présents, jamais concurrents du
    // premier plan (docs/NPC_CAST.md).
    ctx.globalAlpha = 0.85;
    for (const { p, s } of live) {
      // Le cycle de marche est indexé sur la DISTANCE, pas sur le temps :
      // une image tous les trois pixels. C'est ce qui empêche les pieds de
      // patiner quand le personnage avance moins vite que son animation.
      const frame = s.key === 'walk'
        ? Math.round(s.x / 3)
        : Math.floor(t * s.fps);
      this.atlas.draw(ctx, `npc/${p.who}/${TAGS[s.key]}`,
        frame, Math.round(s.x), LANE[plane], s.flip);
    }
    ctx.globalAlpha = 1;

    for (const { p, local, s } of live) {
      if (p.line) drawThought(ctx, p, local, s, LANE[plane]);
    }
  }
}

/**
 * Une pensée : deux bulles et une ligne de texte, à côté de la tête. Elle
 * apparaît et disparaît en fondu — surgir d'un coup ferait réplique, et une
 * réplique appellerait une réponse.
 */
function drawThought(ctx, p, local, s, lane) {
  const [from, to] = p.lineAt;
  if (local < from || local > to) return;
  const fade = Math.min(1, Math.min(local - from, to - local) / 0.5);

  const head = lane - 46;
  const x = Math.round(s.x);
  ctx.globalAlpha = fade;

  if (p.lineSide === 'above') {
    drawText(ctx, p.line, clamp(x, 108, 276), head - 16,
      { color: C.text_muted, align: 'center', shadow: C.outline_deep });
    bubble(ctx, x - 5, head - 8, 2);
    bubble(ctx, x - 8, head - 4, 1);
  } else {
    // à gauche de la tête : au-dessus, il y a les cartes de contact
    drawText(ctx, p.line, x - 16, head + 2,
      { color: C.text_muted, align: 'right', shadow: C.outline_deep });
    bubble(ctx, x - 11, head + 4, 2);
    bubble(ctx, x - 7, head + 7, 1);
  }
  ctx.globalAlpha = 1;
}

function bubble(ctx, x, y, size) {
  ctx.fillStyle = C.text_muted;
  ctx.fillRect(Math.round(x), Math.round(y), size, size);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
