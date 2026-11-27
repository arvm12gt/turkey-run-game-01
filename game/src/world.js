// The simulation for Dusk Escape: a top-down stealth escape.
// The turkey sneaks past patrolling farmers, hides in haystacks, blends with the
// chicken flock, gathers corn and reaches the gate. Detection is a meter: seen in
// a lantern cone it climbs, unseen it falls; full means the farmer gives chase.

import { FIELD, STAGES, TUNING } from './config.js';
import { mulberry32 } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_CAUGHT = 1;
export const EVENT_STAGE_CLEAR = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_OVER = 8;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function dist(ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.sqrt(dx * dx + dy * dy);
}
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
function circleHitsRect(x, y, r, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}
// Does the segment (x0,y0)-(x1,y1) cross any wall? Used for line of sight.
function segmentBlocked(x0, y0, x1, y1, walls) {
  for (const w of walls) {
    // Sample the segment; cheap and exact enough for short sight lines.
    const steps = Math.ceil(dist(x0, y0, x1, y1) / 6);
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (pointInRect(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w)) return true;
    }
  }
  return false;
}

export function createWorld(stageIndex, score, lives) {
  const def = STAGES[stageIndex];
  const rng = mulberry32(def.seed);
  const state = {
    stageIndex,
    def,
    score,
    lives,
    time: 0,
    meter: 0,
    status: 'play',
    caughtReason: '',
    ovenHeat: 0,
    knife: { phase: 0, x: def.knifeLane ? def.knifeLane.x0 : 0, active: false },
    turkey: {
      x: def.turkeyStart.x,
      y: def.turkeyStart.y,
      dir: 0,
      moving: false,
      sneaking: false,
      running: false,
      hidden: false,
      blending: false,
      inShadow: false,
      seen: false,
    },
    farmers: def.farmers.map((f) => ({
      x: f.waypoints[0].x,
      y: f.waypoints[0].y,
      dir: 0,
      waypoint: 1,
      mode: 'patrol',
      speed: f.speed,
      knife: !!f.knife,
      loseSight: 0,
      bob: rng() * 6.28,
    })),
    chickens: def.chickens.map((c) => ({
      x: c.x,
      y: c.y,
      homeX: c.x,
      homeY: c.y,
      dir: rng() * 6.28,
      pause: rng() * 2,
      peck: rng() * 6.28,
    })),
    corn: def.corn.map((c) => ({ x: c.x, y: c.y, taken: false })),
    cornGot: 0,
    cornTotal: def.corn.length,
    gateOpen: false,
    rng,
  };
  return state;
}

function moveWithWalls(state, body, dx, dy) {
  const r = body === state.turkey ? TUNING.turkeyRadius : TUNING.farmerRadius;
  const walls = state.def.walls;
  let nx = body.x + dx;
  let blocked = false;
  for (const w of walls) if (circleHitsRect(nx, body.y, r, w)) { blocked = true; break; }
  if (!blocked && nx > r + 4 && nx < FIELD.width - r - 4) body.x = nx;
  let ny = body.y + dy;
  blocked = false;
  for (const w of walls) if (circleHitsRect(body.x, ny, r, w)) { blocked = true; break; }
  if (!blocked && ny > r + 4 && ny < FIELD.height - r - 4) body.y = ny;
}

function farmerCanSee(state, farmer) {
  const t = state.turkey;
  if (t.hidden) return false;
  const d = dist(farmer.x, farmer.y, t.x, t.y);
  if (d > TUNING.coneRange) return false;
  const ang = Math.atan2(t.y - farmer.y, t.x - farmer.x);
  if (Math.abs(angleDiff(ang, farmer.dir)) > TUNING.coneHalfAngle) return false;
  if (segmentBlocked(farmer.x, farmer.y, t.x, t.y, state.def.walls)) return false;
  return true;
}

