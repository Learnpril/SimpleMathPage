/**
 * The curves the two scenes share: where the control points start, and how the world maps to pixels.
 *
 * Both scenes drive the **same** control points, because the geometry scene and the travelling scene
 * are two questions about one curve. Presets rather than eight sliders: dragging four handles is the
 * natural way to explore this, and a row of buttons is the keyboard path to the same configurations.
 */
import {
  arcTable,
  curveLength,
  fractionAtT,
  pointAt,
  speedSpread,
  tAtFraction,
  type Point,
} from "../../../gamedev2d/bezier2d.ts";

/** Pixels per world unit. The curve lives in world units so its facing angles match Section 2.2's. */
export const UNIT = 44;

/** The canvas both scenes draw into. */
export const VIEW = { width: 620, height: 330 } as const;

/** How far a control point may be dragged, in world units. Keeps every handle on the canvas. */
export const BOUNDS = { x: 6.4, y: 3.2 } as const;

export type Preset = {
  name: string;
  /** Three points for a quadratic, four for a cubic. */
  points: Point[];
  /** Why this one is in the list, which is the only reason to have presets rather than one curve. */
  shows: string;
};

/**
 * Four configurations, each chosen for one thing it makes visible.
 *
 * The first is a **control case** and it is in the list on purpose: a symmetric curve puts $t = 0.5$ at
 * exactly half the length, so it hides the problem completely. The first draft of this list was three
 * symmetric curves, every one of them reporting a perfect $50\%$, which would have made the Section's
 * central claim look like a rounding error. The second preset is the one that shows it.
 *
 * The third has a single handle the curve never reaches, and the fourth puts a handle on its own
 * endpoint so the tangent at the start is the zero vector and the facing angle has no answer at all.
 */
export const PRESETS: readonly Preset[] = [
  {
    name: "symmetric",
    points: [
      { x: -5, y: -2 },
      { x: -2.2, y: 2.4 },
      { x: 2.2, y: -2.4 },
      { x: 5, y: 2 },
    ],
    shows: "symmetric, so t = 0.5 is exactly halfway and hides the problem",
  },
  {
    name: "slow start, fast finish",
    points: [
      { x: -5.2, y: 1.8 },
      { x: -4.4, y: -1.2 },
      { x: -2, y: -2.6 },
      { x: 5.6, y: 2.2 },
    ],
    shows: "t = 0.5 is only a third of the way along",
  },
  {
    name: "quadratic",
    points: [
      { x: -5, y: -2.2 },
      { x: 0, y: 3 },
      { x: 5, y: -2.2 },
    ],
    shows: "one handle, and the curve never reaches it",
  },
  {
    name: "handle on the endpoint",
    points: [
      { x: -5, y: -2 },
      { x: -5, y: -2 },
      { x: 2, y: 2.6 },
      { x: 5, y: -1 },
    ],
    shows: "a zero tangent at the start, so the facing has no answer",
  },
];

/** World to canvas pixels, centred. The Y flip lives here and nowhere else. */
export function screenOf(p: Point): { x: number; y: number } {
  return { x: VIEW.width / 2 + p.x * UNIT, y: VIEW.height / 2 - p.y * UNIT };
}

/** And back, which is what a drag needs. Its round trip is asserted at build time. */
export function worldOf(sx: number, sy: number): Point {
  return {
    x: (sx - VIEW.width / 2) / UNIT,
    y: (VIEW.height / 2 - sy) / UNIT,
  };
}

/** A dragged handle, kept inside the canvas. */
export function clampToBounds(p: Point): Point {
  return {
    x: Math.min(Math.max(p.x, -BOUNDS.x), BOUNDS.x),
    y: Math.min(Math.max(p.y, -BOUNDS.y), BOUNDS.y),
  };
}

/** Enough segments that the drawn curve has no visible corners at this size. */
export const DRAW_STEPS = 96;

/** The polyline a scene strokes for the curve itself. */
export function outline(points: readonly Point[]): Point[] {
  return Array.from({ length: DRAW_STEPS + 1 }, (_, i) =>
    pointAt(points, i / DRAW_STEPS),
  );
}

/** How many marks the travelling scene drops along the path. Same eleven as Section 4.2's gallery. */
export const MARKS = 11;

