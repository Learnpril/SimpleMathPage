/**
 * Position, velocity, acceleration - and the trick of solving them backwards.
 *
 * The forwards direction is the one every physics course teaches: pick a gravity, pick a launch
 * speed, see how high the jump goes. It is the wrong direction for a game. A designer does not
 * have an opinion about gravity; they have an opinion about **reaching that ledge** and about the
 * jump feeling snappy rather than floaty. Those are a height and a duration.
 *
 * So invert it. Take the height and the time as the inputs and let gravity fall out. Two lines of
 * algebra, and it turns tuning from guesswork into typing in the answer.
 *
 * Drag here is Section 4.1's exponential decay pointed at a velocity instead of a position. Same
 * function, same reason: a per-frame multiplier is frame-rate dependent, and `exp(-k·dt)` is not.
 */
import type { Vec3 } from "./matrices.ts";
import { decayFactor } from "./interpolation.ts";

/** Earth, for reference. Games rarely use it: it feels floaty at human scale. */
export const EARTH_GRAVITY = 9.81;

/** Where something is and how fast it is going. Everything else is a rule for changing these. */
export type Body = { position: Vec3; velocity: Vec3 };

const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const mul = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});

// ---- The forwards direction ---------------------------------------------------------------

/** Height above the launch point at time `t`, ignoring drag. The parabola. */
export function heightAt(
  t: number,
  launchSpeed: number,
  gravity: number,
): number {
  return launchSpeed * t - 0.5 * gravity * t * t;
}

/** How long until the rise stops. Velocity reaches zero when `g·t` has cancelled `v₀`. */
export function timeToApex(launchSpeed: number, gravity: number): number {
  return gravity <= 0 ? Infinity : launchSpeed / gravity;
}

/** The top of the arc: substitute the apex time back into the parabola. */
export function apexHeight(launchSpeed: number, gravity: number): number {
  return gravity <= 0 ? Infinity : (launchSpeed * launchSpeed) / (2 * gravity);
}

// ---- The backwards direction, which is the one worth having --------------------------------

/**
 * The gravity that makes a jump of `height` take `timeToApex` seconds to get there.
 *
 * From $h = \tfrac{1}{2} g t^2$ at the apex:
 *
 * $$g = \frac{2h}{t^2}$$
 *
 * Note the **square**. Halving the time to apex quadruples the gravity, which is why a snappy
 * jump needs a gravity nothing like Earth's - and why copying 9.81 into a platformer always feels
 * like the moon.
 */
export function gravityFor(height: number, timeToApex: number): number {
  return (2 * height) / (timeToApex * timeToApex);
}

/**
 * The launch speed for that same pair.
 *
 * $$v_0 = \frac{2h}{t}$$
 *
 * Which is just "twice the average speed on the way up", because the rise decelerates linearly
 * from $v_0$ to zero.
 */
export function launchSpeedFor(height: number, timeToApex: number): number {
  return (2 * height) / timeToApex;
}

/** Both numbers a jump needs, from the two a designer actually has an opinion about. */
export function jumpFromHeightAndTime(
  height: number,
  time: number,
): { gravity: number; launchSpeed: number } {
  return {
    gravity: gravityFor(height, time),
    launchSpeed: launchSpeedFor(height, time),
  };
}

/** The other pairing: gravity is fixed by the rest of the game, so solve for the rest. */
export function jumpFromHeightAndGravity(
  height: number,
  gravity: number,
): { launchSpeed: number; timeToApex: number } {
  const launchSpeed = Math.sqrt(2 * gravity * height);
  return { launchSpeed, timeToApex: launchSpeed / gravity };
}

/**
 * How long a jump lasts, with a heavier gravity on the way down.
 *
 * Falling faster than you rose is not physics, it is a **feel** trick, and almost every platformer
 * uses it. The rise is what the player asked for and wants to watch; the fall is dead time. So
 * multiply gravity once the velocity turns over and the jump reads as responsive without losing
 * any height.
 */
