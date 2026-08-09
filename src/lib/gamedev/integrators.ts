/**
 * Turning an acceleration into motion, one step at a time - and the two orderings that look
 * identical and are not.
 *
 * Section 7.1 ended on a problem: a jump solved exactly and then stepped at 60 fps comes up short
 * by `dt / t_apex`. This is where that gets addressed. The fix is not a smaller timestep, it is
 * caring about **which order the two updates happen in** and about **not letting the timestep vary
 * at all**.
 *
 * Everything here is written for one axis. That is not a simplification: position and velocity in
 * `x` are unaffected by anything happening in `y`, so an integrator applies componentwise and a
 * scalar version is the whole story with less noise around it.
 */

/** Where something is and how fast it is going, on one axis. */
export type State = { position: number; velocity: number };

/** The rule for the acceleration. Constant for gravity, position-dependent for a spring. */
export type Acceleration = (state: State) => number;

/** Gravity: the same number wherever you are and however fast you are going. */
export const constant =
  (a: number): Acceleration =>
  () =>
    a;

/** A spring pulling towards zero. Undamped, so it should oscillate forever. */
export const spring =
  (stiffness: number): Acceleration =>
  (s) =>
    -stiffness * s.position;

/**
 * **Explicit Euler**, also called forward Euler: move, then accelerate.
 *
 * The position update uses the velocity from the *start* of the step, before gravity has been
 * applied. So a falling object is credited with the speed it had before it sped up, and it travels
 * further than it should. On an oscillator it does something worse than inaccurate: it **gains
 * energy** every cycle and spirals outward until the simulation explodes.
 *
 * It is the version everyone writes first, because it reads in the order you would say it aloud.
 */
export function stepExplicit(
  state: State,
  accel: Acceleration,
  dt: number,
): State {
  const position = state.position + state.velocity * dt;
  const velocity = state.velocity + accel(state) * dt;
  return { position, velocity };
}

/**
 * **Semi-implicit Euler**, also called symplectic Euler: accelerate, then move.
 *
 * Two lines swapped, and this is what games use. The position update uses the velocity from the
 * *end* of the step, so a falling object is credited with the speed it has after speeding up, and
 * it travels slightly too little rather than slightly too much.
 *
 * Undershooting is not obviously better than overshooting, and accuracy is not the reason to
 * prefer it. **Stability** is. On an oscillator it stays bounded forever instead of spiralling
 * outward, which means a wrong answer that stays wrong by a fixed amount rather than a wrong
 * answer that becomes infinity.
 */
export function stepSemiImplicit(
  state: State,
  accel: Acceleration,
  dt: number,
): State {
  const velocity = state.velocity + accel(state) * dt;
  return { position: state.position + velocity * dt, velocity };
}

/**
 * **Velocity Verlet**: use the average of the accelerations at both ends of the step.
 *
 * $$x_{n+1} = x_n + v_n\,dt + \tfrac{1}{2} a_n\,dt^2 \qquad v_{n+1} = v_n + \tfrac{1}{2}(a_n + a_{n+1})\,dt$$
 *
 * That extra $\tfrac{1}{2} a\,dt^2$ term is the one the two Eulers are missing, and for a
 * **constant** acceleration it makes this exact - it reproduces the parabola at any timestep, to
 * the last bit. Section 7.1's shortfall simply does not happen.
 *
 * It costs a second acceleration evaluation per step, which is why it is not the default: for a
 * character controller the acceleration is gravity plus input and the Euler error is invisible.
 * Where it earns its keep is cloth, rope and soft bodies, where the acceleration depends on
 * position and the error compounds across thousands of connected particles.
 */
export function stepVerlet(
  state: State,
  accel: Acceleration,
  dt: number,
): State {
  const a = accel(state);
  const position = state.position + state.velocity * dt + 0.5 * a * dt * dt;
  const halfway = { position, velocity: state.velocity };
  const velocity = state.velocity + 0.5 * (a + accel(halfway)) * dt;
  return { position, velocity };
}

/** The exact answer for a constant acceleration, to compare all three against. */
export function exact(start: State, acceleration: number, t: number): State {
  return {
    position: start.position + start.velocity * t + 0.5 * acceleration * t * t,
    velocity: start.velocity + acceleration * t,
  };
}

/**
 * The energy in a spring-mass system, which is what tells the integrators apart.
 *
 * Kinetic plus potential. An undamped spring should hold this exactly forever, so any drift is the
 * integrator's and not the physics'. Explicit Euler grows it, semi-implicit wobbles around it, and
 * that difference is the whole argument.
 */
export function energy(state: State, stiffness: number): number {
  return (
    0.5 * state.velocity * state.velocity +
    0.5 * stiffness * state.position * state.position
  );
}

// ---- The fixed timestep -------------------------------------------------------------------

/**
 * How many fixed steps to run for a frame of real time, and what is left over.
 *
 * The loop is: add the frame's elapsed time to an accumulator, then take **whole fixed steps** out
 * of it while there are any, and keep the remainder for next time. The simulation only ever sees
 * one value of `dt`, so it behaves identically on a 30 Hz laptop and a 240 Hz desktop.
 *
 * `maxSteps` is not optional. If a frame takes longer to compute than the fixed step it is
 * simulating, the accumulator grows, so next frame needs more steps, which takes longer still -
 * the **spiral of death**. Clamping means the simulation falls behind real time under load, which
 * looks like slow motion and is survivable, instead of locking up.
 */
export function stepsFor(
  accumulated: number,
  frameTime: number,
  fixed: number,
  maxSteps = 5,
): { steps: number; leftover: number; dropped: boolean } {
  let pool = accumulated + frameTime;
  const wanted = Math.floor(pool / fixed);
  const steps = Math.min(wanted, maxSteps);
  pool -= steps * fixed;
  return { steps, leftover: pool, dropped: wanted > maxSteps };
}

/**
 * How far through the next fixed step the display currently is, from 0 to 1.
 *
 * The leftover in the accumulator is not waste, it is information: it says the renderer is looking
 * at a moment *between* two simulated states.
 */
export function alphaFrom(leftover: number, fixed: number): number {
  const a = leftover / fixed;
  return a < 0 ? 0 : a > 1 ? 1 : a;
}

/**
 * The state to actually draw: the previous tick and the current one, blended.
 *
 * Skip this and the object jumps to whichever tick was most recent, which reads as stutter even
 * though the physics is perfectly smooth - and it is worst exactly when the display rate is not a
 * multiple of the tick rate, because then the pattern of which frames got a tick keeps changing.
 */
export function blend(previous: State, current: State, alpha: number): State {
  return {
    position:
      previous.position + (current.position - previous.position) * alpha,
    velocity:
      previous.velocity + (current.velocity - previous.velocity) * alpha,
  };
}
