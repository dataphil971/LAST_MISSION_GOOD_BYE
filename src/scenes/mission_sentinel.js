// MISSION 11 — SENTINEL : « L'apprenti devient mentor »
//
// Deux clins d'œil dans la même mission : les bonnes pratiques qu'on se
// fait rappeler en vrai (DEV avant PROD, nom métier, description,
// granularité) et l'agent qui finit par les vérifier tout seul.
//
// C'est surtout le sommet de l'arc du bouton magique. Occurrence n°4 :
// même plan que dans ATLAS, rôles inversés. Philippe passe derrière
// quelqu'un d'autre et appuie. Narrativement, c'est ici que le stage est
// réussi — le reste n'est plus que le départ.

import { Scene, panel } from '../core/game.js';
import { drawText, wrapText } from '../core/font.js';
import { wait } from '../core/timeline.js';
import { C } from '../data/palette.js';
import { T } from '../data/script.js';
import { drawFloor, drawDesk, GROUND } from './backdrops.js';
import { makeHero, makeNpc } from './cast.js';
import { MagicButton } from './magic_button.js';

const FEET = GROUND + 2;
const DESK_X = 258;
const S = T.sentinel;

// Grille des objets audités : deux colonnes, trois rangées.
const CARD = { w: 100, h: 46, cols: [172, 278], rows: [20, 70, 120] };
const PANEL = { x: 6, y: 20, w: 158, h: 148 };

export class MissionSentinelScene extends Scene {
  enter() {
    const g = this.game;
    this.t = 0;
    this.phase = 'intro';
    this.shake = 0;
    this.screen = 'dashboard';
    this.magic = new MagicButton(g);

    this.cards = S.cards.map((c, i) => ({
      ...c,
      flagged: false,
      x: CARD.cols[i % 2],
      y: CARD.rows[Math.floor(i / 2)],
      w: CARD.w,
      h: CARD.h,
    }));
    this.violations = this.cards.filter((c) => c.rule).length;

    // Cette fois, c'est le collègue qui est assis et bloqué.
    this.peer = makeNpc(g, 'peer', { x: 236, y: FEET });
    this.peer.play('sit', 4, true);
    this.hero = makeHero(g, { x: -20, y: FEET });
    this.hero.play('idle', 5, true);
    g.audio.play('mission');
  }

  * script() {
    const g = this.game;
    yield g.dlg.banner(S.number + '  ·  ' + S.id, S.title, 1.8);
    yield g.dlg.say('narrator', S.goal, { style: 'center', hold: 1.8 });
    this.phase = 'audit';
  }

  get found() { return this.cards.filter((c) => c.flagged).length; }

  // -- phase 1 : l'audit ----------------------------------------------
  updateAudit() {
    const i = this.game.input;
    if (!i.click) return;
    for (const c of this.cards) {
      if (c.flagged || !i.clickIn(c.x, c.y, c.w, c.h)) continue;
      if (c.rule) {
        c.flagged = true;
        this.game.audio.sfx('confirm');
        if (this.found === this.violations) this.solve();
      } else {
        // un faux positif coûte aussi cher qu'un oubli : on le dit,
        // sans punir — l'erreur reste comique
        this.shake = 0.22;
        this.game.audio.sfx('bonk');
        this.game.toasts.push(S.falsePositive, C.error, 1.6);
      }
      return;
    }
  }

  solve() {
    const g = this.game;
    const self = this;
    this.phase = 'solved';
    g.run((function* () {
      g.audio.sfx('success');
      yield wait(0.7);
      yield g.dlg.say('narrator', S.solved, { style: 'center', hold: 1.6 });
      self.phase = 'gag';
      yield* self.mentor();
    })());
  }

