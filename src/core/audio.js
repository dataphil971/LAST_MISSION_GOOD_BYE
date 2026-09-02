// Audio 100 % procedural (WebAudio) : aucun fichier son dans le depot.
//
// Le rapport demande une bande-son atmospherique et discrete, pas une
// fanfare. Les nappes sont donc lentes, filtrees, et le volume par defaut
// est bas. Le contexte ne demarre qu apres une interaction utilisateur,
// comme l exigent les navigateurs.

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function hz(name) {
  const m = /^([A-G])(#?)(-?\d)$/.exec(name);
  if (!m) return 440;
  const semis = NOTE[m[1]] + (m[2] ? 1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  return 440 * Math.pow(2, (semis - 69) / 12);
}

// Nappes : une ambiance = une suite d accords joues tres lentement.
const MOODS = {
  morning: { bpm: 54, wave: 'triangle', gain: 0.05, cutoff: 1100,
    chords: [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'],
      ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']] },
  office: { bpm: 66, wave: 'triangle', gain: 0.04, cutoff: 900,
    chords: [['D3', 'A3', 'F4'], ['C3', 'G3', 'E4'],
      ['A2', 'E3', 'C4'], ['G2', 'D3', 'B3']] },
  mission: { bpm: 88, wave: 'square', gain: 0.03, cutoff: 1400,
    chords: [['A2', 'E3', 'A3'], ['A2', 'E3', 'C4'],
      ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']] },
  sunset: { bpm: 44, wave: 'triangle', gain: 0.055, cutoff: 800,
    chords: [['F2', 'C3', 'A3'], ['C3', 'G3', 'E4'],
      ['D3', 'A3', 'F4'], ['G2', 'D3', 'B3']] },
  // le gag des 2 h de trajet merite une vraie musique de boss
  boss: { bpm: 132, wave: 'sawtooth', gain: 0.045, cutoff: 1600,
    chords: [['D2', 'A2', 'D3'], ['D2', 'A2', 'F3'],
      ['C2', 'G2', 'C3'], ['A#1', 'F2', 'A#2']] },
  train: { bpm: 50, wave: 'triangle', gain: 0.045, cutoff: 700,
    chords: [['G2', 'D3', 'B3'], ['E2', 'B2', 'G3'],
      ['C3', 'G3', 'E4'], ['D3', 'A3', 'F4']] },
};

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.mood = null;
    this.timer = 0;
    this.step = 0;
    this.voices = [];
  }

  /** A appeler apres la premiere interaction du joueur. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 1;
    this.musicGain.connect(this.master);
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9,
        this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  // -- effets ----------------------------------------------------------
  blip(freq = 660, dur = 0.05, type = 'square', vol = 0.06) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  slide(from, to, dur, type = 'square', vol = 0.07) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  noise(dur = 0.12, vol = 0.05, cutoff = 1200) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  }

  // -- vocabulaire sonore du jeu ---------------------------------------
  sfx(name) {
    if (!this.ctx) return;
    switch (name) {
      case 'text': this.blip(880, 0.018, 'square', 0.018); break;
      case 'select': this.blip(740, 0.05, 'square', 0.05); break;
      case 'confirm': this.blip(520, 0.05); setTimeout(() => this.blip(780, 0.07), 55); break;
      case 'error': this.slide(320, 150, 0.18, 'square', 0.06); break;
      case 'bonk': this.blip(180, 0.09, 'square', 0.07); break;
      case 'success':
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => this.blip(f, 0.11, 'square', 0.055), i * 65));
        break;
      case 'ding':
        this.blip(1318, 0.35, 'sine', 0.06);
        setTimeout(() => this.blip(1760, 0.4, 'sine', 0.04), 40);
        break;
      case 'click': this.blip(1200, 0.02, 'square', 0.05); break;
      case 'helmet': this.blip(420, 0.04, 'square', 0.05); break;
      case 'xp':
        [784, 988, 1175].forEach((f, i) =>
          setTimeout(() => this.blip(f, 0.09, 'triangle', 0.05), i * 70));
        break;
      case 'step': this.noise(0.05, 0.012, 500); break;
      case 'door': this.noise(0.3, 0.035, 700); break;
      case 'shutdown': this.slide(600, 90, 0.6, 'triangle', 0.05); break;
      default: break;
    }
  }

  // -- musique ---------------------------------------------------------
  play(mood) {
    if (this.mood === mood) return;
    this.mood = mood;
    this.step = 0;
    this.timer = 0;
    this.stopVoices(0.6);
  }

  stop() { this.mood = null; this.stopVoices(0.4); }

  stopVoices(release = 0.3) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const v of this.voices) {
      v.gain.gain.cancelScheduledValues(t);
      v.gain.gain.setTargetAtTime(0, t, release / 3);
      v.osc.stop(t + release + 0.1);
    }
    this.voices = [];
  }

  update(dt) {
    if (!this.ctx || !this.mood) return;
    const m = MOODS[this.mood];
    if (!m) return;
    const beat = 60 / m.bpm;
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = beat * 2;

    const chord = m.chords[this.step % m.chords.length];
    this.step++;
    const t = this.ctx.currentTime;
    const dur = beat * 2.1;
    this.stopVoices(0.25);
    chord.forEach((n, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = m.cutoff;
      osc.type = m.wave;
      osc.frequency.value = hz(n);
      const peak = m.gain * (i === 0 ? 1 : 0.7);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + beat * 0.35);
      g.gain.setTargetAtTime(0.0001, t + dur * 0.6, dur * 0.25);
      osc.connect(f); f.connect(g); g.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + dur + 0.5);
      this.voices.push({ osc, gain: g });
    });
  }
}
