// Acteur : un sprite pose sur une ligne de sol, pilote par des commandes
// de timeline (marcher, se tourner, jouer une animation, attendre).
//
// L animation est volontairement parcimonieuse : le personnage respire d un
// pixel, et c est le casque qui porte l emotion.

import { Animator } from './atlas.js';
import { wait } from './timeline.js';

export class Actor {
  constructor(atlas, tags, opts = {}) {
    this.atlas = atlas;
    this.tags = tags;                 // { idle, walk, ... } -> noms de tags
    this.x = opts.x || 0;
    this.y = opts.y || 0;             // ligne de sol (pivot bas-centre)
    this.flip = !!opts.flip;          // true = regarde vers la gauche
    this.speed = opts.speed || 34;    // px logiques par seconde
    this.visible = opts.visible !== false;
    this.anim = new Animator(atlas, tags.idle, opts.fps || 6, true);
    this.state = 'idle';
    this.shake = 0;
  }

  play(key, fps = 8, loop = true) {
    const tag = this.tags[key] || key;
    this.anim.play(tag, fps, loop);
    this.state = key;
    return this;
  }

  restart(key, fps = 8, loop = false) {
    const tag = this.tags[key] || key;
    this.anim.restart(tag, fps, loop);
    this.state = key;
    return this;
  }

  face(dir) { this.flip = dir < 0; return this; }

  update(dt) {
    this.anim.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
  }

  draw(ctx) {
    if (!this.visible) return;
    const jitter = this.shake > 0 ? (Math.random() < 0.5 ? -1 : 1) : 0;
    this.anim.draw(ctx, this.x + jitter, this.y, this.flip);
  }

  // -- commandes de timeline -------------------------------------------
  /** Marche jusqu a targetX, joue le cycle de marche, puis repasse en idle. */
  walkTo(targetX, opts = {}) {
    const a = this;
    const walkKey = opts.walk || 'walk';
    const idleKey = opts.idle || 'idle';
    const speed = opts.speed || a.speed;
    let stepTimer = 0;
    const audio = opts.audio;
    return {
      update(dt) {
        const d = targetX - a.x;
        if (Math.abs(d) <= speed * dt) {
          a.x = targetX;
          a.play(idleKey, 6, true);
          return true;
        }
        a.face(Math.sign(d));
        a.play(walkKey, opts.fps || 12, true);
        a.x += Math.sign(d) * speed * dt;
        stepTimer -= dt;
        if (audio && stepTimer <= 0) { audio.sfx('step'); stepTimer = 0.34; }
        return false;
      },
    };
  }

  /** Joue une animation une seule fois et attend la derniere frame. */
  playOnce(key, fps = 8) {
    const a = this;
    let started = false;
    return {
      update() {
        if (!started) { a.restart(key, fps, false); started = true; return false; }
        return a.anim.finished;
      },
    };
  }

  /** Sursaut du casque : la reaction de surprise du rapport, en 2 px. */
  helmetJump(audio) {
    const a = this;
    let t = 0;
    return {
      update(dt) {
        if (t === 0 && audio) audio.sfx('helmet');
        t += dt;
        return t > 0.35;
      },
    };
  }
}

export const pause = wait;
