/**
 * What to do once a test says two things are touching. Detection was half the job.
 *
 * Two problems, and they are separate. **Position** is already wrong - the shapes overlap, so
 * something has to be moved out. **Velocity** is still wrong - it is still pointing into the
 * surface, so next frame will overlap again by the same amount. Fix only the first and the
 * object buzzes against the wall; fix only the second and it sinks in and stays there.
 *
 * The whole file rests on one decomposition. Split a velocity into the part heading along the
 * surface normal and the part left over, and every response is a choice about what to do with
 * those two pieces. Sliding throws the normal part away. Bouncing reverses it. Friction shrinks
 * the other one. There is no separate formula for any of them.
 */
import type { Vec3 } from "./matrices.ts";
import { aabbAabb, rayAabb, type Aabb } from "./collision.ts";

const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const sub = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});
const mul = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
const dot3 = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const size = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Everything a response needs: which way to push, and how far in. */
export type Contact = { normal: Vec3; depth: number };

/**
 * A velocity split into the part along the surface normal and the part across it.
 *
 * `amount` is the signed size of the normal part, and its sign is the useful bit: **negative
 * means heading into the surface**, which is the only case that needs responding to. A positive
 * amount means the object is already leaving, and interfering with that is what causes an
 * object to stick to a wall it was trying to walk away from.
 */
export function decompose(
  v: Vec3,
  n: Vec3,
): { amount: number; normalPart: Vec3; tangentPart: Vec3 } {
  const amount = dot3(v, n);
  const normalPart = mul(n, amount);
  return { amount, normalPart, tangentPart: sub(v, normalPart) };
}

/**
 * Throw away the part heading into the surface and keep the rest. This is sliding.
 *
 * It is Section 1.3's `slide` in three dimensions, and it is the single most useful line in a
 * character controller: what `move_and_slide` does, and why running into a wall at an angle
 * carries you along it instead of stopping you dead.
 */
export function slideAlong(v: Vec3, n: Vec3): Vec3 {
  return sub(v, mul(n, dot3(v, n)));
}

/**
 * Reverse the part heading into the surface, scaled by how bouncy the surface is.
 *
 * $$v' = v - (1 + e)(v \cdot n)\,n$$
 *
 * `restitution` of 1 is a perfect bounce that keeps all its speed, and 0 gives back exactly
 * `slideAlong`. **Sliding is bouncing with no bounce**, which is worth noticing: there are not
 * two separate behaviours here, only one number.
 */
export function reflect(v: Vec3, n: Vec3, restitution = 1): Vec3 {
  return sub(v, mul(n, dot3(v, n) * (1 + restitution)));
}

/**
 * The full response: bounce the normal part, and shave the tangent part with friction.
 *
 * `friction` of 0 slides freely along the surface and 1 stops dead in that direction. This is a
 * crude model - real friction depends on how hard the surfaces are pressed together - but it is
 * what most games use, because a designer can feel what the number does.
 */
export function respond(
  v: Vec3,
  n: Vec3,
  restitution: number,
  friction: number,
): Vec3 {
  const { amount, tangentPart } = decompose(v, n);
  if (amount > 0) return v; // Already leaving. Do not interfere.
  return add(
    mul(n, -amount * restitution),
    mul(tangentPart, 1 - clamp01(friction)),
  );
}

/**
 * Move a position out of a surface by the penetration depth, plus a little.
 *
 * That little extra is the **skin**, and it is not sloppiness. Pushing out to exactly zero
 * separation leaves the object on the boundary, where the next frame's test can round either
 * way - so it reports a contact, then no contact, then a contact, and the object buzzes. A skin
 * of a millimeter or two costs nothing visible and removes the whole problem. Unity exposes it
 * as `skinWidth` for exactly this reason.
 */
export function pushOut(position: Vec3, contact: Contact, skin = 0.001): Vec3 {
  return add(position, mul(contact.normal, contact.depth + skin));
}

