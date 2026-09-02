// Fabriques d'acteurs : le moteur ne manipule que des clés d'animation
// ("walk", "sit", "confused"), jamais des noms de fichiers.

import { Actor } from '../core/actor.js';

export const HERO_TAGS = {
  idle: 'hero/gp/idle/side',
  walk: 'hero/gp/walk/side',
  idleFront: 'hero/gp/idle/front',
  walkFront: 'hero/gp/walk/front',
  idleBack: 'hero/gp/idle/back',
  walkBack: 'hero/gp/walk/back',
  sit: 'hero/gp/sit',
  type: 'hero/gp/type',
  think: 'hero/gp/think',
  confused: 'hero/gp/confused',
  error: 'hero/gp/error',
  helmet: 'hero/gp/adjust_helmet',
  wave: 'hero/gp/wave',
  point: 'hero/gp/point',
  bagIdle: 'hero/gp/backpack/idle',
  bagWalk: 'hero/gp/backpack/walk',
};

export const HERO_CS_TAGS = {
  idle: 'hero/cs/magic/receive',
  press: 'hero/cs/magic/press',
  receive: 'hero/cs/magic/receive',
  phone: 'hero/cs/phone',
  phoneShock: 'hero/cs/phone_shock',
  goodbye: 'hero/cs/goodbye',
  turn: 'hero/cs/sunset_turn',
  window: 'hero/cs/sit_window',
};

export function makeHero(game, opts = {}) {
  return new Actor(game.assets.hero, HERO_TAGS, { speed: 36, ...opts });
}

export function makeHeroCs(game, opts = {}) {
  return new Actor(game.assets.heroCs, HERO_CS_TAGS, { speed: 30, ...opts });
}

export function makeNpc(game, variant, opts = {}) {
  return new Actor(game.assets.npc, {
    idle: `npc/${variant}/idle`,
    idleSide: `npc/${variant}/idle_side`,
    walk: `npc/${variant}/walk`,
    talk: `npc/${variant}/talk`,
    press: `npc/${variant}/press`,
  }, { speed: 32, ...opts });
}
