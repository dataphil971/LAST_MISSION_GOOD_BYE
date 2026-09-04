// Captures d'écran sans navigateur, via le canvas logiciel.
//
//   node tools/screenshot.mjs                    → toutes les scènes clés
//   node tools/screenshot.mjs sunset 4 out.png   → une scène, 4 s après l'entrée
//
// Sert à la QA visuelle (test silhouette, test pixel, lisibilité du texte)
// et à produire les captures du README.

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { SoftCanvas, decodePng } from './softcanvas.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'screens');

const main = new SoftCanvas(384, 216);
globalThis.document = {
  getElementById: () => main,
  createElement: (tag) => (tag === 'canvas' ? new SoftCanvas(384, 216) : {}),
};
globalThis.addEventListener = () => {};
globalThis.innerWidth = 1920;
globalThis.innerHeight = 1080;
globalThis.requestAnimationFrame = () => 0;
globalThis.location = { hash: '', href: '' };
globalThis.window = globalThis;
globalThis.window.open = () => {};

globalThis.Image = class {
  set src(url) {
    const img = decodePng(join(ROOT, url));
    this.width = img.width;
    this.height = img.height;
    this.data = img.data;
    queueMicrotask(() => this.onload && this.onload());
  }
};

globalThis.fetch = async (url) => ({
  ok: true,
  json: async () => JSON.parse(readFileSync(join(ROOT, url), 'utf8')),
});

// Plans à capturer : scène, secondes à laisser passer, fichier, paramètres.
const SHOTS = [
  ['title', 1.2, '01-titre.png'],
  ['levels', 1.0, '02-missions.png'],
  ['exterior', 3.4, '03-exterieur.png'],
  ['lobby', 2.6, '04-accueil.png'],
  ['floor', 2.2, '05-plateau.png'],
  ['missionAtlas', 5.0, '06-mission-atlas.png'],
  ['missionSentinel', 6.0, '07-sentinel.png'],
  ['montage', 14.0, '08-bilan.png',
    { lit: 9, animate: [9, 10], next: 'departure', final: true }],
  ['departure', 3.0, '09-depart.png'],
  ['sunset', 3.0, '10-coucher-de-soleil.png'],
  ['credits', 2.0, '11-generique.png'],
  ['credits', 11.0, '12-2h03.png'],
  ['outro', 9.0, '13-contacts.png'],
];

async function run() {
  await import(pathToFileURL(join(ROOT, 'src/main.js')).href);
  for (let i = 0; i < 200 && !globalThis.game; i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  const game = globalThis.game;
  if (!game) throw new Error('Le jeu ne s\'est pas initialisé.');

  const args = process.argv.slice(2);
  const shots = args.length
    ? [[args[0], parseFloat(args[1] || '2'), args[2] || 'shot.png']]
    : SHOTS;

  mkdirSync(OUT, { recursive: true });
  const DT = 1 / 60;

  for (const [scene, seconds, file, params] of shots) {
    game.go(scene, params || {}, 0.001);
    game.fade.alpha = 1;
    // deux images pour laisser le fondu basculer et enter() s'exécuter
    for (let i = 0; i < 3; i++) {
      game.update(DT); game.draw(); game.input.endFrame();
    }
    const frames = Math.round(seconds * 60);
    for (let i = 0; i < frames; i++) {
      game.update(DT);
      game.draw();
      game.input.endFrame();
    }
    const path = join(OUT, file);
    main.save(path, 1);
    console.log('→', 'docs/screens/' + file, `(${scene}, ${seconds}s)`);
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
