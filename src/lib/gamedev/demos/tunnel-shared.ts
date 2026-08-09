/**
 * A fast sphere, a thin wall, and the two ways of asking whether they met.
 *
 * The discrete test is deliberately written the naive way - check the frame positions and nothing
 * in between - because that is the version that ships and then produces bug reports nobody can
 * reproduce. `checks.ts` pins the fact that it fails, and that the swept version does not.
 */
import type { Vec3 } from "../matrices.ts";
import { sphereAabb, type Aabb } from "../collision.ts";
import { sweepSphereToBox } from "../response.ts";

/** A pane of glass, ten centimeters thick. */
export const WALL: Aabb = {
  min: { x: -0.1, y: -1.8, z: -1 },
  max: { x: 0.1, y: 1.8, z: 1 },
};
export const RADIUS = 0.25;
export const DT = 1 / 60;
export const START_X = -4;
export const FRAMES = 40;

/** The window the sphere's centre has to be sampled inside to be noticed at all. */
export const GAP = WALL.max.x - WALL.min.x + 2 * RADIUS;

/** How far the sphere travels in one frame at this speed. */
export const stepFor = (speed: number) => speed * DT;

/** Where the sphere is at the start of each frame, offset by a fraction of a step. */
export function framePositions(speed: number, offset: number): Vec3[] {
  const step = stepFor(speed);
  const out: Vec3[] = [];
  for (let i = 0; i < FRAMES; i += 1) {
    const x = START_X - offset * step + i * step;
    out.push({ x, y: 0, z: 0 });
    if (x > 5) break;
  }
  return out;
}

/** The first frame whose position overlaps the wall. This is the test that tunnels. */
export function discreteHit(
  speed: number,
  offset: number,
): { frame: number; x: number } | null {
  const positions = framePositions(speed, offset);
  for (let i = 0; i < positions.length; i += 1) {
    if (sphereAabb({ centre: positions[i], radius: RADIUS }, WALL) < 0) {
      return { frame: i, x: positions[i].x };
    }
  }
  return null;
}

/** The first frame whose *movement* crosses the wall, and where it made contact. */
export function sweptHit(
  speed: number,
  offset: number,
): { frame: number; x: number } | null {
  const positions = framePositions(speed, offset);
  const velocity = { x: speed, y: 0, z: 0 };
  for (let i = 0; i < positions.length; i += 1) {
    const time = sweepSphereToBox(positions[i], velocity, RADIUS, WALL, DT);
    if (time !== null) return { frame: i, x: positions[i].x + speed * time };
  }
  return null;
}
