// Entrees clavier / souris / tactile, exprimees en pixels LOGIQUES.
//
// Contrat UX du rapport : CLIC ou ESPACE avancent le dialogue, ESPACE
// maintenu accelere, ECHAP ouvre le menu, et rien ne doit jamais bloquer
// le joueur dans une cinematique.

const ACTION_KEYS = {
  Space: 'advance', Enter: 'advance', NumpadEnter: 'advance',
  Escape: 'menu',
  KeyM: 'mute',
  F1: 'debug',
  ArrowLeft: 'left', KeyA: 'left', KeyQ: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', KeyZ: 'up',
  ArrowDown: 'down', KeyS: 'down',
  Tab: 'skip',
};

export class Input {
  constructor(canvas, view) {
    this.view = view;                 // fournit scale + offset courants
    this.down = new Set();            // actions maintenues
    this.pressed = new Set();         // actions declenchees cette frame
    this.mouse = { x: -1, y: -1, inside: false };
    this.click = null;                // {x, y} consomme par les scenes
    this.clickHandled = false;
    this.anyInput = false;            // sert au deverrouillage audio

    addEventListener('keydown', (e) => {
      const a = ACTION_KEYS[e.code];
      if (a) {
        e.preventDefault();
        if (!this.down.has(a)) this.pressed.add(a);
        this.down.add(a);
        this.anyInput = true;
      }
    });
    addEventListener('keyup', (e) => {
      const a = ACTION_KEYS[e.code];
      if (a) this.down.delete(a);
    });
    addEventListener('blur', () => this.down.clear());

    const toLogical = (clientX, clientY) => {
      const r = canvas.getBoundingClientRect();
      const s = this.view.scale || 1;
      return {
        x: Math.floor((clientX - r.left) / s),
        y: Math.floor((clientY - r.top) / s),
      };
    };

    canvas.addEventListener('mousemove', (e) => {
      const p = toLogical(e.clientX, e.clientY);
      this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.inside = true;
    });
    canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    canvas.addEventListener('mousedown', (e) => {
      const p = toLogical(e.clientX, e.clientY);
      this.click = p;
      this.pressed.add('advance');
      this.anyInput = true;
    });
    canvas.addEventListener('touchstart', (e) => {
      const t = e.changedTouches[0];
      const p = toLogical(t.clientX, t.clientY);
      this.mouse.x = p.x; this.mouse.y = p.y; this.mouse.inside = true;
      this.click = p;
      this.pressed.add('advance');
      this.anyInput = true;
      e.preventDefault();
    }, { passive: false });
  }

  isDown(action) { return this.down.has(action); }
  justPressed(action) { return this.pressed.has(action); }

  /** Recupere le clic en attente et le consomme. */
  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  /** Le clic tombe-t-il dans ce rectangle logique ? */
  clickIn(x, y, w, h) {
    if (!this.click) return false;
    const c = this.click;
    if (c.x >= x && c.x < x + w && c.y >= y && c.y < y + h) {
      this.click = null;
      return true;
    }
    return false;
  }

  hoverIn(x, y, w, h) {
    const m = this.mouse;
    return m.inside && m.x >= x && m.x < x + w && m.y >= y && m.y < y + h;
  }

  endFrame() {
    this.pressed.clear();
    this.click = null;
  }
}
