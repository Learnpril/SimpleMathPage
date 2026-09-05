/**
 * Parents, children, and the two directions you convert between them.
 *
 * A hierarchy is one idea: **a child's transform is written relative to its parent**, so the child's
 * transform in world terms is the parent's world transform times the child's local one. A turret is
 * placed on the tank once, at (0, 0.4) facing forward, and it stays there whatever the tank does. Move
 * the tank and the turret comes along, for free, because the multiplication is doing the work.
 *
 * Everything here is Section 3.1's matrix with names attached. The parts worth being careful about are
 * the order of the product, the direction of the conversion, and one thing a hierarchy can do that a
 * single transform cannot: shear a child that its parent scaled unevenly.
 */
import {
  apply,
  applyToDirection,
  compose,
  inverse,
  multiply,
  rotation,
  scaling,
  translation,
  type Mat3,
} from "./matrix2d.ts";
import { cross } from "./cross2d.ts";
import { dot } from "./dot2d.ts";
import { normalize } from "./length2d.ts";
import type { Point, Vector } from "./vectors2d.ts";

/** Where something sits, which way it faces, and how big it is - relative to its parent. */
export type Placement = {
  position: Point;
  /** Radians, counter-clockwise, as everywhere else in this module. */
  rotation: number;
  scale: Vector;
};

/** The identity placement: at the origin, unrotated, unscaled. */
export function placed(
  position: Point = { x: 0, y: 0 },
  rotationRadians = 0,
  scale: Vector = { x: 1, y: 1 },
): Placement {
  return { position, rotation: rotationRadians, scale };
}

/**
 * One placement as a matrix, in the $T R S$ order Section 3.1 settled on.
 *
 * Scale first, then rotate, then translate. Every engine's local transform composes this way, which
 * is why that Section spent a panel on the six orderings.
 */
export function matrixOf(p: Placement): Mat3 {
  return compose(
    translation(p.position.x, p.position.y),
    rotation(p.rotation),
    scaling(p.scale.x, p.scale.y),
  );
}

/**
 * A chain of placements from the root down to the thing itself, as one world transform.
 *
 * $$M_{\text{world}} = M_{\text{root}} \; M_{\text{child}} \; M_{\text{grandchild}} \cdots$$
 *
 * **Root first.** Because points are columns on the right, the rightmost matrix is applied first, and
 * the rightmost matrix is the deepest child - the one whose coordinates the point is written in. So a
 * point starts in the deepest local space and gets carried outward, one parent at a time, until it is
 * in world space. Reverse the list and you get a transform that is not wrong in any single term and
 * is wrong in its entirety.
 */
export function worldOf(chain: readonly Placement[]): Mat3 {
  return compose(...chain.map(matrixOf));
}

/** A place, from a local space out to the world. */
export function pointToWorld(world: Mat3, local: Point): Point {
  return apply(world, local);
}

/**
 * A place, from the world back into a local space. The inverse direction, and the one that needs one.
 *
 * This is what a mouse click needs: the pointer arrives in world coordinates and the question is where
 * that is on the tank. Returns `null` when the transform cannot be inverted, which for a hierarchy
 * means some ancestor has a zero scale - the child has been flattened to nothing and no position on it
 * is recoverable.
 */
export function pointToLocal(world: Mat3, worldPoint: Point): Point | null {
  const back = inverse(world);
  return back === null ? null : apply(back, worldPoint);
}

/** A direction out to the world: rotated and scaled by the chain, never translated. Section 3.1's $w = 0$. */
export function directionToWorld(world: Mat3, local: Vector): Vector {
  return applyToDirection(world, local);
}

/** And back again. `null` on a collapsed chain, for the same reason as `pointToLocal`. */
export function directionToLocal(
  world: Mat3,
  worldVector: Vector,
): Vector | null {
  const back = inverse(world);
  return back === null ? null : applyToDirection(back, worldVector);
}

/**
 * The local transform a child needs to keep its current world transform under a **new** parent.
 *
 * $$M_{\text{local}} = M_{\text{newParent}}^{-1} \; M_{\text{world}}$$
 *
 * This is reparenting, and it is the operation behind "pick up the item without it jumping": the thing
 * must not move on screen, so its world transform is held fixed and its local one is solved for.
 * Note the shape - undo the new parent, then apply the world transform - which is the general rule
 * that $(AB)^{-1} = B^{-1}A^{-1}$ read in a useful direction.
 */
export function localUnderNewParent(
  newParentWorld: Mat3,
  desiredWorld: Mat3,
): Mat3 | null {
  const back = inverse(newParentWorld);
  return back === null ? null : multiply(back, desiredWorld);
}

/**
 * How far from square a transform's own axes have become. Zero for any rigid or uniformly scaled frame.
 *
 * This is the thing a hierarchy can do that a single placement cannot. A parent scaled unevenly does
 * not scale its rotated child unevenly - it **shears** it, because the child's axes are no longer
 * along the parent's, so each picks up a different amount of stretch. A square child comes out a
 * parallelogram, and nothing in the child's own numbers changed.
 *
 * Measured as the cosine of the angle between the two transformed axes, using Section 1.4's dot
 * product. It is the honest test, because "looks skewed" is not something a build can check.
 */
export function shearOf(m: Mat3): number {
  const xAxis = normalize({ x: m[0], y: m[3] });
  const yAxis = normalize({ x: m[1], y: m[4] });
  if (xAxis === null || yAxis === null) return 0;
  return dot(xAxis, yAxis);
}

/** Are the transform's axes still perpendicular? A shear-free frame, whatever its rotation or scale. */
export function isSquare(m: Mat3, tolerance = 1e-9): boolean {
  return Math.abs(shearOf(m)) < tolerance;
}

/**
 * How much the frame stretches each of its own axes, which is what "scale" means once shear is possible.
 *
 * The lengths of the two transformed axes. For a rigid transform both are 1; under a parent's uneven
 * scale they differ, and they are not the numbers the child was given.
 */
export function axisLengths(m: Mat3): Vector {
  return {
    x: Math.hypot(m[0], m[3]),
    y: Math.hypot(m[1], m[4]),
  };
}

/** Did the chain mirror the child? The determinant's sign, from Section 3.1, read through the axes. */
export function isMirrored(m: Mat3): boolean {
  return cross({ x: m[0], y: m[3] }, { x: m[1], y: m[4] }) < 0;
}
