/**
 * The cross product, surface normals, and building a full orientation from one
 * direction.
 *
 * Displayed in the lesson and imported by the figure above it.
 */
import { type Vec, normalize } from "./vectors.ts";

/**
 * A vector perpendicular to both inputs, whose length is the area of the parallelogram
 * they span.
 *
 * Each component is built from the other two axes, cycling x to y to z. Swapping the
 * arguments negates the result, so order matters here in a way it never does for the
 * dot product.
 *
 * The arithmetic is fixed. Where the answer *points* depends on the handedness of the
 * coordinate system, which is why a left/right test written for Unity answers backwards
 * in Three.js or Godot.
 */
export function cross(a: Vec, b: Vec): Vec {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * The 2D "cross product": the z component the 3D version would produce.
 *
 * Two dimensions have no third axis to point along, so the result is a single number.
 * Its sign says which side of `a` the vector `b` lies on, which is the piece of
 * information the dot product cannot give you.
 */
export function cross2(a: Vec, b: Vec): number {
  return a[0] * b[1] - a[1] * b[0];
}

/**
 * The outward normal of a triangle, from its winding order.
 *
 * List the corners the other way round and the normal flips. That is the entire reason
 * 3D tools have a "flip normals" button, and why a model can look right in one program
 * and inside-out in another.
 */
export function triangleNormal(p0: Vec, p1: Vec, p2: Vec): Vec | null {
  const e1 = p1.map((c, i) => c - p0[i]);
  const e2 = p2.map((c, i) => c - p0[i]);
  return normalize(cross(e1, e2));
}

/**
 * Three perpendicular unit vectors from a single forward direction. This is what
 * `look_at` does internally.
 *
 * Returns null when `forward` is parallel to `worldUp`, because then there is genuinely
 * no way to decide which way is "right". That is not a bug to fix: looking straight up,
 * every horizontal direction is equally valid. Engines hit the same wall, which is why
 * third-person cameras clamp pitch just short of vertical.
 *
 * The argument order in the first cross product is load-bearing, and getting it wrong is
 * subtle enough to be worth spelling out. With forward as -Z, `cross(forward, worldUp)`
 * gives +X, which is the right. `cross(worldUp, forward)` gives -X - the *left* - and the
 * resulting three vectors are still mutually perpendicular and still unit length, so
 * every orthonormality check passes while the triple is quietly left-handed. Anything
 * oriented by it comes out mirrored. The demo in the lesson checks the determinant for
 * exactly this reason.
 *
 * Note `up` needs no normalizing: the cross product of two perpendicular unit vectors
 * already has length 1.
 */
export function buildBasis(
  forward: Vec,
  worldUp: Vec = [0, 1, 0],
): { right: Vec; up: Vec; forward: Vec } | null {
  const f = normalize(forward);
  if (f === null) return null;
  const right = normalize(cross(f, worldUp));
  if (right === null) return null; // forward was parallel to worldUp
  return { right, up: cross(right, f), forward: f };
}

/**
 * Which side of `forward` does `toTarget` lie on, as a signed number?
 *
 * Cross to get a perpendicular, then dot with up to collapse it to one value. Which
 * sign means "left" depends on handedness, so establish it once by experiment and write
 * it down rather than guessing each time.
 */
export function sideOf(
  forward: Vec,
  toTarget: Vec,
  up: Vec = [0, 1, 0],
): number {
  const c = cross(forward, toTarget);
  return c[0] * up[0] + c[1] * up[1] + c[2] * up[2];
}
