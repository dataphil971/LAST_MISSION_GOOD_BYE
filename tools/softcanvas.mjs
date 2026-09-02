// Canvas 2D logiciel minimal : juste ce que le jeu utilise.
//
// Il permet de rendre le jeu SANS navigateur, donc de faire de la QA visuelle
// et des captures d'écran en ligne de commande (tools/screenshot.mjs).
// Volontairement limité : fillRect, drawImage, save/restore, clip
// rectangulaire, globalAlpha, translate/scale(-1,1) pour le miroir.
// Aucun anti-aliasing, aucun sous-pixel — exactement comme le jeu.

import zlib from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';

// -- PNG ---------------------------------------------------------------
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(tag, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(tag, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Décodeur PNG RGBA, filtre 0 uniquement (celui de tools/png.py). */
export function decodePng(path) {
  const d = readFileSync(path);
  let i = 8;
  let w = 0; let h = 0; let bitDepth = 8; let colorType = 6;
  const idat = [];
  while (i < d.length) {
    const len = d.readUInt32BE(i);
    const tag = d.toString('latin1', i + 4, i + 8);
    const data = d.subarray(i + 8, i + 8 + len);
    if (tag === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9];
    } else if (tag === 'IDAT') idat.push(data);
    i += 12 + len;
  }
  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error('PNG non supporté (attendu RGBA 8 bits) : ' + path);
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const px = Buffer.alloc(w * h * 4);
  const stride = w * 4;
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    if (filter !== 0) throw new Error('Filtre PNG ' + filter + ' non supporté');
    src.copy(px, y * stride);
  }
  return { width: w, height: h, data: px };
}

export function writePng(path, width, height, data) {
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(path, Buffer.concat([
    Buffer.from('\x89PNG\r\n\x1a\n', 'latin1'),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

// -- couleurs ----------------------------------------------------------
const colorCache = new Map();
function parseColor(css) {
  if (colorCache.has(css)) return colorCache.get(css);
  let r = 255; let g = 0; let b = 255; let a = 255;
  if (typeof css === 'string' && css[0] === '#') {
    const hex = css.slice(1);
    if (hex.length >= 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16);
    }
  }
  const c = [r, g, b, a];
  colorCache.set(css, c);
  return c;
}

// -- contexte ----------------------------------------------------------
class SoftCtx {
  constructor(canvas) {
    this.canvas = canvas;
    this.fillStyle = '#000000';
    this.globalAlpha = 1;
    this.imageSmoothingEnabled = false;
    this.tx = 0; this.ty = 0; this.sx = 1; this.sy = 1;
    this.clip_ = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    this.stack = [];
    this.path = null;
  }

  save() {
    this.stack.push({
      fillStyle: this.fillStyle, globalAlpha: this.globalAlpha,
      tx: this.tx, ty: this.ty, sx: this.sx, sy: this.sy,
      clip: { ...this.clip_ },
    });
  }

  restore() {
    const s = this.stack.pop();
    if (!s) return;
    Object.assign(this, {
      fillStyle: s.fillStyle, globalAlpha: s.globalAlpha,
      tx: s.tx, ty: s.ty, sx: s.sx, sy: s.sy,
    });
    this.clip_ = s.clip;
  }

  translate(x, y) { this.tx += x * this.sx; this.ty += y * this.sy; }
  scale(x, y) { this.sx *= x; this.sy *= y; }
  beginPath() { this.path = null; }
  rect(x, y, w, h) { this.path = { x: this.tx + x, y: this.ty + y, w, h }; }

  clip() {
    if (!this.path) return;
    const p = this.path;
    const c = this.clip_;
    const x0 = Math.max(c.x, Math.round(p.x));
    const y0 = Math.max(c.y, Math.round(p.y));
    const x1 = Math.min(c.x + c.w, Math.round(p.x + p.w));
    const y1 = Math.min(c.y + c.h, Math.round(p.y + p.h));
    this.clip_ = { x: x0, y: y0, w: Math.max(0, x1 - x0), h: Math.max(0, y1 - y0) };
  }

  _blend(x, y, r, g, b, a) {
    const c = this.clip_;
    if (x < c.x || y < c.y || x >= c.x + c.w || y >= c.y + c.h) return;
    const cv = this.canvas;
    if (x < 0 || y < 0 || x >= cv.width || y >= cv.height) return;
    const i = (y * cv.width + x) * 4;
    const d = cv.data;
    if (a >= 255) {
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      return;
    }
    const k = a / 255;
    d[i] = Math.round(r * k + d[i] * (1 - k));
    d[i + 1] = Math.round(g * k + d[i + 1] * (1 - k));
    d[i + 2] = Math.round(b * k + d[i + 2] * (1 - k));
    d[i + 3] = 255;
  }

  fillRect(x, y, w, h) {
    const [r, g, b, ca] = parseColor(this.fillStyle);
    const a = Math.round(ca * Math.max(0, Math.min(1, this.globalAlpha)));
    if (a <= 0) return;
    const X = Math.round(this.tx + x * this.sx);
    const Y = Math.round(this.ty + y * this.sy);
    const W = Math.round(w * Math.abs(this.sx));
    const H = Math.round(h * Math.abs(this.sy));
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) this._blend(X + i, Y + j, r, g, b, a);
    }
  }

  drawImage(img, ...args) {
    let sx = 0; let sy = 0; let sw = img.width; let sh = img.height;
    let dx = 0; let dy = 0; let dw = sw; let dh = sh;
    if (args.length === 2) { [dx, dy] = args; }
    else if (args.length === 4) { [dx, dy, dw, dh] = args; }
    else { [sx, sy, sw, sh, dx, dy, dw, dh] = args; }

    const src = img.data;
    const iw = img.width;
    const kx = sw / dw;
    const ky = sh / dh;
    const mirrored = this.sx < 0;
    const baseX = Math.round(this.tx + dx * this.sx);
    const baseY = Math.round(this.ty + dy * this.sy);
    const alpha = Math.max(0, Math.min(1, this.globalAlpha));

    for (let j = 0; j < Math.round(dh); j++) {
      const py = Math.floor(sy + j * ky);
      for (let i = 0; i < Math.round(dw); i++) {
        const pxx = Math.floor(sx + i * kx);
        const o = (py * iw + pxx) * 4;
        const a = src[o + 3];
        if (!a) continue;
        const X = mirrored ? baseX - 1 - i : baseX + i;
        this._blend(X, baseY + j, src[o], src[o + 1], src[o + 2],
          Math.round(a * alpha));
      }
    }
  }
}

export class SoftCanvas {
  constructor(width = 384, height = 216) {
    this.width = width;
    this.height = height;
    this.style = {};
    this.data = Buffer.alloc(width * height * 4);
    this.ctx = new SoftCtx(this);
  }

  getContext() { return this.ctx; }
  addEventListener() {}
  getBoundingClientRect() {
    return { left: 0, top: 0, width: this.width, height: this.height };
  }

  /** Écrit un PNG, éventuellement agrandi par un facteur entier. */
  save(path, scale = 1) {
    if (scale === 1) { writePng(path, this.width, this.height, this.data); return; }
    const w = this.width * scale;
    const h = this.height * scale;
    const out = Buffer.alloc(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (Math.floor(y / scale) * this.width + Math.floor(x / scale)) * 4;
        this.data.copy(out, (y * w + x) * 4, s, s + 4);
      }
    }
    writePng(path, w, h, out);
  }
}
