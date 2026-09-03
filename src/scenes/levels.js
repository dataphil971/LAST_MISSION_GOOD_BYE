// Sélection de mission, accessible depuis l'accueil.
//
// L'écran assume ce que le prototype est : deux missions jouables, dix
// encore à produire. Les cases vides ne sont pas cachées — elles montrent
// l'architecture complète du récit, et c'est plus honnête qu'une grille
// tronquée. Une mission lancée d'ici revient ici, sans embarquer le joueur
// dans la suite de la journée.

import { Scene, panel } from '../core/game.js';
import { drawText, truncate } from '../core/font.js';
import { C } from '../data/palette.js';
import { T, LEVELS } from '../data/script.js';
import { drawSunset } from './backdrops.js';

const GRID = { cols: [10, 196], w: 178, h: 21, top: 30, gap: 23, rows: 6 };
const BACK = { x: 144, y: 190, w: 96, h: 14 };

export class LevelsScene extends Scene {
  enter() {
    this.t = 0;
    this.cells = LEVELS.map((level, i) => ({
      num: level[0],
      code: level[1],
      title: level[2],
      scene: level[3],
      x: GRID.cols[Math.floor(i / GRID.rows)],
      y: GRID.top + (i % GRID.rows) * GRID.gap,
      w: GRID.w,
      h: GRID.h,
    }));
    this.game.audio.play('office');
  }

  update(dt) {
    this.t += dt;
    const g = this.game;

    for (const cell of this.cells) {
      if (!cell.scene) continue;
      if (!g.input.clickIn(cell.x, cell.y, cell.w, cell.h)) continue;
      g.audio.sfx('confirm');
      // la mission se joue seule : elle reviendra ici, pas dans la journée
      g.state.flags.standalone = true;
      g.go(cell.scene);
      return;
    }

    if (g.input.clickIn(BACK.x, BACK.y, BACK.w, BACK.h)) {
      g.audio.sfx('select');
      g.go('title');
    }
  }

  draw(ctx) {
    drawSunset(ctx, this.t * 0.15);
    ctx.globalAlpha = 0.86;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(0, 0, 384, 216);
    ctx.globalAlpha = 1;

    drawText(ctx, T.levels.title, 192, 6,
      { color: C.accent_orange, align: 'center' });
    drawText(ctx, T.levels.sub, 192, 17,
      { color: C.text_muted, align: 'center' });

    for (const cell of this.cells) {
      const playable = !!cell.scene;
      const done = this.game.state.missions.includes(cell.code);
      const hover = playable && this.game.input.hoverIn(cell.x, cell.y, cell.w, cell.h);
      const accent = done ? C.success : C.accent_orange;

      panel(ctx, cell.x, cell.y - (hover ? 1 : 0), cell.w, cell.h, {
        fill: hover ? '#3A3040' : (playable ? C.ui_panel : '#221C28'),
        border: playable ? accent : '#332C3A',
      });
      const y = cell.y - (hover ? 1 : 0);

      drawText(ctx, cell.num, cell.x + 6, y + 3,
        { color: playable ? accent : '#4A3F55' });
      drawText(ctx, cell.code, cell.x + 24, y + 3,
        { color: playable ? C.text_cream : '#5A4E63' });

      const badge = done ? T.levels.done : (playable ? T.levels.play : T.levels.todo);
      drawText(ctx, badge, cell.x + cell.w - 6, y + 3,
        { color: done ? C.success : (playable ? C.text_cream : '#4A3F55'),
          align: 'right' });

      // titre tronqué avec une ellipse : couper en silence au milieu d'une
      // phrase se lirait comme un bug
      drawText(ctx, truncate(cell.title, cell.w - 12), cell.x + 6, y + 12,
        { color: playable ? C.text_muted : '#463C50' });
    }

    const hoverBack = this.game.input.hoverIn(BACK.x, BACK.y, BACK.w, BACK.h);
    panel(ctx, BACK.x, BACK.y, BACK.w, BACK.h,
      { fill: hoverBack ? '#3A3040' : C.ui_panel });
    drawText(ctx, T.levels.back, BACK.x + BACK.w / 2, BACK.y + 4,
      { color: C.text_muted, align: 'center' });
  }
}
