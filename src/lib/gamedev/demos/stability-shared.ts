/**
 * An undamped spring, drawn in **phase space**: position across, velocity up.
 *
 * Plotted this way an exactly-conserved oscillation is a closed circle, so an integrator that
 * quietly adds energy cannot hide - it spirals outward, visibly, and no amount of squinting at a
 * position-versus-time graph makes that as obvious.
 *
 * Velocity is divided by the square root of the stiffness so the exact orbit really is a circle
 * rather than an ellipse whose shape depends on the spring.
 */
import {
  energy,
  spring,
  stepExplicit,
  stepSemiImplicit,
  stepVerlet,
  type State,
} from "../integrators.ts";

export const STIFFNESS = 40;
export const START: State = { position: 1, velocity: 0 };
/** One full oscillation takes this long: the standard spring period. */
export const PERIOD = (2 * Math.PI) / Math.sqrt(STIFFNESS);

export const METHODS = ["explicit", "semi-implicit", "Verlet"] as const;
export type Method = (typeof METHODS)[number];

const STEP = {
  explicit: stepExplicit,
  "semi-implicit": stepSemiImplicit,
  Verlet: stepVerlet,
} as const;

/** The phase-space path, with velocity scaled so a conserved orbit is a unit circle. */
export function phasePath(
  method: Method,
  fps: number,
  cycles: number,
): Array<{ x: number; y: number }> {
  const dt = 1 / fps;
  const step = STEP[method];
  const scale = 1 / Math.sqrt(STIFFNESS);
  let s = START;
  const out = [{ x: s.position, y: s.velocity * scale }];
  const ticks = Math.max(1, Math.round((cycles * PERIOD) / dt));
  for (let i = 0; i < ticks; i += 1) {
    s = step(s, spring(STIFFNESS), dt);
    out.push({ x: s.position, y: s.velocity * scale });
    // A runaway integrator will leave the picture; stop before it leaves the number range too.
    if (!Number.isFinite(s.position) || Math.abs(s.position) > 1e6) break;
  }
  return out;
}

/** The amplitude after those cycles, as a multiple of where it started. */
export function amplitudeRatio(
  method: Method,
  fps: number,
  cycles: number,
): number {
  const path = phasePath(method, fps, cycles);
  const last = path[path.length - 1];
  return Math.hypot(last.x, last.y);
}

/** The energy at the end, relative to the start. Exactly 1 would be perfect. */
export function energyRatio(
  method: Method,
  fps: number,
  cycles: number,
): number {
  const dt = 1 / fps;
  const step = STEP[method];
  let s = START;
  const ticks = Math.max(1, Math.round((cycles * PERIOD) / dt));
  for (let i = 0; i < ticks; i += 1) {
    s = step(s, spring(STIFFNESS), dt);
    if (!Number.isFinite(s.position)) break;
  }
  return energy(s, STIFFNESS) / energy(START, STIFFNESS);
}
