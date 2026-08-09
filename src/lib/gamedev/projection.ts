/**
 * The last matrix in the chain, and the one that behaves differently from all the others.
 *
 * Everything in Part 2 kept the bottom row at `(0, 0, 0, 1)`, so `w` stayed 1 and a point stayed a
 * point. Projection breaks that on purpose: it writes depth into `w`, and the divide by `w` that
 * follows is what makes distant things small. That divide is also where depth precision goes, which
 * is the practical half of this Section.
 */
import type { Mat4, Vec3, Vec4 } from "./matrices.ts";
import { applyMat4, rowsOf } from "./matrices.ts";

const DEG = Math.PI / 180;

/**
 * A perspective projection, from a **vertical** field of view.
 *
 * Vertical is the convention worth defaulting to, because it keeps the same amount of the world
 * visible when the window gets wider - only the horizontal extent grows. Do it the other way and
 * an ultrawide monitor crops the top and bottom off your game.
 */
export function perspective(
  fovYDegrees: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const t = Math.tan(fovYDegrees * DEG * 0.5);
  return {
    i: { x: 1 / (aspect * t), y: 0, z: 0, w: 0 },
    j: { x: 0, y: 1 / t, z: 0, w: 0 },
    // The -1 in w is the whole trick: it copies view depth into clip w.
    k: { x: 0, y: 0, z: -(far + near) / (far - near), w: -1 },
    t: { x: 0, y: 0, z: (-2 * far * near) / (far - near), w: 0 },
  };
}

/**
 * An orthographic projection: no divide, so no convergence and no foreshortening.
 *
 * Its bottom row stays `(0, 0, 0, 1)`, which means it is an ordinary affine transform of the kind
 * Part 2 already covered. That is the real difference between the two - not the look, the `w`.
 */
export function orthographic(
  halfHeight: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  return {
    i: { x: 1 / (aspect * halfHeight), y: 0, z: 0, w: 0 },
    j: { x: 0, y: 1 / halfHeight, z: 0, w: 0 },
    k: { x: 0, y: 0, z: -2 / (far - near), w: 0 },
    t: { x: 0, y: 0, z: -(far + near) / (far - near), w: 1 },
  };
}

/** Horizontal field of view implied by a vertical one at a given aspect ratio. */
export function fovXFromFovY(fovYDegrees: number, aspect: number): number {
  return (2 * Math.atan(aspect * Math.tan(fovYDegrees * DEG * 0.5))) / DEG;
}

/** And back the other way, for a tool that insists on horizontal. */
export function fovYFromFovX(fovXDegrees: number, aspect: number): number {
  return (2 * Math.atan(Math.tan(fovXDegrees * DEG * 0.5) / aspect)) / DEG;
}

/**
 * Project a view-space point into normalised device coordinates, divide included.
 *
 * Anything with all three components inside `[-1, 1]` is on screen. Returns `null` when `w` has
 * collapsed, which happens exactly at the camera's own position - the one place projection has no
 * answer.
 */
export function ndcOf(proj: Mat4, p: Vec3): Vec3 | null {
  const clip: Vec4 = applyMat4(proj, { x: p.x, y: p.y, z: p.z, w: 1 });
  if (Math.abs(clip.w) < 1e-12) return null;
  return { x: clip.x / clip.w, y: clip.y / clip.w, z: clip.z / clip.w };
}

/** Half the height and width of the frustum at a given distance in front of the camera. */
export function extentAt(
  fovYDegrees: number,
  aspect: number,
  distance: number,
): { halfHeight: number; halfWidth: number } {
  const halfHeight = distance * Math.tan(fovYDegrees * DEG * 0.5);
  return { halfHeight, halfWidth: halfHeight * aspect };
}

/** The eight corners of the frustum in view space: near face first, then far. */
export function frustumCorners(
  fovYDegrees: number,
  aspect: number,
  near: number,
  far: number,
): Vec3[] {
  const out: Vec3[] = [];
  for (const distance of [near, far]) {
    const { halfHeight: h, halfWidth: w } = extentAt(
      fovYDegrees,
      aspect,
      distance,
    );
    out.push(
      { x: -w, y: -h, z: -distance },
      { x: w, y: -h, z: -distance },
      { x: w, y: h, z: -distance },
      { x: -w, y: h, z: -distance },
    );
  }
  return out;
}

// ---- Six planes, straight out of the matrix ----------------------------------------------

