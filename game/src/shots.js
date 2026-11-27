// The screenshot scenes behind ?shot=start|play|kitchen|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered by a
// simple autopilot (head for the nearest corn or the gate, duck into a haystack
// when the lantern finds you, wait for the meter to fall), so the frame is what a
// short game really looks like and the same seed always gives the same frame.

import { FIELD, STEP, TUNING } from './config.js';
import { createWorld, stepWorld, wouldBeSeen, EVENT_CAUGHT, EVENT_STAGE_CLEAR, EVENT_ESCAPED } from './world.js';
import { SCREEN_TITLE, SCREEN_PLAY, SCREEN_ESCAPED, SCREEN_OVER } from './render.js';

const SAMPLE = STEP;
const DIRECTIONS = [
  [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1],
];

/** Score a candidate move: closer to the goal is good, a lantern cone is bad. */
function moveScore(state, dx, dy, target) {
  const t = state.turkey;
  const speed = TUNING.turkeyWalk;
  // A short lookahead: a long one overshoots into the border walls near the
  // gate and scores the only way in as blocked, stalling the pilot.
  const nx = t.x + dx * speed * 0.1;
  const ny = t.y + dy * speed * 0.1;
  if (nx < 24 || nx > FIELD.width - 24 || ny < 24 || ny > FIELD.height - 24) return -1e9;
  // A move the walls block leaves the turkey standing still: score it as
  // impossible, or the pilot keeps "moving" into the wall forever.
  for (const w of state.def.walls) {
    const cx = Math.max(w.x, Math.min(nx, w.x + w.w));
    const cy = Math.max(w.y, Math.min(ny, w.y + w.h));
    if (Math.hypot(nx - cx, ny - cy) < TUNING.turkeyRadius) return -1e9;
  }
  let score = -Math.hypot(target.x - nx, target.y - ny);
  if (wouldBeSeen(state, nx, ny)) {
    // Graded by distance to the nearest farmer: a cone far away is a warning,
    // one point-blank is a wall. A flat penalty made the pilot oscillate.
    let nearest = Infinity;
    for (const f of state.farmers) nearest = Math.min(nearest, Math.hypot(f.x - nx, f.y - ny));
    score -= 300 + 900 * (1 - Math.min(1, nearest / TUNING.coneRange));
  }
  const def = state.def;
  if (def.oven && nx > def.oven.x && nx < def.oven.x + def.oven.w && ny > def.oven.y && ny < def.oven.y + def.oven.h) score -= 1500;
  if (def.knifeLane) {
    // The blade sweeps fast (840 px in 1.1 s) and the lane stays dangerous
    // while a sweep is coming: penalise the whole lane band in the 2 s before
    // a sweep as well as during it, so the pilot waits instead of walking in.
    const lane = def.knifeLane;
    const inBand = Math.abs(ny - lane.y) < 30;
    const untilSweep = state.knife.active ? 0 : lane.period - state.knife.phase;
    if (inBand && (state.knife.active || untilSweep < 2.0)) score -= 1500;
    if (state.knife.active && inBand && Math.abs(nx - state.knife.x) < 60) score -= 1500;
  }
  return score;
}

