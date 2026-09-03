// Le véritable écran final : transport en commun, casque posé à côté de lui,
// le paysage défile. Puis « ON GARDE CONTACT ? ».
//
// Les liens externes s'ouvrent avec rel/features noopener + noreferrer, ce
// qui limite ce que la page cible peut faire de la page d'origine et la
// provenance transmise. L'e-mail passe par un simple mailto:.

import { Scene, panel } from '../core/game.js';
import { drawText, textWidth } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { CONFIG, contactReady } from '../config.js';
import { drawTransport } from './backdrops.js';
import { makeHeroCs } from './cast.js';

// Les cartes se posent en haut de l'image : le dernier plan appartient à
// Philippe, assis près de la fenêtre, son casque posé à côté de lui.
const CARD = { y: 92, w: 84, h: 46, gap: 8 };
const REPLAY = { x: 288, y: 194, w: 84, h: 14 };

export class OutroScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.reveal = 0;
    this.hero = makeHeroCs(g, { x: 96, y: 196 });
    this.hero.play('window', 2, true);
    g.audio.play('train');

    this.cards = CONFIG.contacts.map((c, i) => ({
      ...c,
      ready: contactReady(c),
      x: 12 + i * (CARD.w + CARD.gap),
      y: CARD.y,
      w: CARD.w,
      h: CARD.h,
    }));
  }

  * script() {
    const g = this.game;
    yield wait(1.4);
    yield g.dlg.say('narrator', T.outro.thanks, { style: 'center', hold: 2.2 });
    yield wait(0.4);
    yield { update: (dt) => (this.reveal = Math.min(1, this.reveal + dt * 1.6)) >= 1 };
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    if (this.reveal < 1) return;

    const g = this.game;
    for (const c of this.cards) {
      if (!g.input.clickIn(c.x, c.y, c.w, c.h)) continue;
      if (!c.ready) {
        g.toasts.push('Lien à compléter', C.error, 2);
        continue;
      }
      g.audio.sfx('confirm');
      this.open(c.url);
    }
    if (g.input.clickIn(REPLAY.x, REPLAY.y, REPLAY.w, REPLAY.h)) g.restart();
  }

  open(url) {
    if (url.startsWith('mailto:')) { window.location.href = url; return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  draw(ctx) {
    drawTransport(ctx, this.t);
    this.hero.draw(ctx);
    drawHelmetProp(ctx, 148, 182);        // le casque, posé à côté de lui

    if (this.reveal <= 0) return;
    ctx.globalAlpha = this.reveal;

    drawText(ctx, T.outro.contact, 192, 78,
      { color: C.sunset_gold, align: 'center', shadow: C.outline_deep });

    for (const c of this.cards) {
      const hover = this.game.input.hoverIn(c.x, c.y, c.w, c.h) && c.ready;
      const accent = C[c.accent] || C.accent_orange;
      panel(ctx, c.x, c.y - (hover ? 1 : 0), c.w, c.h, {
        fill: hover ? '#3A3040' : C.ui_panel,
        border: c.ready ? accent : '#4A3F55',
      });
      const cy = c.y - (hover ? 1 : 0);
      drawIcon(ctx, c.id, c.x + c.w / 2 - 6, cy + 8, c.ready ? accent : '#4A3F55');
      drawText(ctx, c.label, c.x + c.w / 2, cy + 23,
        { color: c.ready ? C.text_cream : '#6A5C72', align: 'center' });
      drawText(ctx, c.ready ? c.sub : 'à compléter', c.x + c.w / 2, cy + 33,
        { color: c.ready ? C.text_muted : C.error, align: 'center' });
    }

    const hoverReplay = this.game.input.hoverIn(REPLAY.x, REPLAY.y, REPLAY.w, REPLAY.h);
    panel(ctx, REPLAY.x, REPLAY.y, REPLAY.w, REPLAY.h,
      { fill: hoverReplay ? '#3A3040' : C.ui_panel });
    drawText(ctx, T.outro.replay, REPLAY.x + REPLAY.w / 2, REPLAY.y + 4,
      { color: C.text_muted, align: 'center' });

    drawText(ctx, T.outro.note, 192, 8,
      { color: '#6A5C72', align: 'center' });
    ctx.globalAlpha = 1;
  }
}

/** Le casque, posé sur le siège : il n'est plus sur sa tête. */
function drawHelmetProp(ctx, x, y) {
  ctx.fillStyle = C.helmet_deep;
  ctx.fillRect(x - 10, y + 4, 21, 2);
  ctx.fillStyle = C.helmet_base;
  ctx.fillRect(x - 10, y + 2, 21, 2);
  ctx.fillRect(x - 6, y - 4, 13, 6);
  ctx.fillStyle = C.helmet_light;
  ctx.fillRect(x - 5, y - 4, 6, 2);
  ctx.fillRect(x - 9, y + 2, 6, 1);
  ctx.fillStyle = C.helmet_shadow;
  ctx.fillRect(x + 4, y - 3, 3, 5);
}

/** Pictogrammes 12×12, dessinés en pixels : aucune icône externe. */
function drawIcon(ctx, id, x, y, color) {
  ctx.fillStyle = color;
  if (id === 'linkedin') {
    ctx.fillRect(x, y, 12, 12);
    ctx.fillStyle = C.ui_panel;
    ctx.fillRect(x + 2, y + 5, 2, 5);
    ctx.fillRect(x + 2, y + 2, 2, 2);
    ctx.fillRect(x + 6, y + 5, 2, 5);
    ctx.fillRect(x + 8, y + 5, 2, 2);
    ctx.fillRect(x + 8, y + 7, 2, 3);
  } else if (id === 'github' || id === 'github_perso') {
    // chevrons « </> » : à 12 px, un logo devient illisible, pas ça
    const chevron = (cx, dir) => {
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(cx + dir * i, y + 3 + i, 2, 1);
        ctx.fillRect(cx + dir * i, y + 9 - i, 2, 1);
      }
    };
    chevron(x + 3, -1);
    chevron(x + 7, 1);
    for (let i = 0; i < 9; i++) {
      ctx.fillRect(x + 7 - Math.round(i * 0.35), y + 2 + i, 1, 1);
    }
  } else {
    ctx.fillRect(x, y + 1, 12, 9);
    ctx.fillStyle = C.ui_panel;
    ctx.fillRect(x + 1, y + 2, 10, 7);
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 2, 2, 2);
    ctx.fillRect(x + 9, y + 2, 2, 2);
    ctx.fillRect(x + 3, y + 4, 2, 2);
    ctx.fillRect(x + 7, y + 4, 2, 2);
    ctx.fillRect(x + 5, y + 5, 2, 2);
  }
}
