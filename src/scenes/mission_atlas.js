// MISSION 01 — ATLAS : « Trop de choses à l'écran »
//
// Objectif narratif : comprendre que la BI, c'est aussi de l'UX.
// Gimmick : réorganiser des blocs comme un puzzle spatial.
// Puis running gag du bouton magique, occurrence n°1 : Philippe bloque
// longtemps, un collègue arrive, appuie sur un bouton ridiculement évident,
// et tout fonctionne.

import { Scene, panel } from '../core/game.js';
import { drawText, textWidth } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C, D } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawFloor, drawDesk, drawScreenContent, GROUND } from './backdrops.js';
import { makeHero, makeNpc } from './cast.js';

const FEET = GROUND + 2;
const DESK_X = 258;

// Zones cibles du rapport. L'ordre de lecture attendu est : navigation à
// gauche, KPI en haut, graphiques au centre, tableau dessous, filtres à
// droite. C'est la « hiérarchie visuelle » que la mission fait débloquer.
const SLOTS = [
  { id: 'NAVIGATION', x: 24, y: 20, w: 42, h: 142 },
  { id: 'KPI', x: 70, y: 20, w: 290, h: 28 },
  { id: 'GRAPHIQUES', x: 70, y: 52, w: 210, h: 62 },
  { id: 'TABLEAU', x: 70, y: 118, w: 210, h: 44 },
  { id: 'FILTRES', x: 284, y: 52, w: 76, h: 110 },
];

