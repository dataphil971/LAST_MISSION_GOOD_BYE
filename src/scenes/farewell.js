// ACTE V — Quitter.
//
// Le trajet du soir est exactement l'inverse de celui du matin :
// BUREAU → PLATEAU → COULOIR → ASCENSEUR → RDC → ACCUEIL → EXTÉRIEUR.
// C'est cette symétrie qui donne la sensation d'avoir bouclé quelque chose.
// Pas de fanfare : le son se retire, et on tient sur les silences.

import { Scene, panel } from '../core/game.js';
import { drawText } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawFloor, drawDesk, drawSunset, GROUND } from './backdrops.js';
import { makeHero, makeHeroCs } from './cast.js';

const FEET = GROUND + 2;
const DESK_X = 258;

// ---------------------------------------------------------------------
export class DepartureScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.screen = 'dashboard';
    this.closing = -1;          // index de l'application en cours de fermeture
    this.hero = makeHero(g, { x: 240, y: FEET });
    this.hero.play('sit', 4, true);
    g.audio.play('office');
    g.skippable = () => this.leave();
  }

  * script() {
    const g = this.game;
    yield wait(0.8);
    this.hero.play('type', 6, true);
    yield wait(0.6);

    // il ferme ses applications, une par une
    for (let i = 0; i < T.departure.apps.length; i++) {
      this.closing = i;
      g.audio.sfx('click');
      yield wait(g.fastMode ? 0.28 : 0.5);
    }
    this.closing = T.departure.apps.length;
    yield wait(0.4);
    g.audio.sfx('shutdown');
    this.screen = 'off';
    g.audio.play(null);           // le son disparaît presque entièrement
    yield wait(1.2);

    this.hero.play('idle', 5, true);
    yield wait(0.5);
    this.hero.play('bagIdle', 5, true);
    yield wait(0.9);

    // il regarde son bureau. Pas de dialogue : c'est voulu.
    this.hero.face(1);
    yield wait(1.6);
    this.hero.face(-1);
    yield wait(0.5);
    this.leave();
  }

  leave() {
    const g = this.game;
    g.skippable = null;
    const self = this;
    g.run((function* () {
      yield self.hero.walkTo(-24, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
      g.go('elevator', { evening: true });
    })());
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
  }

  draw(ctx) {
    drawFloor(ctx, this.t, { evening: true });
    drawDesk(ctx, DESK_X, this.screen, this.t);
    this.hero.draw(ctx);

    if (this.closing >= 0 && this.screen !== 'off') {
      // huit applications : le panneau se dimensionne sur la liste
      // panneau calé à gauche : Philippe et son écran restent visibles
      const n = T.departure.apps.length;
      const h = 22 + n * 9;
      const y = 112 - Math.floor(h / 2);
      const x = 30;
      const w = 150;
      panel(ctx, x, y, w, h);
      drawText(ctx, T.departure.closing, x + w / 2, y + 6,
        { color: C.text_muted, align: 'center' });
      T.departure.apps.forEach((app, i) => {
        const gone = i < this.closing;
        drawText(ctx, (gone ? '·  ' : '▶  ') + app, x + 16, y + 18 + i * 9,
          { color: gone ? '#4A3F55' : C.text_cream });
      });
    }
  }
}

// ---------------------------------------------------------------------
export class SunsetScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.thanks = 0;
    this.hero = makeHeroCs(g, { x: 130, y: 196 });
    this.hero.play('turn', 3, true);
    g.audio.play('sunset');
    g.skippable = () => this.toThanks();
  }

  * script() {
    const g = this.game;
    yield wait(0.6);
    yield this.hero.walkTo(196, { walk: 'turn', idle: 'turn', speed: 14 });
    yield wait(1.2);                 // il s'arrête, il se retourne
    this.hero.restart('turn', 2, false);
    yield wait(1.4);

    for (const line of T.sunset.speech) {
      yield g.dlg.say('philippe', line, { style: 'center' });
    }
    this.toThanks();
  }

  toThanks() {
    const g = this.game;
    g.skippable = null;
    g.dlg.clear();
    const self = this;
    g.run((function* () {
      yield wait(0.6);
      yield { update: (dt) => (self.thanks = Math.min(1, self.thanks + dt)) >= 1 };
      yield wait(1.8);
      g.audio.play(null);
      g.go('credits', {}, 1.4);
    })());
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
  }

  draw(ctx) {
    drawSunset(ctx, this.t);
    this.hero.draw(ctx);
    if (this.thanks > 0) {
      ctx.globalAlpha = this.thanks;
      drawText(ctx, T.sunset.thanks, 192, 176,
        { color: C.sunset_gold, align: 'center', shadow: C.outline_deep });
      ctx.globalAlpha = 1;
    }
  }
}

