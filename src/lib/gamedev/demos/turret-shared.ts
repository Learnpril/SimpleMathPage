/**
 * The two helpers the turret needs, in a file with no Three.js import.
 *
 * Kept separate so the build-time demo and the browser-only scene can share exactly the
 * same `wrapRad` without dragging a rendering library into the build.
 */
export const TAU = Math.PI * 2;

/**
 * Fold an angle into [-PI, PI), which is always the short way round.
 *
 * Same function as `wrapRad` in src/lib/gamedev/angles.ts. This is the one line that
 * stops the turret spinning 350 degrees to reach something 10 degrees away.
 */
export function wrapRad(radians: number): number {
  const m = (radians + Math.PI) % TAU;
  return (m < 0 ? m + TAU : m) - Math.PI;
}

/** Radians to degrees, rounded, for readable output. */
export function radToDegRounded(radians: number): number {
  return Math.round(((radians * 180) / Math.PI) * 100) / 100;
}

/**
 * The yaw that makes an object's local -Z axis point along (x, z).
 *
 * Both components are negated, and that is the -Z forward convention from lesson 1
 * turning up again. Rotating by yaw about Y sends local -Z to world
 * (-sin yaw, -cos yaw), so to make that equal (x, z) you need yaw = atan2(-x, -z).
 *
 * Using atan2(x, z) instead - which looks perfectly reasonable - aims the object exactly
 * half a turn away from its target. That was a real bug in this scene, and it is why
 * `forwardAtYaw` below exists: it lets the build check this instead of trusting it.
 */
export function yawToFace(x: number, z: number): number {
  return Math.atan2(-x, -z);
}

/**
 * Where an object at this yaw is actually pointing, in world space, given -Z forward.
 *
 * The inverse of `yawToFace`, and the thing that makes the convention testable.
 */
export function forwardAtYaw(yaw: number): { x: number; z: number } {
  return { x: -Math.sin(yaw), z: -Math.cos(yaw) };
}
