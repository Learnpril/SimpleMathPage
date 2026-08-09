/** The pixel mapping, the behind-the-camera trap, and the pole an orbit camera has to avoid. */
import {
  cartesianToSpherical,
  perspective,
  projectToScreen,
  screenToNdc,
  sphericalToCartesian,
} from "../projection.ts";
import type { Demo } from "./runner.ts";

const W = 800;
const H = 450;
const PROJ = perspective(55, W / H, 0.1, 100);
const px = (p: { x: number; y: number }) =>
  `(${p.x.toFixed(0)}, ${p.y.toFixed(0)})`;

const demo: Demo = (log) => {
  log(
    "top-left pixel in NDC",
    JSON.stringify(screenToNdc(0, 0, W, H)),
    "y is flipped",
  );
  log("bottom-right pixel in NDC", JSON.stringify(screenToNdc(W, H, W, H)));

  // The trap, in one pair of rows: both land on the same pixel, and one is behind you.
  const ahead = projectToScreen(PROJ, { x: 0, y: 0, z: -5 }, W, H);
  const behind = projectToScreen(PROJ, { x: 0, y: 0, z: 5 }, W, H);
  log("5 m in front of the camera", `${px(ahead)}  inFront ${ahead.inFront}`);
  log(
    "5 m behind the camera",
    `${px(behind)}  inFront ${behind.inFront}`,
    "the same pixel, so only the flag tells them apart",
  );

  // Spherical coordinates lose the azimuth at the poles, which is why cameras clamp short.
  log(
    "orbit camera at elevation 89",
    JSON.stringify(cartesianToSpherical(sphericalToCartesian(10, 137, 89))),
  );
  log(
    "orbit camera at elevation 90",
    JSON.stringify(cartesianToSpherical(sphericalToCartesian(10, 137, 90))),
    "the azimuth is gone - every value gives the same point",
  );
};

export default demo;
