/**
 * Rays, planes, and the closest point on things - the arithmetic every collision test is built
 * from.
 *
 * One idea runs through all of it: **signed distance**. A single number that is negative inside a
 * shape, zero on its surface and positive outside. Once a shape can answer that, "are we touching"
 * is a comparison and "which way do I push out" is the direction it grows fastest. Part 6 keeps
 * coming back to it.
 *
 * The `Plane` type is the one `projection.ts` already defined for frustum planes. Same maths, so
 * the same type - a frustum plane and a wall are not different kinds of thing.
 */
import type { Vec3 } from "./matrices.ts";
import { distanceToPlane, type Plane } from "./projection.ts";

export type { Plane };
export { distanceToPlane };

const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const mul = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
export const magnitude = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** A ray is a start and a direction. Keep the direction unit length and `t` is a distance. */
export type Ray = { origin: Vec3; direction: Vec3 };

/** The point `t` along a ray. This is the whole parametric idea: one number picks a point. */
export function pointAt(ray: Ray, t: number): Vec3 {
  return add(ray.origin, mul(ray.direction, t));
}

/**
 * A plane through a point with a given normal.
 *
 * Stored as `n` plus `d`, so that `n · p + d` is the signed distance from the plane for any point -
 * which is why this form is worth using over storing a point and a normal separately.
 */
export function planeThrough(point: Vec3, normal: Vec3): Plane {
  const len = magnitude(normal) || 1;
  const n = mul(normal, 1 / len);
  return { x: n.x, y: n.y, z: n.z, d: -dot(n, point) };
}

/**
 * Where a ray meets a plane, as a distance along the ray. `null` when they never meet.
 *
 * The derivation is two lines. A point on the ray is `O + tD`, and a point is on the plane when
 * `n · p + d = 0`. Substitute and solve:
 *
 * ```
 * n · (O + tD) + d = 0
 * t = -(n · O + d) / (n · D)
 * ```
 *
 * **That denominator is the whole story.** `n · D` measures how much the ray heads into the plane;
 * when it is zero the ray runs parallel and there is no answer at all. Divide anyway and you get
 * `Infinity`, or `NaN` if the ray happens to lie in the plane - and Part 1 covered how far a `NaN`
 * travels before anyone notices.
 *
 * A negative result means the plane is **behind** the ray's start, which is a different thing from
 * no intersection and is usually still a miss for the caller's purposes.
 */
export function rayPlane(ray: Ray, plane: Plane): number | null {
  const denominator =
    plane.x * ray.direction.x +
    plane.y * ray.direction.y +
    plane.z * ray.direction.z;
  if (Math.abs(denominator) < 1e-9) return null;
  return -distanceToPlane(plane, ray.origin) / denominator;
}

// ---- Closest points ----------------------------------------------------------------------

/** The closest point on an **infinite** line through `a` and `b`. */
export function closestOnLine(a: Vec3, b: Vec3, p: Vec3): Vec3 {
  const ab = sub(b, a);
  const lengthSquared = dot(ab, ab);
  if (lengthSquared < 1e-12) return a;
  return add(a, mul(ab, dot(sub(p, a), ab) / lengthSquared));
}

/**
 * The closest point on a **segment**, which is the line version with one `clamp`.
 *
 * That clamp is the entire difference, and forgetting it is why a character sometimes gets pulled
 * towards a point off the end of a wall rather than to the wall's corner.
 */
export function closestOnSegment(a: Vec3, b: Vec3, p: Vec3): Vec3 {
  const ab = sub(b, a);
  const lengthSquared = dot(ab, ab);
  if (lengthSquared < 1e-12) return a;
  return add(a, mul(ab, clamp01(dot(sub(p, a), ab) / lengthSquared)));
}

/** The closest point on a plane: step off it by exactly the signed distance. */
export function closestOnPlane(plane: Plane, p: Vec3): Vec3 {
  const distance = distanceToPlane(plane, p);
  return {
    x: p.x - plane.x * distance,
    y: p.y - plane.y * distance,
    z: p.z - plane.z * distance,
  };
}

/**
 * The closest point on an axis-aligned box: clamp each coordinate on its own.
 *
 * Three independent clamps, no cases, no branches on which face is nearest. It works because the
 * box is a product of three intervals, so the nearest point in each axis is decided separately.
 * Section 6.2's sphere-versus-box test is this function plus one comparison.
 */
export function closestOnBox(min: Vec3, max: Vec3, p: Vec3): Vec3 {
  const clamp = (v: number, lo: number, hi: number) =>
    v < lo ? lo : v > hi ? hi : v;
  return {
    x: clamp(p.x, min.x, max.x),
    y: clamp(p.y, min.y, max.y),
    z: clamp(p.z, min.z, max.z),
  };
}

/** The closest point on a sphere's surface. Undefined at the centre, so it names a direction. */
export function closestOnSphere(centre: Vec3, radius: number, p: Vec3): Vec3 {
  const away = sub(p, centre);
  const length = magnitude(away);
  if (length < 1e-12) return { x: centre.x + radius, y: centre.y, z: centre.z };
  return add(centre, mul(away, radius / length));
}

// ---- Signed distance ---------------------------------------------------------------------

/**
 * Signed distance to a box: negative inside, zero on the surface, positive outside.
 *
 * The two halves do different jobs. `outside` measures how far past the box you are in each axis,
 * ignoring axes you are still within, and takes the length - which handles corners correctly. The
 * `inside` term only bites when every axis is within, and gives the distance to the nearest face
 * as a negative number.
 */
export function signedDistanceToBox(min: Vec3, max: Vec3, p: Vec3): number {
  const centre = mul(add(min, max), 0.5);
  const half = mul(sub(max, min), 0.5);
  const q = {
    x: Math.abs(p.x - centre.x) - half.x,
    y: Math.abs(p.y - centre.y) - half.y,
    z: Math.abs(p.z - centre.z) - half.z,
  };
  const outside = magnitude({
    x: Math.max(q.x, 0),
    y: Math.max(q.y, 0),
    z: Math.max(q.z, 0),
  });
  const inside = Math.min(Math.max(q.x, q.y, q.z), 0);
  return outside + inside;
}

/** Signed distance to a sphere. Same convention, and a one-liner. */
export function signedDistanceToSphere(
  centre: Vec3,
  radius: number,
  p: Vec3,
): number {
  return magnitude(sub(p, centre)) - radius;
}