  // -- phase 2 : le bouton magique, occurrence n°4 ---------------------
  * mentor() {
    const g = this.game;
    this.screen = 'error';
    g.audio.sfx('error');
    yield wait(0.6);
    yield g.dlg.say('narrator', S.peerStuck, { style: 'center', hold: 1.2 });
    yield g.dlg.say('peer', S.peerCall);

    // Philippe arrive et passe derrière lui. Aucun dialogue : le silence
    // est exactement celui de la première occurrence, à l'envers.
    this.hero.face(1);
    yield this.hero.walkTo(206, { audio: g.audio });
    this.hero.face(1);
    yield wait(0.9);

    const previous = yield* this.magic.run({
      presser: this.hero,
      pressKey: 'point',
      onSuccess: () => { this.screen = 'ok'; },
    });

    this.peer.restart('talk', 5, true);
    yield g.dlg.say('peer', S.peerAsk);
    this.peer.play('sit', 4, true);
    this.hero.play('idle', 5, true);
    yield g.dlg.say('philippe', S.heroAnswer);

    // il sort du cadre, puis lâche la vérité hors champ
    yield this.hero.walkTo(-24, { audio: g.audio });
    yield wait(1.0);
    yield g.dlg.say('philippe', S.heroOffscreen, { style: 'thought', hold: 1.8 });

    g.state.magicButton = 4;
    g.audio.play(previous || 'office');
    yield g.dlg.banner(S.skillBanner, S.skillName, 1.8, C.success);
    g.unlock(S.skillName);
    g.addXp(300);
    g.toasts.push(S.xp, C.accent_orange, 2.4);
    yield wait(0.9);
    g.completeMission('SENTINEL');
    yield g.dlg.banner(S.done, S.doneSub, 1.8);
    g.afterMission('montage',
      { lit: 9, animate: [9, 10], next: 'departure', final: true });
  }

  update(dt) {
    this.t += dt;
    this.hero.update(dt);
    this.peer.update(dt);
    this.magic.update(dt);
    if (this.shake > 0) this.shake -= dt;
    if (this.phase === 'audit') this.updateAudit();
  }

  draw(ctx) {
    this.magic.render(ctx, (target) => {
      target.fillStyle = C.outline_deep;
      target.fillRect(0, 0, 384, 216);
      if (this.phase === 'gag') this.drawDeskStage(target);
      else this.drawAudit(target);
    });
  }

  // -- l'écran de l'agent ----------------------------------------------
  drawAudit(ctx) {
    const sh = this.shake > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    ctx.fillStyle = '#1B1620';
    ctx.fillRect(0, 0, 384, 216);
    drawText(ctx, S.instruction, 192, 4,
      { color: C.text_muted, align: 'center' });

    // panneau de l'agent : les règles qu'il surveille
    const ready = this.found === this.violations;
    panel(ctx, PANEL.x, PANEL.y, PANEL.w, PANEL.h,
      { border: ready ? C.success : C.ui_border });
    const mid = PANEL.x + PANEL.w / 2;
    drawText(ctx, S.agent, mid, PANEL.y + 6,
      { color: ready ? C.success : C.accent_orange, align: 'center' });
    ctx.fillStyle = C.ui_border;
    ctx.fillRect(PANEL.x + 8, PANEL.y + 18, PANEL.w - 16, 1);
    drawText(ctx, S.rulesTitle, PANEL.x + 8, PANEL.y + 24,
      { color: C.text_muted });
    S.rules.forEach((rule, i) => {
      const y = PANEL.y + 36 + i * 16;
      ctx.fillStyle = ready ? C.success : C.ui_cell_dark;
      ctx.fillRect(PANEL.x + 8, y + 1, 3, 3);
      drawText(ctx, rule, PANEL.x + 16, y, { color: C.text_cream });
    });
    drawText(ctx, ready ? S.ready : `${this.found}/${this.violations} ${S.missed}`,
      mid, PANEL.y + PANEL.h - 12,
      { color: ready ? C.success : C.text_muted, align: 'center' });

    // les objets audités
    for (const c of this.cards) {
      const hover = !c.flagged && this.game.input.hoverIn(c.x, c.y, c.w, c.h);
      panel(ctx, c.x + sh, c.y, c.w, c.h, {
        fill: c.flagged ? '#2C3A2A' : (hover ? '#3A3040' : C.ui_panel),
        border: c.flagged ? C.success : (hover ? C.accent_orange : '#3A3040'),
      });
      drawText(ctx, c.name, c.x + 6 + sh, c.y + 5, { color: C.text_cream });
      // la note est repliee sur la largeur reelle de la carte : on ne
      // devine pas les largeurs de texte, on les mesure
      wrapText(c.note, c.w - 12).slice(0, 2).forEach((line, n) => {
        drawText(ctx, line, c.x + 6 + sh, c.y + 15 + n * 9,
          { color: C.text_muted });
      });
      if (c.flagged) {
        drawText(ctx, '▶ ' + c.rule, c.x + 6 + sh, c.y + 34, { color: C.success });
      }
    }
  }

  drawDeskStage(ctx) {
    drawFloor(ctx, this.t, {});
    drawDesk(ctx, DESK_X, this.screen, this.t);
    this.peer.draw(ctx);
    this.hero.draw(ctx);
  }
}
