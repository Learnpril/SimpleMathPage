/** A pixel converted to a world point and back, and the two ways of changing zoom compared. */
import {
  camera,
  screenToWorld,
  unitsPerPixel,
  visibleWorld,
  worldToScreen,
  zoomAbout,
} from "../../../gamedev2d/camera2d.ts";
import type { Demo } from "../runner.ts";

const WIDTH = 620;
const HEIGHT = 330;
const at = (p: { x: number; y: number } | null) =>
  p === null ? "null" : `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;

/** A camera looking at (8, 3) at 30 pixels per world unit. */
const CAM = camera({ x: 8, y: 3 }, 30);
/** The landmark the zoom is meant to hold still, several units off to the right. */
const FLAG = { x: 14, y: 5 };

const demo: Demo = (log) => {
  log(
    "camera at (8, 3), 30 px per unit, on a 620 by 330 canvas",
    `one pixel covers ${unitsPerPixel(CAM).toFixed(4)} world units`,
    "the number that decides whether art looks sharp",
  );
  log(
    "the middle pixel, converted to world",
    at(screenToWorld(CAM, WIDTH, HEIGHT, { x: WIDTH / 2, y: HEIGHT / 2 })),
    "the centre of the screen is exactly where the camera is",
  );
  log(
    "the top-left pixel, converted to world",
    at(screenToWorld(CAM, WIDTH, HEIGHT, { x: 0, y: 0 })),
    "left of the camera and above it, because the canvas counts y downward",
  );
  log(
    "world (14, 5) to a pixel and straight back",
    `${at(worldToScreen(CAM, WIDTH, HEIGHT, FLAG))} then ${at(
      screenToWorld(
        CAM,
        WIDTH,
        HEIGHT,
        worldToScreen(CAM, WIDTH, HEIGHT, FLAG),
      ),
    )}`,
    "the round trip every click depends on",
  );

  const seen = visibleWorld(CAM, WIDTH, HEIGHT)!;
  log(
    "how much world is on screen",
    `${(seen.max.x - seen.min.x).toFixed(2)} by ${(seen.max.y - seen.min.y).toFixed(2)} units`,
    "the canvas divided by the zoom, and the honest way to describe a zoom level",
  );

  // The two ways to change zoom, judged by what happens to the flag's pixel.
  const before = worldToScreen(CAM, WIDTH, HEIGHT, FLAG);
  const naive = { ...CAM, zoom: 60 };
  const anchored = zoomAbout(CAM, FLAG, 60);
  log(
    "zoom to 60 by assigning the number, and see where the flag went",
    `${at(before)} became ${at(worldToScreen(naive, WIDTH, HEIGHT, FLAG))}`,
    "it slid right off the canvas, because assigning the zoom zooms about the camera's centre",
  );
  log(
    "zoom to 60 about the flag instead",
    `${at(before)} became ${at(worldToScreen(anchored, WIDTH, HEIGHT, FLAG))}`,
    `unmoved, because the camera walked to ${at(anchored.position)} to keep it there`,
  );
};

export default demo;
