// Tiny synthesized sound effects (WebAudio, no audio files): gobbles, footsteps,
// the alert sting when the farmer spots you, and the escape jingle. All sound is
// generated in code, so the game stays fully offline and asset-free.

let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}
export function isMuted() {
  return muted;
}

function ensureContext() {
  if (context) return context;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    context = new AC();
  } catch {
    return null;
  }
  return context;
}

function tone(freq, dur, type, vol, when, slideTo) {
  const ac = ensureContext();
  if (!ac || muted) return;
  const t0 = ac.currentTime + (when || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playGobble() {
  tone(320, 0.09, 'square', 0.05, 0, 240);
  tone(280, 0.09, 'square', 0.05, 0.09, 200);
  tone(360, 0.12, 'square', 0.05, 0.18, 260);
}

export function playStep() {
  tone(140, 0.05, 'triangle', 0.03, 0, 90);
}

export function playAlert() {
  tone(520, 0.16, 'sawtooth', 0.1, 0, 780);
  tone(780, 0.22, 'sawtooth', 0.1, 0.14, 1040);
}

export function playCaught() {
  tone(300, 0.5, 'sawtooth', 0.12, 0, 90);
  tone(180, 0.4, 'square', 0.08, 0.1, 70);
}

export function playClear() {
  tone(523, 0.12, 'sine', 0.1, 0, 0);
  tone(659, 0.12, 'sine', 0.1, 0.11, 0);
  tone(784, 0.2, 'sine', 0.1, 0.22, 0);
}

export function playEscape() {
  const notes = [523, 659, 784, 1046, 784, 1046];
  notes.forEach((n, i) => tone(n, 0.16, 'triangle', 0.1, i * 0.13, 0));
}
