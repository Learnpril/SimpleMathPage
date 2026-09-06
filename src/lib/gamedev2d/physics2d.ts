/**
 * Position, velocity and acceleration - **without calculus**, because a game loop does not use any.
 *
 * A physics step is two lines of arithmetic. The interesting part is that the *order* of those two lines
 * changes the answer, that both orders are wrong, and that they are wrong by exactly the same amount in
 * opposite directions - so their average is exact. That last fact is free, and it is the reason a jump can
 * land on the height you asked for instead of near it.
 *
 * The second half is the parameterisation. Nobody wants to choose a gravity constant; they want a jump two
 * units high that takes four tenths of a second to reach the top. Those are the same thing, and inverting
 * the relationship is the same move Section 4.1 made when it exposed a half-life instead of a decay rate.
 */
import { length, normalize } from "./length2d.ts";
import {
  combine,
  movedBy,
  scaled,
  type Point,
  type Vector,
} from "./vectors2d.ts";

export type Body = {
  position: Point;
  velocity: Vector;
};

/**
 * **Explicit Euler**: move by the old velocity, then update it.
 *
 * ```js
 * p += v * dt;
 * v += a * dt;
 * ```
 *
 * The order most people write first, because it reads in the order the words come. It uses the velocity
 * from the *start* of the step to cross the whole step, so under gravity it consistently travels too far
 * upward - a jump that goes higher than the arithmetic says it should.
 */
export function stepExplicit(body: Body, a: Vector, dt: number): Body {
  return {
    position: movedBy(body.position, scaled(body.velocity, dt)),
    velocity: combine(body.velocity, scaled(a, dt)),
  };
}

/**
 * **Semi-implicit Euler**: update the velocity first, then move by the new one.
 *
 * ```js
 * v += a * dt;
 * p += v * dt;
 * ```
 *
 * Swapping two lines, and it is what nearly every game engine actually does. It is more stable than the
 * explicit form for springs and damping, which is the usual reason given. For constant acceleration it is
 * wrong by exactly as much as the explicit form and in the opposite direction: it uses the *end* velocity
 * for the whole step, so a jump comes out **short**.
 */
export function stepSemiImplicit(body: Body, a: Vector, dt: number): Body {
  const velocity = combine(body.velocity, scaled(a, dt));
  return { position: movedBy(body.position, scaled(velocity, dt)), velocity };
}

/**
 * **The midpoint step**, which for constant acceleration is not an approximation at all.
 *
 * ```js
 * p += (v + 0.5 * a * dt) * dt;
 * v += a * dt;
 * ```
 *
 * Use the *average* of the start and end velocities to cross the step, which is what the velocity actually
 * averages when acceleration is constant. The extra term is one multiply and one add.
 *
 * The build shows this reproduces $p_0 + v_0t + \tfrac{1}{2}at^2$ **exactly**, to floating-point dust, at
 * every step - and that it is precisely the average of the two Euler forms above, because their errors are
 * equal and opposite. Also called velocity Verlet, and for constant acceleration the two are identical.
 */
export function stepMidpoint(body: Body, a: Vector, dt: number): Body {
  return {
    position: movedBy(
      body.position,
      scaled(combine(body.velocity, scaled(a, dt / 2)), dt),
    ),
    velocity: combine(body.velocity, scaled(a, dt)),
  };
}

export type Integrator = "explicit" | "semi-implicit" | "midpoint";

export const INTEGRATORS: readonly Integrator[] = [
  "explicit",
  "semi-implicit",
  "midpoint",
];

export function step(
  body: Body,
  a: Vector,
  dt: number,
  which: Integrator,
): Body {
  if (which === "explicit") return stepExplicit(body, a, dt);
  if (which === "semi-implicit") return stepSemiImplicit(body, a, dt);
  return stepMidpoint(body, a, dt);
}

/**
 * Where a body with constant acceleration really is, in closed form.
 *
 * $$p(t) = p_0 + v_0 t + \tfrac{1}{2}at^2$$
 *
 * Not what a game uses - forces change, and a closed form cannot cope with a wall appearing halfway
 * through - but it is the thing to measure the stepped versions against.
 */
export function exactAt(body: Body, a: Vector, t: number): Point {
  return movedBy(
    body.position,
    combine(scaled(body.velocity, t), scaled(a, 0.5 * t * t)),
  );
}

/**
 * How far a stepped integrator drifts from the truth after `n` steps, in closed form.
 *
 * $$\text{error} = \tfrac{1}{2}\,a\,\Delta t^2\,n = \tfrac{1}{2}\,a\,\Delta t\,t$$
 *
 * Positive for semi-implicit, negative for explicit, and zero for the midpoint form. Worth stating as a
 * formula rather than a warning, because it says two useful things at once: the error grows **linearly in
 * time**, not quadratically, and it shrinks in proportion to the step size. Halve the timestep and you
 * halve the drift.
 */
export function driftAfter(
  a: number,
  dt: number,
  steps: number,
  which: Integrator,
): number {
  if (which === "midpoint") return 0;
  const size = 0.5 * a * dt * dt * steps;
  return which === "semi-implicit" ? size : -size;
}

// ---- Gravity as something a designer can ask for ---------------------------------------------

