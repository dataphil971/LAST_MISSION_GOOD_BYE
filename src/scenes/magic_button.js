// Le running gag du bouton, en un seul endroit.
//
// Il apparaît quatre fois : ATLAS (Philippe subit), ECHO (il anticipe mal),
// VERDANT (il est autonome), SENTINEL (il transmet). La quatrième occurrence
// ne fonctionne que si elle rejoue EXACTEMENT le plan de la première —
// même coupure de musique, même zoom, même silence avant le clic. Écrites
// deux fois à la main, les deux scènes divergeraient et le payoff tomberait
// à plat.
//
// Ce module possède donc le PLAN. Les répliques, elles, restent dans chaque
// mission : c'est ce qui change d'une occurrence à l'autre.

import { wait } from '../core/timeline.js';
import { drawText } from '../core/font.js';
import { C } from '../data/palette.js';

export class MagicButton {
  constructor(game, opts = {}) {
    this.game = game;
    this.label = opts.label || 'ACTUALISER';
    this.x = opts.x == null ? 236 : opts.x;
    this.y = opts.y == null ? 96 : opts.y;
    this.w = opts.w == null ? 68 : opts.w;
    this.h = 18;
    // le cadrage est volontairement le même pour toutes les occurrences
    this.zoomAt = opts.zoomAt || { x: 292, y: 130 };

    this.zoom = 1;
    this.visible = false;
    this.pressed = false;
    this.t = 0;

    this.off = document.createElement('canvas');
    this.off.width = 384;
    this.off.height = 216;
    this.offCtx = this.off.getContext('2d');
    this.offCtx.imageSmoothingEnabled = false;
  }

  update(dt) { this.t += dt; }

  /**
   * Le plan complet. `presser` est l'acteur qui appuie — un collègue à la
   * première occurrence, Philippe à la dernière.
   * Rend la musique qui jouait avant, pour que l'appelant la restaure.
   */
  * run({ presser, pressKey = 'press', onSuccess }) {
    const g = this.game;
    const previous = g.audio.mood;

    // le silence fait la blague : on coupe avant de zoomer
    g.audio.play(null);
    yield { update: (dt) => (this.zoom = Math.min(2, this.zoom + dt * 6)) >= 2 };

    this.visible = true;
    yield wait(0.9);                       // le temps de voir l'évidence

    if (presser) presser.restart(pressKey, 6, false);
    yield wait(0.35);
    this.pressed = true;
    g.audio.sfx('click');
    yield wait(0.5);

    if (onSuccess) onSuccess();
    g.audio.sfx('success');
    yield wait(0.9);                       // on tient sur la réussite

    this.visible = false;
    yield { update: (dt) => (this.zoom = Math.max(1, this.zoom - dt * 6)) <= 1 };
    this.pressed = false;
    return previous;
  }

  /**
   * Dessine la scène, zoomée si besoin. Le facteur reste ENTIER : on rend
   * hors écran puis on agrandit d'un facteur 2 exact, jamais 1,7.
   */
  render(ctx, drawScene) {
    const zoomed = this.zoom > 1.5;
    const target = zoomed ? this.offCtx : ctx;
    drawScene(target);
    if (this.visible) this.drawButton(target);
    if (!zoomed) return;

    const w = 192;
    const h = 108;
    const sx = Math.max(0, Math.min(384 - w, Math.round(this.zoomAt.x - w / 2)));
    const sy = Math.max(0, Math.min(216 - h, Math.round(this.zoomAt.y - h / 2)));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.off, sx, sy, w, h, 0, 0, 384, 216);
  }

  /** Le bouton ridiculement évident. */
  drawButton(ctx) {
    const dy = this.pressed ? 2 : 0;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(this.x + 2, this.y + 2, this.w, this.h);
    ctx.fillStyle = this.pressed ? C.success : C.ui_cell;
    ctx.fillRect(this.x, this.y + dy, this.w, this.h);
    ctx.fillStyle = C.text_cream;
    ctx.fillRect(this.x, this.y + dy, this.w, 1);
    ctx.fillRect(this.x, this.y + dy + this.h - 1, this.w, 1);
    ctx.fillRect(this.x, this.y + dy, 1, this.h);
    ctx.fillRect(this.x + this.w - 1, this.y + dy, 1, this.h);
    drawText(ctx, this.label, this.x + this.w / 2, this.y + dy + 6,
      { color: this.pressed ? C.outline_deep : C.text_cream, align: 'center' });
    if (!this.pressed && Math.floor(this.t * 3) % 2 === 0) {
      drawText(ctx, '▶', this.x - 10, this.y + 6, { color: C.accent_orange });
    }
  }
}
