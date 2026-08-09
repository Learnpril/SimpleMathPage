/**
 * Places and displacements. Two different things, both written as two numbers.
 *
 * A **point** is a place: "the player is at (3, 2)". A **vector** is a displacement: "move 4 right
 * and 1 up". They are stored identically, which is exactly why mixing them up is so easy and why it
 * is worth being deliberate about which one you are holding.
 *
 * The test that actually separates them is **what happens when the origin moves**. Shift the origin
 * and every point gets a different pair of numbers, because a point is measured *from* somewhere. A
 * displacement is unchanged, because it was never measured from anywhere - it only ever said how far
 * and which way. That is the whole distinction, and it is checked rather than asserted.
 */

/** A place, measured from the origin. */
export type Point = { x: number; y: number };

/**
 * A displacement: how far and which way, with no home.
 *
 * Note this is the *same shape* as `Point`, and TypeScript treats the two as interchangeable. The
 * compiler will not catch you passing one where the other belongs. The distinction is real, but it
 * lives in your head and in your naming, not in the type checker.
 */
export type Vector = { x: number; y: number };

/**
 * **Point minus point is a vector.** The displacement that takes you from `from` to `to`.
 *
 * This is the single most used operation in any game, and the order is the thing people get wrong.
 * `to - from` points at the target. `from - to` points directly away from it - which is a bug that
 * looks like an enemy fleeing when it was supposed to chase.
 */
export function displacement(from: Point, to: Point): Vector {
  return { x: to.x - from.x, y: to.y - from.y };
}

/** **Point plus vector is a point.** Take a place, apply a displacement, arrive somewhere. */
export function movedBy(p: Point, v: Vector): Point {
  return { x: p.x + v.x, y: p.y + v.y };
}

/**
 * **Vector plus vector is a vector.** Two displacements one after the other, as one displacement.
 *
 * Order does not matter: walking east then north lands you where walking north then east does. Which
 * sounds obvious said aloud and is worth knowing you can rely on.
 */
export function combine(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Stretch or shrink a displacement. Negative `k` turns it around. */
export function scaled(v: Vector, k: number): Vector {
  return { x: v.x * k, y: v.y * k };
}

/** The same displacement, backwards. */
export function reversed(v: Vector): Vector {
  return { x: -v.x, y: -v.y };
}

/**
 * The point halfway between two points.
 *
 * Adding two points is meaningless, so this looks like it should be illegal - and written as
 * `(a + b) / 2` it is a coincidence rather than a reason. Written the honest way it is fine:
 *
 * ```
 * midpoint = a + (b - a) / 2
 * ```
 *
 * which is a point, plus half of a displacement. That is a legitimate sentence, and it happens to
 * give the same answer. **Averaging points is the one case where the arithmetic accidentally works**,
 * because the weights add up to one - so it survives an origin shift where a plain sum does not.
 */
export function midpoint(a: Point, b: Point): Point {
  return movedBy(a, scaled(displacement(a, b), 0.5));
}

/**
 * Adding two points, which is the mistake this Section exists to name.
 *
 * It is here only so the demo can show what it produces. The result depends entirely on where the
 * origin happens to be, which means it is not a fact about the two places at all - move the origin
 * and the "answer" moves somewhere else. Nothing in a game should ever want this.
 */
export function addPositions(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

/** Every point re-measured from a new origin. Nothing has moved; the numbers have. */
export function fromNewOrigin(p: Point, newOrigin: Point): Point {
  return { x: p.x - newOrigin.x, y: p.y - newOrigin.y };
}
