/**
 * The one decision that causes the diagonal speed bug. No Three.js, so the build can
 * check it and the scene can draw it from the same source.
 */
export type Vec2 = { x: number; y: number };

export const length = (v: Vec2): number => Math.hypot(v.x, v.y);

/**
 * The raw input a two-axis control reports for a given direction.
 *
 * Each axis is independently pushed to its limit, so the result lands on the edge of a
 * **square** rather than a circle. Straight along an axis that is (1, 0), length 1.
 * Diagonally it is (1, 1), length 1.414 - the corner sticks out past the circle, and that
 * extra length is the whole bug.
 *
 * Keyboard input is the eight corners and edge midpoints of this square. A thumbstick
 * clamped per axis gives you the whole outline.
 */
export function rawInput(degrees: number): Vec2 {
  const a = (degrees * Math.PI) / 180;
  const x = Math.cos(a);
  const y = Math.sin(a);
  const largest = Math.max(Math.abs(x), Math.abs(y));
  return { x: x / largest, y: y / largest };
}

/**
 * Turn an input direction into a velocity.
 *
 * `normalize` is the whole question. With it off, the length of the input acts as an
 * accidental speed multiplier, so a character moves 41% faster diagonally than straight.
 */
export function velocityFrom(
  input: Vec2,
  speed: number,
  normalize: boolean,
): Vec2 {
  const len = length(input);
  if (len === 0) return { x: 0, y: 0 };
  const scale = normalize ? speed / len : speed;
  return { x: input.x * scale, y: input.y * scale };
}
