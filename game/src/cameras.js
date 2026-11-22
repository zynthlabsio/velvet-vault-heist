// The Velvet Vault — wall cameras sweep red cones back and forth.
// An EMP pulse disables them for a while; while disabled they see nothing.
import { CAMERA_RANGE, CAMERA_HALF_FOV } from './config.js';
import { visionStrength } from './guards.js';

export function createCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    baseAngle: spec.angle,
    sweep: spec.sweep,
    speed: spec.speed,
    angle: spec.angle,
    phase: Math.random() * Math.PI * 2,
    disabledTimer: 0,
  };
}

export function updateCamera(cam, dt, time, level, thief, smoke) {
  if (cam.disabledTimer > 0) cam.disabledTimer -= dt;
  // Ping-pong sweep: angle oscillates around the base angle.
  cam.angle = cam.baseAngle + Math.sin(time * cam.speed + cam.phase) * cam.sweep;
  if (cam.disabledTimer > 0) return { see: 0, active: false };
  const see = visionStrength(level, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_FOV, thief.x, thief.y, {
    smoke,
    sneaking: thief.sneaking,
    running: thief.moving && !thief.sneaking,
  });
  return { see, active: true };
}
