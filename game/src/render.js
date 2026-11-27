// All drawing for Dusk Escape: the dusk farm, the turkey, the farmers' lantern
// cones, the HUD and the title / end screens. Every pixel is canvas vector art;
// no image, font or sound file is loaded, so the game runs fully offline.

import { FIELD, TUNING } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';

const PALETTES = {
  yard: {
    floor: '#c98f4e', floorDark: '#b57e3e', wall: '#7a5230', wallTop: '#8d5f36',
    grass: '#8a6b2f', sky: '#e8803c',
  },
  barn: {
    floor: '#6e4a2c', floorDark: '#5d3d24', wall: '#4a2e1a', wallTop: '#5a3a22',
    grass: '#4c3a22', sky: '#c96a2e',
  },
  kitchen: {
    floor: '#b8a88a', floorDark: '#a3947a', wall: '#7c6a52', wallTop: '#8d7a60',
    grass: '#8a7a5c', sky: '#d97a30',
  },
};

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.55);
  ctx.bezierCurveTo(x - s, y - s * 0.1, x - s * 0.45, y - s * 0.8, x, y - s * 0.25);
  ctx.bezierCurveTo(x + s * 0.45, y - s * 0.8, x + s, y - s * 0.1, x, y + s * 0.55);
  ctx.fill();
}

