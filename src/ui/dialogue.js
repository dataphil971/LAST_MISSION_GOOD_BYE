// Dialogues, bannieres et notifications.
//
// Contraintes UX du rapport :
//   - le joueur avance au clic ou a ESPACE ;
//   - ESPACE maintenu accelere la frappe ;
//   - une cinematique ne doit jamais devenir une prison (voir game.skippable).
// Le casque de Philippe joue plus que son corps : le portrait affiche donc
// l animation reelle du personnage, pas une illustration figee.

import { drawText, wrapText, textWidth, LINE_H } from '../core/font.js';
import { panel } from '../core/game.js';
import { C } from '../data/palette.js';
import { CONFIG } from '../config.js';

const BOX = { x: 8, y: 156, w: 368, h: 52 };
const TEXT_X = BOX.x + 48;
const TEXT_W = BOX.w - 56;

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = null;
    this.cast = new Map();
  }

  /** Enregistre un locuteur : nom affiche, couleur, portrait anime. */
  defineSpeaker(id, def) { this.cast.set(id, def); }

  /**
   * Replique. Renvoie une commande pour la timeline :
   *   yield dlg.say('philippe', 'Bonjour !');
   * opts : { style: 'box' | 'center' | 'thought', hold: secondes }
   */
  say(speakerId, text, opts = {}) {
    const self = this;
    const speaker = this.cast.get(speakerId) || { name: '', color: C.text_cream };
    const lines = opts.style === 'box' || !opts.style
      ? wrapText(text, TEXT_W)
      : wrapText(text, 260);
    const total = lines.join('').length;

    const cmd = {
      speakerId, speaker, lines, total,
      style: opts.style || 'box',
      hold: opts.hold || 0,
      shown: 0,
      done: false,
      anim: 0,
      update(dt) {
        self.active = cmd;
        cmd.anim += dt;
        const fast = self.game.input.isDown('advance') || self.game.fastMode;
        const speed = fast ? CONFIG.textSpeedFast : CONFIG.textSpeed;
        const before = Math.floor(cmd.shown);
        cmd.shown = Math.min(total, cmd.shown + speed * dt);
        if (Math.floor(cmd.shown) > before && Math.floor(cmd.shown) % 3 === 0) {
          self.game.audio.sfx('text');
        }
        const complete = cmd.shown >= total;
        const advance = self.game.input.justPressed('advance');
        if (!complete) {
          if (advance) cmd.shown = total;   // premier appui : tout afficher
          return false;
        }
        if (cmd.hold > 0) {
          cmd.hold -= dt;
          if (cmd.hold <= 0 || advance) { self.active = null; return true; }
          return false;
        }
        if (advance) { self.active = null; self.game.audio.sfx('click'); return true; }
        return false;
      },
    };
    return cmd;
  }

  /** Panneau plein ecran facon notification systeme. */
  banner(title, sub = '', dur = 1.6, color = C.accent_orange) {
    const self = this;
    const cmd = {
      banner: true, title, sub, color, t: 0, dur,
      update(dt) {
        self.activeBanner = cmd;
        cmd.t += dt;
        const skip = self.game.input.justPressed('advance') && cmd.t > 0.25;
        if (cmd.t >= dur || skip) { self.activeBanner = null; return true; }
        return false;
      },
    };
    return cmd;
  }

  clear() { this.active = null; this.activeBanner = null; }

  draw(ctx) {
    if (this.activeBanner) this._drawBanner(ctx, this.activeBanner);
    if (!this.active) return;
    const d = this.active;
    if (d.style === 'center' || d.style === 'thought') this._drawCentered(ctx, d);
    else this._drawBox(ctx, d);
  }

  _visibleLines(d) {
    let left = Math.floor(d.shown);
    const out = [];
    for (const line of d.lines) {
      if (left <= 0) { out.push(''); continue; }
      out.push(line.slice(0, left));
      left -= line.length;
    }
    return out;
  }

  _drawBox(ctx, d) {
    panel(ctx, BOX.x, BOX.y, BOX.w, BOX.h);

    // portrait : cadre + animation vivante du locuteur
    const px = BOX.x + 5;
    const py = BOX.y + 7;
    ctx.fillStyle = C.ui_cell_dark;
    ctx.fillRect(px, py, 38, 38);
    if (d.speaker.atlas && d.speaker.tag) {
      const idx = Math.floor(d.anim * 4);
      d.speaker.atlas.drawPortrait(ctx, d.speaker.tag, idx, px + 2, py + 2, 34);
    }
    ctx.fillStyle = C.ui_border;
    ctx.fillRect(px, py, 38, 1);
    ctx.fillRect(px, py + 37, 38, 1);
    ctx.fillRect(px, py, 1, 38);
    ctx.fillRect(px + 37, py, 1, 38);

    if (d.speaker.name) {
      const w = textWidth(d.speaker.name) + 6;
      ctx.fillStyle = C.ui_shadow;
      ctx.fillRect(TEXT_X - 2, BOX.y - 8, w, 9);
      ctx.fillStyle = C.ui_border;
      ctx.fillRect(TEXT_X - 2, BOX.y - 8, w, 1);
      drawText(ctx, d.speaker.name, TEXT_X + 1, BOX.y - 7,
        { color: d.speaker.color || C.text_cream });
    }

    const lines = this._visibleLines(d);
    lines.forEach((l, i) => drawText(ctx, l, TEXT_X, BOX.y + 8 + i * LINE_H,
      { color: C.text_cream }));

    if (d.shown >= d.total && d.hold <= 0) {
      const blink = Math.floor(d.anim * 3) % 2 === 0;
      if (blink) {
        drawText(ctx, '▶', BOX.x + BOX.w - 12, BOX.y + BOX.h - 12,
          { color: C.accent_orange });
      }
    }
  }

  _drawCentered(ctx, d) {
    const lines = this._visibleLines(d);
    const color = d.style === 'thought' ? C.text_muted : C.text_cream;
    const y0 = 168 - Math.floor(lines.length * LINE_H / 2);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(0, y0 - 6, 384, lines.length * LINE_H + 12);
    ctx.globalAlpha = 1;
    lines.forEach((l, i) => drawText(ctx, l, 192, y0 + i * LINE_H,
      { color, align: 'center', shadow: C.outline_deep }));
  }

  _drawBanner(ctx, b) {
    // apparition / disparition rapides : la banniere ponctue, elle ne bloque pas
    const k = Math.min(1, Math.min(b.t, b.dur - b.t) * 6);
    const h = Math.max(1, Math.round(38 * k));
    const y = 108 - Math.floor(h / 2);
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(0, y, 384, h);
    ctx.fillStyle = b.color;
    ctx.fillRect(0, y, 384, 1);
    ctx.fillRect(0, y + h - 1, 384, 1);
    if (h > 20) {
      drawText(ctx, b.title, 192, 100, { color: b.color, align: 'center' });
      if (b.sub) {
        drawText(ctx, b.sub, 192, 110, { color: C.text_muted, align: 'center' });
      }
    }
  }
}

/** File de notifications discretes (XP, competence, qualite). */
export class Toasts {
  constructor(game) { this.game = game; this.items = []; }

  push(text, color = C.success, dur = 2.2) {
    this.items.push({ text, color, t: 0, dur });
    this.game.audio.sfx('xp');
  }

  update(dt) {
    for (const it of this.items) it.t += dt;
    this.items = this.items.filter((it) => it.t < it.dur);
  }

  draw(ctx) {
    this.items.forEach((it, i) => {
      const k = Math.min(1, it.t * 5, (it.dur - it.t) * 5);
      const w = textWidth(it.text) + 12;
      const x = 384 - w - 6;
      const y = 8 + i * 13 - Math.round((1 - k) * 6);
      ctx.globalAlpha = k;
      ctx.fillStyle = C.ui_shadow;
      ctx.fillRect(x, y, w, 11);
      ctx.fillStyle = it.color;
      ctx.fillRect(x, y, 2, 11);
      drawText(ctx, it.text, x + 6, y + 2, { color: C.text_cream });
      ctx.globalAlpha = 1;
    });
  }
}
