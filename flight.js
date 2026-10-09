/**
 * Arcade flight model of the 14-bis, independent of three.js and of the frame rate.
 *
 * Units: scene units (u) and seconds. The scene is Z-up; heading 0 points to +Y and grows
 * counter-clockwise (left turn). Pitch > 0 is nose up; bank > 0 is right wing down (right turn).
 *
 * The airplane turns by banking: turn rate = TURN_GRAVITY * tan(bank) / speed, so the slower it
 * flies, the tighter it turns. Climb follows the nose: vertical speed = speed * sin(pitch). Below
 * STALL_SPEED there is no lift: it cannot climb, and in the air it sinks.
 */

const deg = (degrees) => (degrees * Math.PI) / 180;

export const FLIGHT = {
  MAX_SPEED: 300, // u/s at full throttle
  STALL_SPEED: 80, // u/s, minimum speed to take off and to keep lift
  THROTTLE_RATE: 0.6, // throttle change per second while Q/A is held
  SPEED_RESPONSE: 0.7, // 1/s, how fast speed approaches the throttle setting
  GROUND_BRAKE: 40, // u/s², extra deceleration on the ground with the throttle closed
  GRAVITY_ALONG_PATH: 40, // u/s², speed lost climbing / gained diving

  ROLL_RATE: deg(90), // rad/s
  MAX_BANK: deg(60),
  LEVEL_RATE: deg(60), // rad/s, wings return to level when no roll input
  TURN_GRAVITY: 220, // u/s², sets the turn radius: speed² / (TURN_GRAVITY * tan(bank))
  MIN_TURN_SPEED: 40, // u/s, avoids infinite turn rates at very low speed
  MAX_TURN_RATE: deg(60), // rad/s, keeps slow flight from becoming twitchy

  PITCH_RATE: deg(40), // rad/s
  MAX_PITCH: deg(25),
  PITCH_RETURN: deg(30), // rad/s, nose returns to level when no pitch input
  STALL_PITCH: deg(-10), // nose attitude the airplane falls into when stalled
  STALL_SINK: 40, // u/s, sink rate with no lift at all

  TAXI_TURN_RATE: deg(45), // rad/s, steering on the ground
  TAXI_FULL_TURN_SPEED: 20, // u/s, steering reaches full rate at this speed

  CRASH_SINK_RATE: 35, // u/s, touching the ground faster than this is a crash
  MAX_STEP: 3, // u, higher obstacles in front of the airplane are walls (crash)
  MAX_ALTITUDE: 2000,
  FIXED_DT: 1 / 120, // s, the simulation always advances in steps of this size
  MAX_FRAME_DT: 0.25, // s, longer frames (e.g. a hidden tab) are not caught up
};

export function createFlightState({ x = 0, y = 0, z = 0, heading = 0, speed = 0, throttle = 0, onGround = true } = {}) {
  return { x, y, z, heading, speed, throttle, pitch: 0, bank: 0, verticalSpeed: 0, onGround, pendingTime: 0 };
}

