import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIGHT, createFlightState, stepFlight } from '../flight.js';

const flat = () => 0;
const idle = { throttle: 0, pitch: 0, roll: 0 };

function run(state, input, seconds, { dt = 1 / 60, ground = flat, bounds } = {}) {
  const frames = Math.round(seconds / dt);
  for (let frame = 0; frame < frames; frame++) {
    if (stepFlight(state, input, dt, ground, bounds).crashed) return true;
  }
  return false;
}

function airborne(speed, z = 200) {
  return createFlightState({ z, speed, throttle: speed / FLIGHT.MAX_SPEED, onGround: false });
}

test('a stopped airplane does not move, climb or turn', () => {
  const s = createFlightState();
  run(s, { throttle: 0, pitch: 1, roll: -1 }, 2);
  assert.deepEqual([s.x, s.y, s.z, s.heading], [0, 0, 0, 0]);
});

test('below the stall speed the airplane taxis but cannot take off', () => {
  const s = createFlightState({ throttle: 0.2 });
  run(s, { throttle: 0, pitch: 1, roll: 0 }, 5);
  assert.ok(s.speed > 30 && s.speed < FLIGHT.STALL_SPEED, `speed ${s.speed}`);
  assert.ok(s.y > 50, 'moved forward');
  assert.equal(s.z, 0);
  assert.equal(s.onGround, true);
});

test('taxiing steers without banking', () => {
  const s = createFlightState({ speed: 30, throttle: 0.1 });
  run(s, { throttle: 0, pitch: 0, roll: -1 }, 1);
  assert.ok(s.heading > 0.5, 'turned left');
  assert.equal(s.bank, 0);
});

test('above the stall speed pulling up takes off', () => {
  const s = createFlightState({ throttle: 0.5 });
  run(s, { throttle: 0, pitch: 0, roll: 0 }, 4);
  assert.ok(s.speed >= FLIGHT.STALL_SPEED);
  run(s, { throttle: 0, pitch: 1, roll: 0 }, 2);
  assert.equal(s.onGround, false);
  assert.ok(s.z > 20, `z ${s.z}`);
});

test('slower airplanes turn tighter', () => {
  const radius = (speed) => {
    const s = airborne(speed);
    const right = { throttle: 0, pitch: 0, roll: 1 };
    run(s, right, 1); // roll in
    const heading = s.heading;
    run(s, right, 0.5);
    return (s.speed * 0.5) / Math.abs(s.heading - heading);
  };
  const slow = radius(120);
  const fast = radius(280);
  assert.ok(slow < 130, `slow radius ${slow}`);
  assert.ok(fast > 2 * slow, `fast radius ${fast}`);
});

test('without lift the airplane sinks and cannot climb', () => {
  const s = airborne(40);
  s.throttle = 0;
  run(s, { throttle: 0, pitch: 1, roll: 0 }, 1);
  assert.ok(s.z < 200 - 20, `z ${s.z}`);
  assert.ok(s.pitch < 0, 'nose dropped');
});

test('the closed throttle brakes the airplane to a stop on the ground', () => {
  const s = createFlightState({ speed: 60 });
  run(s, idle, 5);
  assert.equal(s.speed, 0);
});

test('the result does not depend on the frame rate', () => {
  const at30 = airborne(150);
  const at144 = airborne(150);
  const input = { throttle: 1, pitch: 1, roll: 1 };
  run(at30, input, 3, { dt: 1 / 30 });
  run(at144, input, 3, { dt: 1 / 144 });
  const distance = Math.hypot(at30.x - at144.x, at30.y - at144.y, at30.z - at144.z);
  // Same trajectory, up to the fixed step not yet simulated in one of them.
  const oneStep = FLIGHT.MAX_SPEED * 1.2 * FLIGHT.FIXED_DT;
  assert.ok(distance < oneStep, `trajectories differ by ${distance}`);
});

test('a gentle landing is fine, a steep dive into the ground is a crash', () => {
  const gentle = airborne(120, 3);
  assert.equal(run(gentle, { throttle: 0, pitch: -1, roll: 0 }, 1), false);
  assert.equal(gentle.onGround, true);

  const dive = airborne(250, 150);
  assert.equal(run(dive, { throttle: 0, pitch: -1, roll: 0 }, 5), true);
});

test('flying into a wall is a crash, rolling over a curb is not', () => {
  const wallAhead = (x, y) => (y > 100 ? 50 : 0);
  assert.equal(run(airborne(120, 20), idle, 2, { ground: wallAhead }), true);

  const curb = (x, y) => (y > 20 ? 2 : 0);
  const taxi = createFlightState({ speed: 40, throttle: 0.15 });
  assert.equal(run(taxi, idle, 2, { ground: curb }), false);
  assert.equal(taxi.z, 2);
});

test('the airplane cannot leave the map bounds', () => {
  const s = airborne(250);
  const bounds = { minX: -100, maxX: 100, minY: -100, maxY: 100 };
  run(s, idle, 3, { bounds });
  assert.equal(s.y, 100);
  assert.ok(Math.abs(s.x) <= 100);
});
