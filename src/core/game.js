// Coeur du moteur : canvas logique 384x216, agrandissement par facteur
// ENTIER uniquement, boucle de jeu, pile de scenes et fondus.
//
// Regles non negociables de la Bible d art :
//   - nearest-neighbour (imageSmoothingEnabled = false, image-rendering) ;
//   - aucun sous-pixel : toutes les positions dessinees sont arrondies ;
//   - 384x216 x5 = 1920x1080, donc le plein ecran reste net.

import { CONFIG } from '../config.js';
import { Input } from './input.js';
import { AudioBus } from './audio.js';
import { Timeline } from './timeline.js';
import { drawText, textWidth } from './font.js';
import { C } from '../data/palette.js';

// Menu de pause. Une seule source pour la position des boutons : le rendu
// et la détection du clic ne peuvent pas diverger.
const PAUSE = {
  x: 112, y: 40, w: 160, h: 152, bw: 136,
  rows: [110, 130, 150, 170],
};

export class Scene {
  constructor(game) { this.game = game; }
  enter() {}
  exit() {}
  update() {}
  draw() {}
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.W = CONFIG.width;
    this.H = CONFIG.height;
    canvas.width = this.W;
    canvas.height = this.H;
    this.ctx.imageSmoothingEnabled = false;

    this.view = { scale: 1 };
    this.input = new Input(canvas, this.view);
    this.audio = new AudioBus();
    this.assets = {};
    this.scenes = new Map();
    this.scene = null;
    this.sceneName = null;
    this.time = 0;
    this.frame = 0;
    this.paused = false;
    this.debug = CONFIG.debug;
    this.fastMode = false;

    // Progression : le rapport veut des recompenses lisibles mais discretes.
    this.state = {
      xp: 0,
      skills: [],
      missions: [],
      magicButton: 0,       // occurrences du running gag deja vues
      flags: {},
    };

    this.fade = { alpha: 0, target: 0, speed: 2.4, color: '#000000' };
    this.pending = null;
    this.skippable = null;  // callback de saut de cinematique, ou null

