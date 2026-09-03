// Écran-titre. Il annonce honnêtement la durée : d'après le rapport, mieux
// vaut dire « environ 5 minutes » que laisser un collègue découvrir qu'il
// s'engage dans un quart d'heure de cinématiques.

import { Scene, panel, button } from '../core/game.js';
import { drawText } from '../core/font.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawSunset } from './backdrops.js';
import { makeHero } from './cast.js';

// Trois entrées possibles. « Aller à la fin » existe pour les gens pressés :
// mieux vaut qu'un collègue lise le message d'au revoir tout de suite que
// pas du tout.
const BTN = { x: 128, w: 128, h: 16 };
const ROWS = [144, 164, 184];

export class TitleScene extends Scene {
  enter() {
    this.t = 0;
    this.hero = makeHero(this.game, { x: 78, y: 196, flip: false });
    this.hero.play('bagIdle', 4, true);
    this.game.audio.play('sunset');
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    const i = this.game.input;

    if (i.clickIn(BTN.x, ROWS[0], BTN.w, BTN.h)) this.start(false);
    else if (i.clickIn(BTN.x, ROWS[1], BTN.w, BTN.h)) this.start(true);
    else if (i.clickIn(BTN.x, ROWS[2], BTN.w, BTN.h)) this.skipToEnd();
    else if (i.justPressed('advance')) this.start(this.game.fastMode);
  }

  start(fast) {
    this.game.fastMode = fast;
    this.game.audio.sfx('confirm');
    this.game.go('exterior');
  }

  /** Saut direct au coucher de soleil : le discours, puis les contacts. */
  skipToEnd() {
    const g = this.game;
    g.audio.sfx('confirm');
    // la mission Atlas est comptee comme vue : l ecran final reste coherent
    g.completeMission('ATLAS');
    g.state.magicButton = 1;
    g.go('sunset');
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

    panel(ctx, 128, 118, 128, 20);
    drawText(ctx, T.title.duration, 192, 124,
      { color: C.text_muted, align: 'center' });

    const labels = [T.title.start, T.title.fast, T.title.end];
    const active = [false, this.game.fastMode, false];
    ROWS.forEach((y, i) => {
      const hover = this.game.input.hoverIn(BTN.x, y, BTN.w, BTN.h);
      button(ctx, BTN.x, y, BTN.w, BTN.h, labels[i], hover || active[i]);
    });

    if (Math.floor(this.t * 1.5) % 2 === 0) {
      drawText(ctx, T.title.hint, 192, 206,
        { color: C.text_muted, align: 'center', shadow: C.outline_deep });
    }
  }
}

/**
 * Titre agrandi ×2 en respectant la grille : on double les pixels.
 * Le rendu est mis en cache — allouer un canvas par image coûterait
 * soixante allocations par seconde pour un texte qui ne bouge pas.
 */
const titleCache = new Map();

function drawTitleWord(ctx, word, cx, y, color) {
  const key = word + color;
  let off = titleCache.get(key);
  if (!off) {
    off = document.createElement('canvas');
    off.width = 384;
    off.height = 12;
    drawText(off.getContext('2d'), word, 192, 1, { color, align: 'center' });
    titleCache.set(key, off);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, 384, 12, cx - 384, y - 2, 768, 24);
}
