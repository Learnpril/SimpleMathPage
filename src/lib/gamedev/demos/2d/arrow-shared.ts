/**
 * Two places, the displacement between them, and an origin that can be moved out from under both.
 *
 * The origin shift is the point of the whole thing: it is what tells a place apart from a
 * displacement, so it is kept here where the check can sweep it rather than inside the scene.
 */
import {
  displacement,
  fromNewOrigin,
  type Point,
} from "../../../gamedev2d/vectors2d.ts";
import { unitsDown, type View } from "../../../gamedev2d/screen.ts";

export const VIEW: View = {
  pixelWidth: 620,
  pixelHeight: 330,
  unitsAcross: 16,
};
export const WORLD_HEIGHT = unitsDown(VIEW);

export const START_A: Point = { x: 3, y: 2 };
export const START_B: Point = { x: 11, y: 6 };

/**
 * What the readouts say, for a given pair of places and a given origin.
 *
 * Both places are re-measured from the moved origin. The displacement is computed from those
 * re-measured numbers, so if it came out different the shift would be doing something real - which
 * is exactly what the check is there to rule out.
 */
export function readings(a: Point, b: Point, origin: Point) {
  const aFrom = fromNewOrigin(a, origin);
  const bFrom = fromNewOrigin(b, origin);
  return {
    a: aFrom,
    b: bFrom,
    /** Unchanged by the shift, always. */
    between: displacement(aFrom, bFrom),
    /** Changes with every shift, which is why it is meaningless. */
    sum: { x: aFrom.x + bFrom.x, y: aFrom.y + bFrom.y },
  };
}