    addEventListener('resize', () => this.resize());
    this.resize();
  }

  // -- affichage --------------------------------------------------------
  resize() {
    const pad = 0;
    const sx = (innerWidth - pad) / this.W;
    const sy = (innerHeight - pad) / this.H;
    const scale = Math.max(1, Math.min(CONFIG.maxScale, Math.floor(Math.min(sx, sy))));
    this.view.scale = scale;
    this.canvas.style.width = this.W * scale + 'px';
    this.canvas.style.height = this.H * scale + 'px';
  }

  // -- scenes -----------------------------------------------------------
  register(name, factory) { this.scenes.set(name, factory); }

  /** Change de scene avec un fondu au noir ; params est transmis a enter(). */
  go(name, params = {}, fadeTime = 0.35) {
    this.pending = { name, params };
    this.fade.speed = fadeTime > 0 ? 1 / fadeTime : 999;
    this.fade.target = 1;
    if (fadeTime === 0) this.fade.alpha = 1;
  }

  _swap() {
    const { name, params } = this.pending;
    this.pending = null;
    if (this.scene && this.scene.exit) this.scene.exit();
    const factory = this.scenes.get(name);
    if (!factory) throw new Error('Scene inconnue : ' + name);
    this.scene = factory(this);
    this.sceneName = name;
    this.skippable = null;
    this.timeline = null;
    if (this.dlg) this.dlg.clear();
    this.scene.enter(params);
    if (typeof this.scene.script === 'function') {
      this.timeline = new Timeline(this.scene.script(params));
    }
    this.fade.target = 0;
  }

  /** Lance un plan scenarise dans la scene courante. */
  run(gen) { this.timeline = new Timeline(gen); return this.timeline; }

  // -- progression ------------------------------------------------------
  addXp(n) { this.state.xp += n; this.audio.sfx('xp'); }
  unlock(skill) {
    if (!this.state.skills.includes(skill)) this.state.skills.push(skill);
  }
  completeMission(id) {
    if (!this.state.missions.includes(id)) this.state.missions.push(id);
  }

  // -- boucle -----------------------------------------------------------
  start() {
    let last = performance.now();
    const tick = (now) => {
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.1) dt = 0.1;           // onglet en arriere-plan
      this.update(dt);
      this.draw();
      this.input.endFrame();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  update(dt) {
    this.time += dt;
    this.frame++;

    if (this.input.anyInput) { this.audio.unlock(); this.input.anyInput = false; }
    if (this.input.justPressed('mute')) this.audio.toggleMute();
    if (this.input.justPressed('debug')) this.debug = !this.debug;
    this.audio.update(dt);

    // fondu
    const f = this.fade;
    if (f.alpha !== f.target) {
      const d = f.speed * dt;
      f.alpha += Math.sign(f.target - f.alpha) * d;
      if (Math.abs(f.target - f.alpha) < d) f.alpha = f.target;
    }
    if (this.pending && f.alpha >= 1) { this._swap(); return; }
    if (this.pending) return;

    if (this.input.justPressed('menu')) this.paused = !this.paused;
    if (this.paused) { this.updatePause(); return; }

    // TAB saute la cinematique en cours quand la scene l autorise
    if (this.skippable && this.input.justPressed('skip')) {
      const jump = this.skippable;
      this.skippable = null;
      jump();
      return;
    }

    if (this.timeline) this.timeline.update(dt);
    if (this.scene) this.scene.update(dt);
    if (this.toasts) this.toasts.update(dt);
  }

  /** Repart de l'écran-titre, progression remise à zéro. */
  restart() {
    this.paused = false;
    this.state = { xp: 0, skills: [], missions: [], magicButton: 0, flags: {} };
    this.skippable = null;
    if (this.dlg) this.dlg.clear();
    this.audio.sfx('select');
    this.go('title');
  }

  updatePause() {
    const i = this.input;
    const hit = (row) => i.clickIn(PAUSE.x + 12, PAUSE.rows[row], PAUSE.bw, 14);
    if (hit(0) || i.justPressed('mute')) this.audio.toggleMute();
    if (hit(1)) {
      this.fastMode = !this.fastMode;
      this.audio.sfx('select');
    }
    if (hit(2)) this.restart();
    if (hit(3)) {
      this.paused = false;
      this.audio.sfx('select');
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = C.outline_deep;
    ctx.fillRect(0, 0, this.W, this.H);
    if (this.scene) this.scene.draw(ctx);
    if (this.dlg) this.dlg.draw(ctx);
    if (this.toasts) this.toasts.draw(ctx);

    if (this.skippable && !this.paused) this.drawSkipHint(ctx);
    if (this.paused) this.drawPause(ctx);

    if (this.fade.alpha > 0) {
      ctx.globalAlpha = Math.min(1, this.fade.alpha);
      ctx.fillStyle = this.fade.color;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.globalAlpha = 1;
    }

    if (this.debug) {
      drawText(ctx, `${this.sceneName}  xp:${this.state.xp}  s:${this.view.scale}x`,
        3, 3, { color: C.success, shadow: C.outline_deep });
    }
  }

  drawSkipHint(ctx) {
    const label = 'TAB  passer';
    const w = textWidth(label) + 8;
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(this.W - w - 4, this.H - 13, w, 10);
    ctx.globalAlpha = 1;
    drawText(ctx, label, this.W - w, this.H - 11, { color: C.text_muted });
  }

  drawPause(ctx) {
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = C.ui_shadow;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.globalAlpha = 1;
    panel(ctx, PAUSE.x, PAUSE.y, PAUSE.w, PAUSE.h);
    drawText(ctx, 'PAUSE', 192, PAUSE.y + 8,
      { color: C.accent_orange, align: 'center' });
    const lines = [
      'CLIC / ESPACE  avancer',
      'ESPACE maintenu  accélérer',
      'TAB  passer une scène',
      'M  couper le son',
      'ÉCHAP  ce menu',
    ];
    lines.forEach((l, i) => drawText(ctx, l, PAUSE.x + 12, PAUSE.y + 24 + i * 9,
      { color: C.text_muted }));

    const labels = [
      this.audio.muted ? 'SON : COUPÉ' : 'SON : ACTIF',
      this.fastMode ? 'RYTHME : RAPIDE' : 'RYTHME : NORMAL',
      'RETOUR À L\'ACCUEIL',
      'REPRENDRE',
    ];
    PAUSE.rows.forEach((y, i) => {
      const hover = this.input.hoverIn(PAUSE.x + 12, y, PAUSE.bw, 14);
      button(ctx, PAUSE.x + 12, y, PAUSE.bw, 14, labels[i], hover);
    });
  }
}

/** Panneau UI standard : fond, ombre portee, cadre. */
export function panel(ctx, x, y, w, h, opts = {}) {
  ctx.fillStyle = opts.shadow || C.ui_shadow;
  ctx.fillRect(x + 2, y + 2, w, h);
  ctx.fillStyle = opts.fill || C.ui_panel;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = opts.border || C.ui_border;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

export function button(ctx, x, y, w, h, label, active = false) {
  ctx.fillStyle = active ? C.ui_cell : C.ui_cell_dark;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = C.ui_border;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  drawText(ctx, label, x + w / 2, y + Math.floor((h - 7) / 2),
    { color: C.text_cream, align: 'center' });
}
