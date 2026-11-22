// The Velvet Vault — shared constants for the whole game.
// Canvas is 1280x800: an 80px HUD strip on top, then a 32x18 tile
// gallery floor (40px tiles = 1280x720).
export const TILE = 40;
export const COLS = 32;
export const ROWS = 18;
export const HUD_H = 80;
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const PLAY_W = COLS * TILE;
export const PLAY_H = ROWS * TILE;

// Thief movement (pixels per second).
export const WALK_SPEED = 175;
export const SNEAK_SPEED = 88;
export const VENT_SPEED = 62;

// Vision.
export const GUARD_RANGE = 235;
export const GUARD_HALF_FOV = 0.61; // ~35 degrees each side
export const CAMERA_RANGE = 265;
export const CAMERA_HALF_FOV = 0.5;

// Detection / alarm tuning.
export const SPOT_THRESHOLD = 100; // guard suspicion at which the thief is spotted
export const SUSPICIOUS_THRESHOLD = 55;
export const ALARM_SPOTTED_RATE = 14; // alarm points per second while spotted/seen
export const ALARM_SUSPICIOUS_RATE = 5;
export const ALARM_DECAY_RATE = 3.5;
export const ALARM_BUSTED = 100;
export const GHOST_ALARM_LIMIT = 25; // stay under this all level for the ghost bonus

// Tools.
export const TOOL_DEFS = [
  { key: '1', id: 'coin', name: 'Coin toss', desc: 'Lure a guard to the landing spot' },
  { key: '2', id: 'smoke', name: 'Smoke puff', desc: 'Blocks all vision for 6s' },
  { key: '3', id: 'emp', name: 'EMP pulse', desc: 'Disables cameras for 8s' },
];
export const SMOKE_DURATION = 6;
export const SMOKE_RADIUS = 95;
export const EMP_DURATION = 8;
export const COIN_LURE_RADIUS = 280;
export const COIN_LURE_TIME = 6;

// Scoring.
export const DIAMOND_VALUE = 1000;
export const PAINTING_VALUE = 200;
export const GEM_VALUE = 150;
export const GHOST_BONUS = 500;
export const TIME_BONUS_RATE = 10; // points per second under par

export const BEST_KEY = 'velvet-vault-best-score';
