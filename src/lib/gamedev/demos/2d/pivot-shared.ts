/**
 * A sprite rotated about a pivot, with the final translate available as a flag so the bug has a switch.
 *
 * The sprite is deliberately **not** at the origin. With the pivot at the origin the broken version is
 * exactly correct, so a scene placed there would show two identical outlines and teach nothing - which
 * is also precisely why this bug survives being tested.
 *
 * The framing lives here too, as `drawnExtent` and `fittingScale`. A rotated shape sweeps a circle
 * around its pivot, so the further the pivot is from the shape the more room the picture needs, and a
 * hand-picked pixels-per-unit went off the canvas at an eighth of the slider settings. Deriving the
 * scale from the geometry makes that impossible, and makes it checkable.
 */
import { rotateAbout, rotateAboutBroken } from "../../../gamedev2d/rotate2d.ts";
import { length } from "../../../gamedev2d/length2d.ts";
import { displacement, type Point } from "../../../gamedev2d/vectors2d.ts";

/**
 * An arrow, so which way it is facing is never in doubt. World units.
 *
 * It straddles the x-axis rather than sitting above it, which keeps every corner close to the origin.
 * That matters: the radius a corner sweeps sets how much canvas the scene needs, so a shape parked
 * far from the origin costs scale everywhere.
 */
export const SPRITE: readonly Point[] = [
  { x: 0.8, y: -0.45 },
  { x: 2.8, y: -0.45 },
  { x: 2.8, y: -0.9 },
  { x: 3.4, y: 0 },
  { x: 2.8, y: 0.9 },
  { x: 2.8, y: 0.45 },
  { x: 0.8, y: 0.45 },
];

/** The middle of the sprite's own bounding box, which is what "spin in place" means. */
export const SPRITE_CENTRE: Point = { x: 2.1, y: 0 };

/** The arrow's point. Named so the scene never repeats the coordinates and lets them drift. */
export const SPRITE_TIP: Point = SPRITE[3];

/** How far the pivot sliders can go. The scale is derived from this, so the two cannot disagree. */
export const PIVOT_RANGE = { minX: -1, maxX: 3.4, minY: -1, maxY: 1 };

export function transformed(
  angleDegrees: number,
  pivot: Point,
  translateBack: boolean,
): Point[] {
  const radians = (angleDegrees * Math.PI) / 180;
  return SPRITE.map((p) =>
    translateBack
      ? rotateAbout(p, pivot, radians)
      : rotateAboutBroken(p, pivot, radians),
  );
}

/**
 * How far the outermost corner sits from the pivot: the radius the whole shape sweeps.
 *
 * Every point of the rotated shape stays inside this radius at every angle, which is what makes the
 * framing below a bound rather than a guess.
 */
export function sweptRadius(pivot: Point): number {
  return Math.max(...SPRITE.map((p) => length(displacement(pivot, p))));
}

/**
 * What the shape rotates around, which is **not** the pivot when the last step is missing.
 *
 * This is the honest version of the picture. Skip the translate and the shape orbits the origin, so a
 * circle drawn around the pivot would be describing something that is not happening. The identity
 * that justifies it - the broken shape's distance from the origin equals the correct shape's distance
 * from the pivot - is asserted at build time rather than asserted in a caption.
 */
export function orbitCentre(pivot: Point, translateBack: boolean): Point {
  return translateBack ? pivot : { x: 0, y: 0 };
}

/**
 * How far from the origin anything drawn can reach, in world units.
 *
 * The correct shape reaches $|p| + r$ and the broken one reaches $r$, where $r$ is the swept radius.
 * Both $|p|$ and $r$ are convex in the pivot, so their sum is maximised at a **corner** of the pivot
 * rectangle - which is why four evaluations suffice. A fine scan of the whole rectangle is swept at
 * build time to confirm nothing exceeds it.
 */
export function drawnExtent(): { x: number; y: number } {
  const corners: Point[] = [
    { x: PIVOT_RANGE.minX, y: PIVOT_RANGE.minY },
    { x: PIVOT_RANGE.maxX, y: PIVOT_RANGE.minY },
    { x: PIVOT_RANGE.minX, y: PIVOT_RANGE.maxY },
    { x: PIVOT_RANGE.maxX, y: PIVOT_RANGE.maxY },
  ];
  let x = 0;
  let y = 0;
  for (const p of corners) {
    const r = sweptRadius(p);
    x = Math.max(x, Math.abs(p.x) + r, r);
    y = Math.max(y, Math.abs(p.y) + r, r);
  }
  return { x, y };
}

/**
 * Pixels per world unit, chosen so nothing the scene draws can leave the canvas.
 *
 * The margin covers the stroke width and the pivot's own dot, neither of which is a geometric point.
 * A narrow canvas simply gets a smaller scale, which is why this takes the half-sizes rather than
 * assuming any particular width.
 */
export function fittingScale(
  halfWidth: number,
  halfHeight: number,
  margin = 10,
): number {
  const extent = drawnExtent();
  return Math.min(
    (halfWidth - margin) / extent.x,
    (halfHeight - margin) / extent.y,
  );
}

/**
 * How far the broken version lands from the correct one.
 *
 * It is exactly the pivot, every time, whatever the angle - because the only thing missing is adding
 * the pivot back. Returned as a vector so the build can assert that rather than take the picture's
 * word for it.
 */
export function missBy(angleDegrees: number, pivot: Point): Point {
  const right = transformed(angleDegrees, pivot, true);
  const wrong = transformed(angleDegrees, pivot, false);
  return displacement(wrong[0], right[0]);
}
