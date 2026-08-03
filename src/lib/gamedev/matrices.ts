/**
 * Matrices as transformations, in the form that makes them readable.
 *
 * A 2x2 matrix is usually written as four loose numbers, which hides what it does. Here it
 * is stored as its two **columns** instead, because that is what the columns are: the places
 * the x and y axes land after the transformation. Read a matrix that way and you can predict
 * what it does to a shape without multiplying anything.
 */
export type Vec2 = { x: number; y: number };

export type Mat2 = {
  /** Where the x axis lands. The matrix's first column. */
  i: Vec2;
  /** Where the y axis lands. The matrix's second column. */
  j: Vec2;
};

/** The do-nothing matrix. The axes stay exactly where they started. */
export const IDENTITY2: Mat2 = { i: { x: 1, y: 0 }, j: { x: 0, y: 1 } };

/**
 * Transform a vector by a matrix.
 *
 * Read the two lines as a sentence: the result is `x` copies of wherever the x axis landed,
 * plus `y` copies of wherever the y axis landed. That is all matrix multiplication is.
 */
export function applyMat2(m: Mat2, v: Vec2): Vec2 {
  return {
    x: v.x * m.i.x + v.y * m.j.x,
    y: v.x * m.i.y + v.y * m.j.y,
  };
}

/**
 * How much the matrix scales area, and whether it flips the plane.
 *
 * This is the 2D cross product of the two columns, which is the same "signed area of the
 * parallelogram they span" from Part 1. A determinant of 1 preserves area, 2 doubles it, 0
 * collapses the plane onto a line, and a **negative** value means the shape was mirrored.
 */
export function determinant2(m: Mat2): number {
  return m.i.x * m.j.y - m.i.y * m.j.x;
}

/** Turn the plane counter-clockwise by an angle, in degrees. */
export function rotation2(degrees: number): Mat2 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { i: { x: c, y: s }, j: { x: -s, y: c } };
}

/** Stretch each axis independently. */
export function scale2(sx: number, sy: number): Mat2 {
  return { i: { x: sx, y: 0 }, j: { x: 0, y: sy } };
}

/** Slide the plane sideways in proportion to height, like italic text. */
export function shear2(kx: number, ky = 0): Mat2 {
  return { i: { x: 1, y: ky }, j: { x: kx, y: 1 } };
}

/**
 * Apply `second` after `first`.
 *
 * Note the order: transforming by the result is the same as transforming by `first` and then
 * by `second`. Matrix multiplication reads right to left, which is the opposite of how you
 * would say it out loud, and it is the source of most transform-order bugs.
 */
export function multiplyMat2(second: Mat2, first: Mat2): Mat2 {
  return {
    i: applyMat2(second, first.i),
    j: applyMat2(second, first.j),
  };
}

// ---- Three dimensions ------------------------------------------------------------------

export type Vec3 = { x: number; y: number; z: number };

/** Same idea with one more axis: three columns, three places the axes land. */
export type Mat3 = { i: Vec3; j: Vec3; k: Vec3 };

export const IDENTITY3: Mat3 = {
  i: { x: 1, y: 0, z: 0 },
  j: { x: 0, y: 1, z: 0 },
  k: { x: 0, y: 0, z: 1 },
};

export function applyMat3(m: Mat3, v: Vec3): Vec3 {
  return {
    x: v.x * m.i.x + v.y * m.j.x + v.z * m.k.x,
    y: v.x * m.i.y + v.y * m.j.y + v.z * m.k.y,
    z: v.x * m.i.z + v.y * m.j.z + v.z * m.k.z,
  };
}

/**
 * How much the matrix scales **volume**, and whether it turns the space inside out.
 *
 * In 3D the determinant is the scalar triple product of the three columns - cross two of
 * them and dot the result with the third, which is Part 1's machinery again.
 */
export function determinant3(m: Mat3): number {
  const { i, j, k } = m;
  return (
    i.x * (j.y * k.z - j.z * k.y) -
    j.x * (i.y * k.z - i.z * k.y) +
    k.x * (i.y * j.z - i.z * j.y)
  );
}

// ---- Four components, so that translation fits -------------------------------------------

/**
 * A 3D value with a fourth number attached.
 *
 * `w` says what kind of thing this is: **1 for a place, 0 for a direction**. That single
 * number is what lets one matrix move positions while leaving directions alone.
 */
export type Vec4 = { x: number; y: number; z: number; w: number };

/** A location in space. Translating it moves it. */
export const point = (x: number, y: number, z: number): Vec4 => ({
  x,
  y,
  z,
  w: 1,
});

/** A direction with a length. Translating it does nothing, which is correct. */
export const direction = (x: number, y: number, z: number): Vec4 => ({
  x,
  y,
  z,
  w: 0,
});

/**
 * A 4x4 matrix, stored as its four columns.
 *
 * The first three are the same "where the axes land" columns as a 3x3. The fourth, `t`, is
 * new: it is **where the origin lands**, which is to say the translation.
 */
export type Mat4 = { i: Vec4; j: Vec4; k: Vec4; t: Vec4 };

export const IDENTITY4: Mat4 = {
  i: direction(1, 0, 0),
  j: direction(0, 1, 0),
  k: direction(0, 0, 1),
  t: point(0, 0, 0),
};

/**
 * Transform a value by a 4x4 matrix.
 *
 * Read the last term. The translation column is multiplied by `w`, so a place (`w = 1`) picks
 * up the full translation and a direction (`w = 0`) picks up none of it. Nothing else in the
 * function treats them differently - the fourth number does all of the work.
 */
