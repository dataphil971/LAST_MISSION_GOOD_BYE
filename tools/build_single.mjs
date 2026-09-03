// Construit un build MONO-FICHIER : dist/last-mission.html
//
//     node tools/build_single.mjs
//
// Pourquoi : un fichier unique s'ouvre directement depuis le disque, sans
// serveur. Les modules ES et fetch() sont bloqués par la politique
// d'origine sur file://, donc on inline tout — code et assets en data:.
// Pratique pour joindre le jeu à un message ou l'archiver.
//
// Le dépôt reste la source de vérité : ce build est un artefact dérivé.

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// -- collecte des modules ---------------------------------------------
function listModules(dir, out = []) {
  for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = posix.join(dir, entry.name);
    if (entry.isDirectory()) listModules(rel, out);
    else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

/** Résout un chemin relatif d'import en identifiant de module. */
function resolve(from, spec) {
  const base = posix.dirname(from);
  return posix.normalize(posix.join(base, spec));
}

/**
 * Transforme un module ES en fabrique CommonJS minimale.
 * Ne couvre que les formes utilisées dans ce projet :
 *   import { a, b } from './x.js'
 *   export const / export function / export class
 */
function toFactory(id, src) {
  let code = src.replace(
    /^import\s*\{([^}]+)\}\s*from\s*'([^']+)';?\s*$/gm,
    (_, names, spec) => `const {${names}} = __req('${resolve(id, spec)}');`,
  );

  const exported = [];
  code = code.replace(/^export\s+(const|let|function|class|function\*)\s+(\w+)/gm,
    (_, kind, name) => { exported.push(name); return `${kind} ${name}`; });

  const tail = exported.map((n) => `__x.${n} = ${n};`).join('\n');
  return `__def('${id}', function (__x, __req) {\n${code}\n${tail}\n});`;
}

// -- assets en data: ---------------------------------------------------
function dataUri(relPath) {
  const buf = readFileSync(join(ROOT, relPath));
  const mime = relPath.endsWith('.png') ? 'image/png' : 'application/json';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

// Les images passent en data: (une balise <img> les accepte partout).
// Les métadonnées, elles, sont injectées comme objets JS : une page hébergée
// en bac à sable peut refuser fetch(), y compris sur une URL data:.
const IMAGES = [
  'assets/hero/hero_gameplay.png',
  'assets/hero/hero_cutscene.png',
  'assets/npc/npc_office.png',
];
const METADATA = [
  'assets/hero/hero_gameplay.json',
  'assets/hero/hero_cutscene.json',
  'assets/npc/npc_office.json',
];

// -- assemblage --------------------------------------------------------
const modules = listModules('src');
const inlineMeta = Object.fromEntries(
  METADATA.map((m) => [m, JSON.parse(readFileSync(join(ROOT, m), 'utf8'))]),
);

let bundle = `
// Métadonnées des atlas, injectées sans aucun appel réseau.
globalThis.__ATLAS_INLINE = ${JSON.stringify(inlineMeta)};

// Chargeur de modules minimal (le dépôt utilise de vrais modules ES ;
// ce build inline sert uniquement à l'ouverture depuis le disque).
const __reg = {};
const __cache = {};
function __def(id, factory) { __reg[id] = factory; }
function __req(id) {
  if (__cache[id]) return __cache[id];
  const f = __reg[id];
  if (!f) throw new Error('Module introuvable : ' + id);
  const x = __cache[id] = {};
  f(x, __req);
  return x;
}
`;

for (const id of modules) {
  if (id === 'src/main.js') continue;
  bundle += '\n' + toFactory(id, readFileSync(join(ROOT, id), 'utf8'));
}

let main = readFileSync(join(ROOT, 'src/main.js'), 'utf8')
  .replace(/^import\s*\{([^}]+)\}\s*from\s*'([^']+)';?\s*$/gm,
    (_, names, spec) => `const {${names}} = __req('${resolve('src/main.js', spec)}');`);
for (const a of IMAGES) main = main.split(`'${a}'`).join(`'${dataUri(a)}'`);
bundle += '\n\n' + main;

const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
  .replace('<script type="module" src="src/main.js"></script>',
    '<script type="module">\n' + bundle + '\n</script>');

mkdirSync(join(ROOT, 'dist'), { recursive: true });
const out = join(ROOT, 'dist', 'last-mission.html');
writeFileSync(out, html, 'utf8');
console.log('→ dist/last-mission.html',
  (Buffer.byteLength(html) / 1024).toFixed(0) + ' Ko',
  '(' + modules.length + ' modules, ' + IMAGES.length + ' images, ' + METADATA.length + ' métadonnées)');

// -- variante pour hébergement en page partagée -------------------------
// L'hôte fournit lui-même <!doctype>, <head> et <body> : on ne livre que
// le titre, le style, le canvas et le script. Même bundle, même assets.
const embed = `<title>Last Mission — Good Bye</title>
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(ellipse at 50% 40%, #241A22 0%, #140F14 70%, #0E0A10 100%);
    color: #6A5C72;
    font: 12px/1.4 system-ui, sans-serif;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  /* Agrandissement par facteur entier, nearest-neighbour : la taille exacte
     est fixée en JS (src/core/game.js). */
  canvas {
    image-rendering: pixelated;
    display: block;
    touch-action: manipulation;
    box-shadow: 0 0 0 1px #35252A, 0 12px 40px rgba(0, 0, 0, .55);
  }
  /* En portrait sur un telephone, le jeu tient en largeur mais reste une
     bande etroite : on suggere la rotation plutot que de l imposer. */
  .rotate {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 14px;
    margin: 0;
    text-align: center;
    font: 12px/1.4 system-ui, sans-serif;
    color: #6A5C72;
    display: none;
  }
  @media (orientation: portrait) and (max-width: 760px) {
    .rotate { display: block; }
  }
</style>
<canvas id="game" width="384" height="216" aria-label="Jeu"></canvas>
<p class="rotate">Tourne ton téléphone pour agrandir l'image.</p>
<script type="module">
${bundle}
</script>
`;
const embedPath = join(ROOT, 'dist', 'artifact.html');
writeFileSync(embedPath, embed, 'utf8');
console.log('→ dist/artifact.html   ',
  (Buffer.byteLength(embed) / 1024).toFixed(0) + ' Ko (variante page partagée)');
