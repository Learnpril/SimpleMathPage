/**
 * A small world to point a camera at: three parallax layers, a landmark, and the zoom anchor question.
 *
 * The world is fixed and generous - much larger than any view of it - so panning and zooming have
 * somewhere to go. Nothing here needs a framing bound in the sense Sections 2.3 and 3.1 needed one,
 * because the camera decides what is on screen: the interesting assertion is the opposite one, that
 * **every pixel maps back to a world point and every world point on screen maps back to its pixel**.
 */
import {
  parallax,
  screenToWorld,
  visibleWorld,
  worldToScreen,
  zoomAbout,
  type Camera,
} from "../../../gamedev2d/camera2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/**
 * Zoom is in **pixels per world unit**, so these numbers are in the tens rather than around 1.
 *
 * The first version of this scene used a range around 1, which on a 620 pixel canvas meant showing 620
 * world units of a world only 48 units wide. Everything was a speck in the middle and the anchor
 * question - does the flag keep its pixel while you zoom - had no visible answer, because the flag was
 * never more than a few pixels from the centre. The build caught it by asserting the unanchored version
 * visibly slides.
 */
export const RANGE = {
  cameraX: { min: -12, max: 12 },
  cameraY: { min: -6, max: 6 },
  zoom: { min: 12, max: 60 },
};

/** The three depths, from sky to ground. A factor of 1 is where the action is. */
export const LAYERS = [
  { name: "far hills", factor: 0.25, colour: "#30474f" },
  { name: "trees", factor: 0.6, colour: "#3f6b52" },
  { name: "ground", factor: 1, colour: "#7ee787" },
] as const;

/** The landmark the anchor question is about: a flag standing on the ground layer. */
export const FLAG: Point = { x: 3, y: 0.9 };

/** Hills, as a deterministic ridge line. Seeded arithmetic, never Math.random. */
export function ridge(factor: number, height: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i <= 48; i += 1) {
    const x = -24 + i;
    // Two incommensurate sines make a ridge that never visibly repeats and is fully deterministic.
    const y =
      height *
      (0.55 +
        0.3 * Math.sin(x * 0.31 + factor * 9) +
        0.15 * Math.sin(x * 0.73));
    points.push({ x, y });
  }
  return points;
}

export type Params = {
  cameraX: number;
  cameraY: number;
  zoom: number;
  /** Whether zooming holds the flag still, or lets it slide away from under you. */
  anchorZoom: boolean;
};

/**
 * The camera the scene should draw the main layer with.
 *
 * With `anchorZoom` on, the zoom is applied through `zoomAbout` around the flag, so the flag keeps its
 * pixel while the zoom changes. With it off the zoom is simply assigned, which is the version that
 * zooms about the camera's own centre and slides the flag away.
 */
export function cameraFor(p: Params): Camera {
  const base: Camera = {
    position: { x: p.cameraX, y: p.cameraY },
    /* The zoom the anchored version starts from, so both branches begin at the same place. */
    zoom: RANGE.zoom.min,
    rotation: 0,
  };
  return p.anchorZoom
    ? zoomAbout(base, FLAG, p.zoom)
    : { ...base, zoom: p.zoom };
}

/** Where the flag lands on screen, which is the number the anchor question is about. */
export function flagOnScreen(
  p: Params,
  pixelWidth: number,
  pixelHeight: number,
): Point {
  return worldToScreen(cameraFor(p), pixelWidth, pixelHeight, FLAG);
}

/** The camera for one parallax layer. */
export function layerCamera(p: Params, factor: number): Camera {
  return parallax(cameraFor(p), factor);
}

/** What a pixel is pointing at, for the readout under the scene. */
export function worldUnderPixel(
  p: Params,
  pixelWidth: number,
  pixelHeight: number,
  pixel: Point,
): Point | null {
  return screenToWorld(cameraFor(p), pixelWidth, pixelHeight, pixel);
}

/** How much world is on screen, which is the honest way to describe a zoom level. */
export function visible(
  p: Params,
  pixelWidth: number,
  pixelHeight: number,
): { min: Point; max: Point } | null {
  return visibleWorld(cameraFor(p), pixelWidth, pixelHeight);
}
