// Planche de casting : tous les profils PNJ cote a cote, le heros en tete
// de ligne pour comparer.
//
//   node tools/cast_sheet.mjs      -> docs/screens/14-casting.png
//
// Deux tests de la Bible d'art en une image. Le test de distinction :
// deux collegues qui se ressemblent se voient immediatement ici, alors
// qu'ils passeraient inapercus dans des scenes ou ils n'apparaissent jamais
// ensemble. Et le test silhouette (derniere rangee) : sprite entierement
// plein, aucune couleur -- si deux personnes restent reconnaissables la,
// elles le resteront partout.
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { SoftCanvas, decodePng } from './softcanvas.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
globalThis.Image = class {
  set src(url) {
    const img = decodePng(join(ROOT, url));
    this.width = img.width; this.height = img.height; this.data = img.data;
    queueMicrotask(() => this.onload && this.onload());
  }
};
globalThis.fetch = async (url) => ({
  ok: true, json: async () => JSON.parse(readFileSync(join(ROOT, url), 'utf8')),
});

const { Atlas } = await import(pathToFileURL(join(ROOT, 'src/core/atlas.js')).href);
const npc = await Atlas.load('assets/npc/npc_office.png', 'assets/npc/npc_office.json');
const hero = await Atlas.load('assets/hero/hero_gameplay.png', 'assets/hero/hero_gameplay.json');

const PROFILES = ['reception', 'tutor', 'bi07', 'peer', 'bi01', 'bi06', 'bi02', 'de03'];
const POSES = ['idle', 'idle_side', 'walk', 'sit', 'talk'];
const HERO_POSES = {
  idle: 'hero/gp/idle/front', idle_side: 'hero/gp/idle/side',
  walk: 'hero/gp/walk/side', sit: 'hero/gp/sit', talk: 'hero/gp/idle/front',
};
const CW = 44, CH = 62;
const COLS = PROFILES.length + 1;
const ROWS = POSES.length + 1;                 // + la rangee de silhouettes

const cv = new SoftCanvas(CW * COLS, CH * ROWS);
const ctx = cv.getContext('2d');
ctx.fillStyle = '#2E1F2A';
ctx.fillRect(0, 0, cv.width, cv.height);

const at = (col) => CW * col + 22;
const on = (row) => CH * row + CH - 8;

POSES.forEach((pose, r) => {
  hero.draw(ctx, HERO_POSES[pose], 0, at(0), on(r));
  PROFILES.forEach((who, i) => {
    npc.draw(ctx, `npc/${who}/${pose}`, 0, at(i + 1), on(r));
  });
});

// -- test silhouette : on repeint chaque sprite en aplat -------------------
// Le sprite est rendu seul sur un calque transparent, puis tout pixel non
// vide devient une seule couleur. Ce que l'on voit alors, c'est ce que
// l'oeil percoit en premier a 1x, avant la couleur.
const FLAT = [0xF2, 0xE9, 0xCF];

function silhouette(atlas, tag, col) {
  const layer = new SoftCanvas(CW, CH);
  atlas.draw(layer.getContext('2d'), tag, 0, 22, CH - 8);
  const row = POSES.length;
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const s = (y * CW + x) * 4;
      if (layer.data[s + 3] === 0) continue;
      const d = ((CH * row + y) * cv.width + CW * col + x) * 4;
      cv.data[d] = FLAT[0];
      cv.data[d + 1] = FLAT[1];
      cv.data[d + 2] = FLAT[2];
      cv.data[d + 3] = 255;
    }
  }
}

silhouette(hero, HERO_POSES.idle_side, 0);
PROFILES.forEach((who, i) => silhouette(npc, `npc/${who}/idle_side`, i + 1));

cv.save(join(ROOT, 'docs', 'screens', '14-casting.png'), 2);
console.log('→ docs/screens/14-casting.png');
