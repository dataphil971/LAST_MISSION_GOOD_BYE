// Chargement des spritesheets au format Aseprite (PNG + JSON json-array).
//
// Le moteur ne connait que des TAGS ("hero/gp/walk/side"). Les placeholders
// generes par tools/gen_sprites.py exposent exactement les memes tags et le
// meme pivot que les futurs exports Aseprite : remplacer les fichiers
// suffira, aucun code a modifier (cf. docs/PIPELINE.md).

export class Atlas {
  constructor(image, data) {
    this.image = image;
    this.frames = data.frames;
    this.tags = new Map();
    for (const t of data.meta.frameTags || []) {
      this.tags.set(t.name, { from: t.from, to: t.to, dir: t.direction });
    }
    const slice = (data.meta.slices || []).find((s) => s.name === 'pivot');
    const key = slice && slice.keys && slice.keys[0];
    this.pivot = key && key.pivot ? key.pivot : { x: 0, y: 0 };
  }

  static async load(pngUrl, jsonUrl) {
    // Les builds mono-fichier déposent les métadonnées ici plutôt que de
    // les faire charger par le réseau : une page hébergée en bac à sable
    // peut refuser fetch(), y compris sur une URL data:.
    const inlined = globalThis.__ATLAS_INLINE;
    const [image, data] = await Promise.all([
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image illisible : ' + pngUrl));
        img.src = pngUrl;
      }),
      inlined && inlined[jsonUrl]
        ? Promise.resolve(inlined[jsonUrl])
        : fetch(jsonUrl).then((r) => {
          if (!r.ok) throw new Error('JSON introuvable : ' + jsonUrl);
          return r.json();
        }),
    ]);
    return new Atlas(image, data);
  }

  has(tag) { return this.tags.has(tag); }

  frameCount(tag) {
    const t = this.tags.get(tag);
    return t ? t.to - t.from + 1 : 0;
  }

  /**
   * Dessine une frame ancree sur son pivot (bas-centre).
   * Les coordonnees sont arrondies : aucun sous-pixel, jamais.
   */
  draw(ctx, tag, index, x, y, flip = false) {
    const t = this.tags.get(tag);
    if (!t) return;
    const n = t.to - t.from + 1;
    const f = this.frames[t.from + (((index % n) + n) % n)];
    const r = f.frame;
    const dx = Math.round(x) - this.pivot.x;
    const dy = Math.round(y) - this.pivot.y;
    if (flip) {
      ctx.save();
      ctx.translate(dx + r.w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.image, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      ctx.restore();
    } else {
      ctx.drawImage(this.image, r.x, r.y, r.w, r.h, dx, dy, r.w, r.h);
    }
  }

  /** Portrait de dialogue : le haut de la cellule (casque + visage) zoome x2. */
  drawPortrait(ctx, tag, index, x, y, size = 34) {
    const t = this.tags.get(tag);
    if (!t) return;
    const n = t.to - t.from + 1;
    const f = this.frames[t.from + (((index % n) + n) % n)];
    const r = f.frame;
    const src = size / 2;
    const sx = r.x + Math.floor((r.w - src) / 2);
    const sy = r.y + 10;                       // haut du casque
    ctx.save();
    ctx.beginPath();
    ctx.rect(Math.round(x), Math.round(y), size, size);
    ctx.clip();
    ctx.drawImage(this.image, sx, sy, src, src,
      Math.round(x), Math.round(y), size, size);
    ctx.restore();
  }
}

/** Lecteur d animation : cadence fixe, boucle ou one-shot. */
export class Animator {
  constructor(atlas, tag, fps = 8, loop = true) {
    this.atlas = atlas;
    this.fps = fps;
    this.loop = loop;
    this.t = 0;
    this.index = 0;
    this.finished = false;
    this.tag = null;
    this.play(tag, fps, loop);
  }

  play(tag, fps = this.fps, loop = true) {
    if (this.tag === tag) return this;
    this.tag = tag;
    this.fps = fps;
    this.loop = loop;
    this.t = 0;
    this.index = 0;
    this.finished = false;
    return this;
  }

  /** Force le redemarrage meme si le tag est deja actif. */
  restart(tag, fps = this.fps, loop = true) {
    this.tag = null;
    return this.play(tag, fps, loop);
  }

  update(dt) {
    if (this.finished) return;
    const count = this.atlas.frameCount(this.tag);
    if (count <= 1) return;
    this.t += dt;
    const step = 1 / this.fps;
    while (this.t >= step) {
      this.t -= step;
      this.index++;
      if (this.index >= count) {
        if (this.loop) this.index = 0;
        else { this.index = count - 1; this.finished = true; }
      }
    }
  }

  draw(ctx, x, y, flip = false) {
    this.atlas.draw(ctx, this.tag, this.index, x, y, flip);
  }
}
