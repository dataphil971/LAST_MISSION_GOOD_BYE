// Police bitmap 5x7 proportionnelle, avec diacritiques francais composes.
//
// Aucune police systeme n est utilisee : le canvas logique fait 384x216 et
// tout texte anticrenele detruirait la lecture pixel. Chaque glyphe est une
// grille de 5 colonnes ; la largeur d avance est deduite de la colonne la
// plus a droite reellement utilisee, ce qui donne une chasse proportionnelle.
//
// Rangees : 0-6 = corps du glyphe (hauteur de capitale 7 px),
//           7-8 = jambages (g, j, p, q, y, virgule),
//           -2/-1 = zone reservee aux accents (voir ACCENTS).

const G = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
  B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.',
  D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####',
  F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
  H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '###../.#.../.#.../.#.../.#.../.#.../###..',
  J: '..###/...#./...#./...#./#..#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
  L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
  N: '#...#/##..#/#.#.#/#.#.#/#..##/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
  P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
  R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.',
  T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
  V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
  X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
  Z: '#####/....#/...#./..#../.#.../#..../#####',

  a: '...../...../.###./....#/.####/#...#/.####',
  b: '#..../#..../####./#...#/#...#/#...#/####.',
  c: '...../...../.###./#..../#..../#...#/.###.',
  d: '....#/....#/.####/#...#/#...#/#...#/.####',
  e: '...../...../.###./#...#/#####/#..../.###.',
  f: '..##./.#..#/.#.../###../.#.../.#.../.#...',
  g: '...../...../.####/#...#/#...#/.####/....#/#...#/.###.',
  h: '#..../#..../####./#...#/#...#/#...#/#...#',
  i: '.#.../...../##.../.#.../.#.../.#.../.###.',
  j: '...#./...../..##./...#./...#./...#./...#./#..#./.##..',
  k: '#..../#..../#..#./#.#../##.../#.#../#..#.',
  l: '##.../.#.../.#.../.#.../.#.../.#.../.###.',
  m: '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
  n: '...../...../####./#...#/#...#/#...#/#...#',
  o: '...../...../.###./#...#/#...#/#...#/.###.',
  p: '...../...../####./#...#/#...#/####./#..../#..../#....',
  q: '...../...../.####/#...#/#...#/.####/....#/....#/....#',
  r: '...../...../#.##./##..#/#..../#..../#....',
  s: '...../...../.####/#..../.###./....#/####.',
  t: '.#.../.#.../###../.#.../.#.../.#..#/..##.',
  u: '...../...../#...#/#...#/#...#/#..##/.##.#',
  v: '...../...../#...#/#...#/#...#/.#.#./..#..',
  w: '...../...../#...#/#.#.#/#.#.#/#.#.#/.#.#.',
  x: '...../...../#...#/.#.#./..#../.#.#./#...#',
  y: '...../...../#...#/#...#/#...#/.####/....#/....#/.###.',
  z: '...../...../#####/...#./..#../.#.../#####',

  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
  1: '..#../.##../..#../..#../..#../..#../.###.',
  2: '.###./#...#/....#/...#./..#../.#.../#####',
  3: '####./....#/....#/.###./....#/....#/####.',
  4: '...#./..##./.#.#./#..#./#####/...#./...#.',
  5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '.###./#..../#..../####./#...#/#...#/.###.',
  7: '#####/....#/...#./..#../.#.../.#.../.#...',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
  9: '.###./#...#/#...#/.####/....#/....#/.###.',

  '.': '...../...../...../...../...../...../#....',
  ',': '...../...../...../...../...../...../.#.../.#.../#....',
  ':': '...../...../#..../...../...../#..../.....',
  ';': '...../...../.#.../...../...../.#.../.#.../#....',
  '!': '#..../#..../#..../#..../#..../...../#....',
  '?': '.###./#...#/....#/...#./..#../...../..#..',
  "'": '#..../#..../...../...../...../...../.....',
  '"': '#.#../#.#../...../...../...../...../.....',
  '(': '..#../.#.../#..../#..../#..../.#.../..#..',
  ')': '#..../.#.../..#../..#../..#../.#.../#....',
  '-': '...../...../...../###../...../...../.....',
  '–': '...../...../...../####./...../...../.....',
  '—': '...../...../...../#####/...../...../.....',
  '+': '...../..#../..#../#####/..#../..#../.....',
  '=': '...../...../#####/...../#####/...../.....',
  '/': '....#/...#./..#../..#../.#.../#..../#....',
  '%': '##..#/##..#/...#./..#../.#.../#..##/#..##',
  '[': '.###./.#.../.#.../.#.../.#.../.#.../.###.',
  ']': '###../..#../..#../..#../..#../..#../###..',
  '<': '...#./..#../.#.../#..../.#.../..#../...#.',
  '>': '#..../.#.../..#../...#./..#../.#.../#....',
  '_': '...../...../...../...../...../...../#####',
  '*': '...../#.#.#/.###./#####/.###./#.#.#/.....',
  '#': '.#.#./#####/.#.#./#####/.#.#./...../.....',
  '&': '.##../#..#./.##../##.#./#..##/#..#./.##.#',
  '@': '.###./#...#/#.###/#.#.#/#.###/#..../.###.',
  '|': '#..../#..../#..../#..../#..../#..../#....',
  '«': '...../..#.#/.#.#./#.#../.#.#./..#.#/.....',
  '»': '...../#.#../.#.#./..#.#/.#.#./#.#../.....',
  '…': '...../...../...../...../...../...../#.#.#',
  '·': '...../...../...../#..../...../...../.....',
  '★': '..#../..#../#####/.###./#...#/...../.....',
  // Bloc plein : espace 1 px oblige entre les glyphes, une suite de blocs
  // se lit donc comme une jauge segmentee. C est voulu.
  '█': '####./####./####./####./####./####./####.',
  // Deux yeux — remplace l emoji, que la police bitmap ne couvre pas.
  // Le glyphe fait 7 colonnes : en 5, les deux yeux se confondaient avec
  // deux points. La pupille est un trou, seule facon de la rendre en un
  // seul ton. Le moteur gere les glyphes plus larges que la grille.
  '👀': '......./......./###.###/#.#.#.#/###.###/......./.......',
  '→': '...../..#../...#./#####/...#./..#../.....',
  '°': '##.../#.#../##.../...../...../...../.....',
  '♥': '.#.#./#####/#####/.###./..#../...../.....',
  '▶': '#..../##.../###../####./###../##.../#....',
};

