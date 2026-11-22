// The Velvet Vault — level definitions.
// Map legend (32 columns x 18 rows, 40px tiles):
//   # wall   . floor   , shadow floor (hard to spot the thief)
//   v vent floor (hidden, slow)   X display case   O statue   r velvet rope
//   d Starlight Diamond   p painting loot   g gem-case loot
//   e getaway exit   t thief start
// Walls, cases and statues block movement and sight; ropes block
// movement only. Guards and cameras are defined per level below.
import { TILE, DIAMOND_VALUE, PAINTING_VALUE, GEM_VALUE } from './config.js';

const LEVELS = [
  {
    name: 'Gallery Hall',
    subtitle: 'The Marlowe Gallery — main floor',
    intro: 'Slip past the night guards, lift the Starlight Diamond, and reach the side door.',
    parTime: 150,
    seed: 101,
    tools: { coin: 3, smoke: 2, emp: 1 },
    map: [
      '################################',
      '#......,,,,,,,,,,,,,,,,,,......#',
      '#..X......p..........X........#',
      '#..............................#',
      '#..O.........X........O........#',
      '#..............................#',
      '#......X...........X...........#',
      '#..,,,,,,,,,,,,,,,,,,,,,,,,,,..#',
      '#..,,,,,,,,,,,,,,,,,,,,,,,,,,..#',
      '#..t...........X..........d...#',
      '#..............................#',
      '#..O.........X........O........#',
      '#..............................#',
      '#..X......g..........X.........#',
      '#..............................#',
      '#..vvvvvvvvvvvvvvvvvvvvvvvvvv..#',
      '#..........................e...#',
      '################################',
    ],
    guards: [
      { x: 8, y: 3, waypoints: [[8, 3], [24, 3], [24, 5], [8, 5]], speed: 52 },
      { x: 26, y: 12, waypoints: [[26, 12], [26, 9], [20, 9], [20, 13], [26, 13]], speed: 58 },
    ],
    cameras: [
      { x: 16, y: 1, angle: Math.PI / 2, sweep: 0.7, speed: 0.45 },
    ],
  },
  {
    name: 'Vault Corridor',
    subtitle: 'The Marlowe Gallery — east wing',
    intro: 'Two cameras sweep the corridor now. Vents and shadow lanes are your friends.',
    parTime: 180,
    seed: 202,
    tools: { coin: 3, smoke: 2, emp: 2 },
    map: [
      '################################',
      '#..t.....r...................p.#',
      '#........r....X........X.......#',
      '#..######r##############.......#',
      '#..#,,,,,,,,,,,,,,,,,,,#...O...#',
      '#..#,,,,,,,,,,,,,,,,,,,#.......#',
      '#..#,,X,,,,,,,,,,,,X,,,#...X...#',
      '#..#,,,,,,,,,,,,,,,,,,,#.......#',
      '#..######r##############.......#',
      '#........r....O........g.......#',
      '#..X.....r..............X......#',
      '#..............................#',
      '#..O.........X.......O.........#',
      '#..............................#',
      '#..vvvvvvvvvvvvvvvvvvvvvvvvvv..#',
      '#..............d...............#',
      '#..p.......................e...#',
      '################################',
    ],
    guards: [
      { x: 6, y: 1, waypoints: [[6, 1], [26, 1], [26, 2], [6, 2]], speed: 58 },
      { x: 20, y: 11, waypoints: [[20, 11], [28, 11], [28, 13], [12, 13], [12, 11]], speed: 64 },
      { x: 10, y: 15, waypoints: [[10, 15], [22, 15], [22, 16], [10, 16]], speed: 60 },
    ],
    cameras: [
      { x: 12, y: 3, angle: Math.PI / 2, sweep: 0.8, speed: 0.55 },
      { x: 27, y: 0, angle: Math.PI / 2, sweep: 0.6, speed: 0.4 },
    ],
  },
  {
    name: 'The Vault',
    subtitle: 'The Marlowe Gallery — the vault itself',
    intro: 'The Starlight Diamond sits behind the inner vault. Four guards. Three cameras. No mistakes.',
    parTime: 210,
    seed: 303,
    tools: { coin: 4, smoke: 3, emp: 2 },
    map: [
      '################################',
      '#..t.....p...........X........#',
      '#..............................#',
      '#..X......###.###.......O......#',
      '#.........#,,,,,#..............#',
      '#..O......#,d,,,#......X.......#',
      '#.........#,,,,,#..............#',
      '#..X......#######.......O......#',
      '#..............................#',
      '#......X...........X...........#',
      '#..............................#',
      '#..g.........O........p........#',
      '#..............................#',
      '#..X......X...........X........#',
      '#..............................#',
      '#..vvvvvvvvvvvvvvvvvvvvvvvvvv..#',
      '#..O.......................e...#',
      '################################',
    ],
    guards: [
      { x: 6, y: 2, waypoints: [[6, 2], [25, 2], [25, 3], [6, 3]], speed: 62 },
      { x: 22, y: 8, waypoints: [[22, 8], [22, 11], [12, 11], [12, 8]], speed: 66 },
      { x: 26, y: 14, waypoints: [[26, 14], [26, 15], [14, 15], [14, 14]], speed: 60 },
      { x: 8, y: 12, waypoints: [[8, 12], [8, 15], [16, 15], [16, 12]], speed: 64 },
    ],
    cameras: [
      { x: 16, y: 3, angle: Math.PI / 2, sweep: 0.7, speed: 0.6 },
      { x: 4, y: 0, angle: Math.PI / 2, sweep: 0.6, speed: 0.45 },
      { x: 28, y: 0, angle: Math.PI / 2, sweep: 0.6, speed: 0.5 },
    ],
  },
];

