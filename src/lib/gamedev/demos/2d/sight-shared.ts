/**
 * A guard, some walls, and one draggable point that both scenes in this Section use.
 *
 * The walls are shared on purpose. The nearest-point scene asks "how far is that point from this wall"
 * and the sight scene asks "does this wall block the view", and they are the same two functions - a
 * clamped parameter and a pair of clamped parameters - so putting them in one world makes that visible.
 */
import {
  closestPoint,
  distanceToLine,
  distanceToSegment,
  firstBlocker,
  firstBlockerWrong,
  hasLineOfSight,
  hasLineOfSightWrong,
  projectionT,
  type Segment,
} from "../../../gamedev2d/segment2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/** Pixels per world unit. */
export const UNIT = 44;

/** The canvas both scenes draw into. */
export const VIEW = { width: 620, height: 330 } as const;

/**
 * How far the dragged point may go, in world units.
 *
 * Half the canvas is $310$ by $165$ px, which is $7.045$ by $3.75$ units. Leaving room for the dot and
 * its label, and the build sweeps the corners rather than trusting the arithmetic here.
 */
export const BOUNDS = { x: 6.5, y: 3.25 } as const;

/**
 * Where the guard stands. Off-centre so that no wall is symmetric about it, because a symmetric
 * arrangement hides sign errors - a lesson from Section 4.3, where three symmetric curves made the
 * central claim look like a rounding error.
 */
export const GUARD_AT: Point = { x: -4.5, y: -2 };

/**
 * How far out the sweep and the compass ask their question.
 *
 * Stated as a constant because **the answer depends on it**, and that is a real property of line of
 * sight rather than an artefact: a direction can be clear at three units and blocked at six. Any claim
 * about "how much of the view is blocked" is meaningless without saying how far away the target is.
 */
export const SIGHT_RADIUS = 6;

/**
 * The walls. Every coordinate is a quarter, so crossings and parameters print without float dust.
 *
 * The third one is short and set well away from the guard, which is what makes the infinite-line bug
 * visible: as a segment it blocks almost nothing, and as a line it cuts the level in half.
 */
export const WALLS: readonly Segment[] = [
  { a: { x: -1.5, y: -3 }, b: { x: -1.5, y: 0.5 } },
  { a: { x: 1, y: 2.75 }, b: { x: 4.5, y: 2.75 } },
  { a: { x: 2.5, y: -2.5 }, b: { x: 3.5, y: -0.5 } },
];

/**
 * The wall the nearest-point scene measures against. **Diagonal on purpose.**
 *
 * An axis-aligned wall makes the whole scene too easy: the perpendicular distance is just a difference
 * of coordinates, readable straight off the picture, so the projection has nothing to explain. On a
 * diagonal the foot of the perpendicular has to be worked out, which is the point.
 */
export const NEAREST_WALL: Segment = {
  a: { x: -2.25, y: -1.25 },
  b: { x: 2.25, y: 1.25 },
};

/**
 * Where the dragged point starts.
 *
 * Chosen so both scenes open on something worth looking at: the parameter is past the far end, so the
 * clamp is visibly doing work, and the guard's view is **blocked**, so the reader starts from a hit
 * rather than from nothing. The wrong version agrees here, though - the bug is something they have to go
 * and find, as in Section 5.1.
 */
export const START: Point = { x: 3.25, y: 1.5 };

export type NearestReport = {
  /** The unclamped parameter, which says how far past an end you are. */
  raw: number;
  /** And the clamped one, which is the answer. */
  clamped: number;
  onSegment: Point;
  onLine: Point;
  toSegment: number;
  toLine: number;
  /** True when the clamp changed the answer, which is the whole point of the scene. */
  clampMattered: boolean;
};

export function nearestReport(p: Point): NearestReport {
  const raw = projectionT(NEAREST_WALL, p) ?? 0;
  const clamped = Math.min(Math.max(raw, 0), 1);
  return {
    raw,
    clamped,
    onSegment: closestPoint(NEAREST_WALL, p, "segment"),
    onLine: closestPoint(NEAREST_WALL, p, "line"),
    toSegment: distanceToSegment(NEAREST_WALL, p),
    toLine: distanceToLine(NEAREST_WALL, p),
    clampMattered: raw < 0 || raw > 1,
  };
}

export type SightReport = {
  clear: boolean;
  /** What the wrong version thinks, so the picture can show a disagreement rather than describe one. */
  clearIfLines: boolean;
  blocker: Segment | null;
  hitAt: Point | null;
  /** And where the phantom wall stopped the view, which is a different place. */
  blockerIfLines: Segment | null;
  hitAtIfLines: Point | null;
  disagrees: boolean;
};

/**
 * Both verdicts and **both** crossing points.
 *
 * The two hit points are kept apart deliberately. An earlier version of the scene coloured its sight
 * line by whichever test was selected but always marked the correct test's crossing, so in the one case
 * the Section is about - the wrong test blocking a view that is really clear - it drew a red line with no
 * explanation of what had stopped it. Reporting both means the picture can point at the phantom wall.
 */
