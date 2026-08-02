/**
 * The triangle the winding demo draws, and the pure functions that position it.
 *
 * Both halves of the demo import this: the scene, so the arrow it draws is the arrow the
 * maths produced, and the build-time rows, so the numbers on the page describe the thing
 * on screen rather than a second implementation of it.
 *
 * `eyeFromAzimuth` and `frontFaces` live here rather than in the scene on purpose. They
 * are the conversion between "where the camera is" and "which face you are looking at",
 * and a conversion like that is exactly where sign errors hide. Kept pure, they can be
 * checked at build time; left inside the render loop, they could not.
 */
import { type Vec, length } from "../vectors.ts";
import { cross, triangleNormal } from "../cross.ts";

/** The three corners, counter-clockwise seen from above. A 2 by 2 right triangle. */
export const P0: Vec = [0, 0, 0];
export const P1: Vec = [2, 0, 0];
export const P2: Vec = [0, 0, -2];

/** The corners in order. Flipping swaps the last two, which is all "flip normals" does. */
export function corners(flipped: boolean): [Vec, Vec, Vec] {
  return flipped ? [P0, P2, P1] : [P0, P1, P2];
}

/** The two edge vectors leaving the first corner. */
export function edges(flipped: boolean): { e1: Vec; e2: Vec } {
  const [a, b, c] = corners(flipped);
  return {
    e1: b.map((n, i) => n - a[i]),
    e2: c.map((n, i) => n - a[i]),
  };
}

/**
 * The unit normal for a given winding.
 *
 * Throws on a degenerate triangle rather than returning null. Here that could only mean
 * the constants above are wrong, and a build that fails is better than a page that
 * quietly documents a broken figure.
 */
export function normalFor(flipped: boolean): Vec {
  const [a, b, c] = corners(flipped);
  const n = triangleNormal(a, b, c);
  if (n === null) throw new Error("winding demo: the triangle is degenerate");
  return n;
}

/** Half the parallelogram the edges span. Winding does not affect it. */
export function areaFor(flipped: boolean): number {
  const { e1, e2 } = edges(flipped);
  return length(cross(e1, e2)) / 2;
}

/** Where the arrow is drawn from: the average of the corners. */
export const CENTROID: Vec = [0, 1, 2].map((i) => (P0[i] + P1[i] + P2[i]) / 3);

/** The camera's position for a given viewing angle, in degrees around the up axis. */
export function eyeFromAzimuth(deg: number, radius = 6.4, height = 3.6): Vec {
  const a = (deg * Math.PI) / 180;
  return [
    CENTROID[0] + Math.sin(a) * radius,
    height,
    CENTROID[2] + Math.cos(a) * radius,
  ];
}

/**
 * Is the camera on the side the normal points to?
 *
 * This is the whole of backface culling: dot the normal with the direction from the
 * surface to the eye, and look at the sign. Positive means you are seeing the front.
 */
export function frontFaces(normal: Vec, eye: Vec, pointOnFace: Vec): boolean {
  let d = 0;
  for (let i = 0; i < normal.length; i++) {
    d += normal[i] * (eye[i] - pointOnFace[i]);
  }
  return d > 0;
}
