// ACTE I (suite) — Le plateau.
//
// Idée structurante du rapport : Philippe ne refait pas douze projets
// pendant sa dernière journée. La journée est le PRÉSENT ; les missions
// sont des souvenirs déclenchés par un objet, un écran, un lieu, un PNJ.
// Ici, c'est un vieux tableau de bord resté ouvert sur son ancien poste.

import { Scene } from '../core/game.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawFloor, drawDesk, drawChair, GROUND } from './backdrops.js';
import { makeHero, makeNpc } from './cast.js';
import { Walker } from './walk.js';

const FEET = GROUND + 2;
const DESK_X = 258;

export class FloorScene extends Scene {
  enter(params = {}) {
    this.evening = !!params.evening;
    this.t = 0;
    this.flash = 0;
    this.seated = false;
    this.screen = 'dashboard';
    const g = this.game;

    this.hero = makeHero(g, { x: this.evening ? 240 : -16, y: FEET });
    this.hero.play(this.evening ? 'sit' : 'bagIdle', 5, true);
    this.tutor = makeNpc(g, 'tutor', { x: 150, y: FEET });
    this.tutor.play('idle', 4, true);
    g.audio.play('office');

    this.walker = new Walker(g, this.hero, {
      min: -16, max: 300, walk: 'bagWalk', idle: 'bagIdle',
      triggers: [{ x: 222, w: 40, label: 'S\'ASSEOIR', action: () => this.sit() }],
      enabled: false,
    });
  }

  * script() {
    const g = this.game;
    if (this.evening) { g.go('departure'); return; }

    yield g.dlg.banner(T.floor.banner, T.floor.bannerSub, 1.5);
    yield this.hero.walkTo(112, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
    yield wait(0.3);
    this.hero.face(1);
    this.tutor.face(-1);
    this.tutor.restart('talk', 5, true);
    yield g.dlg.say('tutor', T.floor.tutor_hello);
    this.tutor.play('idle', 4, true);
    yield g.dlg.say('philippe', T.floor.hero_reply);
    yield wait(0.2);
    this.walker.enabled = true;
  }

  sit() {
    const g = this.game;
    const self = this;
    g.run((function* () {
      yield self.hero.walkTo(240, { walk: 'bagWalk', idle: 'bagIdle' });
      self.hero.face(1);
      yield wait(0.3);
      self.seated = true;
      self.hero.play('sit', 4, true);
      yield wait(0.6);
      self.hero.play('type', 8, true);
      yield g.dlg.say('narrator', T.floor.sit_hint, { style: 'thought' });

      // l'écran clignote : « mission archivée détectée »
      self.screen = 'error';
      g.audio.sfx('error');
      self.hero.play('confused', 5, true);
      yield wait(0.9);
      yield g.dlg.banner(T.floor.archive, T.floor.archiveSub, 1.6);

      // transition blanche très brève, comme demandé dans le rapport
      yield { update: (dt) => (self.flash = Math.min(1, self.flash + dt * 4)) >= 1 };
      g.go('missionAtlas', {}, 0.001);
    })());
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    this.tutor.update(dt);
    if (!this.seated) this.walker.update(dt);
  }

  draw(ctx) {
    drawFloor(ctx, this.t, { evening: this.evening });
    this.tutor.draw(ctx);
    drawChair(ctx, 236, GROUND + 2);
    drawDesk(ctx, DESK_X, this.screen, this.t);
    this.hero.draw(ctx);
    this.walker.draw(ctx);

    if (this.flash > 0) {
      ctx.globalAlpha = this.flash;
      ctx.fillStyle = '#F2E9CF';
      ctx.fillRect(0, 0, 384, 216);
      ctx.globalAlpha = 1;
    }
  }
}

