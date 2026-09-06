/**
 * One jump, described the way a designer would, and stepped three different ways.
 *
 * The two scenes ask different questions of the same arc. The leap scene asks whether the jump reaches the
 * height it was asked for; the stepper scene asks why it might not. Sharing the jump means the second scene
 * is explaining the first rather than making its own point.
 */
import {
  INTEGRATORS,
  apexOf,
  asymmetricJump,
  driftAfter,
  exactAt,
  jumpFromHeightAndTime,
  step,
  terminalVelocity,
  type Body,
  type Integrator,
} from "../../../gamedev2d/physics2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/** Pixels per world unit. */
export const UNIT = 52;

/** The canvas both scenes draw into. */
export const VIEW = { width: 620, height: 330 } as const;

/** Where the ground is, in world units, and where the jump starts. */
export const GROUND = -2.2;
export const LAUNCH_X = -4.6;

/** The controls' ranges. Height in world units, times in seconds. */
export const HEIGHT_RANGE = { min: 0.8, max: 3.4, step: 0.1 } as const;
export const APEX_TIME_RANGE = { min: 0.2, max: 0.7, step: 0.02 } as const;
/** Frame rates the scenes step at. A slow one, so the drift is visible rather than theoretical. */
export const FPS_RANGE = { min: 10, max: 60, step: 1 } as const;

/** How fast the jumper travels sideways. Constant, so the arc is a parabola in the drawing too. */
export const RUN_SPEED = 5.2;

export { INTEGRATORS };
export type { Integrator };

export type Arc = {
  /** Where the jumper was at the end of each step. */
  points: Point[];
  /** The highest point reached, which is the number the scene is really about. */
  peak: number;
  /** And when it got there. */
  peakAt: number;
  /** How far short of, or past, the requested height that is. */
  heightError: number;
  /** How long until it came back to the ground. */
  airtime: number;
};

/**
 * Step a jump to the ground and report what it actually did.
 *
 * The horizontal motion is deliberately plain: a constant speed with no acceleration, so every integrator
 * agrees about it exactly and any difference in the drawing is vertical. That keeps the comparison honest -
 * an arc that differs in both directions at once is much harder to read.
 */
export function arcFor(
  height: number,
  timeToApex: number,
  fps: number,
  which: Integrator,
): Arc {
  const { launch, gravity } = jumpFromHeightAndTime(height, timeToApex);
  const dt = 1 / fps;
  let body: Body = {
    position: { x: LAUNCH_X, y: GROUND },
    velocity: { x: RUN_SPEED, y: launch },
  };
  const points: Point[] = [body.position];
  let peak = GROUND;
  let peakAt = 0;
  let airtime = 0;
  for (let i = 1; i <= 400; i += 1) {
    body = step(body, { x: 0, y: gravity }, dt, which);
    if (body.position.y > peak) {
      peak = body.position.y;
      peakAt = i * dt;
    }
    /* Landing is clamped to the ground rather than recorded where the step actually finished. At ten frames
       a second the last step of a tall jump ends a whole unit underground and ran off the bottom of the
       canvas - which is a real thing a naive loop does, and the reason Section 5.4 exists. Resolving it
       properly is that Section's job; here it only has to not be drawn through the floor. */
    if (body.position.y <= GROUND && i > 1) {
      points.push({ x: body.position.x, y: GROUND });
      airtime = i * dt;
      break;
    }
    points.push(body.position);
  }
  return {
    points,
    peak,
    peakAt,
    heightError: peak - GROUND - height,
    airtime,
  };
}

/** The true parabola, sampled finely, for the scenes to draw behind the stepped arcs. */
export function exactArc(
  height: number,
  timeToApex: number,
  samples = 200,
): Point[] {
  const { launch, gravity } = jumpFromHeightAndTime(height, timeToApex);
  const body: Body = {
    position: { x: LAUNCH_X, y: GROUND },
    velocity: { x: RUN_SPEED, y: launch },
  };
  const total = 2 * timeToApex;
  return Array.from({ length: samples + 1 }, (_, i) =>
    exactAt(body, { x: 0, y: gravity }, (i / samples) * total),
  );
}

/** What the requested jump comes to in raw numbers, for a readout that shows both descriptions. */
export function requested(height: number, timeToApex: number) {
  const { launch, gravity } = jumpFromHeightAndTime(height, timeToApex);
  return { launch, gravity, ...apexOf(launch, gravity) };
}

/**
 * The predicted vertical drift after a whole rise, in closed form.
 *
 * The scenes quote this beside the measured peak error so the two can be compared on screen rather than only
 * in the checks. They should agree, because the drift formula is exact for constant acceleration.
 */
export function predictedDrift(
  height: number,
  timeToApex: number,
  fps: number,
  which: Integrator,
): number {
  const { gravity } = jumpFromHeightAndTime(height, timeToApex);
  return driftAfter(gravity, 1 / fps, Math.round(timeToApex * fps), which);
}

