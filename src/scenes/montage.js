// Ellipse : les onze missions restantes défilent en accéléré.
//
// C'est le seul endroit où le prototype assume son statut de tranche
// verticale. Plutôt que de simuler onze missions qui n'existent pas, on
// montre l'architecture complète du récit et on annonce clairement ce qui
// reste à produire. Chaque ligne correspond à une mission décrite dans le
// rapport de conception.

import { Scene, panel } from '../core/game.js';
import { drawText } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';

export class MontageScene extends Scene {
  enter() {
    this.t = 0;
    this.shown = 0;
    this.game.audio.play('mission');
    this.game.skippable = () => this.finish();
  }

  * script() {
    const g = this.game;
    yield g.dlg.banner(T.montage.banner, T.montage.note, 1.8);
    for (let i = 0; i < T.montage.missions.length; i++) {
      this.shown = i + 1;
      g.audio.sfx('select');
      yield wait(g.fastMode ? 0.16 : 0.28);
    }
    yield wait(0.6);
    g.audio.sfx('success');
    yield g.dlg.banner(T.montage.end, T.montage.endSub, 1.5, C.success);
    yield wait(0.5);
    g.audio.play(null);
    yield g.dlg.banner(T.montage.internship, T.montage.internshipSub, 2.2,
      C.accent_orange);
    this.finish();
  }

  finish() {
    this.game.skippable = null;
    this.game.go('departure', {}, 0.8);
  }

  update(dt) { this.t += dt; }

  draw(ctx) {
    ctx.fillStyle = '#1B1620';
    ctx.fillRect(0, 0, 384, 216);
    drawText(ctx, T.montage.banner, 192, 8,
      { color: C.accent_orange, align: 'center' });
    drawText(ctx, T.montage.note, 192, 18,
      { color: C.text_muted, align: 'center' });

    const rows = T.montage.missions;
    for (let i = 0; i < rows.length; i++) {
      const [num, code, title] = rows[i];
      const y = 30 + i * 16;
      const done = i < this.shown;
      const appearing = i === this.shown - 1 && this.t > 0;
      panel(ctx, 40, y, 304, 14, {
        fill: done ? '#2A2230' : '#201A26',
        border: done ? C.ui_border : '#2A2230',
      });
      drawText(ctx, num, 48, y + 4,
        { color: done ? C.accent_orange : '#3A3040' });
      drawText(ctx, code, 66, y + 4,
        { color: done ? C.text_cream : '#3A3040' });
      drawText(ctx, title, 132, y + 4,
        { color: done ? C.text_muted : '#332B3C' });
      if (done) {
        drawText(ctx, appearing ? '▶' : '·', 332, y + 4,
          { color: C.success, align: 'right' });
      }
    }
  }
}
