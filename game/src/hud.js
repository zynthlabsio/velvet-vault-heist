// The Velvet Vault — HUD bar and full-screen overlays, all drawn on the
// same canvas: alarm meter, loot, tool stock, level, objective, timer,
// score, plus title / intro / pause / caught / victory screens.
import { HUD_H, TOOL_DEFS, GHOST_ALARM_LIMIT } from './config.js';

function alarmColor(alarm) {
  if (alarm < 25) return '#2ecc71';
  if (alarm < 55) return '#f1c40f';
  if (alarm < 80) return '#e67e22';
  return '#e74c3c';
}

export function drawHud(ctx, s) {
  const { level, thief, alarm, time, score, best } = s;
  ctx.save();
  // Bar.
  ctx.fillStyle = '#0c0a14';
  ctx.fillRect(0, 0, 1280, HUD_H);
  ctx.fillStyle = '#d4af37';
  ctx.fillRect(0, HUD_H - 3, 1280, 3);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 17px Georgia, serif';
  ctx.fillText('THE VELVET VAULT', 16, 26);
  ctx.fillStyle = '#9a8f7a';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Level ${s.levelIndex + 1}/3 — ${level.name}${best > 0 ? ` · Best ${best}` : ''}`, 16, 46);

  // Alarm meter.
  const ax = 300;
  const ay = 16;
  const aw = 260;
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', ax, ay + 12);
  ctx.fillStyle = '#1c1826';
  ctx.fillRect(ax + 58, ay, aw, 18);
  ctx.fillStyle = alarmColor(alarm);
  ctx.fillRect(ax + 58, ay, Math.max(0, (aw * alarm) / 100), 18);
  ctx.strokeStyle = '#d4af37';
  ctx.strokeRect(ax + 58.5, ay + 0.5, aw, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`${Math.round(alarm)}`, ax + 58 + aw + 8, ay + 14);
  // Ghost line at 25.
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.beginPath();
  ctx.moveTo(ax + 58 + (aw * GHOST_ALARM_LIMIT) / 100, ay - 2);
  ctx.lineTo(ax + 58 + (aw * GHOST_ALARM_LIMIT) / 100, ay + 20);
  ctx.stroke();

  // Loot.
  ctx.fillStyle = '#ffd76a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`◆ $${thief.lootValue}`, 668, 28);
  ctx.fillStyle = '#9a8f7a';
  ctx.font = '12px sans-serif';
  ctx.fillText(thief.hasDiamond ? 'Diamond secured ✓' : 'Steal the Starlight Diamond', 668, 48);

  // Tools.
  let tx = 884;
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('TOOLS', tx, 16);
  const SHORT = { coin: 'Coin', smoke: 'Smoke', emp: 'EMP' };
  TOOL_DEFS.forEach((def, i) => {
    const bx = tx + i * 80;
    const selected = thief.selectedTool === i;
    ctx.fillStyle = selected ? '#d4af37' : '#1c1826';
    ctx.fillRect(bx, 24, 72, 30);
    ctx.strokeStyle = selected ? '#fff' : '#5a4f3a';
    ctx.strokeRect(bx + 0.5, 24.5, 72, 30);
    ctx.fillStyle = selected ? '#111' : '#e8dcc0';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${def.key} ${SHORT[def.id]} ×${thief.tools[def.id]}`, bx + 5, 43);
  });

  // Timer + score.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 14px sans-serif';
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1264, 26);
  ctx.fillStyle = '#9a8f7a';
  ctx.font = '12px sans-serif';
  ctx.fillText(`Score ${score}`, 1264, 46);
  ctx.textAlign = 'left';

  // Objective hint at the bottom of the bar area (fades after a while).
  if (s.hintTimer > 0) {
    ctx.fillStyle = 'rgba(232, 220, 192, 0.85)';
    ctx.font = '12px sans-serif';
    ctx.fillText(s.objective, 16, HUD_H - 8);
  }
  ctx.restore();
}

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(8, 6, 14, ${alpha})`;
  ctx.fillRect(0, 0, 1280, 800);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 16, 30, 0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  ctx.fillText(text, 640, y);
}

export function drawTitle(ctx, best) {
  overlay(ctx, 0.55);
  centerText(ctx, 'THE VELVET VAULT', 240, 'bold 64px Georgia, serif', '#ffd76a');
  centerText(ctx, 'A stealth heist at the Marlowe Gallery', 290, '20px Georgia, serif', '#e8dcc0');
  centerText(ctx, 'Wren the thief. One diamond. A gallery full of guards, cameras and very loud alarms.', 330, '16px sans-serif', '#b8ad97');
  panel(ctx, 340, 380, 600, 210);
  centerText(ctx, 'WASD / Arrows — move      Shift — sneak', 425, '16px sans-serif', '#e8dcc0');
  centerText(ctx, 'E — grab the diamond      1 / 2 / 3 — pick a tool, Space / click — use it', 458, '16px sans-serif', '#e8dcc0');
  centerText(ctx, 'Coin lures guards · Smoke blinds · EMP kills cameras', 491, '16px sans-serif', '#e8dcc0');
  centerText(ctx, 'M — mute      P / Esc — pause      R — restart', 524, '16px sans-serif', '#e8dcc0');
  centerText(ctx, 'Press ENTER or click to begin the heist', 560, 'bold 17px sans-serif', '#ffd76a');
  if (best > 0) centerText(ctx, `Best score: ${best}`, 640, '15px sans-serif', '#9a8f7a');
  ctx.textAlign = 'left';
}

export function drawIntro(ctx, level, index) {
  overlay(ctx, 0.6);
  centerText(ctx, `LEVEL ${index + 1} — ${level.name.toUpperCase()}`, 300, 'bold 40px Georgia, serif', '#ffd76a');
  centerText(ctx, level.subtitle, 345, '18px Georgia, serif', '#e8dcc0');
  centerText(ctx, level.intro, 395, '16px sans-serif', '#b8ad97');
  centerText(ctx, 'Press ENTER to slip inside', 470, 'bold 17px sans-serif', '#ffd76a');
  ctx.textAlign = 'left';
}

export function drawPause(ctx) {
  overlay(ctx, 0.55);
  centerText(ctx, 'PAUSED', 360, 'bold 48px Georgia, serif', '#e8dcc0');
  centerText(ctx, 'P / Esc — resume      R — restart the level', 420, '16px sans-serif', '#b8ad97');
  ctx.textAlign = 'left';
}

export function drawCaught(ctx, s) {
  overlay(ctx, 0.72);
  centerText(ctx, 'BUSTED!', 300, 'bold 64px Georgia, serif', '#ff3b30');
  centerText(ctx, s.caughtReason || 'The alarm hit 100 — the gallery is swarming.', 355, '18px sans-serif', '#e8dcc0');
  centerText(ctx, `Level ${s.levelIndex + 1} — ${s.level.name}  ·  Loot $${s.thief.lootValue}  ·  Score ${s.score}`, 405, '16px sans-serif', '#b8ad97');
  centerText(ctx, 'Press R to retry the room — the guards reset, the diamond waits.', 470, 'bold 17px sans-serif', '#ffd76a');
  ctx.textAlign = 'left';
}

export function drawVictory(ctx, s) {
  overlay(ctx, 0.6);
  centerText(ctx, 'THE GETAWAY', 250, 'bold 60px Georgia, serif', '#ffd76a');
  centerText(ctx, 'Wren slips into the night with the Starlight Diamond.', 305, '19px Georgia, serif', '#e8dcc0');
  panel(ctx, 390, 350, 500, 220);
  centerText(ctx, `Loot collected: $${s.totalLoot}`, 400, '17px sans-serif', '#e8dcc0');
  centerText(ctx, `Time bonus: +${s.timeBonus}`, 435, '17px sans-serif', '#e8dcc0');
  centerText(ctx, s.ghost ? `Ghost bonus: +${s.ghostBonus} (alarm never passed 25)` : 'Ghost bonus: +0 (the alarm rose above 25)', 470, '17px sans-serif', '#e8dcc0');
  centerText(ctx, `TOTAL SCORE: ${s.score}`, 515, 'bold 24px Georgia, serif', '#ffd76a');
  if (s.score >= s.best) centerText(ctx, 'NEW BEST SCORE!', 545, 'bold 16px sans-serif', '#2ecc71');
  centerText(ctx, 'Press R to run the heist again', 620, '16px sans-serif', '#b8ad97');
  ctx.textAlign = 'left';
}