function nearestCover(state) {
  let best = null;
  let bestD = Infinity;
  for (const h of state.def.haystacks) {
    const d = Math.hypot(state.turkey.x - h.x, state.turkey.y - h.y);
    if (d < bestD) {
      bestD = d;
      best = h;
    }
  }
  for (const s of state.def.shadows) {
    const d = Math.hypot(state.turkey.x - s.x, state.turkey.y - s.y);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function autopilot(state) {
  const t = state.turkey;
  // Once hidden in the hay, sit still until the heat has properly died down;
  // leaving the moment the meter dips makes the pilot oscillate.
  if (t.hidden && state.meter > 20) return { dx: 0, dy: 0, sneak: true, run: false };
  const goingForGate = state.cornGot >= state.cornTotal;
  // Meter high: if the gate is already open, dash for it — the turkey outruns
  // the farmer, and there is no cover near the gate worth doubling back for.
  // Otherwise run for the nearest cover (haystack or shadow) and wait it out.
  if (state.meter > 55) {
    if (goingForGate) {
      const g = { x: state.def.gate.x + state.def.gate.w / 2, y: state.def.gate.y + state.def.gate.h / 2 };
      const ang = Math.atan2(g.y - t.y, g.x - t.x);
      return { dx: Math.cos(ang), dy: Math.sin(ang), sneak: false, run: true };
    }
    const cover = nearestCover(state);
    if (cover) {
      const d = Math.hypot(t.x - cover.x, t.y - cover.y);
      const inside = cover.r ? d < cover.r * 0.7 : d < 40;
      if (inside) return { dx: 0, dy: 0, sneak: true, run: false };
      const ang = Math.atan2(cover.y - t.y, cover.x - t.x);
      return { dx: Math.cos(ang), dy: Math.sin(ang), sneak: false, run: true };
    }
  }
  let target = null;
  if (state.cornGot < state.cornTotal) {
    let bestD = Infinity;
    for (const c of state.corn) {
      if (c.taken) continue;
      const d = Math.hypot(t.x - c.x, t.y - c.y);
      if (d < bestD) {
        bestD = d;
        target = c;
      }
    }
  } else {
    target = { x: state.def.gate.x + state.def.gate.w / 2, y: state.def.gate.y + state.def.gate.h / 2 };
  }
  if (!target) return { dx: 0, dy: 0, sneak: false, run: false };
  let bestDir = DIRECTIONS[0];
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRECTIONS) {
    const s = moveScore(state, dx, dy, target);
    if (s > bestScore) {
      bestScore = s;
      bestDir = [dx, dy];
    }
  }
  const sneak = state.meter > 30;
  return { dx: bestDir[0], dy: bestDir[1], sneak, run: false };
}

/** Play one stage with the autopilot until it clears, is caught, or time runs out. */
function playStage(state, seconds) {
  const limit = seconds / STEP;
  let result = 0;
  for (let i = 0; i < limit; i += 1) {
    result = stepWorld(state, autopilot(state), STEP);
    if (result !== 0) break;
  }
  return result;
}

/**
 * Set the world to the named scene and return the screen to draw over it, the
 * best score to show and the scene clock.
 */
export function stageShot(name) {
  if (name !== 'play' && name !== 'kitchen' && name !== 'end') {
    const world = createWorld(0, 0, TUNING.startLives);
    for (let i = 0; i < 5 / STEP; i += 1) stepWorld(world, { dx: 0, dy: 0, sneak: false, run: false }, STEP);
    return { screen: SCREEN_TITLE, world, best: 0, time: 2.0 };
  }
  if (name === 'play') {
    const world = createWorld(0, 0, TUNING.startLives);
    playStage(world, 8);
    return { screen: SCREEN_PLAY, world, best: world.score, time: 8 };
  }
  if (name === 'kitchen') {
    const world = createWorld(2, 1450, TUNING.startLives);
    playStage(world, 24);
    return { screen: SCREEN_PLAY, world, best: world.score, time: 24 };
  }
  // end: play the kitchen to the gate; the autopilot gets three lives to do it.
  let world = createWorld(2, 1450, TUNING.startLives);
  let result = 0;
  let spent = 0;
  while (spent < 600) {
    result = playStage(world, 60);
    spent += 60;
    if (result & EVENT_ESCAPED) break;
    if (result & EVENT_CAUGHT) {
      world.lives -= 1;
      if (world.lives <= 0) break;
      world = createWorld(2, world.score, world.lives);
      continue;
    }
    if (result & EVENT_STAGE_CLEAR) break;
    break;
  }
  if (result & EVENT_ESCAPED) return { screen: SCREEN_ESCAPED, world, best: world.score, time: spent };
  return { screen: SCREEN_OVER, world, best: world.score, time: spent };
}
