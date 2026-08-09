/** The same world point on three canvases: different pixels, identical fractions. */
import {
  fractionOf,
  pixelsInUnits,
  pixelsPerUnit,
  worldToScreen,
  type View,
} from "../../../gamedev2d/screen.ts";
import type { Demo } from "../runner.ts";

/** Three sizes, all exactly 16:9, so only the resolution differs. */
const SIZES: View[] = [
  { pixelWidth: 320, pixelHeight: 180, unitsAcross: 16 },
  { pixelWidth: 960, pixelHeight: 540, unitsAcross: 16 },
  { pixelWidth: 1920, pixelHeight: 1080, unitsAcross: 16 },
];
const PLAYER = { x: 3, y: 2 };

const demo: Demo = (log) => {
  for (const view of SIZES) {
    const at = worldToScreen(PLAYER, view);
    const f = fractionOf(PLAYER, view);
    log(
      `on ${view.pixelWidth} by ${view.pixelHeight}, the player at (3, 2) is`,
      `pixel (${at.x}, ${at.y}) \u2014 ${(f.x * 100).toFixed(2)}% across, ${(f.y * 100).toFixed(2)}% down`,
      view.pixelWidth === 320
        ? "the pixels differ, the percentages do not"
        : undefined,
    );
  }

  // The same claim from the other side: a fixed pixel step is a different distance on each.
  for (const view of SIZES) {
    log(
      `moving 5 pixels on ${view.pixelWidth} by ${view.pixelHeight} covers`,
      `${pixelsInUnits(5, view).toFixed(4)} world units`,
      view.pixelWidth === 320
        ? "which is why speeds are not measured in pixels"
        : undefined,
    );
  }

  log(
    "so the same 5 pixels is",
    `${(pixelsInUnits(5, SIZES[0]) / pixelsInUnits(5, SIZES[2])).toFixed(1)}x further on the small screen`,
    `${pixelsPerUnit(SIZES[0])} pixels per unit against ${pixelsPerUnit(SIZES[2])}`,
  );
};

export default demo;