// Terrain codes.
export const T_FLOOR = 0;
export const T_WALL = 1;
export const T_SHADOW = 2;
export const T_VENT = 3;
export const T_CASE = 4;
export const T_STATUE = 5;
export const T_ROPE = 6;

const CHAR_TO_TERRAIN = {
  '#': T_WALL,
  '.': T_FLOOR,
  ',': T_SHADOW,
  v: T_VENT,
  X: T_CASE,
  O: T_STATUE,
  r: T_ROPE,
  d: T_FLOOR,
  p: T_FLOOR,
  g: T_FLOOR,
  e: T_FLOOR,
  t: T_FLOOR,
};

export function isBlockingMove(t) {
  return t === T_WALL || t === T_CASE || t === T_STATUE || t === T_ROPE;
}
export function isBlockingSight(t) {
  return t === T_WALL || t === T_CASE || t === T_STATUE;
}

// Parse a level definition into a runtime level: terrain grid plus
// spawn points, loot, exit and guard/camera specs in pixel coordinates.
export function parseLevel(index) {
  const def = LEVELS[index];
  const rows = def.map.length;
  const cols = def.map[0].length;
  const terrain = [];
  const loot = [];
  let thiefStart = { x: 2 * TILE, y: 9 * TILE };
  let exit = { x: 29 * TILE, y: 16 * TILE };

  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      const ch = def.map[y][x];
      row.push(CHAR_TO_TERRAIN[ch] ?? T_FLOOR);
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      if (ch === 't') thiefStart = { x: cx, y: cy };
      else if (ch === 'e') exit = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'd') loot.push({ id: 'diamond', kind: 'diamond', x: cx, y: cy, value: DIAMOND_VALUE, taken: false });
      else if (ch === 'p') loot.push({ id: `painting-${x}-${y}`, kind: 'painting', x: cx, y: cy, value: PAINTING_VALUE, taken: false });
      else if (ch === 'g') loot.push({ id: `gems-${x}-${y}`, kind: 'gems', x: cx, y: cy, value: GEM_VALUE, taken: false });
    }
    terrain.push(row);
  }

  return {
    index,
    name: def.name,
    subtitle: def.subtitle,
    intro: def.intro,
    parTime: def.parTime,
    seed: def.seed,
    tools: { ...def.tools },
    cols,
    rows,
    terrain,
    loot,
    thiefStart,
    exit,
    guards: def.guards.map((g) => ({
      ...g,
      x: g.x * TILE + TILE / 2,
      y: g.y * TILE + TILE / 2,
      waypoints: g.waypoints.map(([wx, wy]) => ({ x: wx * TILE + TILE / 2, y: wy * TILE + TILE / 2 })),
    })),
    cameras: def.cameras.map((c) => ({
      ...c,
      x: c.x * TILE + TILE / 2,
      y: c.y * TILE + TILE / 2,
    })),
  };
}

export function levelCount() {
  return LEVELS.length;
}

// Terrain at pixel coordinates (out of bounds counts as wall).
export function terrainAt(level, px, py) {
  const tx = Math.floor(px / TILE);
  const ty = Math.floor(py / TILE);
  if (tx < 0 || ty < 0 || tx >= level.cols || ty >= level.rows) return T_WALL;
  return level.terrain[ty][tx];
}

export function tileAt(level, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= level.cols || ty >= level.rows) return T_WALL;
  return level.terrain[ty][tx];
}
