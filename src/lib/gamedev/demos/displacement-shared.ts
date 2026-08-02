/**
 * Two places and the journey between them. No Three.js, so the build can check it.
 */
import { type Vec } from "../vectors.ts";

/** The player stands still. Only the enemy moves, which keeps the demo to two sliders. */
export const PLAYER: Vec = [-2, 0, 2];

/** Point minus point. The result is a displacement: a direction and a length. */
export function displacement(from: Vec, to: Vec): Vec {
  return to.map((c, i) => c - from[i]);
}

/** Point plus displacement. The result is a place again. */
export function travel(from: Vec, by: Vec): Vec {
  return from.map((c, i) => c + by[i]);
}
