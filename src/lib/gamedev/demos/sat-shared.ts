/**
 * Two oriented boxes chosen to sit in the gap that only the cross-product axes can see.
 *
 * These angles are not arbitrary. They came out of a sweep looking for a pair of boxes that
 * overlap on all six of their own face axes while an edge-versus-edge direction separates
 * them, and it was then confirmed by brute force: no sampled point of one box lies inside
 * the other.
 */
import type { Vec3 } from "../matrices.ts";
import { obbSeparationAlong, type Obb } from "../collision.ts";

const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/** The three axes of a frame turned by `deg` about one world axis. */
function turnedAbout(axis: "x" | "y" | "z", deg: number): [Vec3, Vec3, Vec3] {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  if (axis === "z") {
    return [
      { x: c, y: s, z: 0 },
      { x: -s, y: c, z: 0 },
      { x: 0, y: 0, z: 1 },
    ];
  }
  if (axis === "y") {
    return [
      { x: c, y: 0, z: -s },
      { x: 0, y: 1, z: 0 },
      { x: s, y: 0, z: c },
    ];
  }
  return [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: c, z: s },
    { x: 0, y: -s, z: c },
  ];
}

/** A long thin box, lying roughly along X, turned 50 degrees about Z. */
export const BOX_A: Obb = {
  centre: { x: 0, y: 0, z: 0 },
  axes: turnedAbout("z", 50),
  half: { x: 1.6, y: 0.25, z: 0.25 },
};

/** Another long thin box, lying roughly along Z, turned 35 degrees about X. */
export const BOX_B: Obb = {
  centre: { x: 1.4, y: 1.4, z: 0.6 },
  axes: turnedAbout("x", 35),
  half: { x: 0.25, y: 0.25, z: 1.6 },
};

/** The six axes the boxes own. Checking only these is the mistake. */
export const FACE_AXES: Array<{ name: string; axis: Vec3 }> = [
  { name: "A's long axis", axis: BOX_A.axes[0] },
  { name: "A's second axis", axis: BOX_A.axes[1] },
  { name: "A's third axis", axis: BOX_A.axes[2] },
  { name: "B's first axis", axis: BOX_B.axes[0] },
  { name: "B's second axis", axis: BOX_B.axes[1] },
  { name: "B's long axis", axis: BOX_B.axes[2] },
];

/** The nine directions perpendicular to one edge of each box. */
export const CROSS_AXES: Array<{ name: string; axis: Vec3 }> = [
  0, 1, 2,
].flatMap((i) =>
  [0, 1, 2].map((j) => ({
    name: `A axis ${i + 1} crossed with B axis ${j + 1}`,
    axis: cross(BOX_A.axes[i], BOX_B.axes[j]),
  })),
);

/**
 * The widest gap over a set of axes, and which axis gave it.
 *
 * Widest, not narrowest: a single positive gap proves the boxes are apart, so the test is
 * looking for the best evidence of separation rather than the worst.
 */
export function worstGap(axes: Array<{ name: string; axis: Vec3 }>): {
  gap: number;
  name: string;
} {
  let gap = -Infinity;
  let name = axes[0].name;
  for (const entry of axes) {
    const g = obbSeparationAlong(BOX_A, BOX_B, entry.axis);
    if (Number.isFinite(g) && g > gap) {
      gap = g;
      name = entry.name;
    }
  }
  return { gap, name };
}

/** Does a point lie inside an oriented box? Used only by the build check's brute force. */
export function insideObb(box: Obb, p: Vec3): boolean {
  const d = {
    x: p.x - box.centre.x,
    y: p.y - box.centre.y,
    z: p.z - box.centre.z,
  };
  const along = (a: Vec3) => d.x * a.x + d.y * a.y + d.z * a.z;
  return (
    Math.abs(along(box.axes[0])) <= box.half.x + 1e-9 &&
    Math.abs(along(box.axes[1])) <= box.half.y + 1e-9 &&
    Math.abs(along(box.axes[2])) <= box.half.z + 1e-9
  );
}

/** A grid of points filling an oriented box, for the brute-force overlap check. */
export function samplesInside(box: Obb, steps: number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i <= steps; i += 1) {
    for (let j = 0; j <= steps; j += 1) {
      for (let k = 0; k <= steps; k += 1) {
        const u = (i / steps) * 2 - 1;
        const v = (j / steps) * 2 - 1;
        const w = (k / steps) * 2 - 1;
        out.push({
          x:
            box.centre.x +
            box.axes[0].x * u * box.half.x +
            box.axes[1].x * v * box.half.y +
            box.axes[2].x * w * box.half.z,
          y:
            box.centre.y +
            box.axes[0].y * u * box.half.x +
            box.axes[1].y * v * box.half.y +
            box.axes[2].y * w * box.half.z,
          z:
            box.centre.z +
            box.axes[0].z * u * box.half.x +
            box.axes[1].z * v * box.half.y +
            box.axes[2].z * w * box.half.z,
        });
      }
    }
  }
  return out;
}
