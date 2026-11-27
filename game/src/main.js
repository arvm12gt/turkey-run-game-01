// Entry point for Dusk Escape: the game loop, screen flow (title → play → stage
// clear → next stage → escaped / caught → restart) and the ?shot= staging hook
// the screenshot scenes use. The world is stepped at a fixed 1/60 s so a staged
// scene is the same frame every time it is taken.

import { FIELD, STEP, STAGES, TUNING } from './config.js';
import { createWorld, stepWorld, EVENT_CAUGHT, EVENT_STAGE_CLEAR, EVENT_ESCAPED } from './world.js';
import {
  SCREEN_TITLE, SCREEN_PLAY, SCREEN_CLEAR, SCREEN_OVER, SCREEN_ESCAPED,
  drawWorld, drawTitle, drawStageClear, drawOver, drawEscaped,
} from './render.js';
import { installInput, readMovement } from './input.js';
import {
  setMuted, isMuted, playGobble, playStep, playAlert, playCaught, playClear, playEscape,
} from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = FIELD.width;
canvas.height = FIELD.height;

let screen = SCREEN_TITLE;
let world = null;
let best = 0;
let clearTimer = 0;
let overReason = '';
let lastTime = 0;
let accumulator = 0;
let stepSoundTimer = 0;
let alerted = false;

function newRun() {
  world = createWorld(0, 0, TUNING.startLives);
  screen = SCREEN_PLAY;
  clearTimer = 0;
  alerted = false;
}

function nextStage() {
  const score = world.score;
  const lives = world.lives;
  const next = world.stageIndex + 1;
  world = createWorld(next, score, lives);
  screen = SCREEN_PLAY;
  alerted = false;
}

function onAction(code) {
  if (code === 'KeyM') {
    setMuted(!isMuted());
    return;
  }
  if (screen === SCREEN_TITLE && code === 'Enter') {
    newRun();
    return;
  }
  if ((screen === SCREEN_OVER || screen === SCREEN_ESCAPED) && code === 'KeyR') {
    newRun();
  }
}

installInput(onAction);

function update(dt) {
  if (screen === SCREEN_PLAY) {
    const input = readMovement();
    const before = world.cornGot;
    const events = stepWorld(world, input, dt);
    if (world.cornGot > before) playGobble();
    if (world.turkey.moving && world.turkey.running) {
      stepSoundTimer -= dt;
      if (stepSoundTimer <= 0) {
        playStep();
        stepSoundTimer = 0.28;
      }
    }
    if (world.turkey.seen && !alerted) {
      playAlert();
      alerted = true;
    }
    if (!world.turkey.seen && world.meter < 30) alerted = false;
    if (events & EVENT_CAUGHT) {
      overReason = world.caughtReason || 'caught';
      playCaught();
      world.lives -= 1;
      if (world.lives <= 0) {
        screen = SCREEN_OVER;
      } else {
        // Caught, but lives remain: restart this stage with the score kept.
        const score = world.score;
        const lives = world.lives;
        const stage = world.stageIndex;
        world = createWorld(stage, score, lives);
        alerted = false;
      }
    } else if (events & EVENT_STAGE_CLEAR) {
      playClear();
      screen = SCREEN_CLEAR;
      clearTimer = 2.2;
    } else if (events & EVENT_ESCAPED) {
      playEscape();
      best = Math.max(best, world.score);
      screen = SCREEN_ESCAPED;
    }
  } else if (screen === SCREEN_CLEAR) {
    clearTimer -= dt;
    if (clearTimer <= 0) nextStage();
  }
}

function draw(time) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (screen === SCREEN_TITLE) {
    drawTitle(ctx, time, best);
  } else if (screen === SCREEN_PLAY || screen === SCREEN_CLEAR) {
    drawWorld(ctx, world, time);
    if (screen === SCREEN_CLEAR) drawStageClear(ctx, world);
  } else if (screen === SCREEN_OVER) {
    drawWorld(ctx, world, time);
    drawOver(ctx, world, overReason);
  } else if (screen === SCREEN_ESCAPED) {
    drawEscaped(ctx, world);
  }
}

function frame(timestamp) {
  const now = timestamp / 1000;
  if (!lastTime) lastTime = now;
  let dt = now - lastTime;
  lastTime = now;
  if (dt > 0.25) dt = 0.25;
  accumulator += dt;
  while (accumulator >= STEP) {
    update(STEP);
    accumulator -= STEP;
  }
  draw(now);
  requestAnimationFrame(frame);
}

// Screenshot staging: ?shot=start|play|kitchen|end stages a deterministic scene
// from the real rules (an autopilot plays the world forward), then draws it once.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot);
  screen = staged.screen;
  world = staged.world;
  best = staged.best;
  draw(staged.time);
  document.title = `Dusk Escape — shot ${shot}`;
} else {
  requestAnimationFrame(frame);
}

// Test hook for local play-testing: read-only state inspection.
window.__turkey = {
  get screen() { return screen; },
  get world() { return world; },
  get best() { return best; },
  start: () => { if (screen === SCREEN_TITLE) newRun(); },
};
