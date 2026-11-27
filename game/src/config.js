// Tuning and stage layouts for Dusk Escape — a top-down stealth turkey escape.
// All numbers are in canvas pixels / seconds; the field is 960 x 600.

export const FIELD = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const TUNING = {
  turkeyWalk: 150,
  turkeyRun: 205,
  turkeySneak: 85,
  turkeyRadius: 15,
  farmerPatrol: 62,
  farmerChase: 148,
  farmerRadius: 16,
  coneRange: 175,
  coneHalfAngle: 0.62, // radians, ~35 degrees each side
  detectBase: 55, // meter points per second at point-blank, walking, lit
  detectDecay: 30, // meter points per second while unseen
  detectRunFactor: 1.3,
  detectSneakFactor: 0.55,
  detectShadowFactor: 0.5,
  detectBlendFactor: 0.25,
  chaseGiveUpSeconds: 2.5,
  ovenHurtSeconds: 0.8,
  knifeLanePeriod: 4.2,
  knifeSweepSeconds: 1.1,
  cornScore: 100,
  stageBonus: 500,
  timeBonusPerSecond: 5,
  startLives: 3,
};

// A stage is a small data table: where the turkey starts, the gate, the farmers'
// patrol loops, haystacks (hide spots), shadow patches, the chicken flock, corn,
// walls (line-of-sight blockers) and, for the kitchen, the oven and knife lane.
export const STAGES = [
  {
    name: 'THE FARMYARD',
    sub: 'Stage 1 — slip past Farmer Bram',
    seed: 1127,
    turkeyStart: { x: 70, y: 520 },
    gate: { x: 900, y: 60, w: 46, h: 46 },
    farmers: [
      {
        waypoints: [
          { x: 300, y: 140 },
          { x: 700, y: 140 },
          { x: 700, y: 420 },
          { x: 300, y: 420 },
        ],
        speed: 62,
      },
    ],
    haystacks: [
      { x: 210, y: 250, r: 42 },
      { x: 620, y: 300, r: 42 },
      { x: 430, y: 480, r: 42 },
    ],
    shadows: [
      { x: 120, y: 120, rx: 110, ry: 60 },
      { x: 760, y: 480, rx: 120, ry: 55 },
    ],
    chickens: [
      { x: 500, y: 180 },
      { x: 540, y: 210 },
      { x: 470, y: 230 },
      { x: 820, y: 300 },
      { x: 180, y: 420 },
    ],
    corn: [
      { x: 250, y: 120 },
      { x: 700, y: 200 },
      { x: 480, y: 350 },
      { x: 850, y: 480 },
    ],
    walls: [
      { x: 0, y: 0, w: 960, h: 14 },
      { x: 0, y: 586, w: 960, h: 14 },
      { x: 0, y: 0, w: 14, h: 600 },
      { x: 946, y: 0, w: 14, h: 600 },
      { x: 400, y: 250, w: 160, h: 14 },
      { x: 120, y: 380, w: 140, h: 14 },
    ],
    oven: null,
    knifeLane: null,
    palette: 'yard',
  },
  {
    name: 'THE BARN',
    sub: 'Stage 2 — two lanterns, darker hay',
    seed: 227,
    turkeyStart: { x: 70, y: 520 },
    gate: { x: 900, y: 60, w: 46, h: 46 },
    farmers: [
      {
        waypoints: [
          { x: 260, y: 130 },
          { x: 700, y: 130 },
          { x: 700, y: 300 },
          { x: 260, y: 300 },
        ],
        speed: 66,
      },
      {
        waypoints: [
          { x: 700, y: 470 },
          { x: 300, y: 470 },
          { x: 300, y: 330 },
          { x: 700, y: 330 },
        ],
        speed: 58,
      },
    ],
    haystacks: [
      { x: 180, y: 200, r: 42 },
      { x: 480, y: 200, r: 42 },
      { x: 780, y: 200, r: 42 },
      { x: 480, y: 440, r: 42 },
    ],
    shadows: [
      { x: 120, y: 90, rx: 130, ry: 70 },
      { x: 820, y: 90, rx: 110, ry: 70 },
      { x: 480, y: 520, rx: 150, ry: 55 },
    ],
    chickens: [
      { x: 350, y: 250 },
      { x: 390, y: 280 },
      { x: 610, y: 250 },
      { x: 650, y: 280 },
      { x: 200, y: 480 },
      { x: 820, y: 420 },
    ],
    corn: [
      { x: 180, y: 110 },
      { x: 780, y: 110 },
      { x: 480, y: 310 },
      { x: 150, y: 500 },
      { x: 850, y: 500 },
    ],
    walls: [
      { x: 0, y: 0, w: 960, h: 14 },
      { x: 0, y: 586, w: 960, h: 14 },
      { x: 0, y: 0, w: 14, h: 600 },
      { x: 946, y: 0, w: 14, h: 600 },
      { x: 430, y: 200, w: 120, h: 14 },
      { x: 470, y: 240, w: 120, h: 14 },
      { x: 120, y: 380, w: 140, h: 14 },
      { x: 760, y: 200, w: 14, h: 120 },
    ],
    oven: null,
    knifeLane: null,
    palette: 'barn',
  },
  {
    name: 'THE KITCHEN',
    sub: 'Stage 3 — the oven is lit, the knife is out',
    seed: 327,
    turkeyStart: { x: 70, y: 520 },
    gate: { x: 900, y: 60, w: 46, h: 46 },
    farmers: [
      {
        waypoints: [
          { x: 280, y: 150 },
          { x: 700, y: 150 },
          { x: 700, y: 430 },
          { x: 280, y: 430 },
        ],
        speed: 78,
        knife: true,
      },
    ],
    haystacks: [
      { x: 200, y: 260, r: 40 },
      { x: 740, y: 320, r: 40 },
    ],
    shadows: [
      { x: 120, y: 110, rx: 120, ry: 60 },
      { x: 820, y: 490, rx: 120, ry: 55 },
    ],
    chickens: [
      { x: 480, y: 200 },
      { x: 520, y: 230 },
      { x: 450, y: 240 },
    ],
    corn: [
      { x: 220, y: 110 },
      { x: 700, y: 110 },
      { x: 480, y: 300 },
      { x: 150, y: 480 },
      { x: 840, y: 460 },
    ],
    walls: [
      { x: 0, y: 0, w: 960, h: 14 },
      { x: 0, y: 586, w: 960, h: 14 },
      { x: 0, y: 0, w: 14, h: 600 },
      { x: 946, y: 0, w: 14, h: 600 },
      { x: 400, y: 250, w: 160, h: 14 },
      { x: 120, y: 380, w: 140, h: 14 },
      { x: 430, y: 90, w: 200, h: 14 },
    ],
    oven: { x: 700, y: 470, w: 170, h: 90 },
    knifeLane: { y: 300, x0: 60, x1: 900, period: 4.2, sweep: 1.1 },
    palette: 'kitchen',
  },
];