export function airTime(
  height: number,
  timeUp: number,
  fallMultiplier = 1,
): { up: number; down: number; total: number } {
  const down = timeUp / Math.sqrt(fallMultiplier);
  return { up: timeUp, down, total: timeUp + down };
}

/** Height above the launch point at `t`, with the fall accelerated after the apex. */
export function heightWithFallMultiplier(
  t: number,
  height: number,
  timeUp: number,
  fallMultiplier: number,
): number {
  const gravity = gravityFor(height, timeUp);
  if (t <= timeUp) return heightAt(t, launchSpeedFor(height, timeUp), gravity);
  const falling = t - timeUp;
  return height - 0.5 * gravity * fallMultiplier * falling * falling;
}

// ---- Forces and impulses ------------------------------------------------------------------

/**
 * An **impulse**: change the velocity right now.
 *
 * This is what a jump is, what a bullet hit is, what an explosion is. Divide by mass because the
 * impulse is a change in momentum, and heavier things move less for the same shove.
 */
export function applyImpulse(body: Body, impulse: Vec3, mass = 1): Body {
  return {
    position: body.position,
    velocity: add(body.velocity, mul(impulse, 1 / mass)),
  };
}

/**
 * A **continuous force**: change the velocity a bit, for as long as it is applied.
 *
 * The difference from an impulse is entirely about time. A force of 75 N for a tenth of a second
 * ends at the same velocity as the equivalent impulse - but it spent that tenth of a second
 * getting there, so it has travelled less far. Rockets and thrusters are forces; jumps are not.
 */
export function applyForce(
  body: Body,
  force: Vec3,
  mass: number,
  dt: number,
): Body {
  const acceleration = mul(force, dt / mass);
  return {
    position: body.position,
    velocity: add(body.velocity, acceleration),
  };
}

/** How high an impulse-driven jump is after `t`, against a force spread over `duration`. */
export function riseFromImpulse(
  t: number,
  launchSpeed: number,
  gravity: number,
): number {
  return heightAt(t, launchSpeed, gravity);
}

/**
 * The same total velocity change, delivered as a steady force over `duration` instead.
 *
 * Only valid up to `duration`, which is the interesting part: at that moment both are travelling
 * at the same speed and the force-driven one is lower, because it started from nothing.
 */
export function riseFromSteadyForce(
  t: number,
  launchSpeed: number,
  duration: number,
): number {
  const capped = Math.min(t, duration);
  return 0.5 * (launchSpeed / duration) * capped * capped;
}

// ---- Drag ---------------------------------------------------------------------------------

/**
 * Linear drag: shave a fraction of the velocity per second, frame-rate independently.
 *
 * Section 4.1's `decayFactor(k, dt)` is the fraction of the gap a decay *removes* in `dt`, so what
 * survives is one minus it - which is `exp(-k·dt)`. Reaching for the same function is the point:
 * multiplying velocity by a constant each frame would make drag depend on the frame rate, exactly
 * as Section 4.1's headline bug did for position.
 */
export function dragStep(velocity: Vec3, k: number, dt: number): Vec3 {
  return mul(velocity, 1 - decayFactor(k, dt));
}

/**
 * The speed a falling object settles at, where drag exactly cancels gravity.
 *
 * $$-g - k\,v = 0 \;\Longrightarrow\; v_{\text{terminal}} = \frac{g}{k}$$
 *
 * A real falling body has drag going as the *square* of speed, so its terminal speed is
 * $\sqrt{g/k}$ instead. Linear is what games mostly use, because it is stable at any timestep and
 * nobody can tell the difference.
 */
export function terminalSpeed(gravity: number, k: number): number {
  return k <= 0 ? Infinity : gravity / k;
}

/** One step of a projectile under gravity and linear drag. Semi-implicit: velocity first. */
export function stepProjectile(
  body: Body,
  gravity: number,
  k: number,
  dt: number,
): Body {
  const dragged = dragStep(body.velocity, k, dt);
  const velocity = { x: dragged.x, y: dragged.y - gravity * dt, z: dragged.z };
  return { position: add(body.position, mul(velocity, dt)), velocity };
}
