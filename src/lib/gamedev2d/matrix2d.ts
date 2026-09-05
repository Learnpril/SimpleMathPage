/**
 * Translation, rotation and scale, packaged as one 3x3 matrix.
 *
 * Everything here has already appeared. Rotation is Section 2.3's formula. Scale is multiplying the
 * components. Translation is Section 1.2's "point plus vector". The matrix does not add a new idea; it
 * gives the three of them **one shape**, so they can be composed once and applied to a thousand points,
 * and so a parent's transform can be combined with a child's by multiplying rather than by remembering
 * which operations to redo in which order.
 *
 * A 2D transform needs 3x3 rather than 2x2 because translation is not a multiplication. That is what
 * the third row and column are for, and the cost is one extra coordinate on every point - which turns
 * out to carry the place-against-displacement distinction from Section 1.2 for free.
 *
 * **Conventions used throughout this module**, stated once because half of all matrix confusion is two
 * sources disagreeing silently:
 *
 * - **Column vectors.** A point is a column, and it goes on the **right**: $p' = M p$.
 * - **Translation lives in the right-hand column**, entries `tx` and `ty`.
 * - **Products read right to left.** In $T R S$ the scale happens first and the translation last.
 * - **Row-major storage.** The nine numbers are listed a row at a time, which is how they are printed.
 */
import type { Point, Vector } from "./vectors2d.ts";

/**
 * Nine numbers, listed a row at a time:
 *
 * $$\begin{bmatrix} a & b & t_x \\ c & d & t_y \\ 0 & 0 & 1 \end{bmatrix}$$
 *
 * The top-left 2x2 block does rotation, scale, shear and reflection. The right-hand column translates.
 * The bottom row is `0 0 1` for every transform in this Section, and Section 3.3 is where it finally
 * earns its keep.
 */
export type Mat3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Does nothing, which is the transform you start a composition from. */
export function identity(): Mat3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

/** Move by a displacement. The one operation a 2x2 matrix cannot express. */
export function translation(tx: number, ty: number): Mat3 {
  return [1, 0, tx, 0, 1, ty, 0, 0, 1];
}

/**
 * Rotate counter-clockwise about the origin. Section 2.3's formula, in a box.
 *
 * $$\begin{bmatrix} \cos\theta & -\sin\theta & 0 \\ \sin\theta & \cos\theta & 0 \\ 0 & 0 & 1 \end{bmatrix}$$
 *
 * Read the **columns** and it stops being something to memorise: the first column is where $(1, 0)$
 * lands and the second is where $(0, 1)$ lands. That is exactly what Section 2.3 said a rotation does -
 * move the axes and let the point ride along - and a matrix is just those destinations written side by
 * side.
 */
export function rotation(radians: number): Mat3 {
  const c = Math.cos(radians);
  const s = Math.sin(radians);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}

/** Stretch each axis independently. Equal factors is uniform scale; unequal is where order starts to matter. */
export function scaling(sx: number, sy: number): Mat3 {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

/**
 * Multiply two matrices. **The right-hand one happens first.**
 *
 * That ordering is not a convention you could flip freely; it follows from writing points as columns on
 * the right. $(AB)p = A(Bp)$, so `B` is applied to the point before `A` ever sees it. Every "why is my
 * sprite in the wrong place" question about transform order comes back to this line.
 */
export function multiply(a: Mat3, b: Mat3): Mat3 {
  const out = new Array<number>(9);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      out[row * 3 + col] =
        a[row * 3] * b[col] +
        a[row * 3 + 1] * b[3 + col] +
        a[row * 3 + 2] * b[6 + col];
    }
  }
  return out as unknown as Mat3;
}

/**
 * Compose a list of transforms, left to right, so `compose(T, R, S)` is $T R S$ - scale first.
 *
 * Written this way the argument order matches the way the product is written on paper, which is worth
 * more than it sounds: a helper that quietly reversed it would be correct, useful, and impossible to
 * reason about alongside any textbook.
 */
export function compose(...matrices: Mat3[]): Mat3 {
  return matrices.reduce((acc, m) => multiply(acc, m), identity());
}