/** How deep two boxes overlap on each axis. Negative entries mean that axis is clear. */
export function axisOverlaps(
  a: Aabb,
  b: Aabb,
): Array<{ axis: "x" | "y" | "z"; overlap: number }> {
  return (["x", "y", "z"] as const).map((axis) => ({
    axis,
    overlap: -Math.max(a.min[axis] - b.max[axis], b.min[axis] - a.max[axis]),
  }));
}

/**
 * The **minimum translation vector** for two overlapping boxes: the shortest push that separates
 * them, as a direction and a distance.
 *
 * Shortest is the whole point. Any of the three axes would separate them, but the other two move
 * the object further than it needs to go, and a character pushed out sideways when they landed on
 * a floor reads as being flung. Section 6.2's `aabbAabb` already reports the axis with the
 * shallowest overlap, so the MTV falls out of the test that detected the contact.
 */
export function boxContact(a: Aabb, b: Aabb): Contact | null {
  const { separation, axis } = aabbAabb(a, b);
  if (separation >= 0) return null;
  const aCentre = (a.min[axis] + a.max[axis]) / 2;
  const bCentre = (b.min[axis] + b.max[axis]) / 2;
  const normal: Vec3 = { x: 0, y: 0, z: 0 };
  normal[axis] = bCentre >= aCentre ? 1 : -1;
  return { normal, depth: -separation };
}

/** How steep a surface is, in degrees from flat. A floor is 0 and a wall is 90. */
export function slopeAngle(
  normal: Vec3,
  up: Vec3 = { x: 0, y: 1, z: 0 },
): number {
  const length = size(normal) * size(up);
  if (length < 1e-12) return 0;
  const c = dot3(normal, up) / length;
  return (Math.acos(Math.min(1, Math.max(-1, c))) * 180) / Math.PI;
}

/**
 * Is this surface a floor or a wall? The question a character controller has to ask.
 *
 * Nothing in the geometry distinguishes them - both are just surfaces with normals. The
 * difference is a threshold somebody chose, and it is what stops a player walking up a cliff by
 * pressing forward into it. Above the limit, the surface is treated as a wall and the character
 * slides down instead of standing on it.
 */
export function isWalkable(normal: Vec3, maxSlopeDegrees: number): boolean {
  return slopeAngle(normal) <= maxSlopeDegrees;
}

// ---- Sweeping, and the reason it exists --------------------------------------------------

/** A box grown by a radius on every side. */
export function expandBox(box: Aabb, radius: number): Aabb {
  const r = { x: radius, y: radius, z: radius };
  return { min: sub(box.min, r), max: add(box.max, r) };
}

/**
 * When a moving sphere first touches a box, in seconds, or `null` if it does not within `dt`.
 *
 * The trick is that a sphere against a box is a **point against a box grown by the radius**, so
 * this is Section 6.2's `rayAabb` with no new geometry at all. It is exact on the faces and
 * slightly generous at the corners, where the grown shape should really be rounded - which
 * matters for a shape sliding along an edge and not at all for catching a bullet.
 *
 * This is the fix for **tunneling**. A test done only at frame positions asks "am I overlapping
 * now", and something fast enough is simply never sampled while it is inside the wall. Sweeping
 * asks "did I pass through between then and now", which is a different question and the right
 * one.
 */
export function sweepSphereToBox(
  centre: Vec3,
  velocity: Vec3,
  radius: number,
  box: Aabb,
  dt: number,
): number | null {
  const speed = size(velocity);
  if (speed < 1e-12) return null;
  const direction = mul(velocity, 1 / speed);
  const hit = rayAabb(centre, direction, expandBox(box, radius));
  if (hit === null) return null;
  if (hit.startedInside) return 0;
  const time = hit.enter / speed;
  return time <= dt ? time : null;
}

/**
 * How high a ball reaches after a given number of bounces.
 *
 * Restitution scales **speed** by `e`, and height goes as the square of speed, so each bounce
 * keeps only `e²` of the height. That squaring is why a restitution that sounds lively, say 0.8,
 * still loses more than a third of the height every time it lands.
 */
export function apexAfterBounces(
  height: number,
  restitution: number,
  bounces: number,
): number {
  return height * Math.pow(restitution, 2 * bounces);
}
