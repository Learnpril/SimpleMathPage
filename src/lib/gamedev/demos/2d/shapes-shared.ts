/**
 * The three pairings the scenes show, behind one interface, plus the world-to-pixel mapping.
 *
 * Putting them behind one interface is the point rather than a convenience: all three tests are a
 * distance against a radius or a range against a range, and a reader who sees three separate scenes
 * learns three formulas instead of one idea.
 */
import {
  aabbOverlapDepth,
  aabbsOverlap,
  boxAround,
  circleAabbOverlap,
  circleAabbOverlapNaive,
  circleAabbSeparation,
  circleSeparation,
  circlesOverlap,
  circlesOverlapWrongSquare,
  closestPointInAabb,
  cornerErrorArea,
  expanded,
  type Aabb,
  type Circle,
} from "../../../gamedev2d/collide2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/** Pixels per world unit. */
export const UNIT = 46;

/** The canvas both scenes draw into. */
export const VIEW = { width: 620, height: 320 } as const;

/**
 * How far the moving shape may be dragged, in world units.
 *
 * The vertical bound is the tight one and the first version got it wrong: at $y = 2.6$ the top of the
 * dragged circle sat a pixel above the canvas. Half the canvas is $160$ px, which is $3.478$ units, so
 * the centre can reach $3.478 - 1.25 = 2.228$ and no further. The build sweeps the bound corners.
 */
export const BOUNDS = { x: 5.4, y: 2.2 } as const;

export type Kind = "two circles" | "two boxes" | "circle and box";
export const KINDS: readonly Kind[] = [
  "two circles",
  "two boxes",
  "circle and box",
];

/**
 * The shape that stays put, one per pairing.
 *
 * Every dimension here is a **binary fraction** - halves, quarters, eighths - so that corners and
 * half-extents come out exact. With a width of $3.4$ the box's left edge printed as
 * $-3.0999999999999996$, and these coordinates end up in a values panel that is committed to the
 * repository.
 */
export const STATIC_CIRCLE: Circle = { centre: { x: -1.5, y: 0 }, radius: 1.5 };
export const STATIC_BOX: Aabb = boxAround({ x: -1.5, y: 0 }, 3.5, 2.5);

/** And the shape the reader drags. Same rule: quarters and eighths only. */
export const MOVING_RADIUS = 1.25;
export const MOVING_BOX = { width: 2.5, height: 1.75 } as const;

export function movingCircleAt(p: Point): Circle {
  return { centre: p, radius: MOVING_RADIUS };
}

export function movingBoxAt(p: Point): Aabb {
  return boxAround(p, MOVING_BOX.width, MOVING_BOX.height);
}

export type Report = {
  hit: boolean;
  /** What the test actually compared, so the picture is not magic. */
  detail: string;
  /** Negative when overlapping. The one number all three pairings share. */
  separation: number;
  /** For the circle-and-box pairing only: the clamped point the test measured to. */
  nearest: Point | null;
  /** True when a deliberately wrong version of this test disagrees with the right one. */
  naiveDisagrees: boolean;
};

/**
 * Run a pairing at a position, and report what it compared as well as what it decided.
 *
 * Each pairing also carries a **wrong** version, and the report says when the two disagree. That is
 * what lets one picture show a bug rather than describing one: for circles the wrong version squares
 * the radii separately, and for a box it grows the rectangle and gets the corners square.
 */
export function reportAt(kind: Kind, p: Point): Report {
  switch (kind) {
    case "two circles": {
      const moving = movingCircleAt(p);
      const hit = circlesOverlap(STATIC_CIRCLE, moving);
      return {
        hit,
        detail: "centre distance against the sum of the radii, both squared",
        separation: circleSeparation(STATIC_CIRCLE, moving),
        nearest: null,
        naiveDisagrees:
          circlesOverlapWrongSquare(STATIC_CIRCLE, moving) !== hit,
      };
    }
    case "two boxes": {
      const moving = movingBoxAt(p);
      const hit = aabbsOverlap(STATIC_BOX, moving);
      const depth = aabbOverlapDepth(STATIC_BOX, moving);
      return {
        hit,
        detail: "each axis on its own: they miss if either one has a gap",
        /* Taking the minimum does double duty. While they are apart the depths are negative and the
           most negative axis is the widest gap, which is the one keeping them separated. Once they
           overlap both are positive and the smallest is the shorter way back out. */
        separation: -Math.min(depth.x, depth.y),
        nearest: null,
        naiveDisagrees: false,
      };
    }
    case "circle and box": {
      const moving = movingCircleAt(p);
      const hit = circleAabbOverlap(moving, STATIC_BOX);
      return {
        hit,
        detail: "clamp the centre into the box, then it is two circles again",
        separation: circleAabbSeparation(moving, STATIC_BOX),
        nearest: closestPointInAabb(STATIC_BOX, p),
        naiveDisagrees: circleAabbOverlapNaive(moving, STATIC_BOX) !== hit,
      };
    }
  }
}

// ---- The corner scene ------------------------------------------------------------------------

/** The box the corner scene grows. Smaller than the other one so both outlines fit. */
export const CORNER_BOX: Aabb = boxAround({ x: 0, y: 0 }, 3.25, 2.25);

/** How large a radius the corner scene's slider allows. */
export const RADIUS_RANGE = { min: 0.3, max: 1.8 } as const;

/** The square-cornered region the naive test accepts: the box grown by the radius. */
export function naiveRegion(radius: number): Aabb {
  return expanded(CORNER_BOX, radius);
}

/**
 * The area the naive test gets wrong, measured by sampling rather than by trusting the formula.
 *
 * Counts positions where the two tests disagree over a grid covering the whole grown region, and
 * scales by the cell area. Compared against $(4 - \pi)r^2$ in the checks, which is a real test because
 * the two are computed completely differently - one by counting, the other in closed form.
 */
export function measuredErrorArea(radius: number, samples = 400): number {
  const region = naiveRegion(radius);
  const width = region.max.x - region.min.x;
  const height = region.max.y - region.min.y;
  const cell = (width / samples) * (height / samples);
  let wrong = 0;
  for (let i = 0; i < samples; i += 1) {
    for (let j = 0; j < samples; j += 1) {
      const centre = {
        x: region.min.x + ((i + 0.5) / samples) * width,
        y: region.min.y + ((j + 0.5) / samples) * height,
      };
      const circle = { centre, radius };
      if (
        circleAabbOverlapNaive(circle, CORNER_BOX) !==
        circleAabbOverlap(circle, CORNER_BOX)
      ) {
        wrong += 1;
      }
    }
  }
  return wrong * cell;
}

/** The closed form, re-exported so the scene and the checks quote the same source. */
export { cornerErrorArea };

/**
 * The false-positive area as a fraction of the whole region the naive test accepts.
 *
 * A better number for a caption than bare area, because it answers "how often does this matter" rather
 * than "how big is it in square units nobody has a feel for".
 */
export function errorFraction(radius: number): number {
  const region = naiveRegion(radius);
  const total = (region.max.x - region.min.x) * (region.max.y - region.min.y);
  return cornerErrorArea(radius) / total;
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

/** Where the moving shape starts. A clear miss in all three pairings, so the first look is a miss. */
export const START: Point = { x: 2.75, y: 1 };
