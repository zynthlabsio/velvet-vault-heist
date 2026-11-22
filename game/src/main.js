// The Velvet Vault — game entry point: state machine, main loop, wiring.
// Screens: title -> intro -> playing <-> paused -> caught / victory.
// In `?shot=` mode the game stages one fixed scene and paints a single
// frozen frame (no loop, no audio) for deterministic screenshots.
import {
  VIEW_W,
  VIEW_H,
  HUD_H,
  ALARM_SPOTTED_RATE,
  ALARM_SUSPICIOUS_RATE,
  ALARM_DECAY_RATE,
  ALARM_BUSTED,
  GHOST_ALARM_LIMIT,
  GHOST_BONUS,
  BEST_KEY,
} from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { parseLevel, levelCount } from './levels.js';
import { createGuard, updateGuard, guardTouchesThief } from './guards.js';
import { createCamera, updateCamera } from './cameras.js';
import { createThief, updateThief, lureGuards, atExit } from './thief.js';
import { renderWorld } from './render.js';
import { drawHud, drawTitle, drawIntro, drawPause, drawCaught, drawVictory } from './hud.js';
import { shotFromUrl, applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const audio = createAudio();

function loadBest() {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}
function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Best score is a nicety; never break the game.
  }
}

// Full run state. loadLevel() rebuilds the per-level pieces.
const state = {
  screen: 'title', // title | intro | playing | paused | caught | victory
  levelIndex: 0,
  level: null,
  thief: null,
  guards: [],
  cameras: [],
  alarm: 0,
  maxAlarm: 0,
  time: 0,
  score: 0,
  totalLoot: 0,
  timeBonus: 0,
  ghost: true,
  ghostBonus: 0,
  best: loadBest(),
  caughtReason: '',
  hintTimer: 0,
  objective: '',
  shake: 0,
  shotMode: shotFromUrl(),
};

function loadLevel(index) {
  const level = parseLevel(index);
  state.levelIndex = index;
  state.level = level;
  state.thief = createThief(level.thiefStart);
  state.thief.tools = { ...level.tools };
  state.guards = level.guards.map(createGuard);
  state.cameras = level.cameras.map(createCamera);
  state.alarm = 0;
  state.time = 0;
  state.hintTimer = 9;
  state.objective = 'Grab the Starlight Diamond, then reach the green EXIT door.';
  state.shake = 0;
}

function startRun() {
  state.score = 0;
  state.totalLoot = 0;
  state.timeBonus = 0;
  state.ghost = true;
  state.ghostBonus = 0;
  loadLevel(0);
  state.screen = 'intro';
}

function levelComplete() {
  const timeBonus = Math.max(0, Math.round((state.level.parTime - state.time) * 10));
  state.timeBonus += timeBonus;
  state.totalLoot += state.thief.lootValue;
  audio.win();
  if (state.levelIndex + 1 >= levelCount()) {
    // Final getaway.
    state.ghostBonus = state.ghost ? GHOST_BONUS : 0;
    state.score = state.totalLoot + state.timeBonus + state.ghostBonus;
    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }
    state.screen = 'victory';
  } else {
    loadLevel(state.levelIndex + 1);
    state.screen = 'intro';
  }
}

function bust(reason) {
  state.caughtReason = reason;
  state.screen = 'caught';
  state.shake = 10;
  audio.busted();
}

