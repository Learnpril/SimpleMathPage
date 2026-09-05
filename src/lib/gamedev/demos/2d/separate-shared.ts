/**
 * Two convex polygons the reader can move and turn, and one concave one that catches SAT out.
 *
 * The concave shape shares this file rather than getting its own, because the point being made is a
 * comparison: the same test, the same code path, and an answer that is right for one shape and wrong for
 * the other.
 */
import {
  candidateAxes,
  containsPoint,
  convexHull,
  cornerCentre,
  distinctAxisCount,
  overlapOnAxis,
  polygonsOverlap,
  project,
  regularPolygon,
  rotatePolygon,
  separatingAxis,
  smallestOverlap,
  smallestOverlapRaw,
  suitableForSat,
  translatePolygon,
  type Polygon,
} from "../../../gamedev2d/sat2d.ts";
import type { Point, Vector } from "../../../gamedev2d/vectors2d.ts";

/** Pixels per world unit. */
export const UNIT = 42;

/** The canvas the scenes draw into. */
export const VIEW = { width: 620, height: 340 } as const;

/**
 * How far the moving shape may be dragged.
 *
 * The vertical bound is the tight one and the first attempt got it wrong: at $2.6$ a corner of the
 * triangle left the top of the canvas once it was turned half a turn. The triangle's circumradius is
 * $1.7$ and half the canvas is $4.048$ units, so the centre can reach $2.348$ - and the build now sweeps
 * every bound corner at every five degrees of spin rather than taking that on trust.
 */
export const BOUNDS = { x: 5.6, y: 2.3 } as const;

/** How far either shape may be turned, in degrees. A full turn, since nothing here is symmetric about it. */
export const SPIN_RANGE = { min: -180, max: 180 } as const;

/** The shape that stays put: a pentagon, so its five normals are all different directions. */
export const FIXED: Polygon = regularPolygon(5, 1.9, { x: -2.4, y: 0 }, 0.35);

/** And the one that moves: a triangle, for the fewest axes that still make a shape. */
export const MOVING: Polygon = regularPolygon(3, 1.7, { x: 0, y: 0 }, 0.2);

/** Where it starts. Clear of the pentagon, so the first thing on screen is a separating axis. */
export const START: Point = { x: 2.9, y: 1.1 };

/**
 * A chevron: concave, and the shape SAT quietly lies about.
 *
 * Concave by construction - the middle corner is pushed **in** past the line between its neighbours, so
 * the cross products change sign and `isConvex` says no. Its convex hull covers the notch, and the notch
 * is exactly where SAT invents collisions.
 */
export const CHEVRON: Polygon = [
  { x: -2, y: -1.5 },
  { x: 0, y: -0.25 },
  { x: 2, y: -1.5 },
  { x: 2, y: 0.5 },
  { x: 0, y: 1.75 },
  { x: -2, y: 0.5 },
];

/** The chevron's convex hull, shared so the scene draws what the checks measure against. */
export const CHEVRON_HULL: Polygon = convexHull(CHEVRON);

/** The probe the concave scene slides around, small enough to fit inside the notch. */
export const PROBE_RADIUS = 0.55;

export function probeAt(p: Point): Polygon {
  // A square rather than a circle, since SAT is a polygon test and mixing in a circle would confuse it.
  return [
    { x: p.x - PROBE_RADIUS, y: p.y - PROBE_RADIUS },
    { x: p.x + PROBE_RADIUS, y: p.y - PROBE_RADIUS },
    { x: p.x + PROBE_RADIUS, y: p.y + PROBE_RADIUS },
    { x: p.x - PROBE_RADIUS, y: p.y + PROBE_RADIUS },
  ];
}

/**
 * Where the probe starts: **inside the notch, where SAT is already wrong.**
 *
 * Found by searching rather than guessed. My first choice of $(0, -1.1)$ turned out to be a genuine
 * overlap - the probe's upper corners really do reach inside the notch's sloping edges there - so the
 * scene would have opened on SAT being perfectly correct while the prose claimed otherwise. At $-1.25$
 * every corner is clear of the shape and SAT still reports a hit.
 */
export const PROBE_START: Point = { x: 0, y: -1.25 };

export function movingAt(p: Point, spinDegrees: number): Polygon {
  return translatePolygon(
    rotatePolygon(MOVING, (spinDegrees * Math.PI) / 180),
    p,
  );
}

export function fixedAt(spinDegrees: number): Polygon {
  return rotatePolygon(
    FIXED,
    (spinDegrees * Math.PI) / 180,
    cornerCentre(FIXED),
  );
}

export type SatReport = {
  hit: boolean;
  /** The axis that proved a miss, or `null` when there is none to find. */
  proof: Vector | null;
  /** How many axes had to be tried before the answer was known. */
  tried: number;
  /** Of the axes offered, how many point in genuinely different directions. */
  distinct: number;
  /** The shallowest overlap, which is what Section 5.4 pushes along. */
  push: ReturnType<typeof smallestOverlap>;
  /** And what the unnormalized version would have chosen instead. */
  rawPush: ReturnType<typeof smallestOverlapRaw>;
  /** True when those two disagree about the direction to push. */
  pushDisagrees: boolean;
};

