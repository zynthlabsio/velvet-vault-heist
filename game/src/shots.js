// The Velvet Vault — deterministic screenshot modes.
// `?shot=cover|tools|caught|escape` stages a fixed scene from level 1
// (or the victory screen) with fixed positions, alarm and timer, so the
// screenshots are reproducible renders of the game's own code. main.js
// freezes time in shot mode, so every run paints the same frame.
import { TILE, GHOST_BONUS } from './config.js';

export const SHOT_MODES = ['cover', 'tools', 'caught', 'escape'];

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  return SHOT_MODES.includes(shot) ? shot : null;
}

// Stage the state for a screenshot. The state object is the one main.js
// builds for a fresh level-1 run; this only moves pieces into place.
export function applyShot(state, mode) {
  const { level, thief, guards, cameras } = state;
  const diamond = level.loot.find((l) => l.kind === 'diamond');
  const painting = level.loot.find((l) => l.kind === 'painting');

  if (mode === 'cover') {
    // Thief crossing the open floor mid-room; guard cones, a camera cone,
    // the diamond and an alarm around 35, all in one frame.
    state.screen = 'playing';
    state.time = 42;
    state.alarm = 35;
    state.maxAlarm = 35;
    thief.x = 16 * TILE + TILE / 2;
    thief.y = 9 * TILE + TILE / 2;
    thief.facing = Math.PI / 2;
    thief.sneaking = true;
    if (painting) {
      painting.taken = true;
      thief.lootValue = painting.value;
      thief.lootCount = 1;
    }
    const g1 = guards[0];
    g1.x = 18 * TILE + TILE / 2;
    g1.y = 5 * TILE + TILE / 2;
    g1.facing = Math.atan2(thief.y - g1.y, thief.x - g1.x);
    g1.suspicion = 62;
    g1.state = 'suspicious';
    const g2 = guards[1];
    g2.x = 23 * TILE + TILE / 2;
    g2.y = 10 * TILE + TILE / 2;
    g2.facing = Math.atan2(diamond.y - g2.y, diamond.x - g2.x);
    g2.suspicion = 10;
    g2.state = 'patrol';
    const cam = cameras[0];
    cam.angle = Math.atan2(thief.y - cam.y, thief.x - cam.x);
    cam.phase = 0;
    state.hintTimer = 0;
    state.objective = 'Grab the Starlight Diamond, then reach the exit.';
  } else if (mode === 'tools') {
    // Smoke puff around the thief, EMP knocking the cameras out, and a
    // guard lured away by a tossed coin.
    state.screen = 'playing';
    state.time = 75;
    state.alarm = 18;
    state.maxAlarm = 18;
    thief.x = 14 * TILE + TILE / 2;
    thief.y = 10 * TILE + TILE / 2;
    thief.facing = -Math.PI / 2;
    thief.sneaking = true;
    thief.empTimer = 7;
    thief.smokes = [{ x: thief.x, y: thief.y, r: 95, timer: 5 }];
    thief.coins = [{ x: 22 * TILE + TILE / 2, y: 6 * TILE + TILE / 2, tx: 22 * TILE + TILE / 2, ty: 6 * TILE + TILE / 2, landed: true, timer: 5 }];
    thief.tools = { coin: 2, smoke: 1, emp: 0 };
    thief.selectedTool = 1;
    const g1 = guards[0];
    g1.x = 20 * TILE + TILE / 2;
    g1.y = 7 * TILE + TILE / 2;
    g1.state = 'investigate';
    g1.investigateTarget = { x: 22 * TILE + TILE / 2, y: 6 * TILE + TILE / 2 };
    g1.facing = Math.atan2(6 * TILE - g1.y, 22 * TILE - g1.x);
    g1.suspicion = 30;
    const g2 = guards[1];
    g2.x = 24 * TILE + TILE / 2;
    g2.y = 12 * TILE + TILE / 2;
    g2.facing = Math.PI;
    g2.suspicion = 0;
    g2.state = 'patrol';
    cameras[0].disabledTimer = 7;
    state.hintTimer = 0;
  } else if (mode === 'caught') {
    // Alarm 100, a guard on top of the thief with "!", busted moment.
    state.screen = 'caught';
    state.time = 96;
    state.alarm = 100;
    state.maxAlarm = 100;
    state.caughtReason = 'Spotted at point-blank range — the alarm hit 100.';
    thief.x = 20 * TILE + TILE / 2;
    thief.y = 9 * TILE + TILE / 2;
    thief.facing = 0;
    const g1 = guards[0];
    g1.x = thief.x + 24;
    g1.y = thief.y - 4;
    g1.facing = Math.atan2(thief.y - g1.y, thief.x - g1.x);
    g1.suspicion = 120;
    g1.state = 'spotted';
    const g2 = guards[1];
    g2.x = 25 * TILE + TILE / 2;
    g2.y = 11 * TILE + TILE / 2;
    g2.facing = Math.atan2(thief.y - g2.y, thief.x - g2.x);
    g2.suspicion = 100;
    g2.state = 'spotted';
    cameras[0].angle = Math.atan2(thief.y - cameras[0].y, thief.x - cameras[0].x);
    state.hintTimer = 0;
  } else if (mode === 'escape') {
    // Getaway / victory screen with a full score breakdown.
    state.screen = 'victory';
    state.time = 132;
    state.alarm = 12;
    state.maxAlarm = 12;
    state.totalLoot = 1550;
    state.timeBonus = 320;
    state.ghost = true;
    state.ghostBonus = GHOST_BONUS;
    state.score = 1550 + 320 + GHOST_BONUS;
    state.best = state.score;
    thief.hasDiamond = true;
    thief.lootValue = 1550;
    state.hintTimer = 0;
  }
}
