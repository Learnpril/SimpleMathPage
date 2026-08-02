/**
 * Coordinate conventions, and the maths for reading a direction out of a basis.
 *
 * This file is displayed to readers in the lesson and imported by the figure that
 * runs above it, so the code on the page is the code doing the work. If you change
 * something here, the lesson updates with it.
 */

/** Which way is up and which way is forward, per tool. */
export interface Convention {
  name: string;
  /** false means a left-handed coordinate system. */
  rightHanded: boolean;
  /** Signed axis for "up": index 0/1/2 is x/y/z, sign is +1 or -1. */
  up: [axis: number, sign: number];
  /** Signed axis for "forward". */
  forward: [axis: number, sign: number];
}

/**
 * Three.js agrees with Godot on every count: right-handed, +Y up, and a camera that
 * looks down -Z. That is why the maths in this track ports between them unchanged.
 */
export const CONVENTIONS: Convention[] = [
  { name: "Three.js", rightHanded: true, up: [1, 1], forward: [2, -1] },
  { name: "Godot 4", rightHanded: true, up: [1, 1], forward: [2, -1] },
  { name: "Unity", rightHanded: false, up: [1, 1], forward: [2, 1] },
  { name: "Unreal", rightHanded: false, up: [2, 1], forward: [0, 1] },
  { name: "Blender", rightHanded: true, up: [2, 1], forward: [1, -1] },
];

/** A unit vector along a signed axis, as a plain [x, y, z] triple. */
export function axisVector([axis, sign]: [number, number]): [
  number,
  number,
  number,
] {
  const v: [number, number, number] = [0, 0, 0];
  v[axis] = sign;
  return v;
}

/**
 * The forward direction of an object, given the three columns of its basis.
 *
 * A basis is just the object's own right, up and back directions written in world
 * coordinates. In a -Z-forward convention, "forward" is the negated third column -
 * which is the entire content of the minus sign you see in engine code.
 */
export function forwardFromBasis(
  basisX: [number, number, number],
  basisY: [number, number, number],
  basisZ: [number, number, number],
  convention: Convention,
): [number, number, number] {
  const columns = [basisX, basisY, basisZ];
  const [axis, sign] = convention.forward;
  const col = columns[axis];
  return [col[0] * sign, col[1] * sign, col[2] * sign];
}

/**
 * The basis of an object rotated by `yawRadians` about the +Y axis.
 *
 * Rotating about Y sends +X toward -Z and +Z toward +X, which is why the columns
 * below look the way they do. Try yaw = 90 degrees: basisZ becomes (1, 0, 0), so
 * forward becomes (-1, 0, 0) and the object faces down negative X.
 */
export function basisFromYaw(yawRadians: number): {
  x: [number, number, number];
  y: [number, number, number];
  z: [number, number, number];
} {
  const c = Math.cos(yawRadians);
  const s = Math.sin(yawRadians);
  return {
    x: [c, 0, -s],
    y: [0, 1, 0],
    z: [s, 0, c],
  };
}

/** Degrees to radians. Every trig function in every engine wants radians. */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Radians to degrees, for showing a number to a human. */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * The arc length swept on a circle of radius r by an angle in radians.
 *
 * On the unit circle this returns the angle itself, which is the definition of a
 * radian rather than a coincidence.
 */
export function arcLength(radians: number, radius = 1): number {
  return radians * radius;
}