function updatePlaying(dt) {
  const s = state;
  s.time += dt;
  s.hintTimer = Math.max(0, s.hintTimer - dt);

  updateThief(s.thief, dt, input, s.level, audio, (event) => {
    if (event === 'diamond') s.objective = 'Diamond secured — get to the green EXIT door!';
  });
  lureGuards(s.thief, s.guards);

  let spotted = false;
  let suspicious = false;
  for (const g of s.guards) {
    const res = updateGuard(g, dt, s.level, s.thief, s.thief.smokes, audio);
    if (res.spotted) spotted = true;
    else if (res.suspicious) suspicious = true;
    if (guardTouchesThief(g, s.thief)) {
      bust('A guard grabbed Wren in the gallery.');
      return;
    }
  }
  for (const cam of s.cameras) {
    const res = updateCamera(cam, dt, s.time, s.level, s.thief, s.thief.smokes);
    if (res.active && res.see > 0.6) spotted = true;
    else if (res.active && res.see > 0) suspicious = true;
  }

  const prevAlarm = s.alarm;
  if (spotted) s.alarm += ALARM_SPOTTED_RATE * dt;
  else if (suspicious) s.alarm += ALARM_SUSPICIOUS_RATE * dt;
  else s.alarm -= ALARM_DECAY_RATE * dt;
  s.alarm = Math.max(0, Math.min(ALARM_BUSTED, s.alarm));
  s.maxAlarm = Math.max(s.maxAlarm, s.alarm);
  if (s.alarm > GHOST_ALARM_LIMIT) s.ghost = false;
  // Screen shake kicks in as the alarm spikes.
  if (s.alarm > 70 && s.alarm > prevAlarm) s.shake = Math.max(s.shake, (s.alarm - 70) / 8);
  s.shake = Math.max(0, s.shake - dt * 14);
  audio.sirenTick(dt, s.alarm);

  if (s.alarm >= ALARM_BUSTED) {
    bust('The alarm hit 100 — the gallery is swarming with guards.');
    return;
  }
  if (atExit(s.thief, s.level)) levelComplete();
}

function update(dt) {
  if (input.wasPressed('KeyM')) audio.toggleMute();
  if (input.wasPressed('KeyR')) {
    if (state.screen === 'victory') startRun();
    else if (state.screen !== 'title') {
      loadLevel(state.levelIndex);
      state.screen = 'playing';
    }
  }

  if (state.screen === 'title') {
    if (input.wasPressed('Enter') || input.mouse.clicked) {
      audio.unlock();
      startRun();
    }
  } else if (state.screen === 'intro') {
    if (input.wasPressed('Enter') || input.mouse.clicked) {
      audio.unlock();
      state.screen = 'playing';
    }
  } else if (state.screen === 'playing') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
      state.screen = 'paused';
    } else {
      updatePlaying(dt);
    }
  } else if (state.screen === 'paused') {
    if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.mouse.clicked) {
      state.screen = 'playing';
    }
  } else if (state.screen === 'caught') {
    // R retries (handled above).
  } else if (state.screen === 'victory') {
    // R runs it again (handled above).
  }
  input.endFrame();
}

function renderFrame() {
  const s = state;
  ctx.save();
  if (s.shake > 0.2) {
    ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake);
  }
  const world = {
    level: s.level,
    thief: s.thief,
    guards: s.guards,
    cameras: s.cameras,
    alarm: s.alarm,
    time: s.shotMode ? 12.5 : s.time,
  };
  renderWorld(ctx, world);
  ctx.restore();

  // HUD is always visible, even on overlays.
  drawHud(ctx, {
    level: s.level,
    levelIndex: s.levelIndex,
    thief: s.thief,
    alarm: s.alarm,
    time: s.time,
    score: s.totalLoot + s.timeBonus + (s.screen === 'victory' ? s.ghostBonus : s.thief.lootValue),
    best: s.best,
    hintTimer: s.hintTimer,
    objective: s.objective,
  });

  if (s.screen === 'title') drawTitle(ctx, s.best);
  else if (s.screen === 'intro') drawIntro(ctx, s.level, s.levelIndex);
  else if (s.screen === 'paused') drawPause(ctx);
  else if (s.screen === 'caught') drawCaught(ctx, s);
  else if (s.screen === 'victory') drawVictory(ctx, s);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  renderFrame();
  requestAnimationFrame(loop);
}

// Boot.
loadLevel(0);
if (state.shotMode) {
  // Deterministic screenshot: stage the scene, paint one frozen frame.
  // No audio, no loop, no input — the frame is identical every run.
  applyShot(state, state.shotMode);
  renderFrame();
  document.title = `The Velvet Vault — shot ${state.shotMode}`;
} else {
  requestAnimationFrame(loop);
}