function approach(value, target, maxDelta) {
  if (value < target) return Math.min(target, value + maxDelta);
  return Math.max(target, value - maxDelta);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* 0 (no lift) .. 1 (full lift) */
export function liftFactor(speed) {
  return clamp((speed / FLIGHT.STALL_SPEED) ** 2, 0, 1);
}

/**
 * Advances the simulation by the frame time dt, in fixed steps so the result does not depend on
 * the frame rate (the remainder is kept for the next frame).
 *
 * input: { throttle, pitch, roll } each -1, 0 or 1 (pitch 1 = nose up, roll 1 = right).
 * groundHeightAt(x, y): height of whatever is below the point (ground or building top).
 * bounds: optional { minX, maxX, minY, maxY } the airplane cannot leave.
 *
 * Returns { crashed } and mutates state.
 */
export function stepFlight(state, input, dt, groundHeightAt, bounds) {
  state.pendingTime += Math.min(dt, FLIGHT.MAX_FRAME_DT);
  while (state.pendingTime >= FLIGHT.FIXED_DT) {
    state.pendingTime -= FLIGHT.FIXED_DT;
    if (step(state, input, FLIGHT.FIXED_DT, groundHeightAt, bounds)) {
      state.pendingTime = 0;
      return { crashed: true };
    }
  }
  return { crashed: false };
}

function step(s, input, dt, groundHeightAt, bounds) {
  const F = FLIGHT;

  // Engine and speed
  s.throttle = clamp(s.throttle + input.throttle * F.THROTTLE_RATE * dt, 0, 1);
  s.speed += (s.throttle * F.MAX_SPEED - s.speed) * F.SPEED_RESPONSE * dt;
  s.speed -= F.GRAVITY_ALONG_PATH * Math.sin(s.pitch) * dt;
  if (s.onGround && s.throttle === 0) s.speed -= F.GROUND_BRAKE * dt;
  s.speed = clamp(s.speed, 0, F.MAX_SPEED * 1.2);
  const lift = liftFactor(s.speed);

  // Roll: no banking on the ground
  if (s.onGround || input.roll === 0) s.bank = approach(s.bank, 0, F.LEVEL_RATE * dt);
  else s.bank = clamp(s.bank + input.roll * F.ROLL_RATE * dt, -F.MAX_BANK, F.MAX_BANK);

  // Pitch: nose up needs lift, nose down only in the air, stalled airplanes drop the nose
  if (!s.onGround && lift < 1) {
    s.pitch = approach(s.pitch, F.STALL_PITCH, F.PITCH_RATE * dt);
  } else if (input.pitch > 0 && lift >= 1) {
    s.pitch = Math.min(F.MAX_PITCH, s.pitch + F.PITCH_RATE * dt);
  } else if (input.pitch < 0 && !s.onGround) {
    s.pitch = Math.max(-F.MAX_PITCH, s.pitch - F.PITCH_RATE * dt);
  } else {
    s.pitch = approach(s.pitch, 0, F.PITCH_RETURN * dt);
  }

  // Heading: steering wheel on the ground, bank-to-turn in the air
  if (s.onGround) {
    const steering = Math.min(1, s.speed / F.TAXI_FULL_TURN_SPEED);
    s.heading -= input.roll * F.TAXI_TURN_RATE * steering * dt;
  } else {
    const turnRate = (F.TURN_GRAVITY * Math.tan(s.bank)) / Math.max(s.speed, F.MIN_TURN_SPEED);
    s.heading -= clamp(turnRate, -F.MAX_TURN_RATE, F.MAX_TURN_RATE) * dt;
  }

  // Movement
  s.verticalSpeed = s.speed * Math.sin(s.pitch) * lift - (1 - lift) * F.STALL_SINK;
  const horizontalSpeed = s.speed * Math.cos(s.pitch);
  s.x -= Math.sin(s.heading) * horizontalSpeed * dt;
  s.y += Math.cos(s.heading) * horizontalSpeed * dt;
  s.z = Math.min(F.MAX_ALTITUDE, s.z + s.verticalSpeed * dt);

  if (bounds) {
    s.x = clamp(s.x, bounds.minX, bounds.maxX);
    s.y = clamp(s.y, bounds.minY, bounds.maxY);
  }

  // Ground contact
  const ground = groundHeightAt(s.x, s.y);
  if (s.z <= ground) {
    const wall = ground - s.z > F.MAX_STEP;
    const hardLanding = !s.onGround && s.verticalSpeed < -F.CRASH_SINK_RATE;
    if (wall || hardLanding) return true;
    s.z = ground;
    s.onGround = true;
    s.pitch = Math.max(0, s.pitch);
    s.verticalSpeed = 0;
  } else {
    s.onGround = false;
  }
  return false;
}
