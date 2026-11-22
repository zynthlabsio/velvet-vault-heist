// The Velvet Vault — all canvas drawing for the playfield.
// Dark gallery, marble floor, gold-framed paintings, display cases and
// statues as cover, velvet ropes, pools of spotlight. The thief is dark
// teal, guards navy, loot gold: safe cover, danger and loot are obvious
// at a glance. Vision cones are drawn under the entities.
import { TILE, HUD_H, PLAY_W, PLAY_H, GUARD_RANGE, GUARD_HALF_FOV, CAMERA_RANGE, CAMERA_HALF_FOV } from './config.js';
import { isBlockingSight, terrainAt, T_WALL, T_SHADOW, T_VENT, T_CASE, T_STATUE, T_ROPE } from './levels.js';
import { makeRng } from './random.js';

// Raycast one cone edge: walk out until a sight-blocking tile or range.
function coneFan(ctx, level, ox, oy, facing, halfFov, range, fill) {
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  for (let i = 0; i <= steps; i++) {
    const a = facing - halfFov + (2 * halfFov * i) / steps;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let d = range;
    for (let r = 12; r < range; r += 8) {
      if (isBlockingSight(terrainAt(level, ox + dx * r, oy + dy * r))) {
        d = r;
        break;
      }
    }
    ctx.lineTo(ox + dx * d, oy + dy * d);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx, level, time) {
  const rng = makeRng(level.seed);
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const t = level.terrain[y][x];
      const px = x * TILE;
      const py = y * TILE + HUD_H;
      if (t === T_WALL) {
        ctx.fillStyle = '#241d2e';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#3a2f47';
        ctx.fillRect(px, py, TILE, 4);
        continue;
      }
      // Marble checker.
      const light = (x + y) % 2 === 0;
      if (t === T_SHADOW) ctx.fillStyle = light ? '#1a2233' : '#161d2b';
      else if (t === T_VENT) ctx.fillStyle = light ? '#232830' : '#1f242c';
      else ctx.fillStyle = light ? '#2e2a3d' : '#2a2636';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.strokeRect(px + 0.5, py + 0.5, TILE, TILE);
      if (t === T_VENT) {
        // Grate slats.
        ctx.strokeStyle = 'rgba(180,190,210,0.35)';
        ctx.beginPath();
        for (let i = 1; i < 4; i++) {
          ctx.moveTo(px + 6, py + i * 10);
          ctx.lineTo(px + TILE - 6, py + i * 10);
        }
        ctx.stroke();
      }
    }
  }
  // Spotlight pools on the floor (fixed per level seed).
  for (let i = 0; i < 5; i++) {
    const sx = rng.range(120, PLAY_W - 120);
    const sy = rng.range(120, PLAY_H - 120) + HUD_H;
    const grad = ctx.createRadialGradient(sx, sy, 10, sx, sy, 130);
    grad.addColorStop(0, 'rgba(255, 226, 150, 0.10)');
    grad.addColorStop(1, 'rgba(255, 226, 150, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 130, 90, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Gold-framed paintings along the top and bottom walls.
  const frames = ['#c0392b', '#2e6f5e', '#7d5ba6', '#b8860b', '#31597f'];
  for (let x = 2; x < level.cols - 2; x += 4) {
    const c = frames[(x / 4) % frames.length | 0];
    paintOnWall(ctx, x * TILE + 8, HUD_H + 4, c);
    paintOnWall(ctx, x * TILE + 8, HUD_H + PLAY_H - 36, c);
  }
}

function paintOnWall(ctx, x, y, color) {
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(x, y, 26, 32);
  ctx.fillStyle = color;
  ctx.fillRect(x + 3, y + 3, 20, 26);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(x + 5, y + 5, 7, 9);
}

function drawObstacles(ctx, level) {
  for (let y = 0; y < level.rows; y++) {
    for (let x = 0; x < level.cols; x++) {
      const t = level.terrain[y][x];
      const px = x * TILE;
      const py = y * TILE + HUD_H;
      if (t === T_CASE) {
        ctx.fillStyle = '#4a4238';
        ctx.fillRect(px + 4, py + 6, TILE - 8, TILE - 12);
        ctx.fillStyle = 'rgba(150, 200, 230, 0.28)';
        ctx.fillRect(px + 6, py + 8, TILE - 12, TILE - 16);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 4, py + 6, TILE - 8, TILE - 12);
        ctx.lineWidth = 1;
        // Tiny treasure glint inside the case.
        ctx.fillStyle = '#ffd76a';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === T_STATUE) {
        ctx.fillStyle = '#5a5348';
        ctx.fillRect(px + 8, py + TILE - 12, TILE - 16, 10);
        ctx.fillStyle = '#8d8578';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2 - 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a89e8c';
        ctx.fillRect(px + TILE / 2 - 5, py + 6, 10, 12);
      } else if (t === T_ROPE) {
        ctx.strokeStyle = '#8e1f2f';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px, py + TILE / 2);
        ctx.quadraticCurveTo(px + TILE / 2, py + TILE / 2 + 8, px + TILE, py + TILE / 2);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.arc(px + 3, py + TILE / 2 - 6, 3, 0, Math.PI * 2);
        ctx.arc(px + TILE - 3, py + TILE / 2 - 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawLoot(ctx, level, time) {
  for (const loot of level.loot) {
    if (loot.taken) continue;
    const x = loot.x;
    const y = loot.y + HUD_H;
    const pulse = 1 + Math.sin(time * 3 + loot.x) * 0.12;
    if (loot.kind === 'diamond') {
      // Pedestal.
      ctx.fillStyle = '#6b6455';
      ctx.fillRect(x - 16, y + 8, 32, 14);
      ctx.fillStyle = '#8d8578';
      ctx.fillRect(x - 13, y + 5, 26, 5);
      // Sparkling starlight diamond.
      const glow = ctx.createRadialGradient(x, y - 6, 2, x, y - 6, 34 * pulse);
      glow.addColorStop(0, 'rgba(120, 220, 255, 0.55)');
      glow.addColorStop(1, 'rgba(120, 220, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y - 6, 34 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.translate(x, y - 6);
      ctx.rotate(Math.PI / 4);
      ctx.scale(1, 0.8);
      ctx.fillStyle = '#aee9ff';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.fillStyle = '#e8fbff';
      ctx.fillRect(-11, -11, 22, 8);
      ctx.restore();
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 16, y - 20);
      ctx.lineTo(x - 8, y - 12);
      ctx.moveTo(x + 18, y - 2);
      ctx.lineTo(x + 10, y - 10);
      ctx.stroke();
    } else if (loot.kind === 'painting') {
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(x - 14, y - 18, 28, 34);
      ctx.fillStyle = '#7d2e2e';
      ctx.fillRect(x - 11, y - 15, 22, 28);
      ctx.fillStyle = '#ffd76a';
      ctx.beginPath();
      ctx.arc(x, y - 2, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gem case.
      ctx.fillStyle = '#4a4238';
      ctx.fillRect(x - 13, y - 9, 26, 18);
      ctx.fillStyle = '#ff5d8f';
      ctx.beginPath();
      ctx.arc(x - 4, y - 2, 5, 0, Math.PI * 2);
      ctx.arc(x + 5, y + 2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawExit(ctx, level, thief) {
  const x = level.exit.x;
  const y = level.exit.y + HUD_H;
  const open = thief.hasDiamond;
  ctx.save();
  if (open) {
    const glow = ctx.createRadialGradient(x, y, 4, x, y, 46);
    glow.addColorStop(0, 'rgba(80, 255, 140, 0.5)');
    glow.addColorStop(1, 'rgba(80, 255, 140, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = open ? '#2ecc71' : '#3d5a44';
  ctx.fillRect(x - 16, y - 18, 32, 36);
  ctx.fillStyle = '#12351f';
  ctx.fillRect(x - 12, y - 14, 24, 28);
  ctx.fillStyle = open ? '#a9ffcb' : '#7fae8d';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', x, y + 30);
  ctx.restore();
}

function drawCones(ctx, level, guards, cameras, thief) {
  for (const g of guards) {
    const alerted = g.state === 'spotted';
    const suspicious = g.state === 'suspicious' || g.state === 'investigate';
    const fill = alerted
      ? 'rgba(255, 60, 60, 0.28)'
      : suspicious
        ? 'rgba(255, 160, 60, 0.20)'
        : 'rgba(255, 235, 150, 0.13)';
    coneFan(ctx, level, g.x, g.y + HUD_H, g.facing, GUARD_HALF_FOV, GUARD_RANGE, fill);
  }
  for (const cam of cameras) {
    if (cam.disabledTimer > 0) continue;
    coneFan(ctx, level, cam.x, cam.y + HUD_H, cam.angle, CAMERA_HALF_FOV, CAMERA_RANGE, 'rgba(255, 70, 70, 0.16)');
  }
}

function drawGuards(ctx, guards, time) {
  for (const g of guards) {
    const x = g.x;
    const y = g.y + HUD_H;
    // Body: navy uniform with a cap brim facing the look direction.
    ctx.fillStyle = '#1f2d5a';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0d1530';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#16224a';
    ctx.beginPath();
    ctx.arc(x + Math.cos(g.facing) * 6, y + Math.sin(g.facing) * 6, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(x + Math.cos(g.facing) * 11, y + Math.sin(g.facing) * 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // "?" while suspicious, "!" when spotted.
    if (g.state === 'suspicious' || g.state === 'investigate') {
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffcf4d';
      ctx.fillText('?', x, y - 20 + Math.sin(time * 4) * 2);
    } else if (g.state === 'spotted') {
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff3b30';
      ctx.fillText('!', x, y - 22);
    }
  }
}

function drawCameras(ctx, cameras) {
  for (const cam of cameras) {
    const x = cam.x;
    const y = cam.y + HUD_H;
    const disabled = cam.disabledTimer > 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(cam.angle);
    ctx.fillStyle = disabled ? '#555' : '#222';
    ctx.fillRect(-4, -6, 14, 12);
    ctx.fillStyle = disabled ? '#888' : '#ff2d2d';
    ctx.beginPath();
    ctx.arc(11, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (disabled) {
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#9fd8ff';
      ctx.fillText('EMP', x, y - 14);
    }
  }
}

function drawThief(ctx, thief, time) {
  const x = thief.x;
  const y = thief.y + HUD_H;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Dark teal hooded figure.
  ctx.fillStyle = thief.inVent ? '#0f5a52' : '#0e7c74';
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#083f3a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point + eyes in the facing direction.
  const fx = Math.cos(thief.facing);
  const fy = Math.sin(thief.facing);
  ctx.fillStyle = '#0a4f49';
  ctx.beginPath();
  ctx.moveTo(x + fx * 13, y + fy * 13);
  ctx.lineTo(x - fy * 7, y + fx * 7);
  ctx.lineTo(x + fy * 7, y - fx * 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath();
  ctx.arc(x + fx * 5 - fy * 4, y + fy * 5 + fx * 4, 1.8, 0, Math.PI * 2);
  ctx.arc(x + fx * 5 + fy * 4, y + fy * 5 - fx * 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (thief.sneaking) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9fd8c9';
    ctx.fillText('sneaking', x, y - 18);
  }
}

function drawToolsFx(ctx, thief, time) {
  for (const s of thief.smokes) {
    const alpha = Math.min(0.75, s.timer * 0.4);
    ctx.fillStyle = `rgba(200, 205, 215, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y + HUD_H, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 225, 235, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x - 22, s.y + HUD_H - 10, s.r * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 20, s.y + HUD_H + 12, s.r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of thief.coins) {
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(c.x, c.y + HUD_H, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b8860b';
    ctx.stroke();
    if (c.landed) {
      ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
      ctx.beginPath();
      ctx.arc(c.x, c.y + HUD_H, 10 + Math.sin(time * 6) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawVignette(ctx, alarm, time) {
  const base = 0.25 + (alarm / 100) * 0.45;
  const grad = ctx.createRadialGradient(640, 440, 260, 640, 440, 720);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, `rgba(0,0,0,${base.toFixed(2)})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, HUD_H, 1280, 720);
  if (alarm > 55) {
    const pulse = 0.1 + 0.08 * Math.sin(time * 6) + ((alarm - 55) / 45) * 0.12;
    const red = ctx.createRadialGradient(640, 440, 200, 640, 440, 700);
    red.addColorStop(0, 'rgba(255,0,0,0)');
    red.addColorStop(1, `rgba(255, 30, 30, ${pulse.toFixed(2)})`);
    ctx.fillStyle = red;
    ctx.fillRect(0, HUD_H, 1280, 720);
  }
}

// Full playfield render. `world` carries level, thief, guards, cameras,
// alarm, time and the shake offset chosen by main.js.
export function renderWorld(ctx, world) {
  const { level, thief, guards, cameras, alarm, time } = world;
  ctx.save();
  ctx.clearRect(0, 0, 1280, 800);
  // Playfield background.
  ctx.fillStyle = '#12101a';
  ctx.fillRect(0, HUD_H, 1280, 720);
  drawFloor(ctx, level, time);
  drawCones(ctx, level, guards, cameras, thief);
  drawObstacles(ctx, level);
  drawExit(ctx, level, thief);
  drawLoot(ctx, level, time);
  drawToolsFx(ctx, thief, time);
  drawCameras(ctx, cameras);
  drawGuards(ctx, guards, time);
  drawThief(ctx, thief, time);
  drawVignette(ctx, alarm, time);
  ctx.restore();
}