export class MissionAtlasScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.phase = 'intro';
    this.placed = new Set();
    this.selected = null;
    this.shake = 0;
    this.zoom = 1;
    this.zoomAt = { x: 192, y: 108 };
    this.screen = 'error';
    this.tray = T.atlas.blocks.map((id, i) => ({
      id, x: 12 + i * 72, y: 176, w: 66, h: 26,
    }));

    this.off = document.createElement('canvas');
    this.off.width = 384; this.off.height = 216;
    this.offCtx = this.off.getContext('2d');
    this.offCtx.imageSmoothingEnabled = false;

    this.hero = makeHero(g, { x: 240, y: FEET });
    this.hero.play('sit', 4, true);
    this.npc = makeNpc(g, 'bi07', { x: 420, y: FEET });
    this.npc.play('idleSide', 4, true);
    g.audio.play('mission');
  }

  * script() {
    const g = this.game;
    yield g.dlg.banner(T.atlas.number + '  ·  ' + T.atlas.id, T.atlas.title, 1.8);
    yield g.dlg.say('narrator', T.atlas.goal, { style: 'center', hold: 1.6 });
    this.phase = 'puzzle';
  }

  /** Zone cible d'un bloc (utilisée aussi par tools/smoke_test.mjs). */
  slotFor(id) { return SLOTS.find((s) => s.id === id); }

  // -- phase 1 : le puzzle -------------------------------------------
  updatePuzzle() {
    const i = this.game.input;
    if (!i.click) return;

    for (const b of this.tray) {
      if (this.placed.has(b.id)) continue;
      if (i.clickIn(b.x, b.y, b.w, b.h)) {
        this.selected = this.selected === b.id ? null : b.id;
        this.game.audio.sfx('select');
        return;
      }
    }
    if (!this.selected) return;

    for (const s of SLOTS) {
      if (!i.clickIn(s.x, s.y, s.w, s.h)) continue;
      if (this.placed.has(s.id)) return;
      if (s.id === this.selected) {
        this.placed.add(s.id);
        this.selected = null;
        this.game.audio.sfx('confirm');
        if (this.placed.size === SLOTS.length) this.solve();
      } else {
        // BONK : erreur sans punition, on rit avec Philippe
        this.shake = 0.22;
        this.game.audio.sfx('bonk');
        this.game.toasts.push(T.atlas.wrong, C.error, 1.2);
      }
      return;
    }
  }

  solve() {
    const g = this.game;
    const self = this;
    this.phase = 'solved';
    g.run((function* () {
      g.audio.sfx('success');
      yield wait(0.6);
      yield g.dlg.say('narrator', T.atlas.solved, { style: 'center', hold: 1.4 });
      self.phase = 'gag';
      yield* self.magicButton();
    })());
  }

  // -- phase 2 : le bouton magique, occurrence n°1 --------------------
  * magicButton() {
    const g = this.game;
    yield wait(0.4);
    yield g.dlg.say('narrator', T.atlas.bug, { style: 'thought', hold: 1.4 });

    this.hero.play('type', 12, true);
    g.audio.sfx('error');
    yield wait(0.7);
    this.hero.play('confused', 6, true);
    g.audio.sfx('error');
    yield wait(0.7);
    this.hero.play('error', 6, true);
    g.audio.sfx('error');
    yield g.dlg.say('philippe', T.atlas.heroPanic);

    // le collègue arrive. Silence.
    this.npc.face(-1);
    yield this.npc.walkTo(292, { walk: 'walk', idle: 'idleSide', audio: g.audio });
    this.npc.face(-1);
    this.hero.play('sit', 4, true);
    yield wait(0.8);
    yield g.dlg.say('bi07', T.atlas.npcArrive);

    // zoom dramatique : ×2 exactement, aucun pixel n'est déformé.
    // La musique se coupe : c'est le silence qui fait la blague.
    this.zoomAt = { x: 292, y: 130 };
    g.audio.play(null);
    yield { update: (dt) => (this.zoom = Math.min(2, this.zoom + dt * 6)) >= 2 };
    this.showButton = true;
    yield wait(0.9);
    this.npc.restart('press', 6, false);
    yield wait(0.35);
    this.pressed = true;
    g.audio.sfx('click');
    yield wait(0.5);
    this.screen = 'ok';
    g.audio.sfx('success');
    yield wait(0.9);
    this.showButton = false;
    yield { update: (dt) => (this.zoom = Math.max(1, this.zoom - dt * 6)) <= 1 };

    this.hero.play('confused', 5, true);
    yield g.dlg.say('philippe', T.atlas.afterPress);
    yield g.dlg.say('bi07', T.atlas.npcYes);
    this.npc.face(1);
    yield this.npc.walkTo(420, { walk: 'walk', idle: 'idleSide' });

    // Philippe regarde la caméra
    this.hero.play('sit', 4, true);
    yield wait(0.7);
    yield g.dlg.say('philippe', T.atlas.heroCamera);

    g.state.magicButton = 1;
    g.audio.play('office');
    yield g.dlg.banner(T.atlas.skillBanner, T.atlas.skillName, 1.8, C.success);
    g.unlock(T.atlas.skillName);
    g.addXp(150);
    g.toasts.push(T.atlas.xp, C.accent_orange, 2.4);
    yield wait(0.9);
    g.completeMission('ATLAS');
    yield g.dlg.banner(T.atlas.done, T.atlas.doneSub, 1.8);
    g.go('montage');
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    this.npc.update(dt);
    if (this.shake > 0) this.shake -= dt;
    if (this.phase === 'puzzle') this.updatePuzzle();
  }

  draw(ctx) {
    const target = this.zoom > 1 ? this.offCtx : ctx;
    target.fillStyle = C.outline_deep;
    target.fillRect(0, 0, 384, 216);

    if (this.phase === 'intro' || this.phase === 'puzzle' || this.phase === 'solved') {
      this.drawReport(target);
    } else {
      this.drawDeskStage(target);
    }

    if (this.zoom > 1) {
      const k = Math.round(this.zoom);
      const w = Math.round(384 / k);
      const h = Math.round(216 / k);
      const sx = Math.max(0, Math.min(384 - w, Math.round(this.zoomAt.x - w / 2)));
      const sy = Math.max(0, Math.min(216 - h, Math.round(this.zoomAt.y - h / 2)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.off, sx, sy, w, h, 0, 0, 384, 216);
    }
  }

  // -- rendu du rapport à réorganiser ---------------------------------
  drawReport(ctx) {
    const sh = this.shake > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    ctx.fillStyle = '#1B1620';
    ctx.fillRect(0, 0, 384, 216);
    drawText(ctx, T.atlas.instruction, 192, 4,
      { color: C.text_muted, align: 'center' });

    panel(ctx, 20 + sh, 14, 344, 152, { fill: '#2A2230' });
    for (const s of SLOTS) {
      const filled = this.placed.has(s.id);
      const hover = this.selected && this.game.input.hoverIn(s.x, s.y, s.w, s.h);
      ctx.fillStyle = filled ? '#3A3040' : (hover ? '#453A50' : '#231C2A');
      ctx.fillRect(s.x + sh, s.y, s.w, s.h);
      ctx.fillStyle = filled ? C.ui_border : (hover ? C.accent_orange : '#3A3040');
      strokeRect(ctx, s.x + sh, s.y, s.w, s.h);
      if (filled) drawSlotContent(ctx, s, this.t);
      else {
        // les zones étroites reçoivent une étiquette sur plusieurs lignes
        const lines = wrapLabel(s.id, s.w - 6);
        lines.forEach((l, i) => drawText(ctx, l, s.x + s.w / 2 + sh,
          s.y + s.h / 2 - 3 - (lines.length - 1) * 4 + i * 9,
          { color: '#4A3F55', align: 'center' }));
      }
    }

    for (const b of this.tray) {
      if (this.placed.has(b.id)) continue;
      const sel = this.selected === b.id;
      const hover = this.game.input.hoverIn(b.x, b.y, b.w, b.h);
      ctx.fillStyle = sel ? C.accent_orange : (hover ? C.ui_cell : C.ui_cell_dark);
      ctx.fillRect(b.x, b.y - (sel ? 2 : 0), b.w, b.h);
      ctx.fillStyle = C.ui_shadow;
      ctx.fillRect(b.x, b.y + b.h - (sel ? 2 : 0), b.w, 2);
      drawText(ctx, b.id, b.x + b.w / 2, b.y + 9 - (sel ? 2 : 0),
        { color: sel ? C.outline_deep : C.text_cream, align: 'center' });
    }

    const left = SLOTS.length - this.placed.size;
    if (left > 0) {
      drawText(ctx, `${left} bloc${left > 1 ? 's' : ''} à placer`, 364, 168,
        { color: C.text_muted, align: 'right' });
    }
  }

  // -- rendu de la scène jouée au bureau ------------------------------
  drawDeskStage(ctx) {
    drawFloor(ctx, this.t, {});
    drawDesk(ctx, DESK_X, this.screen, this.t);
    this.hero.draw(ctx);
    this.npc.draw(ctx);

    if (this.showButton) {
      // le bouton ridiculement évident
      const x = 236;
      const y = 96;
      const w = 68;
      const h = 18;
      ctx.fillStyle = C.ui_shadow;
      ctx.fillRect(x + 2, y + 2, w, h);
      ctx.fillStyle = this.pressed ? C.success : C.ui_cell;
      ctx.fillRect(x, y + (this.pressed ? 2 : 0), w, h);
      ctx.fillStyle = C.text_cream;
      strokeRect(ctx, x, y + (this.pressed ? 2 : 0), w, h);
      drawText(ctx, 'ACTUALISER', x + w / 2, y + 6 + (this.pressed ? 2 : 0),
        { color: this.pressed ? C.outline_deep : C.text_cream, align: 'center' });
      if (!this.pressed && Math.floor(this.t * 3) % 2 === 0) {
        drawText(ctx, '▶', x - 10, y + 6, { color: C.accent_orange });
      }
    }
  }
}