/**
 * The eleven marks, spaced either by equal steps of `t` or by equal steps of **distance**.
 *
 * This is the comparison the Section is built on, and putting it here rather than in the scene means
 * the build can assert that the two really do differ - otherwise the picture would be one row of dots
 * drawn twice and the reader would learn nothing.
 */
export function markPoints(
  points: readonly Point[],
  byDistance: boolean,
): Point[] {
  const table = arcTable(points);
  return Array.from({ length: MARKS }, (_, i) => {
    const fraction = i / (MARKS - 1);
    return pointAt(
      points,
      byDistance ? tAtFraction(table, fraction) : fraction,
    );
  });
}

/** The largest gap between consecutive marks, in world units. Even spacing means constant speed. */
export function widestMarkGap(
  points: readonly Point[],
  byDistance: boolean,
): number {
  const marks = markPoints(points, byDistance);
  let widest = 0;
  for (let i = 1; i < marks.length; i += 1) {
    widest = Math.max(
      widest,
      Math.hypot(marks[i].x - marks[i - 1].x, marks[i].y - marks[i - 1].y),
    );
  }
  return widest;
}

/** The narrowest gap, so the scene can report the ratio the reader is looking at. */
export function narrowestMarkGap(
  points: readonly Point[],
  byDistance: boolean,
): number {
  const marks = markPoints(points, byDistance);
  let narrowest = Infinity;
  for (let i = 1; i < marks.length; i += 1) {
    narrowest = Math.min(
      narrowest,
      Math.hypot(marks[i].x - marks[i - 1].x, marks[i].y - marks[i - 1].y),
    );
  }
  return narrowest;
}

/** Everything the travelling scene puts in its readouts, in one place so the build can check it. */
export type TravelReport = {
  length: number;
  /** Fastest point over slowest, in parameter terms. 1 would mean `t` already was distance. */
  spread: number;
  /** The fraction of the length reached at t = 0.5. Half, if `t` were distance. */
  halfway: number;
  /** Widest mark gap over narrowest. Even marks means even speed. */
  evenness: number;
};

export function travelReport(
  points: readonly Point[],
  byDistance: boolean,
): TravelReport {
  return {
    length: curveLength(points),
    spread: speedSpread(points),
    halfway: fractionAtT(points, 0.5),
    evenness:
      narrowestMarkGap(points, byDistance) < 1e-9
        ? Infinity
        : widestMarkGap(points, byDistance) /
          narrowestMarkGap(points, byDistance),
  };
}

// ---- The seam, shared with the values demo so the build checks the same numbers it prints ----

/**
 * The first curve of a two-curve chain. It arrives at the seam heading down and to the right.
 *
 * **The seam is deliberately not at the origin.** It was, in the first version, and that made the
 * mirror formula $P_1' = 2S - P_{n-1}$ indistinguishable from $S - P_{n-1}$ - because at $S = 0$ the
 * two agree. A sabotage that halved the reflection passed every assertion. Moving the seam to
 * $(1.2, 0.5)$ is what gives that check teeth.
 */
export const JOIN_A: readonly Point[] = [
  { x: -4, y: -0.5 },
  { x: -2.5, y: 2.75 },
  { x: -0.5, y: 2.5 },
  { x: 1.5, y: 0.5 },
];

/**
 * A second curve that starts exactly where the first ends, and still has a corner at the seam.
 *
 * Its first handle heads up and to the right at $+45°$ while the first curve arrives heading down and
 * to the right at $-45°$, so the seam turns through exactly a right angle. Sharing an endpoint is not
 * smoothness, and this is the example that says so - the first attempt at writing it accidentally
 * placed the handle at exactly the mirrored position, producing a seam angle of $0$ and demonstrating
 * nothing at all.
 *
 * Every coordinate here is a half or a quarter, which are exact in binary. That is not fussiness: the
 * mirrored handle is printed in a values panel that gets committed to the repository, and with tenths
 * it came out as $2.6999999999999997$.
 */
export const JOIN_NAIVE: readonly Point[] = [
  { x: 1.5, y: 0.5 },
  { x: 3.25, y: 2.25 },
  { x: 4.75, y: -1.25 },
  { x: 6.25, y: 1.75 },
];
