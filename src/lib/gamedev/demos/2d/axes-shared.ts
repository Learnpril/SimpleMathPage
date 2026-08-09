/**
 * One point, and its coordinates in both conventions at once.
 *
 * The mapping lives here rather than in the scene because it is the part that can be silently
 * wrong: a flipped sign still draws a dot in a plausible place, and the only way to catch it is to
 * assert the round trip.
 */
import {
  screenToWorld,
  unitsDown,
  worldToScreen,
  type Vec2,
  type View,
} from "../../../gamedev2d/screen.ts";

/** The canvas the scene draws into, as a world 16 units across. */
export const VIEW: View = {
  pixelWidth: 620,
  pixelHeight: 340,
  unitsAcross: 16,
};

/** How tall the world is, given the canvas shape. Not chosen: derived. */
export const WORLD_HEIGHT = unitsDown(VIEW);

/**
 * Where the dot goes, from the two slider values.
 *
 * With `canvasStyle` off, the second slider means what a mathematician means: height above the
 * bottom. With it on, it means what a canvas means: distance down from the top. **The same slider
 * value puts the dot in two different places**, which is the entire lesson.
 */
export function pointFrom(
  across: number,
  second: number,
  canvasStyle: boolean,
): Vec2 {
  return { x: across, y: canvasStyle ? WORLD_HEIGHT - second : second };
}

/** Both readings of the same dot, for the readout. */
export function bothReadings(p: Vec2): { world: Vec2; screen: Vec2 } {
  return { world: p, screen: worldToScreen(p, VIEW) };
}

/** The round trip, exposed so the check can sweep it. */
export function roundTrip(p: Vec2): Vec2 {
  return screenToWorld(worldToScreen(p, VIEW), VIEW);
}
