// Écran-titre. Il annonce honnêtement la durée : d'après le rapport, mieux
// vaut dire « environ 5 minutes » que laisser un collègue découvrir qu'il
// s'engage dans un quart d'heure de cinématiques.

import { Scene, panel, button } from '../core/game.js';
import { drawText } from '../core/font.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawSunset } from './backdrops.js';
import { makeHero } from './cast.js';

export class TitleScene extends Scene {
  enter() {
    this.t = 0;
    this.hero = makeHero(this.game, { x: 92, y: 196, flip: false });
    this.hero.play('bagIdle', 4, true);
    this.game.audio.play('sunset');
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    const i = this.game.input;

    if (i.clickIn(136, 150, 112, 16)) this.start(false);
    else if (i.clickIn(136, 170, 112, 16)) this.start(true);
    else if (i.justPressed('advance')) this.start(this.game.fastMode);
  }

  start(fast) {
    this.game.fastMode = fast;
    this.game.audio.sfx('confirm');
    this.game.go('exterior');
  }

  draw(ctx) {
    drawSunset(ctx, this.t * 0.2);
    this.hero.draw(ctx);

    // bandeau titre : aplat sombre, pas d'ombre floue
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(0, 28, 384, 66);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.accent_orange;
    ctx.fillRect(0, 28, 384, 1);
    ctx.fillRect(0, 93, 384, 1);

    drawTitleWord(ctx, T.title.name, 192, 40, C.text_cream);
    drawTitleWord(ctx, T.title.sub, 192, 62, C.sunset_gold);
    drawText(ctx, T.title.tagline, 192, 82,
      { color: C.text_muted, align: 'center' });

    panel(ctx, 128, 118, 128, 22);
    drawText(ctx, T.title.duration, 192, 126,
      { color: C.text_muted, align: 'center' });

    const hoverPlay = this.game.input.hoverIn(136, 150, 112, 16);
    const hoverFast = this.game.input.hoverIn(136, 170, 112, 16);
    button(ctx, 136, 150, 112, 16, T.title.start, hoverPlay);
    button(ctx, 136, 170, 112, 16, T.title.fast, hoverFast || this.game.fastMode);

    if (Math.floor(this.t * 1.5) % 2 === 0) {
      drawText(ctx, T.title.hint, 192, 200,
        { color: C.text_muted, align: 'center', shadow: C.outline_deep });
    }
  }
}

/** Titre agrandi ×2 en respectant la grille : on double les pixels. */
function drawTitleWord(ctx, word, cx, y, color) {
  const off = document.createElement('canvas');
  off.width = 384; off.height = 12;
  const octx = off.getContext('2d');
  drawText(octx, word, 192, 1, { color, align: 'center' });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, 384, 12, cx - 384, y - 2, 768, 24);
}