/**
 * Apply a transform to a **place**. The third coordinate is 1, so translation reaches it.
 *
 * $$\begin{bmatrix} a & b & t_x \\ c & d & t_y \\ 0 & 0 & 1 \end{bmatrix}
 * \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}
 * = \begin{bmatrix} ax + by + t_x \\ cx + dy + t_y \\ 1 \end{bmatrix}$$
 *
 * The 1 is doing real work: it is what multiplies $t_x$ and $t_y$ into the answer.
 */
export function apply(m: Mat3, p: Point): Point {
  return {
    x: m[0] * p.x + m[1] * p.y + m[2],
    y: m[3] * p.x + m[4] * p.y + m[5],
  };
}

/**
 * Apply a transform to a **displacement**. The third coordinate is 0, so translation cannot reach it.
 *
 * This is Section 1.2's distinction, finally enforced by the arithmetic rather than by your naming. A
 * place is $(x, y, 1)$ and a displacement is $(x, y, 0)$; moving the world moves the places in it and
 * leaves every "four metres east" exactly four metres east. Rotation and scale still apply, because
 * turning the world does turn your directions.
 *
 * Getting this wrong is a specific, common bug: a normal or a velocity translated along with its owner,
 * which looks fine at the origin and drifts further wrong the further from it you go.
 */
export function applyToDirection(m: Mat3, v: Vector): Vector {
  return { x: m[0] * v.x + m[1] * v.y, y: m[3] * v.x + m[4] * v.y };
}

/** Apply one transform to many points. The reason a matrix is worth building at all. */
export function applyAll(m: Mat3, points: readonly Point[]): Point[] {
  return points.map((p) => apply(m, p));
}

/**
 * The determinant: **how much the transform multiplies area by**, and whether it flips.
 *
 * For an affine matrix it reduces to $ad - bc$ on the 2x2 block, which is Section 2.1's cross product
 * of the two columns - the parallelogram the transformed axes span. So a scale of 2 by 3 has
 * determinant 6, a rotation has determinant 1 because turning something does not change its area, and a
 * **negative** determinant means the transform mirrored the shape, which is the number to check when a
 * sprite comes out backwards.
 */
export function determinant(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/**
 * The transform that undoes this one, or `null` if there is nothing to undo it with.
 *
 * Invert the linear block, then invert the translation **through** it: if $p' = Lp + t$ then
 * $p = L^{-1}p' - L^{-1}t$. That second term is the part people get wrong by negating the
 * translation and stopping there, which is only correct when there is no rotation or scale.
 *
 * Returns `null` when the determinant is zero, in the same spirit as `normalize` in Section 1.3. A
 * zero scale on either axis collapses the plane onto a line and genuinely destroys information -
 * every point on that line came from somewhere different, and no matrix can say where. Returning
 * `null` forces the caller to decide, rather than handing back `Infinity` for them to propagate.
 */
export function inverse(m: Mat3, epsilon = 1e-12): Mat3 | null {
  const det = m[0] * m[4] - m[1] * m[3];
  if (Math.abs(det) < epsilon) return null;
  const a = m[4] / det;
  const b = -m[1] / det;
  const c = -m[3] / det;
  const d = m[0] / det;
  return [a, b, -(a * m[2] + b * m[5]), c, d, -(c * m[2] + d * m[5]), 0, 0, 1];
}

/** The nine numbers as three rows, for printing or for a live grid under a scene. */
export function rows(m: Mat3): number[][] {
  return [
    [m[0], m[1], m[2]],
    [m[3], m[4], m[5]],
    [m[6], m[7], m[8]],
  ];
}

/** The translation a transform carries, which is just its right-hand column read out. */
export function translationOf(m: Mat3): Vector {
  return { x: m[2], y: m[5] };
}

/** Do two transforms do the same thing? Compared entry by entry, with a tolerance. */
export function sameMatrix(a: Mat3, b: Mat3, tolerance = 1e-9): boolean {
  return a.every((v, i) => Math.abs(v - b[i]) <= tolerance);
}