// ---------------------------------------------------------------------
// Le faux générique : trois secondes, puis retour brutal.
// ---------------------------------------------------------------------
export class CreditsScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.phase = 'credits';
    this.quest = 0;
    this.hero = makeHeroCs(g, { x: 150, y: 196 });
    this.hero.play('phone', 4, true);
    g.audio.play(null);
  }

  * script() {
    const g = this.game;
    // un peu plus long qu'avant : il y a maintenant quelque chose à lire
    yield wait(g.fastMode ? 2.4 : 4.6);

    // retour brutal
    this.phase = 'street';
    g.audio.sfx('bonk');
    yield wait(0.8);
    g.audio.sfx('select');
    this.phase = 'phone';
    yield wait(1.2);

    // le casque descend lentement jusqu'aux yeux
    this.hero.restart('phoneShock', 3, false);
    g.audio.play('boss');
    yield wait(1.6);

    yield { update: (dt) => (this.quest = Math.min(1, this.quest + dt * 2)) >= 1 };
    yield wait(g.fastMode ? 1.2 : 2.2);
    yield g.dlg.say('philippe', T.credits.heroSilence, { style: 'center', hold: 1.4 });
    yield wait(0.4);
    yield g.dlg.say('philippe', T.credits.heroOk, { style: 'center', hold: 1.2 });

    this.quest = 0;
    g.audio.play(null);
    yield this.hero.walkTo(420, { walk: 'phone', idle: 'phone', speed: 34 });
    g.go('outro', {}, 1.0);
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
  }

  draw(ctx) {
    if (this.phase === 'credits') {
      // Vrai générique : fonction à gauche, nom à droite, aligné sur deux
      // colonnes. C'est ce qui le distingue d'une simple liste de noms.
      ctx.fillStyle = '#0E0A10';
      ctx.fillRect(0, 0, 384, 216);
      drawText(ctx, T.credits.title, 192, 52,
        { color: C.sunset_gold, align: 'center' });
      ctx.fillStyle = C.ui_border;
      ctx.fillRect(96, 66, 192, 1);
      T.credits.roles.forEach(([label, name], i) => {
        const y = 82 + i * 15;
        drawText(ctx, label, 72, y, { color: C.text_muted });
        drawText(ctx, name, 312, y, { color: C.text_cream, align: 'right' });
      });
      drawText(ctx, T.credits.footer, 192, 156,
        { color: '#6A5C72', align: 'center' });
      return;
    }

    drawSunset(ctx, this.t * 0.3);
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = C.night_blue;
    ctx.fillRect(0, 0, 384, 216);
    ctx.globalAlpha = 1;
    this.hero.draw(ctx);

    if (this.phase === 'phone' || this.quest > 0) {
      panel(ctx, 108, 26, 168, 34);
      drawText(ctx, T.credits.route, 192, 32,
        { color: C.text_muted, align: 'center' });
      drawText(ctx, T.credits.time, 192, 44,
        { color: C.error, align: 'center' });
    }

    if (this.quest > 0) {
      const h = Math.round(56 * this.quest);
      const y = 132 - Math.floor(h / 2);
      panel(ctx, 84, y, 216, h, { border: C.accent_orange });
      if (h > 40) {
        drawText(ctx, T.credits.questBanner, 192, y + 6,
          { color: C.accent_orange, align: 'center' });
        drawText(ctx, T.credits.questName, 192, y + 17,
          { color: C.text_cream, align: 'center' });
        drawText(ctx, T.credits.questDiff, 96, y + 30, { color: C.text_muted });
        drawText(ctx, T.credits.questDur, 96, y + 38, { color: C.text_muted });
        drawText(ctx, T.credits.questReward, 96, y + 46, { color: C.success });
      }
    }
  }
}
