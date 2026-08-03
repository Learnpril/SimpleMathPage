/**
 * Sample points on a sphere, each carrying the two directions along the surface and the one
 * perpendicular to it - which is all you need to tell a correct normal from a plausible one.
 */
import {
  applyMat3,
  applyMat4,
  point,
  type Mat4,
  type Vec3,
} from "../matrices.ts";
import { basisOf, normalMatrix } from "../spaces.ts";

export type Sample = {
  /** A point on the unit sphere. */
  p: Vec3;
  /** Its normal. On a unit sphere centred on the origin this is the position itself. */
  n: Vec3;
  /** Two directions along the surface at that point. The normal must stay square to both. */
  t1: Vec3;
  t2: Vec3;
};

const norm = (v: Vec3): Vec3 => {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
};

/** A ring-and-segment grid over the whole sphere, poles excluded. For build-time sweeps. */
export function sphereSamples(rings = 8, segments = 16): Sample[] {
  const out: Sample[] = [];
  for (let r = 1; r < rings; r += 1) {
    const theta = (r / rings) * Math.PI;
    const st = Math.sin(theta);
    const ct = Math.cos(theta);
    for (let s = 0; s < segments; s += 1) {
      const phi = (s / segments) * Math.PI * 2;
      const sp = Math.sin(phi);
      const cp = Math.cos(phi);
      out.push({
        p: { x: st * cp, y: ct, z: st * sp },
        n: { x: st * cp, y: ct, z: st * sp },
        t1: { x: ct * cp, y: -st, z: ct * sp },
        t2: { x: -st * sp, y: 0, z: st * cp },
      });
    }
  }
  return out;
}

/** One ring around the sphere in the xy plane, so a scene can show it edge-on and legibly. */
export function profileSamples(count = 16): Sample[] {
  const out: Sample[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    const s = Math.sin(a);
    const c = Math.cos(a);
    out.push({
      p: { x: s, y: c, z: 0 },
      n: { x: s, y: c, z: 0 },
      t1: { x: c, y: -s, z: 0 },
      t2: { x: 0, y: 0, z: 1 },
    });
  }
  return out;
}

/**
 * Put one sample through a transform, both ways, and keep the surface it has to agree with.
 *
 * `naive` is the tempting answer - push the normal through the object's own matrix. `correct`
 * uses the inverse transpose. `tangents` are the surface directions after transforming, and
 * they are the referee: whichever normal stays perpendicular to them is the right one.
 */
export function transformSample(m: Mat4, s: Sample) {
  const basis = basisOf(m);
  const forNormals = normalMatrix(m);
  const moved = applyMat4(m, point(s.p.x, s.p.y, s.p.z));
  return {
    at: { x: moved.x, y: moved.y, z: moved.z },
    naive: norm(applyMat3(basis, s.n)),
    correct: forNormals === null ? null : norm(applyMat3(forNormals, s.n)),
    tangents: [
      norm(applyMat3(basis, s.t1)),
      norm(applyMat3(basis, s.t2)),
    ] as const,
  };
}

/** How far a candidate normal is from square to the surface, in degrees. Zero is correct. */
export function degreesOff(n: Vec3, tangents: readonly Vec3[]): number {
  let worst = 0;
  for (const t of tangents) {
    const d = Math.min(1, Math.max(-1, n.x * t.x + n.y * t.y + n.z * t.z));
    worst = Math.max(worst, Math.abs(90 - (Math.acos(d) * 180) / Math.PI));
  }
  return worst;
}