// Accents : deux rangees dessinees AU-DESSUS du corps du glyphe,
// et la cedille, dessinee sous la ligne de base.
const ACCENTS = {
  acute: { rows: ['..#..', '.#...'], below: false },
  grave: { rows: ['.#...', '..#..'], below: false },
  circ: { rows: ['..#..', '.#.#.'], below: false },
  trema: { rows: ['.#.#.', '.....'], below: false },
  cedil: { rows: ['..#..', '.##..'], below: true },
};

const COMPOSED = {
  'é': ['e', 'acute'], 'è': ['e', 'grave'], 'ê': ['e', 'circ'],
  'ë': ['e', 'trema'], 'à': ['a', 'grave'], 'â': ['a', 'circ'],
  'ä': ['a', 'trema'], 'ù': ['u', 'grave'], 'û': ['u', 'circ'],
  'ü': ['u', 'trema'], 'î': ['i', 'circ'], 'ï': ['i', 'trema'],
  'ô': ['o', 'circ'], 'ö': ['o', 'trema'], 'ç': ['c', 'cedil'],
  'É': ['E', 'acute'], 'È': ['E', 'grave'], 'Ê': ['E', 'circ'],
  'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ç': ['C', 'cedil'],
  'Î': ['I', 'circ'], 'Ô': ['O', 'circ'], 'Û': ['U', 'circ'],
  'Ù': ['U', 'grave'],
};

const SPACE_W = 2;
const cache = new Map();

function glyph(ch) {
  if (cache.has(ch)) return cache.get(ch);
  let base = ch;
  let accent = null;
  if (COMPOSED[ch]) [base, accent] = COMPOSED[ch];
  const def = G[base];
  let g;
  if (!def) {
    g = { rows: [], w: SPACE_W, accent: null };
  } else {
    const rows = def.split('/');
    let w = 0;
    for (const r of rows) {
      for (let x = 0; x < r.length; x++) if (r[x] === '#') w = Math.max(w, x + 1);
    }
    g = { rows, w: w || SPACE_W, accent: accent ? ACCENTS[accent] : null };
  }
  cache.set(ch, g);
  return g;
}

/** Largeur en pixels d une chaine, avance comprise (1 px entre glyphes). */
export function textWidth(str, spacing = 1) {
  let w = 0;
  for (const ch of str) w += (ch === ' ' ? SPACE_W : glyph(ch).w) + spacing;
  return Math.max(0, w - spacing);
}

export const LINE_H = 9;

/**
 * Dessine du texte pixel-parfait.
 * opts : { color, shadow, spacing, align } ; x et y sont arrondis.
 */
export function drawText(ctx, str, x, y, opts = {}) {
  const color = opts.color || '#F2E9CF';
  const spacing = opts.spacing == null ? 1 : opts.spacing;
  let px = Math.round(x);
  const py = Math.round(y);
  if (opts.align === 'center') px -= Math.floor(textWidth(str, spacing) / 2);
  else if (opts.align === 'right') px -= textWidth(str, spacing);

  if (opts.shadow) {
    drawText(ctx, str, px + 1, py + 1,
      { ...opts, color: opts.shadow, shadow: null, align: 'left' });
  }

  ctx.fillStyle = color;
  for (const ch of str) {
    if (ch === ' ') { px += SPACE_W + spacing; continue; }
    const g = glyph(ch);
    for (let ry = 0; ry < g.rows.length; ry++) {
      const row = g.rows[ry];
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === '#') ctx.fillRect(px + rx, py + ry, 1, 1);
      }
    }
    if (g.accent) {
      const off = g.accent.below ? g.rows.length : -2;
      for (let ry = 0; ry < g.accent.rows.length; ry++) {
        const row = g.accent.rows[ry];
        for (let rx = 0; rx < row.length; rx++) {
          if (row[rx] === '#') ctx.fillRect(px + rx, py + off + ry, 1, 1);
        }
      }
    }
    px += g.w + spacing;
  }
  return px;
}

/** Decoupe un texte en lignes tenant dans maxW pixels. */
export function wrapText(str, maxW, spacing = 1) {
  const lines = [];
  for (const paragraph of str.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? line + ' ' + word : word;
      if (textWidth(candidate, spacing) > maxW && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}