/** Coupe une étiquette de zone en syllabes tenant dans la largeur. */
function wrapLabel(label, maxW) {
  if (textWidth(label) <= maxW) return [label];
  for (let cut = label.length - 2; cut > 2; cut--) {
    if (textWidth(label.slice(0, cut) + '-') <= maxW) {
      return [label.slice(0, cut) + '-', label.slice(cut)];
    }
  }
  return [label];
}

function strokeRect(ctx, x, y, w, h) {
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

/** Maquette du contenu une fois le bloc bien placé : le rapport se construit. */
function drawSlotContent(ctx, s, t) {
  const { x, y, w, h } = s;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, w - 4, h - 4);
  ctx.clip();
  if (s.id === 'KPI') {
    for (let i = 0; i < 4; i++) {
      const bx = x + 5 + i * 72;
      ctx.fillStyle = C.ui_cell_dark;
      ctx.fillRect(bx, y + 5, 66, 18);
      ctx.fillStyle = C.accent_orange;
      ctx.fillRect(bx, y + 5, 2, 18);
      drawText(ctx, ['TOTAL', 'ACTIFS', 'TAUX', 'ÉCART'][i], bx + 6, y + 8,
        { color: C.text_muted });
      drawText(ctx, ['1 240', '318', '62 %', '+4'][i], bx + 6, y + 15,
        { color: C.text_cream });
    }
  } else if (s.id === 'GRAPHIQUES') {
    for (let i = 0; i < 14; i++) {
      const bh = 6 + ((i * 7) % 34);
      ctx.fillStyle = i % 3 === 0 ? C.sunset_gold : D.screen_on;
      ctx.fillRect(x + 8 + i * 14, y + h - 8 - bh, 9, bh);
    }
    ctx.fillStyle = C.ui_border;
    ctx.fillRect(x + 6, y + h - 8, w - 12, 1);
  } else if (s.id === 'TABLEAU') {
    for (let r = 0; r < 4; r++) {
      ctx.fillStyle = r === 0 ? C.ui_border : (r % 2 ? '#2F2738' : '#332B3C');
      ctx.fillRect(x + 6, y + 6 + r * 9, w - 12, 8);
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = r === 0 ? C.text_cream : C.text_muted;
        ctx.fillRect(x + 10 + c * 50, y + 9 + r * 9, 32, 2);
      }
    }
  } else if (s.id === 'FILTRES') {
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = C.ui_cell_dark;
      ctx.fillRect(x + 6, y + 8 + i * 20, w - 12, 14);
      ctx.fillStyle = i === 1 ? C.success : C.ui_border;
      ctx.fillRect(x + 9, y + 12 + i * 20, 6, 6);
      drawText(ctx, ['Période', 'Équipe', 'Statut', 'Source', 'Version'][i],
        x + 19, y + 12 + i * 20, { color: C.text_muted });
    }
  } else if (s.id === 'NAVIGATION') {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i === 0 ? C.accent_orange : C.ui_cell_dark;
      ctx.fillRect(x + 5, y + 8 + i * 22, w - 10, 16);
      ctx.fillStyle = i === 0 ? C.outline_deep : C.text_muted;
      ctx.fillRect(x + 9, y + 14 + i * 22, 24, 3);
    }
  }
  ctx.restore();
}