/** Does the apex land on a frame boundary, or somewhere between two of them? */
export function apexOnFrame(timeToApex: number, fps: number): boolean {
  const steps = timeToApex * fps;
  return Math.abs(steps - Math.round(steps)) < 1e-9;
}

/**
 * The height a jump loses purely because **nobody looked at the apex.**
 *
 * $$\text{deficit} = \tfrac{1}{2}|a|\,\delta^2$$
 *
 * where $\delta$ is the gap between the true apex and the nearest frame. This is a completely different
 * failure from integrator drift and it is worth keeping apart: drift is the stepping being wrong, and this is
 * the stepping being **right at instants that miss the interesting one**. No integrator can fix it, because
 * there is nothing wrong to fix - the position simply is never evaluated at the top.
 *
 * The same distinction Section 4.1 drew between frame-rate dependence and sampling coarseness. Found here by
 * an assertion failing: the midpoint step is exact at every step it takes, and a $0.25$ s rise at ten frames
 * a second still reported a peak $0.032$ short, because the apex falls halfway between frames 2 and 3.
 */
export function samplingDeficit(
  height: number,
  timeToApex: number,
  fps: number,
): number {
  const { gravity } = jumpFromHeightAndTime(height, timeToApex);
  const dt = 1 / fps;
  const steps = timeToApex / dt;
  // How far the nearest frame is from the true apex, in seconds.
  const gap = Math.abs(Math.round(steps) - steps) * dt;
  return 0.5 * Math.abs(gravity) * gap * gap;
}

// ---- The stepper scene -----------------------------------------------------------------------

/** A straight-up throw, so the comparison is one dimensional and the drift is the only difference. */
export const THROW_HEIGHT = 2.5;
export const THROW_TIME = 0.5;

export type Trace = {
  which: Integrator;
  /** Height above the ground at the end of each step. */
  heights: number[];
  /** And the exact answer at those same instants. */
  exact: number[];
};

export function traceFor(fps: number, which: Integrator): Trace {
  const { launch, gravity } = jumpFromHeightAndTime(THROW_HEIGHT, THROW_TIME);
  const dt = 1 / fps;
  const steps = Math.max(2, Math.round(2 * THROW_TIME * fps));
  let body: Body = { position: { x: 0, y: 0 }, velocity: { x: 0, y: launch } };
  const start: Body = {
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: launch },
  };
  const heights: number[] = [0];
  const exact: number[] = [0];
  for (let i = 1; i <= steps; i += 1) {
    body = step(body, { x: 0, y: gravity }, dt, which);
    heights.push(body.position.y);
    exact.push(exactAt(start, { x: 0, y: gravity }, i * dt).y);
  }
  return { which, heights, exact };
}

/** All three traces plus the exact one, which is what the stepper scene plots. */
export function allTraces(fps: number): Trace[] {
  return INTEGRATORS.map((which) => traceFor(fps, which));
}

/**
 * The claim the Section is built on: the two Euler forms bracket the truth, and their average is it.
 *
 * Returned as numbers so both the scene and the checks can quote the same thing.
 */
export function bracketAt(fps: number, stepIndex: number) {
  const traces = allTraces(fps);
  const explicit = traces[0].heights[stepIndex];
  const semi = traces[1].heights[stepIndex];
  const midpoint = traces[2].heights[stepIndex];
  const exact = traces[0].exact[stepIndex];
  return {
    explicit,
    semi,
    midpoint,
    exact,
    average: (explicit + semi) / 2,
    /** How far the average is from the truth. Should be dust. */
    averageError: (explicit + semi) / 2 - exact,
  };
}

// ---- Terminal velocity, for the values demo --------------------------------------------------

export const DRAG_GRAVITY = -25;
export const DRAG_COEFFICIENT = 4;

export function terminalFor(): number {
  return terminalVelocity(DRAG_GRAVITY, DRAG_COEFFICIENT);
}

/** An asymmetric jump the values demo can quote, since most platformers use one. */
export const ASYMMETRIC = { height: 2.5, up: 0.4, down: 0.28 } as const;

export function asymmetricFor() {
  return asymmetricJump(ASYMMETRIC.height, ASYMMETRIC.up, ASYMMETRIC.down);
}

/** World to canvas pixels. The Y flip lives here and nowhere else. */
export function screenOf(p: Point): { x: number; y: number } {
  return { x: VIEW.width / 2 + p.x * UNIT, y: VIEW.height / 2 - p.y * UNIT };
}

/** And back, exercised as a round trip by the checks. */
export function worldOf(sx: number, sy: number): Point {
  return { x: (sx - VIEW.width / 2) / UNIT, y: (VIEW.height / 2 - sy) / UNIT };
}
