/**
 * The geometry of a vision cone, kept free of Three.js so both halves of the demo agree.
 *
 * `dirFromBearing` is the conversion the scene depends on: it turns "the target is 40
 * degrees off my left shoulder" into a world direction. Conversions like that are where
 * sign errors live, so it sits here where the build can check it rather than inside a
 * render loop where it cannot.
 */
import { type Vec } from "../vectors.ts";
import { dot } from "../dot.ts";

/** The guard faces local -Z, the same convention as Three.js, Godot and OpenGL. */
export const FORWARD: Vec = [0, 0, -1];

/** How far from the guard the target sits. Only the direction matters to the test. */
export const RANGE = 3.2;

/**
 * A horizontal unit direction, `deg` away from forward.
 *
 * Zero is straight ahead. Positive swings toward world +X, which is to the right of the
 * screen in the top-down view the scene uses.
 */
export function dirFromBearing(deg: number): Vec {
  const a = (deg * Math.PI) / 180;
  return [Math.sin(a), 0, -Math.cos(a)];
}

/** Where to draw the target for a given bearing. */
export function targetAt(deg: number): Vec {
  return dirFromBearing(deg).map((c) => c * RANGE);
}

/** The cosine a dot product has to beat to count as inside a cone of this total width. */
export function thresholdFor(fovDeg: number): number {
  return Math.cos((fovDeg * 0.5 * Math.PI) / 180);
}

/**
 * The test itself, spelled out rather than called, so the demo can show every part of it.
 *
 * `dirFromBearing` already returns a unit vector and `FORWARD` is one, so no normalizing
 * is needed here - which is the point of keeping directions normalized in the first place.
 */
export function coneTest(
  bearingDeg: number,
  fovDeg: number,
): { d: number; threshold: number; inside: boolean } {
  const d = dot(FORWARD, dirFromBearing(bearingDeg));
  const threshold = thresholdFor(fovDeg);
  return { d, threshold, inside: d > threshold };
}