export function satReport(a: Polygon, b: Polygon): SatReport {
  const axes = candidateAxes(a, b);
  const proof = separatingAxis(a, b);
  // How far the loop actually got: it stops at the first axis showing a gap.
  let tried = axes.length;
  for (let i = 0; i < axes.length; i += 1) {
    if (overlapOnAxis(a, b, axes[i]) <= 0) {
      tried = i + 1;
      break;
    }
  }
  const push = smallestOverlap(a, b);
  const rawPush = smallestOverlapRaw(a, b);
  return {
    hit: proof === null,
    proof,
    tried,
    distinct: distinctAxisCount(a, b),
    push,
    rawPush,
    pushDisagrees:
      push !== null &&
      rawPush !== null &&
      Math.abs(push.axis.x * rawPush.axis.y - push.axis.y * rawPush.axis.x) >
        1e-9,
  };
}

/**
 * How much area SAT wrongly claims is inside the chevron, measured by sampling.
 *
 * Counts probe positions where SAT reports an overlap and the honest ray-casting test says the probe is
 * entirely outside the shape. That is a real false positive rather than a boundary quibble, and its size
 * is what turns "SAT needs convex shapes" from a rule into a consequence.
 */
export function concaveFalseArea(samples = 400): {
  falseArea: number;
  total: number;
  fraction: number;
} {
  const span = PROBE_SPAN;
  const cell = ((2 * span.x) / samples) * ((2 * span.y) / samples);
  let wrong = 0;
  let counted = 0;
  for (let i = 0; i < samples; i += 1) {
    for (let j = 0; j < samples; j += 1) {
      const centre = {
        x: -span.x + ((i + 0.5) / samples) * 2 * span.x,
        y: -span.y + ((j + 0.5) / samples) * 2 * span.y,
      };
      counted += 1;
      const probe = probeAt(centre);
      if (!polygonsOverlap(CHEVRON, probe)) continue;
      /* SAT says they touch. Does any corner of the probe actually lie inside the chevron, or any corner
         of the chevron inside the probe? If neither, and no edges cross, SAT has invented it. */
      const anyProbeCornerInside = probe.some((c) => containsPoint(CHEVRON, c));
      const anyShapeCornerInside = CHEVRON.some((c) => containsPoint(probe, c));
      if (!anyProbeCornerInside && !anyShapeCornerInside) wrong += 1;
    }
  }
  return {
    falseArea: wrong * cell,
    total: counted * cell,
    fraction: wrong / counted,
  };
}

/** Is a probe position one where SAT is wrong? What the concave scene colours by. */
export function satIsWrongAt(p: Point): boolean {
  const probe = probeAt(p);
  if (!polygonsOverlap(CHEVRON, probe)) return false;
  return (
    !probe.some((c) => containsPoint(CHEVRON, c)) &&
    !CHEVRON.some((c) => containsPoint(probe, c))
  );
}

/** The extent the concave scene samples over, shared by the measurement and the drawing. */
export const PROBE_SPAN = { x: 3.2, y: 3.2 } as const;

/**
 * The probe centres where SAT is wrong, as a grid of cells to shade.
 *
 * Computed once and cached, because it does not depend on anything the reader controls - only on the
 * shape, which is fixed. Cheap enough at mount and far too slow per pointer move.
 */
let FALSE_CELLS: Array<{ x: number; y: number; size: number }> | null = null;

export function falseRegionCells(
  samples = 90,
): Array<{ x: number; y: number; size: number }> {
  if (FALSE_CELLS !== null) return FALSE_CELLS;
  const cells: Array<{ x: number; y: number; size: number }> = [];
  const step = (2 * PROBE_SPAN.x) / samples;
  for (let i = 0; i < samples; i += 1) {
    for (let j = 0; j < samples; j += 1) {
      const centre = {
        x: -PROBE_SPAN.x + (i + 0.5) * step,
        y: -PROBE_SPAN.y + (j + 0.5) * ((2 * PROBE_SPAN.y) / samples),
      };
      if (satIsWrongAt(centre)) cells.push({ ...centre, size: step });
    }
  }
  FALSE_CELLS = cells;
  return cells;
}

/** The shadow a polygon casts on an axis, as two points on that axis for drawing. */
export function shadowSegment(
  poly: Polygon,
  axis: Vector,
): { from: Point; to: Point } {
  const shadow = project(poly, axis);
  return {
    from: { x: axis.x * shadow.min, y: axis.y * shadow.min },
    to: { x: axis.x * shadow.max, y: axis.y * shadow.max },
  };
}

/** World to canvas pixels, centred. The Y flip lives here and nowhere else. */
export function screenOf(p: Point): { x: number; y: number } {
  return { x: VIEW.width / 2 + p.x * UNIT, y: VIEW.height / 2 - p.y * UNIT };
}

/** And back, which is what a drag needs. Its round trip is asserted at build time. */
export function worldOf(sx: number, sy: number): Point {
  return { x: (sx - VIEW.width / 2) / UNIT, y: (VIEW.height / 2 - sy) / UNIT };
}

/** A dragged shape, kept inside the canvas. */
export function clampToBounds(p: Point): Point {
  return {
    x: Math.min(Math.max(p.x, -BOUNDS.x), BOUNDS.x),
    y: Math.min(Math.max(p.y, -BOUNDS.y), BOUNDS.y),
  };
}

/** Re-exported so the scenes and the checks all speak of one source. */
export { suitableForSat };
