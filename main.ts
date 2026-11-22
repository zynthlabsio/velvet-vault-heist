// The Velvet Vault — the hand-in program for make.fun.
// Run with Node 22 (standard library only):
//   MAKEFUN_OUTPUT_DIR=out node main.ts
// It copies this repository's game/ and screenshots/ into the output
// directory (MAKEFUN_OUTPUT_DIR, or /output inside the grader) and writes
// /output/dossier.json using the vendored make.fun library, so the judge
// sees the game, its screenshots and a summary of the source.
// Caps match the scorer's own limits: at most 4 screenshots of 256 KiB,
// game/ at most 993 files / 48 MiB, paths at most 1000 bytes, and the
// dossier text capped at 160 KiB.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const gameSource = join(repoRoot, 'game');
const shotsSource = join(repoRoot, 'screenshots');

if (!existsSync(gameSource)) {
  throw new Error(`game/ not found beside main.ts (${gameSource})`);
}

// Start from a clean output directory so stale files never leak in.
rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

cpSync(gameSource, join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
console.log(`dossier written to ${join(outputDir, 'dossier.json')}`);
