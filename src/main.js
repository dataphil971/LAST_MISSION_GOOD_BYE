// Amorçage : chargement des atlas, câblage des services, table des scènes.

import { Game } from './core/game.js';
import { Atlas } from './core/atlas.js';
import { drawText } from './core/font.js';
import { Dialogue, Toasts } from './ui/dialogue.js';
import { CAST } from './data/script.js';
import { C } from './data/palette.js';

import { TitleScene } from './scenes/title.js';
import { LevelsScene } from './scenes/levels.js';
import { ExteriorScene, LobbyScene, ElevatorScene } from './scenes/arrival.js';
import { FloorScene } from './scenes/plateau.js';
import { MissionAtlasScene } from './scenes/mission_atlas.js';
import { MissionSentinelScene } from './scenes/mission_sentinel.js';
import { MontageScene } from './scenes/montage.js';
import { DepartureScene, SunsetScene, CreditsScene } from './scenes/farewell.js';
import { OutroScene } from './scenes/outro.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function splash(message, error = false) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = C.outline_deep;
  ctx.fillRect(0, 0, canvas.width || 384, canvas.height || 216);
  drawText(ctx, message, (canvas.width || 384) / 2, 104,
    { color: error ? C.error : C.text_muted, align: 'center' });
}

async function boot() {
  canvas.width = 384;
  canvas.height = 216;
  splash('Chargement...');

  const game = new Game(canvas);
  try {
    const [hero, heroCs, npc] = await Promise.all([
      Atlas.load('assets/hero/hero_gameplay.png', 'assets/hero/hero_gameplay.json'),
      Atlas.load('assets/hero/hero_cutscene.png', 'assets/hero/hero_cutscene.json'),
      Atlas.load('assets/npc/npc_office.png', 'assets/npc/npc_office.json'),
    ]);
    game.assets = { hero, heroCs, npc };
  } catch (err) {
    console.error(err);
    // le message réel, pas une supposition : c'est ce qui rend un échec
    // de chargement diagnosticable chez quelqu'un d'autre
    splash(String(err && err.message ? err.message : err), true);
    return;
  }

  game.dlg = new Dialogue(game);
  game.toasts = new Toasts(game);

  // Portraits de dialogue : l'animation réelle du personnage, pas une
  // illustration figée. Le casque continue donc de jouer pendant qu'il parle.
  game.dlg.defineSpeaker('philippe', {
    ...CAST.philippe, atlas: game.assets.hero, tag: 'hero/gp/idle/front',
  });
  game.dlg.defineSpeaker('reception', {
    ...CAST.reception, atlas: game.assets.npc, tag: 'npc/reception/idle',
  });
  game.dlg.defineSpeaker('tutor', {
    ...CAST.tutor, atlas: game.assets.npc, tag: 'npc/tutor/talk',
  });
  game.dlg.defineSpeaker('bi07', {
    ...CAST.bi07, atlas: game.assets.npc, tag: 'npc/bi07/talk',
  });
  game.dlg.defineSpeaker('peer', {
    ...CAST.peer, atlas: game.assets.npc, tag: 'npc/peer/talk',
  });
  game.dlg.defineSpeaker('bi02', {
    ...CAST.bi02, atlas: game.assets.npc, tag: 'npc/bi02/talk',
  });
  game.dlg.defineSpeaker('narrator', { ...CAST.narrator });

  game.register('title', (g) => new TitleScene(g));
  game.register('levels', (g) => new LevelsScene(g));
  game.register('exterior', (g) => new ExteriorScene(g));
  game.register('lobby', (g) => new LobbyScene(g));
  game.register('elevator', (g) => new ElevatorScene(g));
  game.register('floor', (g) => new FloorScene(g));
  game.register('missionAtlas', (g) => new MissionAtlasScene(g));
  game.register('missionSentinel', (g) => new MissionSentinelScene(g));
  game.register('montage', (g) => new MontageScene(g));
  game.register('departure', (g) => new DepartureScene(g));
  game.register('sunset', (g) => new SunsetScene(g));
  game.register('credits', (g) => new CreditsScene(g));
  game.register('outro', (g) => new OutroScene(g));

  // Raccourci de production : #scene=sunset ouvre directement un plan.
  const jump = new URLSearchParams(location.hash.slice(1)).get('scene');
  game.go(game.scenes.has(jump) ? jump : 'title', {}, 0.2);
  game.fade.alpha = 1;
  game.start();
  window.game = game;            // utile en debug console
}

boot();
