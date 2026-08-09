/**
 * One projectile launched twice: once through vacuum, once through air.
 *
 * The trajectory is stepped rather than solved, because with drag there is no tidy parabola to
 * solve - which is itself the reason games step it.
 */
import type { Vec3 } from "../matrices.ts";
import { EARTH_GRAVITY, stepProjectile } from "../dynamics.ts";

export const SPEED = 12;
export const DT = 1 / 240;

/** The path until it lands, at a given launch angle and drag strength. */
export function arc(angleDeg: number, k: number): Vec3[] {
  const r = (angleDeg * Math.PI) / 180;
  let body = {
    position: { x: 0, y: 0, z: 0 },
    velocity: { x: Math.cos(r) * SPEED, y: Math.sin(r) * SPEED, z: 0 },
  };
  const out: Vec3[] = [body.position];
  for (let i = 0; i < 4000; i += 1) {
    body = stepProjectile(body, EARTH_GRAVITY, k, DT);
    if (body.position.y < 0) break;
    out.push(body.position);
  }
  return out;
}

/** How far it got. The number a player feels as "this weapon is short-ranged". */
export function rangeOf(angleDeg: number, k: number): number {
  const path = arc(angleDeg, k);
  return path[path.length - 1].x;
}

/** The highest point, for framing the picture and for comparing the two shapes. */
export function peakOf(angleDeg: number, k: number): number {
  return arc(angleDeg, k).reduce((best, p) => Math.max(best, p.y), 0);
}

/** The index of the highest sample, which is also its position in the flight time. */
function peakIndex(path: Vec3[]): number {
  let best = 0;
  let at = 0;
  path.forEach((p, i) => {
    if (p.y > best) {
      best = p.y;
      at = i;
    }
  });
  return at;
}

/**
 * When the peak happens, as a fraction of the **flight time**.
 *
 * Drag pulls this below one half: the climb is fast and the fall is slow, so most of the flight is
 * spent coming down.
 */
export function peakTimeFraction(angleDeg: number, k: number): number {
  const path = arc(angleDeg, k);
  return peakIndex(path) / (path.length - 1);
}

/**
 * Where the peak happens, as a fraction of the **horizontal distance**.
 *
 * This one moves the *other* way, above one half, and the two together are the whole story. The
 * object is still going fast on the way up so it covers ground, then drag has taken its horizontal
 * speed away and it drops almost straight down. Reporting only one of these numbers next to a
 * picture of the arc reads as a mistake, because the eye measures distance and the clock does not.
 */
export function peakDistanceFraction(angleDeg: number, k: number): number {
  const path = arc(angleDeg, k);
  const end = path[path.length - 1].x;
  return end === 0 ? 0.5 : path[peakIndex(path)].x / end;
}
