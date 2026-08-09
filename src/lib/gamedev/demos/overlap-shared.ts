/**
 * Four pairings of bounding volumes, all answering the same question the same way.
 *
 * The point of putting them behind one interface is that they really do share one: each
 * returns a separation, negative when the shapes overlap. The scene draws four different
 * pictures over one line of logic.
 */
import type { Vec3 } from "../matrices.ts";
import {
  aabbAabb,
  capsuleCapsule,
  sphereAabb,
  sphereSphere,
  type Aabb,
  type Capsule,
  type Sphere,
} from "../collision.ts";

export const STATIC_SPHERE: Sphere = {
  centre: { x: 0, y: 0, z: 0 },
  radius: 1.3,
};
export const STATIC_BOX: Aabb = {
  min: { x: -1.4, y: -1, z: -0.9 },
  max: { x: 1.4, y: 1, z: 0.9 },
};
export const STATIC_CAPSULE: Capsule = {
  a: { x: -1.5, y: -0.8, z: 0 },
  b: { x: 1.5, y: 0.8, z: 0 },
  radius: 0.55,
};

export const MOVING_SPHERE_RADIUS = 1;
export const MOVING_BOX_HALF = 0.9;
export const MOVING_CAPSULE_HALF = 1.1;
export const MOVING_CAPSULE_RADIUS = 0.5;

export type Kind = "spheres" | "sphere and box" | "boxes" | "capsules";
export const KINDS: readonly Kind[] = [
  "spheres",
  "sphere and box",
  "boxes",
  "capsules",
];

/** The moving box, centred wherever the sliders put it. Axis-aligned, so it never turns. */
export function movingBoxAt(p: Vec3): Aabb {
  const h = MOVING_BOX_HALF;
  return {
    min: { x: p.x - h, y: p.y - h, z: p.z - h },
    max: { x: p.x + h, y: p.y + h, z: p.z + h },
  };
}

/** The moving capsule, standing upright through the given point. */
export function movingCapsuleAt(p: Vec3): Capsule {
  return {
    a: { x: p.x, y: p.y - MOVING_CAPSULE_HALF, z: p.z },
    b: { x: p.x, y: p.y + MOVING_CAPSULE_HALF, z: p.z },
    radius: MOVING_CAPSULE_RADIUS,
  };
}

/**
 * The separation for a pairing, plus a phrase naming what the test actually did.
 *
 * The phrase is not decoration. Four tests that all return one number look like magic
 * unless the reader can see that each one is a distance minus some radii.
 */
export function testAt(
  kind: Kind,
  p: Vec3,
): { separation: number; detail: string } {
  switch (kind) {
    case "spheres":
      return {
        separation: sphereSphere(STATIC_SPHERE, {
          centre: p,
          radius: MOVING_SPHERE_RADIUS,
        }),
        detail: "centre distance minus both radii",
      };
    case "sphere and box":
      return {
        separation: sphereAabb(
          { centre: p, radius: MOVING_SPHERE_RADIUS },
          STATIC_BOX,
        ),
        detail: "closest point on the box, minus the radius",
      };
    case "boxes": {
      const { separation, axis } = aabbAabb(STATIC_BOX, movingBoxAt(p));
      return { separation, detail: `widest gap is on the ${axis} axis` };
    }
    case "capsules":
      return {
        separation: capsuleCapsule(STATIC_CAPSULE, movingCapsuleAt(p)),
        detail: "distance between the segments, minus both radii",
      };
  }
}