export function sightReport(p: Point): SightReport {
  const blocked = firstBlocker(GUARD_AT, p, WALLS);
  const blockedByLines = firstBlockerWrong(GUARD_AT, p, WALLS);
  const clear = hasLineOfSight(GUARD_AT, p, WALLS);
  const clearIfLines = hasLineOfSightWrong(GUARD_AT, p, WALLS);
  return {
    clear,
    clearIfLines,
    blocker: blocked?.wall ?? null,
    hitAt: blocked?.crossing.point ?? null,
    blockerIfLines: blockedByLines?.wall ?? null,
    hitAtIfLines: blockedByLines?.crossing.point ?? null,
    disagrees: clear !== clearIfLines,
  };
}

/**
 * Sweep a full turn around the guard and count how many directions the two tests disagree about.
 *
 * The number that makes the infinite-line bug concrete. A ring rather than a grid because "how much of
 * the guard's view is wrong" is the question a designer would ask, and a ring answers it in degrees.
 */
/**
 * How far the reader may push the sweep's question. Coarse steps, so the cache below stays small.
 *
 * Worth having as a control rather than a constant: at three units out the two tests agree completely,
 * and by ten the third wall's line has come into range. Watching the figure move is the argument that
 * it needs its radius quoted beside it.
 */
export const RADIUS_RANGE = { min: 3, max: 10, step: 0.5 } as const;

/**
 * Sweeps are cached by radius, because the scene needs enough samples to be **right**.
 *
 * At 1440 samples the scene reported $129.5°$ where the page quoted $129.4°$ - two displays of one
 * quantity disagreeing, and neither matching the true $129.4179°$. The resolution has to be fine enough
 * that the second decimal is trustworthy, which is far too much work to redo on every pointer move. The
 * answer does not depend on the dragged point at all, only on the radius, so it is computed once per
 * radius and kept.
 */
const SWEEP_CACHE = new Map<number, ReturnType<typeof computeSweep>>();

export function sweepDisagreements(
  radius = SIGHT_RADIUS,
  samples = 36000,
): ReturnType<typeof computeSweep> {
  const key = radius * 1e6 + samples;
  const cached = SWEEP_CACHE.get(key);
  if (cached) return cached;
  const computed = computeSweep(radius, samples);
  SWEEP_CACHE.set(key, computed);
  return computed;
}

function computeSweep(
  radius: number,
  samples: number,
): {
  total: number;
  /** Directions the two tests disagree about, as degrees of the full turn. */
  degrees: number;
  /** How much of the turn is genuinely clear. */
  clearDegrees: number;
  /** And how much the wrong version thinks is clear. */
  wrongClearDegrees: number;
} {
  let disagreeing = 0;
  let clear = 0;
  let wrongClear = 0;
  for (let i = 0; i < samples; i += 1) {
    const angle = (i / samples) * Math.PI * 2;
    const target = {
      x: GUARD_AT.x + Math.cos(angle) * radius,
      y: GUARD_AT.y + Math.sin(angle) * radius,
    };
    const right = hasLineOfSight(GUARD_AT, target, WALLS);
    const wrong = hasLineOfSightWrong(GUARD_AT, target, WALLS);
    if (right) clear += 1;
    if (wrong) wrongClear += 1;
    if (right !== wrong) disagreeing += 1;
  }
  const asDegrees = (n: number) => (n / samples) * 360;
  return {
    total: samples,
    degrees: asDegrees(disagreeing),
    clearDegrees: asDegrees(clear),
    wrongClearDegrees: asDegrees(wrongClear),
  };
}

/** Is a target this far out, in this direction, visible? What the sight scene's compass draws. */
export function clearInDirection(
  angle: number,
  radius = SIGHT_RADIUS,
  wrong = false,
): boolean {
  const target = {
    x: GUARD_AT.x + Math.cos(angle) * radius,
    y: GUARD_AT.y + Math.sin(angle) * radius,
  };
  return wrong
    ? hasLineOfSightWrong(GUARD_AT, target, WALLS)
    : hasLineOfSight(GUARD_AT, target, WALLS);
}

/** World to canvas pixels, centred. The Y flip lives here and nowhere else. */
export function screenOf(p: Point): { x: number; y: number } {
  return { x: VIEW.width / 2 + p.x * UNIT, y: VIEW.height / 2 - p.y * UNIT };
}

/** And back, which is what a drag needs. Its round trip is asserted at build time. */
export function worldOf(sx: number, sy: number): Point {
  return { x: (sx - VIEW.width / 2) / UNIT, y: (VIEW.height / 2 - sy) / UNIT };
}

/** A dragged point, kept inside the canvas. */
export function clampToBounds(p: Point): Point {
  return {
    x: Math.min(Math.max(p.x, -BOUNDS.x), BOUNDS.x),
    y: Math.min(Math.max(p.y, -BOUNDS.y), BOUNDS.y),
  };
}
