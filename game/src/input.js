// Keyboard (and mouse-free) input: WASD or arrows to move, Shift to sneak,
// Enter to start, R to restart, M to mute. Keys are tracked as a held set so the
// game reads smooth held movement instead of single key presses.

const held = new Set();

const MOVE_KEYS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

export function installInput(onAction) {
  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.code] || event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'Space') {
      event.preventDefault();
    }
    if (event.repeat) return;
    held.add(event.code);
    if (event.code === 'Enter' || event.code === 'KeyR' || event.code === 'KeyM') {
      onAction(event.code);
    }
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.code);
  });
  window.addEventListener('blur', () => held.clear());
}

export function readMovement() {
  let dx = 0;
  let dy = 0;
  for (const code of held) {
    const dir = MOVE_KEYS[code];
    if (dir) {
      dx += dir[0];
      dy += dir[1];
    }
  }
  return {
    dx,
    dy,
    sneak: held.has('ShiftLeft') || held.has('ShiftRight'),
    run: held.has('Space'),
  };
}