// Would a turkey standing at (x, y) be seen by any farmer right now? Used by the
// screenshot autopilot to pick safe moves; it ignores haystack hiding (the point
// is the position, not the turkey's current cover).
export function wouldBeSeen(state, x, y) {
  for (const f of state.farmers) {
    const d = dist(f.x, f.y, x, y);
    if (d > TUNING.coneRange) continue;
    const ang = Math.atan2(y - f.y, x - f.x);
    if (Math.abs(angleDiff(ang, f.dir)) > TUNING.coneHalfAngle) continue;
    if (segmentBlocked(f.x, f.y, x, y, state.def.walls)) continue;
    return true;
  }
  return false;
}

export function stepWorld(state, input, dt) {
  let events = EVENT_NONE;
  const t = state.turkey;
  const def = state.def;
  state.time += dt;

  // ---- turkey movement ----
  const speed = input.sneak ? TUNING.turkeySneak : input.run ? TUNING.turkeyRun : TUNING.turkeyWalk;
  const mag = Math.hypot(input.dx, input.dy);
  t.moving = mag > 0.01;
  t.sneaking = !!input.sneak;
  t.running = !!input.run && !input.sneak;
  if (t.moving) {
    const nx = (input.dx / (mag || 1)) * speed * dt;
    const ny = (input.dy / (mag || 1)) * speed * dt;
    t.dir = Math.atan2(input.dy, input.dx);
    moveWithWalls(state, t, nx, ny);
  }

  // ---- cover: haystacks hide, shadows dim, chickens camouflage ----
  t.hidden = def.haystacks.some((h) => dist(t.x, t.y, h.x, h.y) < h.r * 0.8);
  t.inShadow = def.shadows.some((s) => {
    const dx = (t.x - s.x) / s.rx;
    const dy = (t.y - s.y) / s.ry;
    return dx * dx + dy * dy < 1;
  });
  let nearBirds = 0;
  for (const c of state.chickens) if (dist(t.x, t.y, c.x, c.y) < 46) nearBirds += 1;
  t.blending = !t.hidden && nearBirds >= 2 && !t.running;

  // ---- chickens wander and peck ----
  for (const c of state.chickens) {
    c.peck += dt * 3;
    if (c.pause > 0) {
      c.pause -= dt;
      continue;
    }
    c.dir += (state.rng() - 0.5) * 1.6 * dt * 4;
    const nx = c.x + Math.cos(c.dir) * 14 * dt;
    const ny = c.y + Math.sin(c.dir) * 14 * dt;
    const home = dist(nx, ny, c.homeX, c.homeY);
    if (home < 70 && nx > 24 && nx < FIELD.width - 24 && ny > 24 && ny < FIELD.height - 24) {
      c.x = nx;
      c.y = ny;
    } else {
      c.dir += Math.PI * dt;
    }
    if (state.rng() < 0.01) c.pause = 0.5 + state.rng() * 1.5;
  }

  // ---- detection meter ----
  let seen = false;
  let closest = Infinity;
  for (const f of state.farmers) {
    if (farmerCanSee(state, f)) {
      seen = true;
      closest = Math.min(closest, dist(f.x, f.y, t.x, t.y));
    }
  }
  t.seen = seen;
  if (seen) {
    const proximity = 1 - 0.65 * (closest / TUNING.coneRange);
    let factor = proximity;
    if (t.running) factor *= TUNING.detectRunFactor;
    if (t.sneaking) factor *= TUNING.detectSneakFactor;
    if (t.inShadow) factor *= TUNING.detectShadowFactor;
    if (t.blending) factor *= TUNING.detectBlendFactor;
    state.meter = clamp(state.meter + TUNING.detectBase * factor * dt, 0, 100);
  } else {
    state.meter = clamp(state.meter - TUNING.detectDecay * dt, 0, 100);
  }

  // ---- farmers: patrol, chase, give up ----
  for (const f of state.farmers) {
    f.bob += dt * 6;
    const canSee = farmerCanSee(state, f);
    if (state.meter >= 100 && f.mode !== 'chase') f.mode = 'chase';
    if (f.mode === 'chase') {
      const d = dist(f.x, f.y, t.x, t.y);
      f.dir = Math.atan2(t.y - f.y, t.x - f.x);
      moveWithWalls(state, f, Math.cos(f.dir) * TUNING.farmerChase * dt, Math.sin(f.dir) * TUNING.farmerChase * dt);
      if (canSee) f.loseSight = 0;
      else f.loseSight += dt;
      if (f.loseSight > TUNING.chaseGiveUpSeconds) {
        f.mode = 'patrol';
        f.loseSight = 0;
        state.meter = 40;
      }
      if (d < TUNING.turkeyRadius + TUNING.farmerRadius + 2) {
        state.caughtReason = 'caught';
        return EVENT_CAUGHT;
      }
    } else {
      // A patrolling farmer who walks right into the turkey and sees it
      // catches it too — bumping into him is not a safe way past.
      if (canSee && dist(f.x, f.y, t.x, t.y) < TUNING.turkeyRadius + TUNING.farmerRadius + 2) {
        state.caughtReason = 'caught';
        return EVENT_CAUGHT;
      }
      const wp = def.farmers[state.farmers.indexOf(f)].waypoints[f.waypoint];
      const d = dist(f.x, f.y, wp.x, wp.y);
      if (d < 8) {
        f.waypoint = (f.waypoint + 1) % def.farmers[state.farmers.indexOf(f)].waypoints.length;
      } else {
        const ang = Math.atan2(wp.y - f.y, wp.x - f.x);
        f.dir = ang;
        moveWithWalls(state, f, Math.cos(ang) * f.speed * dt, Math.sin(ang) * f.speed * dt);
      }
    }
  }

  // ---- corn ----
  for (const c of state.corn) {
    if (!c.taken && dist(t.x, t.y, c.x, c.y) < 26) {
      c.taken = true;
      state.cornGot += 1;
      state.score += TUNING.cornScore;
    }
  }
  if (!state.gateOpen && state.cornGot >= state.cornTotal) state.gateOpen = true;

  // ---- gate ----
  if (state.gateOpen && pointInRect(t.x, t.y, def.gate)) {
    if (state.stageIndex >= STAGES.length - 1) {
      state.score += TUNING.stageBonus + Math.max(0, Math.round((120 - state.time) * TUNING.timeBonusPerSecond));
      return EVENT_ESCAPED;
    }
    state.score += TUNING.stageBonus + Math.max(0, Math.round((120 - state.time) * TUNING.timeBonusPerSecond));
    return EVENT_STAGE_CLEAR;
  }

  // ---- oven (kitchen): standing in the glow burns ----
  if (def.oven) {
    if (pointInRect(t.x, t.y, def.oven)) {
      state.ovenHeat += dt;
      if (state.ovenHeat > TUNING.ovenHurtSeconds) {
        state.caughtReason = 'oven';
        return EVENT_CAUGHT;
      }
    } else {
      state.ovenHeat = Math.max(0, state.ovenHeat - dt * 2);
    }
  }

  // ---- carving knife lane (kitchen): a blade sweeps the floor on a timer ----
  if (def.knifeLane) {
    const lane = def.knifeLane;
    const phase = state.time % lane.period;
    state.knife.phase = phase;
    if (phase < lane.sweep) {
      state.knife.active = true;
      const k = phase / lane.sweep;
      state.knife.x = lane.x0 + (lane.x1 - lane.x0) * k;
      if (Math.abs(t.y - lane.y) < 24 && Math.abs(t.x - state.knife.x) < 26) {
        state.caughtReason = 'knife';
        return EVENT_CAUGHT;
      }
    } else {
      state.knife.active = false;
    }
  }

  return events;
}
