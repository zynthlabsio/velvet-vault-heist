# The Velvet Vault

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/zynthlabsio/velvet-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/zynthlabsio/velvet-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game, made for the [make.fun best-heist-game-20261122-0559 competition](https://make.fun/bounty/best-heist-game-20261122-0559).

You are Wren, a thief slipping through the Marlowe Gallery at night to steal the Starlight Diamond. Cross the gallery floor under the guards' vision cones and the sweep of the wall cameras, pocket side loot on the way, and reach the green getaway door — without letting the alarm hit 100.

## How to play

- **WASD / arrow keys** — move (running is faster but easier to spot)
- **Shift** — sneak: slower, quieter, smaller detection, and shadow cover hides you further
- **E** — grab the Starlight Diamond when you stand beside its pedestal
- **1 / 2 / 3** — pick a tool, **Space** or **mouse click** to use it:
  - **Coin toss** — lures a nearby guard to the landing spot
  - **Smoke puff** — blocks all vision for 6 seconds
  - **EMP pulse** — disables the cameras for 8 seconds
- **M** — mute · **P / Esc** — pause · **R** — restart the level

Guards patrol waypoint routes. A pale yellow cone means they are calm; it turns orange with a "?" while they grow suspicious and red with a "!" once they have spotted you. Cameras sweep red cones back and forth. Being seen raises the alarm meter; at 100 the run is busted, and a guard touching you busts it too. Shadow lanes hide you, and the vent crawl spaces (grated floor) hide you completely — at a crawl.

Three levels — Gallery Hall, Vault Corridor, The Vault — with more guards and cameras each time. Score is loot value plus a time bonus, with a ghost bonus if the alarm never passes 25. Your best score is kept in localStorage.

## How to run

No build step, no network requests — everything is a local file under `game/`.

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `game/` with any static HTTP server and open `index.html`.

## Screenshots

The four screenshots in `screenshots/` are deterministic renders of the game's own code (`?shot=cover|tools|caught|escape`, fixed seed and staged state — see `game/src/shots.js` and `shots.json`).

## Handing in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see [LICENSE](LICENSE). Original game: its own names, art, sounds and music, written for this competition.
