# Dusk Escape — A Turkey's Last Thanksgiving

[![make.fun](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/arvm12gt/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/arvm12gt/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

Entry for the [make.fun bounty "Make the best turkey escape game"](https://make.fun/bounty/turkey-run-game-01) — $250 shared by the top 20 entries.

## What it is

A top-down stealth escape game, played at golden hour on a farm. You are Pip
the turkey, and Thanksgiving is tonight. Slip past Farmer Bram's lantern
patrols, hide in the haystacks, blend in with the chicken flock, gather corn
and reach the gate — through the farmyard, the barn, and finally the kitchen,
where the oven is lit and the carving knife sweeps the floor.

Most turkey games are runners: dodge right, jump the knife. This one is about
being unseen. A lantern cone is a moving wall; a haystack is a door; a flock
of chickens is a disguise. Running is fast and loud, sneaking is slow and
quiet, and the meter over your head is the whole game.

## How it plays

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
  **Space** — run (faster, louder). **M** — mute. **Enter** — start.
  **R** — restart after being caught or escaping.
- **Detection meter**: seen in a lantern cone it climbs — faster up close,
  faster running, slower sneaking, in shadow, or while blending with the
  flock. Full means the farmer gives chase; break line of sight and he gives
  up, suspicious.
- **Haystacks** hide you completely. **Shadows** halve how fast you are
  spotted. **Chickens** (stand among two or more) quarter it.
- **Corn**: gather every cob to unlock the gate. **Gate**: reach it to clear
  the stage — 3 stages, farmyard → barn → kitchen.
- **Kitchen hazards**: the oven burns if you linger in its glow; the carving
  knife sweeps its marked lane every few seconds.
- 3 lives, score for corn and stage bonuses, synthesized WebAudio gobbles and
  alert stings (no audio files).

## How it runs

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/`
to the output directory and writes `dossier.json` with the vendored make.fun
library. The game itself is plain static files under `game/` — no build step,
no network request, no assets: every pixel is canvas vector art and every
sound is synthesized in code.

```sh
node serve.ts        # play it at http://localhost:8080
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `main.ts` — entrypoint: copies the game and screenshots, writes the dossier
- `game/index.html` — the page
- `game/src/config.js` — tuning and the three stage layouts
- `game/src/random.js` — seeded RNG
- `game/src/world.js` — simulation: movement, lantern cones, detection, chase, hazards
- `game/src/render.js` — all drawing: farm, turkey, farmer, HUD, title and end screens
- `game/src/audio.js` — synthesized sound effects
- `game/src/input.js` — keyboard input
- `game/src/main.js` — game loop, screen flow, screenshot staging hook
- `game/src/shots.js` — autopilot that stages the screenshot scenes from the real rules
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT
