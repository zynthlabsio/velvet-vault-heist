// The Velvet Vault — guard patrol, vision cones and detection.
// A guard walks waypoint routes, watches a cone, and goes through three
// states: patrol -> suspicious ("?") -> spotted ("!", chase). Line of sight
// is sampled along the ray and blocked by walls, cases and statues.
import {
  GUARD_RANGE,
  GUARD_HALF_FOV,
  SPOT_THRESHOLD,
  SUSPICIOUS_THRESHOLD,
} from './config.js';
import { isBlockingSight, isBlockingMove, terrainAt } from './levels.js';

export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isBlockingSight(terrainAt(level, x0 + dx * t, y0 + dy * t))) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// How strongly can this watcher see the thief right now? 0 = not at all,
// 1 = fully exposed at close range. Vent tiles and smoke hide completely.
export function visionStrength(level, wx, wy, facing, range, halfFov, tx, ty, opts) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return 0;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfFov) return 0;
  if (!hasLineOfSight(level, wx, wy, tx, ty)) return 0;
  const tile = terrainAt(level, tx, ty);
  if (tile === 3) return 0; // vent: hidden
  if (opts && opts.smoke && opts.smoke.some((s) => Math.hypot(tx - s.x, ty - s.y) < s.r)) return 0;
  let strength = 1 - (dist / range) * 0.65; // 0.35 at max range, 1.0 point blank
  if (tile === 2) strength *= 0.5; // shadow cover
  if (opts && opts.sneaking) strength *= 0.55;
  if (opts && opts.running) strength *= 1.5;
  return Math.min(1.4, Math.max(0, strength));
}

export function createGuard(spec) {
  return {
    x: spec.x,
    y: spec.y,
    waypoints: spec.waypoints,
    wpIndex: 0,
    wait: 0,
    speed: spec.speed,
    facing: 0,
    suspicion: 0,
    state: 'patrol', // patrol | suspicious | spotted | investigate
    lastSeen: null,
    loseTimer: 0,
    investigateTarget: null,
    investigateTimer: 0,
    stepTimer: 0,
  };
}

function moveToward(g, tx, ty, speed, dt, level) {
  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return true;
  const step = Math.min(dist, speed * dt);
  const nx = g.x + (dx / dist) * step;
  const ny = g.y + (dy / dist) * step;
  // Axis-separated collision so guards slide along obstacles.
  if (!blocksMove(level, nx, g.y)) g.x = nx;
  if (!blocksMove(level, g.x, ny)) g.y = ny;
  g.facing = Math.atan2(dy, dx);
  return dist <= step + 0.5;
}

function blocksMove(level, px, py) {
  // Circle radius 12 against blocking tiles.
  const r = 12;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, -r], [0, r], [-r, 0], [r, 0]]) {
    if (isBlockingMove(terrainAt(level, px + ox, py + oy))) return true;
  }
  return false;
}

export function updateGuard(g, dt, level, thief, smoke, audio) {
  const see = visionStrength(level, g.x, g.y, g.facing, GUARD_RANGE, GUARD_HALF_FOV, thief.x, thief.y, {
    smoke,
    sneaking: thief.sneaking,
    running: thief.moving && !thief.sneaking,
  });

  if (see > 0) {
    // Detection rises faster up close; sneaking and shadow slow it.
    g.suspicion = Math.min(SPOT_THRESHOLD + 20, g.suspicion + see * 62 * dt);
    g.lastSeen = { x: thief.x, y: thief.y };
    g.loseTimer = 0;
  } else {
    g.loseTimer += dt;
    if (g.loseTimer > 1.2) g.suspicion = Math.max(0, g.suspicion - 26 * dt);
  }

  const prevState = g.state;
  if (g.suspicion >= SPOT_THRESHOLD) g.state = 'spotted';
  else if (g.suspicion >= SUSPICIOUS_THRESHOLD) g.state = 'suspicious';
  else if (g.state !== 'investigate') g.state = 'patrol';
  if (g.state === 'spotted' && prevState !== 'spotted' && audio) audio.alert();

  if (g.state === 'spotted') {
    // Chase the thief's last seen position; re-acquire while visible.
    const target = see > 0 ? thief : g.lastSeen;
    if (target) {
      const arrived = moveToward(g, target.x, target.y, g.speed * 1.7, dt, level);
      if (arrived && see <= 0) {
        g.state = 'investigate';
        g.investigateTimer = 2.5;
      }
    }
  } else if (g.state === 'investigate') {
    g.investigateTimer -= dt;
    if (g.investigateTarget) {
      const arrived = moveToward(g, g.investigateTarget.x, g.investigateTarget.y, g.speed * 1.25, dt, level);
      if (arrived) g.investigateTarget = null;
    }
    if (g.investigateTimer <= 0) {
      g.state = 'patrol';
      g.suspicion = Math.max(0, g.suspicion - 20);
    }
  } else {
    // Patrol: walk the waypoint loop, pausing briefly at each stop.
    if (g.wait > 0) {
      g.wait -= dt;
    } else {
      const wp = g.waypoints[g.wpIndex];
      const arrived = moveToward(g, wp.x, wp.y, g.speed, dt, level);
      if (arrived) {
        g.wpIndex = (g.wpIndex + 1) % g.waypoints.length;
        g.wait = 0.7;
      }
    }
  }

  // Footstep blips while moving (soft; only when close to the thief).
  g.stepTimer -= dt;
  const moving = g.state !== 'patrol' || g.wait <= 0;
  if (moving && g.stepTimer <= 0 && Math.hypot(g.x - thief.x, g.y - thief.y) < 320) {
    g.stepTimer = 0.42;
    if (audio) audio.footstep(false);
  }

  return { see, spotted: g.state === 'spotted', suspicious: g.state === 'suspicious' };
}

export function guardTouchesThief(g, thief) {
  return Math.hypot(g.x - thief.x, g.y - thief.y) < 26;
}