/** A plane as `x*px + y*py + z*pz + d >= 0` for the inside. */
export type Plane = { x: number; y: number; z: number; d: number };

/**
 * The frustum's six planes, read directly off the projection matrix rows.
 *
 * This is worth seeing rather than deriving trigonometrically. "Inside" means every NDC coordinate
 * lies in `[-1, 1]`, and each of those six inequalities is a row of the matrix added to or
 * subtracted from the last row. So the planes are not extra information - they were in the matrix
 * the whole time.
 */
export function frustumPlanes(proj: Mat4): Plane[] {
  const r = rowsOf(proj);
  const combine = (a: number[], b: number[], sign: number): Plane => {
    const raw = {
      x: b[0] + sign * a[0],
      y: b[1] + sign * a[1],
      z: b[2] + sign * a[2],
      d: b[3] + sign * a[3],
    };
    const len = Math.hypot(raw.x, raw.y, raw.z) || 1;
    return { x: raw.x / len, y: raw.y / len, z: raw.z / len, d: raw.d / len };
  };
  return [
    combine(r[0], r[3], 1), // left
    combine(r[0], r[3], -1), // right
    combine(r[1], r[3], 1), // bottom
    combine(r[1], r[3], -1), // top
    combine(r[2], r[3], 1), // near
    combine(r[2], r[3], -1), // far
  ];
}

/** Signed distance from a plane. Negative means outside. */
export const distanceToPlane = (plane: Plane, p: Vec3): number =>
  plane.x * p.x + plane.y * p.y + plane.z * p.z + plane.d;

/**
 * Is a sphere at least partly inside all six planes?
 *
 * A sphere rather than a point, because that is what culling actually tests - the object's bounding
 * volume. Fail any one plane by more than the radius and the object cannot be visible, which is why
 * this is the cheap early-out that runs before anything is drawn.
 */
export function insideFrustum(planes: Plane[], p: Vec3, radius = 0): boolean {
  for (const plane of planes) {
    if (distanceToPlane(plane, p) < -radius) return false;
  }
  return true;
}

// ---- Where depth precision goes ----------------------------------------------------------

/** NDC depth for a point straight ahead at `distance` in front of the camera. */
export function ndcDepth(proj: Mat4, distance: number): number {
  const ndc = ndcOf(proj, { x: 0, y: 0, z: -distance });
  return ndc === null ? NaN : ndc.z;
}

/**
 * How much world distance a single depth-buffer step covers, at a given distance out.
 *
 * Small is good: it is the thickness of the thinnest gap the depth buffer can still tell apart.
 * When two surfaces are closer together than this they fight for the same value and flicker, which
 * is z-fighting.
 *
 * Computed from the matrix by finite difference rather than from a remembered formula, so it cannot
 * drift away from whatever `perspective` actually builds.
 */
export function depthResolution(
  proj: Mat4,
  distance: number,
  bits = 24,
): number {
  const quantum = 2 / Math.pow(2, bits);
  const h = distance * 1e-6;
  const slope =
    (ndcDepth(proj, distance + h) - ndcDepth(proj, distance - h)) / (2 * h);
  return Math.abs(quantum / slope);
}

// ---- Pixels, and going backwards ---------------------------------------------------------

/** Where a pixel sits in NDC. Note the **Y flip**: pixels count down, NDC counts up. */
export function screenToNdc(
  px: number,
  py: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (px / width) * 2 - 1,
    y: -((py / height) * 2 - 1),
  };
}

/** And back to pixels, flipping Y again. */
export function ndcToScreen(
  ndc: { x: number; y: number },
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (ndc.x * 0.5 + 0.5) * width,
    y: (0.5 - ndc.y * 0.5) * height,
  };
}

/**
 * The view-space point that a cursor position corresponds to, at a chosen distance.
 *
 * Read straight off the frustum's geometry rather than by inverting the projection matrix.
 * Section 5.1 already established that the frustum is `distance * tan(fov/2)` tall, so a
 * cursor at NDC `(x, y)` is that fraction of the way across it. No matrix inverse needed, and
 * `projectionCheck` confirms it round-trips through `ndcOf` exactly.
 *
 * Engines invert the matrix instead because they have to support projections this shortcut
 * does not cover - off-centre frusta for VR, oblique projections for portals.
 */
