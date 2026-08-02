/**
 * Where the target sits, in a file with no Three.js so the build can check it.
 */
import { type Vec } from "../vectors.ts";

export const RANGE = 3.4;

/**
 * A point at a given compass bearing and height angle.
 *
 * Bearing 0 with elevation 0 is straight ahead along $-Z$, matching the forward
 * convention used everywhere else in this track.
 */
export function targetAt(
  bearingDeg: number,
  elevationDeg: number,
  radius = RANGE,
): Vec {
  const b = (bearingDeg * Math.PI) / 180;
  const e = (elevationDeg * Math.PI) / 180;
  const horizontal = Math.cos(e);
  return [
    Math.sin(b) * horizontal * radius,
    Math.sin(e) * radius,
    -Math.cos(b) * horizontal * radius,
  ];
}

/** Read a bearing and elevation back out of a position. The inverse of `targetAt`. */
export function anglesOf(p: Vec): { bearing: number; elevation: number } {
  const radius = Math.hypot(p[0], p[1], p[2]);
  return {
    bearing: (Math.atan2(p[0], -p[2]) * 180) / Math.PI,
    elevation: (Math.asin(p[1] / radius) * 180) / Math.PI,
  };
}
