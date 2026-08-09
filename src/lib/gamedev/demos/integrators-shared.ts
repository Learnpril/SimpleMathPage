/**
 * One throw, stepped three ways, against the answer we already know.
 *
 * The acceleration is constant, which is the case where the exact answer is available - so this is
 * the honest way to see what an integrator costs, rather than comparing two approximations to each
 * other and hoping.
 */
import {
  constant,
  exact,
  stepExplicit,
  stepSemiImplicit,
  stepVerlet,
  type State,
} from "../integrators.ts";

/** Section 7.1's jump: 1.2 m in 0.4 s, so gravity 15 and launch 6. */
export const GRAVITY = -15;
export const START: State = { position: 0, velocity: 6 };
export const FLIGHT = 0.8;
/** The thrower is moving, so the picture is a trajectory rather than a graph. */
export const FORWARD = 4;

export const METHODS = ["explicit", "semi-implicit", "Verlet"] as const;
export type Method = (typeof METHODS)[number];

const STEP = {
  explicit: stepExplicit,
  "semi-implicit": stepSemiImplicit,
  Verlet: stepVerlet,
} as const;

/** The path one integrator produces at a given tick rate. */
export function path(
  method: Method,
  fps: number,
): Array<{ x: number; y: number }> {
  const dt = 1 / fps;
  const step = STEP[method];
  let s = START;
  const out = [{ x: 0, y: START.position }];
  const ticks = Math.max(1, Math.round(FLIGHT * fps));
  for (let i = 1; i <= ticks; i += 1) {
    s = step(s, constant(GRAVITY), dt);
    out.push({ x: i * dt * FORWARD, y: s.position });
  }
  return out;
}

/** The parabola, sampled finely enough to read as a curve. */
export function exactPath(samples = 120): Array<{ x: number; y: number }> {
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * FLIGHT;
    return { x: t * FORWARD, y: exact(START, GRAVITY, t).position };
  });
}

/** The highest sampled point. Note this is a *sample*, so it lands on the true apex only when a
 * tick happens to fall at 0.4 s - which is why the scene reports the error instead. */
export function apexOf(method: Method, fps: number): number {
  return path(method, fps).reduce((best, p) => Math.max(best, p.y), 0);
}

/** Where it is when the exact answer says it has landed. Exact is 0. */
export function endsAt(method: Method, fps: number): number {
  const p = path(method, fps);
  return p[p.length - 1].y;
}

/**
 * The worst distance between an integrator's samples and the exact curve.
 *
 * This is the number worth showing, rather than the apex. Comparing sampled apexes muddles two
 * different things: how wrong the integrator is, and whether a tick happened to land on the top of
 * the arc. This measures only the first, so Verlet reports zero at every tick rate rather than
 * appearing to be short at rates where no tick lands at 0.4 s.
 */
export function maxErrorOf(method: Method, fps: number): number {
  const dt = 1 / fps;
  return path(method, fps).reduce((worst, p, i) => {
    const truth = exact(START, GRAVITY, i * dt).position;
    return Math.max(worst, Math.abs(p.y - truth));
  }, 0);
}