function drawTurkey(ctx, x, y, dir, t, time, opts) {
  const o = opts || {};
  ctx.save();
  ctx.translate(x, y);
  // Tail fan behind the body.
  ctx.fillStyle = '#6b4423';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate(dir + Math.PI + i * 0.38);
    ctx.beginPath();
    ctx.ellipse(-16, 0, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#8a5a2e';
  ctx.beginPath();
  ctx.ellipse(-12, 0, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body, squashed when sneaking.
  const squash = o.sneak ? 0.72 : 1;
  ctx.rotate(dir);
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 12 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#9c6a35';
  ctx.beginPath();
  ctx.ellipse(-2, 0, 12, 8 * squash, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head, beak, wattle, eye.
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.arc(16, -4 * squash, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath();
  ctx.moveTo(21, -6 * squash);
  ctx.lineTo(29, -3 * squash);
  ctx.lineTo(21, -1 * squash);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c22e2e';
  ctx.beginPath();
  ctx.ellipse(19, 2 * squash, 3, 5 * squash, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(18, -6 * squash, 1.8, 0, Math.PI * 2);
  ctx.fill();
  // Feet, scuttling when moving.
  const step = t && t.moving ? Math.sin(time * 14) * 3 : 0;
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 8 * squash);
  ctx.lineTo(-4 + step, 13);
  ctx.moveTo(5, 8 * squash);
  ctx.lineTo(5 - step, 13);
  ctx.stroke();
  ctx.restore();
  if (o.blend) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLENDING…', x, y - 26);
  }
}

function drawFarmer(ctx, f, time, knife) {
  ctx.save();
  ctx.translate(f.x, f.y);
  const chase = f.mode === 'chase';
  // Lantern cone.
  ctx.save();
  ctx.rotate(f.dir);
  const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, 175);
  grad.addColorStop(0, chase ? 'rgba(255,80,40,0.34)' : 'rgba(255,214,120,0.30)');
  grad.addColorStop(1, 'rgba(255,214,120,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 175, -0.62, 0.62);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Body: overalls, shirt, head, straw hat.
  ctx.rotate(f.dir);
  ctx.fillStyle = '#3a5a8c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d8c49a';
  ctx.beginPath();
  ctx.arc(14, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c93c';
  ctx.beginPath();
  ctx.ellipse(14, -3, 13, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c93c';
  ctx.beginPath();
  ctx.arc(14, -3, 6, 0, Math.PI * 2);
  ctx.fill();
  // Lantern in hand: warm glow.
  const flicker = 0.85 + Math.sin(time * 9 + f.bob) * 0.15;
  const glow = ctx.createRadialGradient(18, 10, 1, 18, 10, 26 * flicker);
  glow.addColorStop(0, 'rgba(255,220,130,0.95)');
  glow.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(18, 10, 26 * flicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a12';
  ctx.fillRect(15, 5, 6, 10);
  // The carving knife, carried in the kitchen stage.
  if (knife) {
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(16, -12);
    ctx.lineTo(34, -20);
    ctx.stroke();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(12, -14, 6, 4);
  }
  ctx.restore();
  if (chase) {
    ctx.fillStyle = '#ff4a2e';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', f.x, f.y - 26);
  }
}

function drawHaystack(ctx, h, time) {
  ctx.save();
  ctx.translate(h.x, h.y);
  ctx.fillStyle = '#d8a93c';
  ctx.beginPath();
  ctx.moveTo(-h.r, 0);
  ctx.quadraticCurveTo(0, -h.r * 1.5, h.r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#a87e22';
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * h.r * 0.32, -h.r * 0.25 - Math.abs(i) * -4);
    ctx.quadraticCurveTo(i * h.r * 0.36, -h.r * 0.9, i * h.r * 0.28, -h.r * 1.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawChicken(ctx, c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  const peck = Math.max(0, Math.sin(c.peck)) * 4;
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -4 + peck, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a13c';
  ctx.beginPath();
  ctx.moveTo(9, -5 + peck);
  ctx.lineTo(13, -3 + peck);
  ctx.lineTo(9, -2 + peck);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#c22e2e';
  ctx.fillRect(5, -9 + peck, 3, 3);
  ctx.restore();
}

function drawCorn(ctx, c, time) {
  ctx.save();
  ctx.translate(c.x, c.y + Math.sin(time * 3 + c.x) * 2);
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 11, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c8901a';
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * 3, -9);
    ctx.lineTo(i * 3, 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a7a2e';
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(0, 14);
  ctx.lineTo(6, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGate(ctx, gate, open, time) {
  ctx.save();
  ctx.fillStyle = open ? '#3a8c3a' : '#6a5a3a';
  ctx.fillRect(gate.x - 6, gate.y - 6, 8, gate.h + 12);
  ctx.fillRect(gate.x + gate.w - 2, gate.y - 6, 8, gate.h + 12);
  ctx.fillStyle = open ? '#7ae07a' : '#8a7a5a';
  ctx.fillRect(gate.x - 6, gate.y - 10, gate.w + 12, 8);
  if (open) {
    const pulse = 0.6 + Math.sin(time * 5) * 0.4;
    ctx.fillStyle = `rgba(122,224,122,${0.25 + pulse * 0.25})`;
    ctx.fillRect(gate.x, gate.y, gate.w, gate.h);
    ctx.fillStyle = '#1a4a1a';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', gate.x + gate.w / 2, gate.y + gate.h / 2 + 5);
  } else {
    ctx.fillStyle = '#d8c49a';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', gate.x + gate.w / 2, gate.y + gate.h / 2 + 4);
  }
  ctx.restore();
}

function drawOven(ctx, oven, heat, time) {
  ctx.save();
  const glow = 0.5 + Math.sin(time * 4) * 0.2 + (heat > 0 ? 0.3 : 0);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(oven.x, oven.y, oven.w, oven.h);
  ctx.fillStyle = `rgba(255,${Math.round(90 + glow * 60)},20,${0.55 + glow * 0.3})`;
  ctx.fillRect(oven.x + 12, oven.y + 12, oven.w - 24, oven.h - 24);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(oven.x + 30, oven.y + 28, oven.w - 60, 6);
  ctx.fillRect(oven.x + 30, oven.y + 52, oven.w - 60, 6);
  ctx.fillStyle = '#ffd870';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('OVEN — HOT!', oven.x + oven.w / 2, oven.y - 8);
  ctx.restore();
}

function drawKnifeLane(ctx, lane, knife, time) {
  ctx.save();
  const warn = lane.period - (time % lane.period) < 0.8;
  ctx.strokeStyle = warn ? '#ff4a2e' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(lane.x0, lane.y);
  ctx.lineTo(lane.x1, lane.y);
  ctx.stroke();
  ctx.setLineDash([]);
  if (warn) {
    ctx.fillStyle = '#ff4a2e';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! KNIFE !', lane.x0 + 40, lane.y - 10);
  }
  if (knife.active) {
    ctx.save();
    ctx.translate(knife.x, lane.y);
    ctx.rotate(Math.PI / 2);
    ctx.fillStyle = '#e8e8e8';
    ctx.beginPath();
    ctx.moveTo(-4, -26);
    ctx.lineTo(4, -26);
    ctx.lineTo(2, 6);
    ctx.lineTo(-2, 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-5, 6, 10, 12);
    ctx.restore();
  }
  ctx.restore();
}

function drawFloor(ctx, state) {
  const pal = PALETTES[state.def.palette];
  const w = FIELD.width;
  const h = FIELD.height;
  ctx.fillStyle = pal.floor;
  ctx.fillRect(0, 0, w, h);
  // Floor texture: faint planks or tiles.
  ctx.fillStyle = pal.floorDark;
  if (state.def.palette === 'kitchen') {
    for (let y = 0; y < h; y += 40) {
      for (let x = ((y / 40) % 2) * 40; x < w; x += 80) ctx.fillRect(x, y, 40, 40);
    }
  } else {
    for (let y = 20; y < h; y += 46) ctx.fillRect(0, y, w, 3);
    for (let x = 30; x < w; x += 90) ctx.fillRect(x, 0, 3, h);
  }
  // Dusk light from the top-left.
  const light = ctx.createRadialGradient(120, 60, 40, 120, 60, 700);
  light.addColorStop(0, 'rgba(255,190,90,0.20)');
  light.addColorStop(1, 'rgba(60,20,60,0.18)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  // Walls.
  for (const wall of state.def.walls) {
    ctx.fillStyle = pal.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = pal.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
  }
  // Shadow patches (cool dark ellipses).
  for (const s of state.def.shadows) {
    ctx.fillStyle = 'rgba(20,16,48,0.34)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawWorld(ctx, state, time) {
  drawFloor(ctx, state);
  const def = state.def;
  if (def.oven) drawOven(ctx, def.oven, state.ovenHeat, time);
  if (def.knifeLane) drawKnifeLane(ctx, def.knifeLane, state.knife, time);
  for (const h of def.haystacks) drawHaystack(ctx, h, time);
  drawGate(ctx, def.gate, state.gateOpen, time);
  for (const c of state.corn) if (!c.taken) drawCorn(ctx, c, time);
  for (const c of state.chickens) drawChicken(ctx, c);
  for (const f of state.farmers) drawFarmer(ctx, f, time, f.knife);
  const t = state.turkey;
  if (t.hidden) {
    // Only the head pokes out of the hay.
    const h = def.haystacks.find((hh) => Math.hypot(t.x - hh.x, t.y - hh.y) < hh.r * 0.8);
    if (h) drawHaystack(ctx, h, time);
    ctx.save();
    ctx.translate(t.x, t.y - h.r * 0.5);
    ctx.fillStyle = '#7a4a22';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.moveTo(6, -2);
    ctx.lineTo(12, 0);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(2, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN IN THE HAY', t.x, t.y - h.r - 8);
  } else {
    drawTurkey(ctx, t.x, t.y, t.dir, t, time, { sneak: t.sneaking, blend: t.blending });
  }
  drawHUD(ctx, state, time);
}

export function drawHUD(ctx, state, time) {
  const def = state.def;
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.72)';
  ctx.fillRect(0, 0, FIELD.width, 40);
  ctx.fillStyle = '#ffd870';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${state.score}`, 14, 26);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(def.name, 180, 25);
  ctx.fillStyle = '#c9b896';
  ctx.font = '12px monospace';
  ctx.fillText(`${state.cornGot}/${state.cornTotal} CORN`, 400, 25);
  for (let i = 0; i < TUNING.startLives; i += 1) {
    heart(ctx, 560 + i * 22, 20, 9, i < state.lives ? '#e84a3a' : '#4a3a30');
  }
  // Detection meter.
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('SEEN', 640, 25);
  ctx.fillStyle = '#2a1a12';
  ctx.fillRect(690, 14, 150, 14);
  const m = state.meter / 100;
  ctx.fillStyle = m > 0.75 ? '#ff4a2e' : m > 0.4 ? '#f2a230' : '#7ac74a';
  ctx.fillRect(690, 14, 150 * m, 14);
  ctx.strokeStyle = '#f2ead8';
  ctx.lineWidth = 1;
  ctx.strokeRect(690, 14, 150, 14);
  // Status line.
  let status = '';
  let color = '#c9b896';
  if (state.turkey.seen) {
    status = state.meter >= 100 ? 'RUN! HE SEES YOU!' : 'SPOTTED — BREAK LINE OF SIGHT!';
    color = '#ff6a4a';
  } else if (state.turkey.hidden) {
    status = 'HIDDEN — WAIT FOR THE LANTERN TO PASS';
    color = '#7ae07a';
  } else if (state.turkey.blending) {
    status = 'BLENDING IN WITH THE FLOCK';
    color = '#7ae07a';
  } else if (state.gateOpen) {
    status = 'GATE OPEN — RUN FOR THE EXIT!';
    color = '#ffd870';
  }
  if (status) {
    ctx.fillStyle = color;
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(status, FIELD.width / 2, FIELD.height - 12);
  }
  ctx.fillStyle = '#c9b896';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('WASD/ARROWS move · SHIFT sneak · SPACE run · M mute', 14, FIELD.height - 12);
  ctx.restore();
}

export function drawTitle(ctx, time, best) {
  // The poster frame: a golden-hour farmhouse, the turkey mid-leap over the
  // carving knife, the farmer a silhouette in the doorway.
  const w = FIELD.width;
  const h = FIELD.height;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#3a2350');
  sky.addColorStop(0.45, '#c65a2e');
  sky.addColorStop(0.75, '#e8803c');
  sky.addColorStop(1, '#7a4a22');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // Low sun.
  const sun = ctx.createRadialGradient(700, 330, 10, 700, 330, 180);
  sun.addColorStop(0, 'rgba(255,230,150,0.95)');
  sun.addColorStop(0.4, 'rgba(255,180,80,0.55)');
  sun.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(480, 120, 440, 420);
  ctx.fillStyle = '#ffd870';
  ctx.beginPath();
  ctx.arc(700, 330, 52, 0, Math.PI * 2);
  ctx.fill();
  // Farmhouse silhouette with a lit doorway.
  ctx.fillStyle = '#2a1a2e';
  ctx.fillRect(90, 300, 260, 150);
  ctx.beginPath();
  ctx.moveTo(70, 300);
  ctx.lineTo(220, 220);
  ctx.lineTo(370, 300);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd870';
  ctx.fillRect(200, 360, 40, 90);
  // Farmer Bram, a silhouette watching from the lit doorway.
  ctx.fillStyle = '#2a1a2e';
  ctx.beginPath();
  ctx.arc(220, 388, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(220, 424, 22, 18, 0, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(220, 380, 20, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(220, 378, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffd870';
  ctx.fillRect(120, 330, 34, 30);
  ctx.fillRect(280, 330, 34, 30);
  // Fence.
  ctx.fillStyle = '#2a1a2e';
  for (let x = 420; x < w; x += 46) ctx.fillRect(x, 420, 8, 40);
  ctx.fillRect(420, 430, w - 420, 6);
  ctx.fillRect(420, 448, w - 420, 6);
  // Ground.
  ctx.fillStyle = '#4a2e16';
  ctx.fillRect(0, 450, w, 150);
  ctx.fillStyle = '#5d3a1c';
  for (let i = 0; i < 40; i += 1) {
    const gx = (i * 137) % w;
    ctx.fillRect(gx, 470 + ((i * 53) % 110), 26, 3);
  }
  // The carving knife lying on the ground, gleaming.
  ctx.save();
  ctx.translate(600, 528);
  ctx.rotate(-1.35);
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.moveTo(-8, -70);
  ctx.lineTo(8, -70);
  ctx.lineTo(4, 10);
  ctx.lineTo(-4, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-2, -66, 3, 70);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-9, 10, 18, 30);
  ctx.restore();
  // The turkey mid-leap over the knife, drawn large: the poster's hero.
  const leap = Math.sin(time * 2) * 8;
  ctx.save();
  ctx.translate(620, 462 + leap);
  ctx.scale(1.9, 1.9);
  drawTurkey(ctx, 0, 0, -0.5, { moving: true }, time, {});
  ctx.restore();
  // Title block.
  ctx.fillStyle = 'rgba(20,10,6,0.55)';
  ctx.fillRect(0, 30, w, 150);
  ctx.fillStyle = '#ffd870';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DUSK ESCAPE', w / 2, 100);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText("A TURKEY'S LAST THANKSGIVING", w / 2, 136);
  ctx.fillStyle = '#ffb060';
  ctx.font = '15px monospace';
  ctx.fillText('Sneak past the farmer · Hide in the hay · Blend with the flock · Mind the oven and the knife', w / 2, 165);
  const blink = Math.sin(time * 4) > 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('PRESS ENTER TO PLAY', w / 2, 560);
  }
  ctx.fillStyle = '#d8c49a';
  ctx.font = '13px monospace';
  ctx.fillText('WASD / ARROWS move   SHIFT sneak   M mute', w / 2, 585);
  if (best > 0) {
    ctx.fillStyle = '#ffd870';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`BEST SCORE ${best}`, w / 2, 210);
  }
}

export function drawStageClear(ctx, state) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,12,8,0.72)';
  ctx.fillRect(0, 200, FIELD.width, 130);
  ctx.fillStyle = '#7ae07a';
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STAGE CLEAR!', FIELD.width / 2, 260);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`+${TUNING.stageBonus} BONUS  ·  NEXT: ${STAGES[state.stageIndex + 1].name}`, FIELD.width / 2, 300);
  ctx.restore();
}

export function drawOver(ctx, state, reason) {
  ctx.save();
  ctx.fillStyle = 'rgba(16,8,6,0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#ff6a4a';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(reason === 'oven' ? 'TOO HOT!' : reason === 'knife' ? 'SLICED!' : 'CAUGHT!', FIELD.width / 2, 240);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(
    reason === 'oven'
      ? 'The oven got you. Thanksgiving dinner, after all.'
      : reason === 'knife'
        ? 'The carving knife found you mid-sweep.'
        : 'Farmer Bram caught you. Thanksgiving dinner, after all.',
    FIELD.width / 2,
    285,
  );
  ctx.fillStyle = '#ffd870';
  ctx.font = 'bold 22px monospace';
  ctx.fillText(`SCORE ${state.score}   ·   STAGE ${state.stageIndex + 1}`, FIELD.width / 2, 330);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('PRESS R TO TRY AGAIN', FIELD.width / 2, 390);
  ctx.restore();
}

export function drawEscaped(ctx, state) {
  ctx.save();
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, '#101a3a');
  sky.addColorStop(1, '#3a2a5a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i += 1) {
    const sx = (i * 173) % FIELD.width;
    const sy = (i * 97) % 300;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.arc(780, 110, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101a3a';
  ctx.beginPath();
  ctx.arc(765, 100, 36, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7ae07a';
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ESCAPED!', FIELD.width / 2, 250);
  ctx.fillStyle = '#f2ead8';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('Pip the turkey slipped the farm, the barn and the kitchen —', FIELD.width / 2, 295);
  ctx.fillText('no Thanksgiving dinner tonight.', FIELD.width / 2, 325);
  ctx.fillStyle = '#ffd870';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`FINAL SCORE ${state.score}`, FIELD.width / 2, 380);
  drawTurkey(ctx, FIELD.width / 2, 470, -Math.PI / 2, { moving: false }, 0, {});
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('PRESS R TO PLAY AGAIN', FIELD.width / 2, 545);
  ctx.restore();
}
