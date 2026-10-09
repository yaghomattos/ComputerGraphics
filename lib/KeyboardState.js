/**
 * Polled keyboard state.
 *
 * Call update() once per frame, then:
 *  - pressed(key): key is held down
 *  - down(key):    key went down since the previous update()
 *  - up(key):      key went up since the previous update()
 *
 * Keys are named by letter ('Q', 'a') or by alias: 'space', 'enter',
 * 'left', 'up', 'right', 'down', 'shift', 'ctrl', 'alt', 'esc', 'tab'.
 */
const ALIASES = {
  space: ' ',
  enter: 'enter',
  left: 'arrowleft',
  up: 'arrowup',
  right: 'arrowright',
  down: 'arrowdown',
  shift: 'shift',
  ctrl: 'control',
  alt: 'alt',
  esc: 'escape',
  tab: 'tab',
};

function normalize(name) {
  const lower = name.toLowerCase();
  return ALIASES[lower] ?? lower;
}

export default class KeyboardState {
  constructor() {
    this.held = new Set();
    this.pending = []; // raw events since the last update()
    this.wentDown = new Set();
    this.wentUp = new Set();

    window.addEventListener('keydown', (event) => {
      if (event.key.startsWith('Arrow') || event.key === ' ') event.preventDefault();
      if (!event.repeat) this.pending.push({ key: normalize(event.key), down: true });
    });
    window.addEventListener('keyup', (event) => {
      this.pending.push({ key: normalize(event.key), down: false });
    });
    // Releasing keys while the window is unfocused would leave them stuck.
    window.addEventListener('blur', () => this.held.clear());
  }

  update() {
    this.wentDown.clear();
    this.wentUp.clear();
    for (const { key, down } of this.pending) {
      if (down) {
        this.held.add(key);
        this.wentDown.add(key);
      } else {
        this.held.delete(key);
        this.wentUp.add(key);
      }
    }
    this.pending = [];
  }

  pressed(name) {
    return this.held.has(normalize(name));
  }

  down(name) {
    return this.wentDown.has(normalize(name));
  }

  up(name) {
    return this.wentUp.has(normalize(name));
  }
}
