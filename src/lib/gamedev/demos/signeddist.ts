/** One number that says both how far from a box you are and which side you are on. */
import { signedDistanceToBox } from "../geometry.ts";
import type { Demo } from "./runner.ts";

const MIN = { x: -1, y: -1, z: -1 };
const MAX = { x: 1, y: 1, z: 1 };

const demo: Demo = (log) => {
  const at = (p: { x: number; y: number; z: number }, note?: string) =>
    log(
      `signedDistanceToBox(min, max, { x: ${p.x}, y: ${p.y}, z: ${p.z} })`,
      signedDistanceToBox(MIN, MAX, p).toFixed(6),
      note,
    );

  // A box two meters on a side, centred on the origin. Walking out from the middle.
  at({ x: 0, y: 0, z: 0 }, "dead centre, and one meter from every face");
  at({ x: 0.5, y: 0.5, z: 0.5 }, "still inside, so still negative");
  at({ x: 1, y: 0, z: 0 }, "on a face - this is the surface");
  at({ x: 1.5, y: 0, z: 0 }, "outside, straight off one face");
  at({ x: 2, y: 2, z: 0 }, "past two faces at once, so the corner decides it");
  at({ x: 3, y: 4, z: 0 }, "and it keeps behaving like a distance");
};

export default demo;
