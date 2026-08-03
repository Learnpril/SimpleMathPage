/** One corner of one object, written out in each space it passes through. */
import {
  applyMat4,
  multiplyMat4,
  point,
  rotationY4,
  translation4,
} from "../matrices.ts";
import { toWorld, viewFrom } from "../spaces.ts";
import type { Demo } from "./runner.ts";

const fmt = (v: { x: number; y: number; z: number }) =>
  `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;

const demo: Demo = (log) => {
  // A child sitting on a parent that has been moved and turned a quarter turn.
  const parent = multiplyMat4(translation4(1, 0, 0), rotationY4(90));
  const child = translation4(0, 0.6, 1.3);
  const model = toWorld([parent, child]);

  // A camera two meters up and six back, looking down its own -Z as everything does.
  const cameraWorld = translation4(0, 2, 6);
  const view = viewFrom(cameraWorld)!;

  const local = point(0, 0, 0);
  const world = applyMat4(model, local);
  const eye = applyMat4(view, world);

  log("local space, the child's own origin", fmt(local));
  log("world space, model * local", fmt(world), "the parent's turn moved it");
  log(
    "view space, view * world",
    fmt(eye),
    "negative z is in front of the camera",
  );
  log(
    "the camera itself, in view space",
    fmt(applyMat4(view, point(0, 2, 6))),
    "always the origin - that is what view space means",
  );
};

export default demo;