export function unprojectAt(
  fovYDegrees: number,
  aspect: number,
  ndc: { x: number; y: number },
  distance: number,
): Vec3 {
  const { halfHeight, halfWidth } = extentAt(fovYDegrees, aspect, distance);
  return { x: ndc.x * halfWidth, y: ndc.y * halfHeight, z: -distance };
}

/** A ray from the camera through a cursor position: origin plus a unit direction. */
export function rayThroughNdc(
  fovYDegrees: number,
  aspect: number,
  ndc: { x: number; y: number },
): { origin: Vec3; direction: Vec3 } {
  const at = unprojectAt(fovYDegrees, aspect, ndc, 1);
  const len = Math.hypot(at.x, at.y, at.z);
  return {
    origin: { x: 0, y: 0, z: 0 },
    direction: { x: at.x / len, y: at.y / len, z: at.z / len },
  };
}

/**
 * Where a world point lands on screen, and whether it should be drawn at all.
 *
 * `inFront` is the part people forget. Clip `w` is the point's distance in front of the camera,
 * so it goes **negative** behind the camera - and dividing by a negative number mirrors the
 * result through the origin. Skip that test and markers for things behind you appear on screen,
 * in the wrong place, upside down.
 */
export function projectToScreen(
  proj: Mat4,
  p: Vec3,
  width: number,
  height: number,
): { x: number; y: number; inFront: boolean; onScreen: boolean } {
  const clip = applyMat4(proj, { x: p.x, y: p.y, z: p.z, w: 1 });
  const inFront = clip.w > 1e-9;
  const w = inFront ? clip.w : 1;
  const ndc = { x: clip.x / w, y: clip.y / w, z: clip.z / w };
  const screen = ndcToScreen(ndc, width, height);
  return {
    ...screen,
    inFront,
    onScreen:
      inFront &&
      Math.abs(ndc.x) <= 1 &&
      Math.abs(ndc.y) <= 1 &&
      Math.abs(ndc.z) <= 1,
  };
}

/**
 * The nearest point where a ray enters a sphere, or `null` if it misses.
 *
 * Enough for picking, which is all this Section needs. Part 6 does intersection tests
 * properly, including the cases this one glosses over.
 */
export function raySphere(
  origin: Vec3,
  direction: Vec3,
  centre: Vec3,
  radius: number,
): number | null {
  const ox = origin.x - centre.x;
  const oy = origin.y - centre.y;
  const oz = origin.z - centre.z;
  const b = ox * direction.x + oy * direction.y + oz * direction.z;
  const c = ox * ox + oy * oy + oz * oz - radius * radius;
  const discriminant = b * b - c;
  if (discriminant < 0) return null;
  const root = Math.sqrt(discriminant);
  const near = -b - root;
  const far = -b + root;
  const t = near >= 0 ? near : far;
  return t >= 0 ? t : null;
}

// ---- Spherical coordinates, for an orbit camera ------------------------------------------

/**
 * A position on a sphere from two angles and a radius, which is what an orbit camera is.
 *
 * Azimuth sweeps around the Y axis, elevation tilts up and down. Storing a camera this way
 * means dragging maps onto the two angles directly, and zoom is the radius - all three controls
 * stay independent, which they do not if you store a position and try to rotate it.
 */
export function sphericalToCartesian(
  radius: number,
  azimuthDegrees: number,
  elevationDegrees: number,
): Vec3 {
  const az = azimuthDegrees * DEG;
  const el = elevationDegrees * DEG;
  const horizontal = radius * Math.cos(el);
  return {
    x: horizontal * Math.sin(az),
    y: radius * Math.sin(el),
    z: horizontal * Math.cos(az),
  };
}

/**
 * Back to angles. At the poles the azimuth is genuinely undefined - every value gives the same
 * point - so it reports 0 rather than whatever the floating point noise suggests.
 */
export function cartesianToSpherical(p: Vec3): {
  radius: number;
  azimuth: number;
  elevation: number;
} {
  const radius = Math.hypot(p.x, p.y, p.z);
  if (radius < 1e-12) return { radius: 0, azimuth: 0, elevation: 0 };
  const horizontal = Math.hypot(p.x, p.z);
  return {
    radius,
    azimuth: horizontal < 1e-12 ? 0 : Math.atan2(p.x, p.z) / DEG,
    elevation: Math.asin(Math.min(1, Math.max(-1, p.y / radius))) / DEG,
  };
}
