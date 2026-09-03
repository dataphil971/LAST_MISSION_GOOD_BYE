// Test de fumée headless : joue le jeu du début à la fin, sans navigateur.
//
//     node tools/smoke_test.mjs
//
// Le DOM, le canvas, les images, fetch et WebAudio sont remplacés par des
// doublures minimales. Le pilote appuie sur « avancer », résout le puzzle de
// la mission Atlas et déclenche les zones d'interaction, puis vérifie qu'on
// atteint bien l'écran final. Toute exception non gérée fait échouer le test.
//
// Ce n'est pas un substitut au test visuel dans un vrai navigateur : cela
// attrape les erreurs de code, pas les erreurs de mise en scène.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------
// Doublures navigateur
// ---------------------------------------------------------------------
function makeCtx() {
  const noop = () => {};
  return {
    canvas: { width: 384, height: 216, getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    imageSmoothingEnabled: false,
    globalAlpha: 1,
    fillStyle: '#000',
    fillRect: noop, drawImage: noop, save: noop, restore: noop,
    beginPath: noop, rect: noop, clip: noop, translate: noop, scale: noop,
  };
}

function makeCanvas() {
  return {
    width: 384, height: 216, style: {},
    getContext: () => makeCtx(),
    addEventListener: () => {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 384, height: 216 }),
  };
}

const canvas = makeCanvas();
globalThis.document = {
  getElementById: () => canvas,
  createElement: (tag) => (tag === 'canvas' ? makeCanvas() : {}),
};
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.requestAnimationFrame = () => 0;
globalThis.performance = globalThis.performance || { now: () => Date.now() };
globalThis.location = { hash: '', href: '' };
globalThis.window = globalThis;
globalThis.window.open = () => {};

globalThis.Image = class {
  set src(url) { this._url = url; queueMicrotask(() => this.onload && this.onload()); }
  get src() { return this._url; }
};

globalThis.fetch = async (url) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync(join(ROOT, url), 'utf8')),
});

// ---------------------------------------------------------------------
// Pilote : il joue à notre place
// ---------------------------------------------------------------------
const seen = new Set();
let pendingSlot = null;

function press(game, action) { game.input.pressed.add(action); }
function clickAt(game, x, y) {
  game.input.click = { x, y };
  game.input.pressed.add('advance');
}

function drive(game) {
  const s = game.scene;
  if (!s) return;
  seen.add(game.sceneName);

  // écran-titre : bouton JOUER
  if (game.sceneName === 'title') { clickAt(game, 190, 158); return; }

  // mission Atlas : on résout le puzzle par le vrai chemin d'interaction
  if (s.tray && s.phase === 'puzzle') {
    if (pendingSlot) {
      clickAt(game, pendingSlot.x + 4, pendingSlot.y + 4);
      pendingSlot = null;
      return;
    }
    const block = s.tray.find((b) => !s.placed.has(b.id));
    if (block) {
      clickAt(game, block.x + 4, block.y + 4);
      pendingSlot = { ...s.slotFor(block.id) };
      return;
    }
  }

  // mission Sentinel : on signale les objets qui enfreignent une règle,
  // et seulement ceux-là — un faux positif ferait échouer l'audit
  if (s.cards && s.phase === 'audit') {
    const card = s.cards.find((c) => c.rule && !c.flagged);
    if (card) { clickAt(game, card.x + 6, card.y + 6); return; }
  }

  // zones d'interaction : on amène le héros dessus puis on valide
  if (s.walker && s.walker.enabled && !s.walker.busy) {
    const z = s.walker.triggers[0];
    if (z) { s.hero.x = z.x + z.w / 2; press(game, 'advance'); return; }
  }

  press(game, 'advance');
}

// ---------------------------------------------------------------------
async function run() {
  const errors = [];
  process.on('uncaughtException', (e) => errors.push(e));

  await import(pathToFileURL(join(ROOT, 'src/main.js')).href);

  // boot() est asynchrone : on attend que la partie soit prête
  for (let i = 0; i < 200 && !globalThis.game; i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  const game = globalThis.game;
  if (!game) throw new Error('Le jeu ne s\'est pas initialisé.');

  const DT = 1 / 60;
  const MAX_FRAMES = 60 * 60 * 6;      // 6 minutes de jeu simulées
  let frames = 0;
  while (frames < MAX_FRAMES && game.sceneName !== 'outro') {
    drive(game);
    game.update(DT);
    game.draw();
    game.input.endFrame();
    frames++;
    // TRACE=1 node tools/smoke_test.mjs  → suivi image par image
    if (process.env.TRACE && frames % 60 === 0) {
      console.log(frames, game.sceneName,
        'tl:' + (game.timeline ? game.timeline.done : 'none'),
        'x:' + (game.scene && game.scene.hero ? Math.round(game.scene.hero.x) : '-'));
    }
    if (frames % 600 === 0) await new Promise((r) => setImmediate(r));
    if (errors.length) break;
  }

  seen.add(game.sceneName);            // la scène atteinte au dernier tour
  const seconds = (frames / 60).toFixed(1);
  const expected = ['title', 'exterior', 'lobby', 'elevator', 'floor',
    'missionAtlas', 'montage', 'missionSentinel', 'departure', 'sunset',
    'credits', 'outro'];
  const missing = expected.filter((s) => !seen.has(s));

  console.log('scènes traversées :', [...seen].join(' → '));
  console.log('durée simulée     :', seconds + ' s');
  console.log('XP               :', game.state.xp,
    '| missions :', game.state.missions.join(', ') || '(aucune)',
    '| bouton magique :', game.state.magicButton);

  if (errors.length) {
    console.error('\nERREURS :');
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  if (missing.length) {
    console.error('\nSCÈNES JAMAIS ATTEINTES : ' + missing.join(', '));
    process.exit(1);
  }
  // L'arc du gag doit aller jusqu'à son terme : Philippe finit par aider.
  if (game.state.magicButton !== 4) {
    console.error('\nL\'arc du bouton magique s\'arrête à l\'occurrence '
      + game.state.magicButton + '/4.');
    process.exit(1);
  }
  for (const mission of ['ATLAS', 'SENTINEL']) {
    if (!game.state.missions.includes(mission)) {
      console.error('\nMission jamais terminée : ' + mission);
      process.exit(1);
    }
  }
  console.log('\nOK — parcours complet sans erreur.');
}

run().catch((e) => { console.error(e); process.exit(1); });
