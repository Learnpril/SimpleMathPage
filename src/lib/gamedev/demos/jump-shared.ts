/**
 * A jump specified the way a designer specifies one, and the same jump actually stepped.
 *
 * Both live here because the comparison is the point: the backwards solve gives an exact height,
 * and a simulation running at a real frame rate does not reach it. `checks.ts` pins how far off it
 * is, so the page can quote a number rather than a hedge.
 */
import {
  airTime,
  gravityFor,
  heightWithFallMultiplier,
  launchSpeedFor,
} from "../dynamics.ts";

/** The character is running while it jumps, so the arc is an arc rather than a graph. */
export const FORWARD = 4;
export const FPS = 60;

/** Everything the backwards solve produces from a height, a rise time and a fall multiplier. */
export function derived(
  height: number,
  timeUp: number,
  fallMultiplier: number,
) {
  const gravity = gravityFor(height, timeUp);
  return {
    gravity,
    fallGravity: gravity * fallMultiplier,
    launchSpeed: launchSpeedFor(height, timeUp),
    ...airTime(height, timeUp, fallMultiplier),
  };
}

/** The exact arc, sampled for drawing. */
export function analyticArc(
  height: number,
  timeUp: number,
  fallMultiplier: number,
  samples = 90,
): Array<{ x: number; y: number }> {
  const { total } = derived(height, timeUp, fallMultiplier);
  return Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * total;
    return {
      x: t * FORWARD,
      y: Math.max(
        0,
        heightWithFallMultiplier(t, height, timeUp, fallMultiplier),
      ),
    };
  });
}

/**
 * The same jump stepped at a real frame rate, velocity first.
 *
 * Velocity before position is **semi-implicit Euler**, which Section 7.2 argues for properly. It
 * is written out here rather than imported because watching it lose height is half of what this
 * scene is for.
 */
export function steppedArc(
  height: number,
  timeUp: number,
  fallMultiplier: number,
  dt = 1 / FPS,
): Array<{ x: number; y: number }> {
  const { gravity, launchSpeed, total } = derived(
    height,
    timeUp,
    fallMultiplier,
  );
  const out: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  let y = 0;
  let v = launchSpeed;
  let t = 0;
  /* Bounded by the flight time rather than by a fixed step count, so a very fine timestep still
     reaches the apex instead of being cut off partway up. */
  const maxSteps = Math.min(500_000, Math.ceil((total * 3) / dt) + 4);
  for (let i = 0; i < maxSteps; i += 1) {
    v -= gravity * (v <= 0 ? fallMultiplier : 1) * dt;
    y += v * dt;
    t += dt;
    if (y < 0) break;
    out.push({ x: t * FORWARD, y });
  }
  return out;
}

/** The highest the stepped jump actually gets. Always short of the number asked for. */
export function steppedApex(
  height: number,
  timeUp: number,
  fallMultiplier: number,
  dt = 1 / FPS,
): number {
  return steppedArc(height, timeUp, fallMultiplier, dt).reduce(
    (best, p) => Math.max(best, p.y),
    0,
  );
}
