/**
 * One deliberately uneven Catmull-Rom path, walked two ways.
 *
 * The waypoints are spaced unevenly on purpose. With even spacing the uniform-`t` and
 * uniform-distance walks look nearly the same and the section has nothing to show; unevenness is
 * exactly the condition that makes the difference visible, and it is also what real level layouts
 * look like.
 */
import type { Vec2 } from "../matrices.ts";
import {
  buildArcTable,
  catmullRomAt,
  tAtFraction,
  type ArcTable,
} from "../splines.ts";

export const WAYPOINTS: readonly Vec2[] = [
  { x: -2.3, y: -0.9 },
  { x: -1.7, y: 0.8 },
  { x: -1.2, y: -0.4 },
  { x: 1.4, y: 0.9 },
  { x: 2.3, y: -0.7 },
];

export const pathAt = (t: number): Vec2 => catmullRomAt(WAYPOINTS, t);

/** Built once and shared, because rebuilding a 256-sample table every frame would be silly. */
export const TABLE: ArcTable = buildArcTable(pathAt, 256);

/** Where a dot sits if you step `t` evenly. Uneven speed. */
export const byParameter = (u: number): Vec2 => pathAt(u);

/** Where a dot sits if you step **distance** evenly. Steady speed. */
export const byDistance = (u: number): Vec2 => pathAt(tAtFraction(TABLE, u));

/** The longest and shortest hop taken by a walk, over equal steps of its own input. */
export function hopSpread(
  walk: (u: number) => Vec2,
  steps = 200,
): { shortest: number; longest: number; ratio: number } {
  let shortest = Infinity;
  let longest = 0;
  let previous = walk(0);
  for (let i = 1; i <= steps; i += 1) {
    const here = walk(i / steps);
    const hop = Math.hypot(here.x - previous.x, here.y - previous.y);
    shortest = Math.min(shortest, hop);
    longest = Math.max(longest, hop);
    previous = here;
  }
  return { shortest, longest, ratio: longest / shortest };
}
