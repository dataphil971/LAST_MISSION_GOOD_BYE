// Realisation des scenes : un generateur = un plan de mise en scene.
//
//   function* acte() {
//     yield wait(0.4);
//     yield* dlg.say('philippe', 'Bonjour !');
//     yield walkTo(hero, 210);
//   }
//
// Chaque valeur produite (yield) est une commande : un objet expose
// update(dt) et renvoie true quand elle est terminee. Un nombre est
// interprete comme une attente en secondes. Cela evite les machines a
// etats illisibles dans les cinematiques.

class Wait {
  constructor(sec) { this.left = sec; }
  update(dt) { this.left -= dt; return this.left <= 0; }
}

class Until {
  constructor(fn) { this.fn = fn; }
  update(dt) { return !!this.fn(dt); }
}

class Tween {
  constructor(obj, prop, to, dur, ease) {
    this.obj = obj; this.prop = prop;
    this.from = obj[prop]; this.to = to;
    this.dur = Math.max(0.0001, dur);
    this.t = 0;
    this.ease = ease || ((x) => x);
  }
  update(dt) {
    this.t += dt;
    const k = Math.min(1, this.t / this.dur);
    this.obj[this.prop] = this.from + (this.to - this.from) * this.ease(k);
    return k >= 1;
  }
}

export const wait = (sec) => new Wait(sec);
export const until = (fn) => new Until(fn);
export const tween = (obj, prop, to, dur, ease) =>
  new Tween(obj, prop, to, dur, ease);
export const call = (fn) => new Until(() => { fn(); return true; });

export const ease = {
  linear: (x) => x,
  inOut: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x,
};

function normalize(v) {
  if (v == null) return new Wait(0);
  if (typeof v === 'number') return new Wait(v);
  if (typeof v === 'function') return new Until(v);
  if (typeof v.update === 'function') return v;
  return new Wait(0);
}

export class Timeline {
  constructor(gen) {
    this.it = gen;
    this.cur = null;
    this.done = false;
    this._advance();
  }

  _advance(sent) {
    const r = this.it.next(sent);
    if (r.done) { this.done = true; this.cur = null; }
    else this.cur = normalize(r.value);
  }

  update(dt) {
    let guard = 0;
    while (!this.done && this.cur && this.cur.update(dt)) {
      this._advance(this.cur.result);
      if (++guard > 512) break;     // garde-fou anti boucle infinie
    }
    return this.done;
  }
}
