// Déplacement libre du joueur + zones d'interaction.
//
// Le rapport insiste : la cinématique ne doit jamais devenir une prison.
// Entre deux plans scénarisés, le joueur reprend donc la main et marche
// lui-même jusqu'au prochain déclencheur.

import { drawText, textWidth } from '../core/font.js';
import { C } from '../data/palette.js';

export class Walker {
  constructor(game, actor, opts) {
    this.game = game;
    this.actor = actor;
    this.min = opts.min;
    this.max = opts.max;
    this.triggers = opts.triggers || [];
    this.enabled = opts.enabled !== false;
    this.walkKey = opts.walk || 'walk';
    this.idleKey = opts.idle || 'idle';
    this.stepTimer = 0;
    this.hint = 0;          // temporisation avant d'afficher la flèche d'aide
  }

  get busy() {
    const tl = this.game.timeline;
    return !!(tl && !tl.done);
  }

  update(dt) {
    const a = this.actor;
    if (!this.enabled || this.busy) { a.play(this.idleKey, 6, true); return; }

    const i = this.game.input;
    let dir = 0;
    if (i.isDown('left')) dir -= 1;
    if (i.isDown('right')) dir += 1;

    // au clic loin du personnage, il se dirige vers le point cliqué
    if (i.click && i.click.y > 90) {
      this.target = i.click.x;
      i.click = null;
    }
    if (dir !== 0) this.target = null;
    if (this.target != null) {
      const d = this.target - a.x;
      if (Math.abs(d) < 3) this.target = null;
      else dir = Math.sign(d);
    }

    if (dir !== 0) {
      this.hint = 0;
      a.face(dir);
      a.play(this.walkKey, 10, true);
      a.x = Math.max(this.min, Math.min(this.max, a.x + dir * a.speed * dt));
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) { this.game.audio.sfx('step'); this.stepTimer = 0.3; }
    } else {
      a.play(this.idleKey, 6, true);
      this.hint += dt;
    }

    const zone = this.zoneAt(a.x);
    if (zone && i.justPressed('advance')) {
      this.enabled = false;
      this.game.audio.sfx('select');
      zone.action();
    }
  }

  zoneAt(x) {
    return this.triggers.find((z) => x >= z.x && x <= z.x + z.w);
  }

  /** Bulle d'action au-dessus du personnage + flèche d'orientation. */
  draw(ctx) {
    if (!this.enabled || this.busy) return;
    const a = this.actor;
    const zone = this.zoneAt(a.x);
    if (zone) {
      const label = '▶ ' + zone.label;
      const w = textWidth(label) + 8;
      const x = Math.round(a.x - w / 2);
      const y = Math.round(a.y - 62);
      ctx.fillStyle = C.ui_shadow;
      ctx.fillRect(x, y, w, 11);
      ctx.fillStyle = C.accent_orange;
      ctx.fillRect(x, y, w, 1);
      drawText(ctx, label, x + 4, y + 2, { color: C.text_cream });
    } else if (this.hint > 1.6 && this.triggers.length) {
      const target = this.triggers[0];
      const dir = target.x > a.x ? 1 : -1;
      const bob = Math.floor(this.hint * 3) % 2;
      drawText(ctx, dir > 0 ? '→' : '←', a.x + dir * 16, a.y - 34 + bob,
        { color: C.text_muted, align: 'center' });
    }
  }
}