export function applyMat4(m: Mat4, v: Vec4): Vec4 {
  return {
    x: v.x * m.i.x + v.y * m.j.x + v.z * m.k.x + v.w * m.t.x,
    y: v.x * m.i.y + v.y * m.j.y + v.z * m.k.y + v.w * m.t.y,
    z: v.x * m.i.z + v.y * m.j.z + v.z * m.k.z + v.w * m.t.z,
    w: v.x * m.i.w + v.y * m.j.w + v.z * m.k.w + v.w * m.t.w,
  };
}

/** Slide everything by a fixed offset. Impossible without the fourth column. */
export function translation4(tx: number, ty: number, tz: number): Mat4 {
  return { ...IDENTITY4, t: point(tx, ty, tz) };
}

export function scale4(sx: number, sy: number, sz: number): Mat4 {
  return {
    i: direction(sx, 0, 0),
    j: direction(0, sy, 0),
    k: direction(0, 0, sz),
    t: point(0, 0, 0),
  };
}

/** Turn about the y axis, the usual "which way is this facing" rotation. */
export function rotationY4(degrees: number): Mat4 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    i: direction(c, 0, -s),
    j: direction(0, 1, 0),
    k: direction(s, 0, c),
    t: point(0, 0, 0),
  };
}

/** Turn about the x axis. Nose up and nose down, for something facing -Z. */
export function rotationX4(degrees: number): Mat4 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    i: direction(1, 0, 0),
    j: direction(0, c, s),
    k: direction(0, -s, c),
    t: point(0, 0, 0),
  };
}

/** Turn about the z axis. Tilting sideways without changing where you face. */
export function rotationZ4(degrees: number): Mat4 {
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    i: direction(c, s, 0),
    j: direction(-s, c, 0),
    k: direction(0, 0, 1),
    t: point(0, 0, 0),
  };
}

/** Apply `second` after `first`. Same right-to-left reading as the 2x2 version. */
export function multiplyMat4(second: Mat4, first: Mat4): Mat4 {
  return {
    i: applyMat4(second, first.i),
    j: applyMat4(second, first.j),
    k: applyMat4(second, first.k),
    t: applyMat4(second, first.t),
  };
}

/**
 * The sixteen numbers laid out as rows, the way a matrix is written on paper.
 *
 * Only needed for display. Note that the translation appears in the right-hand **column**,
 * not the bottom row - a mix-up worth seeing written down once, because a transposed matrix
 * translates along the wrong axes rather than failing outright.
 */
export function rowsOf(m: Mat4): number[][] {
  return [
    [m.i.x, m.j.x, m.k.x, m.t.x],
    [m.i.y, m.j.y, m.k.y, m.t.y],
    [m.i.z, m.j.z, m.k.z, m.t.z],
    [m.i.w, m.j.w, m.k.w, m.t.w],
  ];
}

// ---- Composing: the order is the whole problem -------------------------------------------

/** The three ingredients of an object's transform, before any decision about order. */
export type TRS = {
  /** Per-axis scale. Equal values behave very differently from unequal ones. */
  scale: Vec3;
  /** Yaw in degrees. One rotation axis is enough to show what ordering does. */
  degrees: number;
  translate: Vec3;
};

/** One of the three operations. */
export type Step = "scale" | "rotate" | "translate";

/** An order to apply them in, read left to right as "do this, then this, then this". */
export type Sequence = readonly [Step, Step, Step];

/** All six orders, so a demo can walk them and a check can compare them. */
export const SEQUENCES: readonly Sequence[] = [
  ["scale", "rotate", "translate"],
  ["scale", "translate", "rotate"],
  ["rotate", "scale", "translate"],
  ["rotate", "translate", "scale"],
  ["translate", "scale", "rotate"],
  ["translate", "rotate", "scale"],
];

/** The matrix for one step on its own. */
export function matrixFor(v: TRS, step: Step): Mat4 {
  if (step === "scale") return scale4(v.scale.x, v.scale.y, v.scale.z);
  if (step === "rotate") return rotationY4(v.degrees);
  return translation4(v.translate.x, v.translate.y, v.translate.z);
}

/**
 * Build one matrix that applies the three steps in the order given.
 *
 * Each new step multiplies on the **left**, because that is what "after" means for column
 * vectors: whichever matrix sits nearest the vector acts first. So the sequence
 * `["scale", "rotate", "translate"]` accumulates into `T * R * S` - written in the reverse
 * of the order it happens in, which is the single most confusing thing about transforms.
 */
export function composeSequence(v: TRS, seq: Sequence): Mat4 {
  let m = IDENTITY4;
  for (const step of seq) m = multiplyMat4(matrixFor(v, step), m);
  return m;
}

// ---- The other convention ----------------------------------------------------------------

/** Swap rows and columns. The bridge between the two conventions. */
export function transpose4(m: Mat4): Mat4 {
  return {
    i: { x: m.i.x, y: m.j.x, z: m.k.x, w: m.t.x },
    j: { x: m.i.y, y: m.j.y, z: m.k.y, w: m.t.y },
    k: { x: m.i.z, y: m.j.z, z: m.k.z, w: m.t.z },
    t: { x: m.i.w, y: m.j.w, z: m.k.w, w: m.t.w },
  };
}

/**
 * The row-vector convention: the vector sits on the **left** of the matrix.
 *
 * Same arithmetic, transposed layout, and - the part that bites - reversed composition
 * order. `demos/checks.ts` asserts that column-order `T * R * S` and row-order `S * R * T`
 * describe the very same transform.
 */
export function applyRow4(v: Vec4, m: Mat4): Vec4 {
  const rows = rowsOf(m);
  const c = [v.x, v.y, v.z, v.w];
  const out = [0, 0, 0, 0];
  for (let col = 0; col < 4; col += 1) {
    for (let row = 0; row < 4; row += 1) out[col] += c[row] * rows[row][col];
  }
  return { x: out[0], y: out[1], z: out[2], w: out[3] };
}
