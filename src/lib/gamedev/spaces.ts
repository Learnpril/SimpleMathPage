/**
 * Moving between spaces - local, world, view - and the one transform that is not the
 * object's own.
 *
 * Everything here is built from `matrices.ts`. The reason it is a separate file is that
 * every function below exists to answer one of two questions: "how do I get back?" and
 * "which matrix does a normal need?" The first is an inverse. The second is an inverse
 * transpose, and the difference between them is a bug that renders rather than crashes.
 */
import {
  IDENTITY4,
  applyMat3,
  applyMat4,
  determinant3,
  direction,
  multiplyMat4,
  point,
  type Mat3,
  type Mat4,
  type Vec3,
} from "./matrices.ts";

/** The rotation-and-scale block of a 4x4, with the translation dropped. */
export function basisOf(m: Mat4): Mat3 {
  return {
    i: { x: m.i.x, y: m.i.y, z: m.i.z },
    j: { x: m.j.x, y: m.j.y, z: m.j.z },
    k: { x: m.k.x, y: m.k.y, z: m.k.z },
  };
}

/** Swap rows and columns. */
export function transpose3(m: Mat3): Mat3 {
  return {
    i: { x: m.i.x, y: m.j.x, z: m.k.x },
    j: { x: m.i.y, y: m.j.y, z: m.k.y },
    k: { x: m.i.z, y: m.j.z, z: m.k.z },
  };
}

/**
 * Undo a 3x3, by cofactors. Returns `null` when the matrix flattens space, because then
 * there is genuinely nothing to undo - a collapsed volume cannot be un-collapsed.
 */
export function inverse3(m: Mat3): Mat3 | null {
  const det = determinant3(m);
  if (Math.abs(det) < 1e-12) return null;

  // Entry names follow the written matrix, row then column. Recall the columns are stored.
  const a = m.i.x;
  const b = m.j.x;
  const c = m.k.x;
  const d = m.i.y;
  const e = m.j.y;
  const f = m.k.y;
  const g = m.i.z;
  const h = m.j.z;
  const k = m.k.z;

  // The nine cofactors: each is the 2x2 determinant left when one row and column are struck.
  const c00 = e * k - f * h;
  const c01 = -(d * k - f * g);
  const c02 = d * h - e * g;
  const c10 = -(b * k - c * h);
  const c11 = a * k - c * g;
  const c12 = -(a * h - b * g);
  const c20 = b * f - c * e;
  const c21 = -(a * f - c * d);
  const c22 = a * e - b * d;

  // The inverse is the cofactors transposed and divided through - so a row above becomes a
  // column below, which is why the grouping looks shuffled.
  return {
    i: { x: c00 / det, y: c01 / det, z: c02 / det },
    j: { x: c10 / det, y: c11 / det, z: c12 / det },
    k: { x: c20 / det, y: c21 / det, z: c22 / det },
  };
}

/**
 * Undo a whole transform: invert the basis, then send the origin back where it came from.
 *
 * The translation is `-A^-1 t` rather than `-t`, because you have to undo the rotation and
 * scale before the offset means anything in the original space.
 */
export function inverseAffine4(m: Mat4): Mat4 | null {
  const inv = inverse3(basisOf(m));
  if (inv === null) return null;
  const back = applyMat3(inv, { x: m.t.x, y: m.t.y, z: m.t.z });
  return {
    i: direction(inv.i.x, inv.i.y, inv.i.z),
    j: direction(inv.j.x, inv.j.y, inv.j.z),
    k: direction(inv.k.x, inv.k.y, inv.k.z),
    t: point(-back.x, -back.y, -back.z),
  };
}

/**
 * The view matrix is not a new kind of thing. It is the camera's own transform, inverted.
 *
 * Moving the camera right is identical to moving the whole world left, and this is the
 * matrix that says so.
 */
export function viewFrom(cameraWorld: Mat4): Mat4 | null {
  return inverseAffine4(cameraWorld);
}

/**
 * Collapse a parent chain into one world matrix. Outermost ancestor first.
 *
 * Each child multiplies onto the **right**, because a child's own transform happens first
 * and its parent's is applied to the result.
 */
export function toWorld(chain: readonly Mat4[]): Mat4 {
  let m = IDENTITY4;
  for (const local of chain) m = multiplyMat4(m, local);
  return m;
}

/**
 * The matrix a **normal** has to be transformed by: the inverse transpose of the basis.
 *
 * A normal is not an arrow lying along the surface, it is an arrow perpendicular to it, and
 * those two behave differently under uneven scaling. Squash a sphere vertically and every
 * direction *along* the surface tilts towards horizontal, so a direction *perpendicular* to
 * it has to tilt the other way - towards vertical. Pushing a normal through the object's own
 * matrix tilts it the wrong way.
 *
 * For a pure rotation this returns the rotation unchanged, and for uniform scale it returns
 * the same direction with a different length, which is why the mistake survives so long.
 */
export function normalMatrix(m: Mat4): Mat3 | null {
  const inv = inverse3(basisOf(m));
  return inv === null ? null : transpose3(inv);
}

/** Transform a direction by a 4x4, which is `w = 0` and so ignores the translation. */
export function transformDirection(m: Mat4, v: Vec3): Vec3 {
  const out = applyMat4(m, direction(v.x, v.y, v.z));
  return { x: out.x, y: out.y, z: out.z };
}