/**
 * The gravity and launch speed that give a jump of a chosen height in a chosen time to the top.
 *
 * $$v_0 = \frac{2h}{t_{\text{up}}} \qquad a = -\frac{2h}{t_{\text{up}}^2}$$
 *
 * This is the whole reason to do the algebra. "Gravity is -25 and the jump velocity is 10" is a pair of
 * numbers nobody can picture; "two units high, four tenths of a second to the top" is a description of a
 * jump. Same jump, and the second one can be tuned by someone who has never opened the physics code.
 *
 * Derived by solving the closed form twice: the apex is where $v_0 + at = 0$, so $t_{\text{up}} = -v_0/a$,
 * and the height there is $-v_0^2/(2a)$. Two equations, two unknowns.
 */
export function jumpFromHeightAndTime(
  height: number,
  timeToApex: number,
): { launch: number; gravity: number } {
  return {
    launch: (2 * height) / timeToApex,
    gravity: (-2 * height) / (timeToApex * timeToApex),
  };
}

/** The same, given the **total** airtime of a symmetric jump. Half of it is the rise. */
export function jumpFromHeightAndAirtime(
  height: number,
  airtime: number,
): { launch: number; gravity: number } {
  return jumpFromHeightAndTime(height, airtime / 2);
}

/** And forward again, so the round trip can be checked rather than trusted. */
export function apexOf(
  launch: number,
  gravity: number,
): { height: number; timeToApex: number } {
  const timeToApex = -launch / gravity;
  return {
    height: (-launch * launch) / (2 * gravity),
    timeToApex,
  };
}

/**
 * A jump that rises and falls at **different** rates, which is what most platformers actually use.
 *
 * Falling faster than you rose makes a jump feel snappy and controllable, and it is not physical in the
 * slightest. Each half is its own parabola, sharing the apex, so each half gets its own gravity from the
 * same formula.
 */
export function asymmetricJump(
  height: number,
  timeUp: number,
  timeDown: number,
): { launch: number; riseGravity: number; fallGravity: number } {
  return {
    launch: (2 * height) / timeUp,
    riseGravity: (-2 * height) / (timeUp * timeUp),
    fallGravity: (-2 * height) / (timeDown * timeDown),
  };
}

/**
 * Cutting a jump short when the button is released: **scale the upward velocity down.**
 *
 * The cheap, standard variable-height jump. Multiplying by a fraction rather than zeroing it keeps a little
 * of the arc, which reads better than stopping dead. The guard matters: applied while falling it would
 * *slow the fall*, which feels like the character catching on something.
 */
export function cutJump(velocityY: number, keep: number): number {
  return velocityY > 0 ? velocityY * keep : velocityY;
}

/** How high a jump cut at the moment of release still reaches, from that instant. */
export function remainingHeight(velocityY: number, gravity: number): number {
  return velocityY <= 0 ? 0 : (velocityY * velocityY) / (-2 * gravity);
}

// ---- Terminal velocity -----------------------------------------------------------------------

/**
 * Gravity with linear drag, which is where terminal velocity comes from.
 *
 * $$\frac{dv}{dt} = a - k v \quad\Longrightarrow\quad v_\infty = \frac{a}{k}$$
 *
 * The speed at which drag exactly cancels gravity, so the acceleration is zero and nothing changes. Note
 * what shape the approach has: the gap between the current speed and the terminal speed decays
 * exponentially, which is **Section 4.1's decay** turning up in a completely different setting - and it is
 * frame-rate independent for the same reason.
 */
export function terminalVelocity(gravity: number, drag: number): number {
  return drag <= 0 ? Infinity : gravity / drag;
}

/** One step of gravity with drag. Semi-implicit, because that is what the stability argument is for. */
export function stepWithDrag(
  velocityY: number,
  gravity: number,
  drag: number,
  dt: number,
): number {
  return velocityY + (gravity - drag * velocityY) * dt;
}

/**
 * The exact speed after falling for a while with drag, for the stepped version to be checked against.
 *
 * $$v(t) = v_\infty + (v_0 - v_\infty)e^{-kt}$$
 *
 * Which is `decay` from Section 4.1 with a different name on the variables. Seeing that the two are the
 * same equation is worth more than either of them alone.
 */
export function dragExactAt(
  v0: number,
  gravity: number,
  drag: number,
  t: number,
): number {
  const terminal = terminalVelocity(gravity, drag);
  return terminal + (v0 - terminal) * Math.exp(-drag * t);
}

/**
 * The simpler alternative: no drag, just refuse to fall faster than a limit.
 *
 * Not physical, and often the right choice anyway - it is one comparison, it gives an exact maximum fall
 * speed you can design a level around, and it never quietly changes how far a jump goes. Drag does: it
 * slows the rise as well, so a jump tuned without it comes out short once it is added.
 */
export function clampFallSpeed(velocityY: number, limit: number): number {
  return Math.max(velocityY, -Math.abs(limit));
}

/** A whole velocity clamped in speed, for anything that should have a maximum regardless of direction. */
export function clampSpeed(v: Vector, limit: number): Vector {
  const speed = length(v);
  if (speed <= limit) return v;
  const unit = normalize(v);
  return unit === null ? { x: 0, y: 0 } : scaled(unit, limit);
}
