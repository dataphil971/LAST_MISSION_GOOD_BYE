// ACTE I — Les premiers pas : extérieur, accueil, ascenseur.
//
// Le trajet du matin sera rejoué exactement à l'envers le soir
// (voir farewell.js) : c'est cette symétrie qui donne la sensation
// d'avoir bouclé une aventure.

import { Scene, panel } from '../core/game.js';
import { drawText } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import {
  drawExterior, drawLobby, drawElevator, drawElevatorDoors, GROUND,
} from './backdrops.js';
import { makeHero, makeNpc } from './cast.js';
import { Walker } from './walk.js';

const FEET = GROUND + 6;

// ---------------------------------------------------------------------
export class ExteriorScene extends Scene {
  enter(params = {}) {
    this.evening = !!params.evening;
    this.t = 0;
    this.hudAlpha = 0;
    const g = this.game;
    this.hero = makeHero(g, { x: this.evening ? 206 : -18, y: FEET });
    this.hero.play('bagIdle', 5, true);
    g.audio.play(this.evening ? 'sunset' : 'morning');

    this.walker = new Walker(g, this.hero, {
      min: -18, max: 340, walk: 'bagWalk', idle: 'bagIdle',
      triggers: this.evening
        ? [{ x: 20, w: 60, label: 'PARTIR', action: () => g.go('sunset') }]
        : [{ x: 186, w: 46, label: 'ENTRER', action: () => this.enterBuilding() }],
      enabled: false,
    });
  }

  * script() {
    const g = this.game;
    if (this.evening) {
      this.hero.face(-1);
      yield wait(0.6);
      yield g.dlg.say('narrator', 'La journée est finie. Il reste le trajet.',
        { style: 'thought', hold: 2 });
      this.walker.enabled = true;
      return;
    }
    // arrivée : il traverse le cadre, le bâtiment le domine
    yield wait(0.4);
    yield this.hero.walkTo(150, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
    yield wait(0.5);
    this.walker.enabled = true;
  }

  enterBuilding() {
    const g = this.game;
    g.audio.sfx('door');
    g.run((function* () {
      yield wait(0.35);
      g.go('lobby', { evening: false });
    })());
  }

  update(dt) {
    this.t += dt;
    this.hudAlpha = Math.min(1, this.hudAlpha + dt * 1.4);
    this.hero.update(dt);
    this.walker.update(dt);
  }

  draw(ctx) {
    drawExterior(ctx, this.t, { evening: this.evening });
    this.hero.draw(ctx);
    this.walker.draw(ctx);
    if (!this.evening) this.drawClock(ctx);
  }

  drawClock(ctx) {
    ctx.globalAlpha = this.hudAlpha;
    panel(ctx, 10, 10, 78, 26);
    drawText(ctx, T.exterior.clock, 49, 14,
      { color: C.text_cream, align: 'center' });
    drawText(ctx, T.exterior.day, 49, 24,
      { color: C.accent_orange, align: 'center' });
    ctx.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------------
export class LobbyScene extends Scene {
  enter(params = {}) {
    this.evening = !!params.evening;
    this.t = 0;
    const g = this.game;
    this.hero = makeHero(g, { x: this.evening ? 330 : -16, y: FEET });
    this.hero.play('bagIdle', 5, true);
    this.desk = makeNpc(g, 'reception', { x: 196, y: GROUND - 2 });
    this.desk.play('idle', 4, true);
    this.greeted = false;
    g.audio.play('office');

    this.walker = new Walker(g, this.hero, {
      min: -16, max: 356, walk: 'bagWalk', idle: 'bagIdle',
      triggers: [],
      enabled: false,
    });
  }

  * script() {
    const g = this.game;
    if (this.evening) { yield* this.eveningScript(); return; }

    yield this.hero.walkTo(150, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
    yield wait(0.3);
    this.hero.face(1);
    yield g.dlg.say('philippe', T.lobby.hello_hero);
    this.desk.restart('talk', 5, true);
    yield g.dlg.say('reception', T.lobby.hello_desk);
    this.desk.play('idle', 4, true);
    this.greeted = true;
    this.walker.triggers = [{
      x: 300, w: 56, label: 'ASCENSEUR',
      action: () => this.takeElevator(),
    }];
    this.walker.enabled = true;
  }

  * eveningScript() {
    const g = this.game;
    yield this.hero.walkTo(240, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
    yield wait(0.4);
    this.hero.face(-1);
    this.desk.restart('talk', 5, true);
    yield g.dlg.say('reception', T.lobby.evening_desk);
    this.desk.play('idle', 4, true);
    yield wait(0.5);                     // le silence fait le poids du moment
    yield g.dlg.say('philippe', T.lobby.evening_hero);
    yield this.hero.walkTo(-20, { walk: 'bagWalk', idle: 'bagIdle', audio: g.audio });
    g.go('exterior', { evening: true });
  }

  takeElevator() {
    const g = this.game;
    g.run((function* () {
      const self = g.scene;
      self.hero.face(-1);                // « ...dernière fois. »
      yield wait(0.5);
      yield g.dlg.say('philippe', T.exterior.thought, { style: 'thought' });
      yield wait(0.3);
      self.hero.face(1);
      yield self.hero.walkTo(346, { walk: 'bagWalk', idle: 'bagIdle' });
      g.audio.sfx('ding');
      yield wait(0.5);
      g.go('elevator');
    })());
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    this.desk.update(dt);
    this.walker.update(dt);
  }

  draw(ctx) {
    drawLobby(ctx, this.t);
    this.desk.draw(ctx);
    // le comptoir repasse devant : le PNJ est bien DERRIÈRE l'accueil
    ctx.fillStyle = '#6B5039';
    ctx.fillRect(148, GROUND - 40, 104, 4);
    ctx.fillStyle = '#4C382A';
    ctx.fillRect(152, GROUND - 34, 96, 30);
    ctx.fillStyle = '#2E1F2A';
    ctx.fillRect(160, GROUND - 30, 18, 12);
    ctx.fillStyle = '#8FB8C9';
    ctx.fillRect(162, GROUND - 28, 14, 8);
    this.hero.draw(ctx);
    this.walker.draw(ctx);
  }
}

// ---------------------------------------------------------------------
export class ElevatorScene extends Scene {
  enter(params = {}) {
    this.evening = !!params.evening;
    this.t = 0;
    this.door = 0;
    const g = this.game;
    this.hero = makeHero(g, { x: 192, y: 176 });
    this.hero.play('idleFront', 4, true);
    g.skippable = () => this.exit_();
  }

  * script() {
    const g = this.game;
    yield wait(1.1);
    g.audio.sfx('ding');
    yield g.dlg.say('narrator', T.elevator.floor, { style: 'center', hold: 1.1 });
    yield { update: (dt) => (this.door = Math.min(1, this.door + dt * 1.6)) >= 1 };
    yield wait(0.5);
    this.exit_();
  }

  exit_() {
    this.game.skippable = null;
    this.game.go(this.evening ? 'lobby' : 'floor', { evening: this.evening });
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
  }

  draw(ctx) {
    drawElevator(ctx, this.t);
    this.hero.draw(ctx);
    drawElevatorDoors(ctx, this.door);   // les portes passent devant lui
    drawText(ctx, this.evening ? '0' : '1', 192, 34,
      { color: C.accent_orange, align: 'center' });
  }
}
