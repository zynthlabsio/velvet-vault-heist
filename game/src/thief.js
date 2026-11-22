// The Velvet Vault — the thief: movement, sneaking, tools and loot.
// Movement collides circle-vs-tiles; the diamond needs E next to its
// pedestal, side loot is pocketed on touch, and the exit only opens
// once the diamond is in hand.
import {
  TILE,
  WALK_SPEED,
  SNEAK_SPEED,
  VENT_SPEED,
  SMOKE_DURATION,
  SMOKE_RADIUS,
  EMP_DURATION,
  COIN_LURE_RADIUS,
  COIN_LURE_TIME,
  TOOL_DEFS,
  HUD_H,
} from './config.js';
import { isBlockingMove, terrainAt, T_VENT, T_SHADOW } from './levels.js';

export function createThief(start) {
  return {
    x: start.x,
    y: start.y,
    r: 13,
    facing: 0,
    moving: false,
    sneaking: false,
    inVent: false,
    inShadow: false,
    stepTimer: 0,
    selectedTool: 0, // index into TOOL_DEFS
    tools: { coin: 0, smoke: 0, emp: 0 },
    coins: [], // thrown coins still rolling / lying
    smokes: [], // {x, y, r, timer}
    empTimer: 0,
    hasDiamond: false,
    lootValue: 0,
    lootCount: 0,
  };
}

export function thiefTile(thief, level) {
  return terrainAt(level, thief.x, thief.y);
}

export function updateThief(thief, dt, input, level, audio, onEvent) {
  const vec = input.moveVector();
  const sneak = input.down('ShiftLeft') || input.down('ShiftRight');
  const tile = thiefTile(thief, level);
  thief.inVent = tile === T_VENT;
  thief.inShadow = tile === T_SHADOW;
  const speed = thief.inVent ? VENT_SPEED : sneak ? SNEAK_SPEED : WALK_SPEED;
  thief.sneaking = sneak;
  thief.moving = vec.x !== 0 || vec.y !== 0;

  if (thief.moving) {
    thief.facing = Math.atan2(vec.y, vec.x);
    const nx = thief.x + vec.x * speed * dt;
    const ny = thief.y + vec.y * speed * dt;
    if (!circleBlocked(level, nx, thief.y, thief.r)) thief.x = nx;
    if (!circleBlocked(level, thief.x, ny, thief.r)) thief.y = ny;
    thief.stepTimer -= dt;
    if (thief.stepTimer <= 0) {
      thief.stepTimer = sneak ? 0.55 : 0.34;
      if (audio) audio.footstep(sneak);
    }
  }

  // Tool selection.
  for (let i = 0; i < TOOL_DEFS.length; i++) {
    if (input.wasPressed(`Digit${i + 1}`)) thief.selectedTool = i;
  }

  // Use the selected tool: Space or a mouse click.
  if (input.wasPressed('Space') || input.mouse.clicked) {
    useTool(thief, input, level, audio, onEvent);
  }

  // Diamond pickup needs E beside the pedestal.
  if (input.wasPressed('KeyE')) {
    const diamond = level.loot.find((l) => l.kind === 'diamond' && !l.taken);
    if (diamond && Math.hypot(thief.x - diamond.x, thief.y - diamond.y) < 52) {
      diamond.taken = true;
      thief.hasDiamond = true;
      thief.lootValue += diamond.value;
      thief.lootCount += 1;
      if (audio) audio.diamond();
      if (onEvent) onEvent('diamond');
    }
  }

  // Side loot is pocketed on touch.
  for (const loot of level.loot) {
    if (!loot.taken && loot.kind !== 'diamond' && Math.hypot(thief.x - loot.x, thief.y - loot.y) < 30) {
      loot.taken = true;
      thief.lootValue += loot.value;
      thief.lootCount += 1;
      if (audio) audio.pickup();
      if (onEvent) onEvent('loot', loot);
    }
  }

  // Coin flight: a thrown coin rolls to its target, then lies there
  // luring guards for a few seconds.
  for (const coin of thief.coins) {
    if (!coin.landed) {
      const dx = coin.tx - coin.x;
      const dy = coin.ty - coin.y;
      const d = Math.hypot(dx, dy);
      const step = 420 * dt;
      if (d <= step) {
        coin.x = coin.tx;
        coin.y = coin.ty;
        coin.landed = true;
        coin.timer = COIN_LURE_TIME;
      } else {
        coin.x += (dx / d) * step;
        coin.y += (dy / d) * step;
      }
    } else {
      coin.timer -= dt;
    }
  }
  thief.coins = thief.coins.filter((c) => !c.landed || c.timer > 0);

  for (const s of thief.smokes) s.timer -= dt;
  thief.smokes = thief.smokes.filter((s) => s.timer > 0);
  if (thief.empTimer > 0) thief.empTimer -= dt;
}

function circleBlocked(level, px, py, r) {
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) {
    if (isBlockingMove(terrainAt(level, px + ox, py + oy))) return true;
  }
  return false;
}

function useTool(thief, input, level, audio, onEvent) {
  const def = TOOL_DEFS[thief.selectedTool];
  if (thief.tools[def.id] <= 0) return;
  thief.tools[def.id] -= 1;

  if (def.id === 'coin') {
    // Aim at the mouse (in playfield coordinates) or straight ahead.
    const mx = input.mouse.x;
    const my = input.mouse.y - HUD_H;
    const dist = Math.hypot(mx - thief.x, my - thief.y);
    const range = Math.min(dist, 260);
    const ang = dist > 4 ? Math.atan2(my - thief.y, mx - thief.x) : thief.facing;
    const tx = thief.x + Math.cos(ang) * range;
    const ty = thief.y + Math.sin(ang) * range;
    thief.coins.push({ x: thief.x, y: thief.y, tx, ty, landed: false, timer: 0 });
    if (audio) audio.coin();
    if (onEvent) onEvent('coin', { x: tx, y: ty });
  } else if (def.id === 'smoke') {
    thief.smokes.push({ x: thief.x, y: thief.y, r: SMOKE_RADIUS, timer: SMOKE_DURATION });
    if (audio) audio.smoke();
    if (onEvent) onEvent('smoke');
  } else if (def.id === 'emp') {
    thief.empTimer = EMP_DURATION;
    if (audio) audio.emp();
    if (onEvent) onEvent('emp');
  }
}

// A landed coin lures every guard in earshot to its spot.
export function lureGuards(thief, guards) {
  for (const coin of thief.coins) {
    if (!coin.landed) continue;
    for (const g of guards) {
      if (g.state === 'spotted') continue;
      if (Math.hypot(g.x - coin.x, g.y - coin.y) < COIN_LURE_RADIUS) {
        g.state = 'investigate';
        g.investigateTarget = { x: coin.x, y: coin.y };
        g.investigateTimer = COIN_LURE_TIME;
        g.suspicion = Math.max(0, g.suspicion - 30);
      }
    }
  }
}

export function atExit(thief, level) {
  return thief.hasDiamond && Math.hypot(thief.x - level.exit.x, thief.y - level.exit.y) < 34;
}
