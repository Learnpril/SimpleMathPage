/**
 * A camera, which is not a thing that looks at the world so much as a transform applied to it.
 *
 * The idea that makes cameras simple: a camera is **an object with a transform, used backwards**. Put
 * it at $(10, 4)$ and the world has to move $(-10, -4)$ to bring that spot to the middle of the screen.
 * Zoom in twice and the world scales by two, not by a half. So the matrix you actually draw with is the
 * **inverse** of the camera's own placement, which is why Section 3.2's inverse had to come first.
 *
 * Then the viewport: view coordinates have their origin in the middle of the screen with Y up, and a
 * canvas wants its origin top-left with Y down. That is Section 1.1's single conversion, and it lives
 * in exactly one function here.
 */
import {
  apply,
  compose,
  inverse,
  multiply,
  rotation,
  scaling,
  translation,
  type Mat3,
} from "./matrix2d.ts";
import type { Point } from "./vectors2d.ts";

/**
 * Where the camera is, how far in it is zoomed, and which way up it is.
 *
 * **`zoom` is pixels per world unit.** At 30, a one-unit tile is 30 pixels across and a 620 pixel
 * canvas shows about 20 units of world. Doubling it to 60 draws everything twice as big and shows half
 * as much, which is what a reader means by zooming in.
 *
 * Stating it in pixels per unit rather than as an abstract multiplier is worth the extra word: it is
 * the number that decides whether art looks sharp, it is what `unitsPerPixel` inverts, and it means
 * "what zoom should this be" has an answer you can work out from your tile size instead of guess.
 */
export type Camera = {
  position: Point;
  zoom: number;
  /** Radians. Counter-clockwise in world terms, as everywhere else in this module. */
  rotation: number;
};

export function camera(
  position: Point = { x: 0, y: 0 },
  zoom = 30,
  rotationRadians = 0,
): Camera {
  return { position, zoom, rotation: rotationRadians };
}

/** Zoom must stay positive: zero would flatten the world to a point and negative would mirror it. */
export function withZoom(cam: Camera, zoom: number, min = 1e-3): Camera {
  return { ...cam, zoom: Math.max(min, zoom) };
}

/**
 * The camera treated as an ordinary object in the world, which is the thing being inverted.
 *
 * Note the scale is $1/\text{zoom}$. A camera zoomed in twice is a small window on the world, so as an
 * object it is half the size - and inverting that is what makes the world twice as big.
 */
export function cameraPlacement(cam: Camera): Mat3 {
  return compose(
    translation(cam.position.x, cam.position.y),
    rotation(cam.rotation),
    scaling(1 / cam.zoom, 1 / cam.zoom),
  );
}

/**
 * World to view: the view matrix. Every term is the opposite of the camera's own.
 *
 * $$V = S(\text{zoom}) \; R(-\theta) \; T(-\text{position})$$
 *
 * Read right to left, as Section 3.1 requires: move the world so the camera sits at the origin,
 * un-rotate it, then scale it up by the zoom. Written out this way it needs no matrix inversion at
 * runtime, and the build checks it really is `inverse(cameraPlacement)` rather than merely resembling
 * it - three sign errors would each still produce a believable picture.
 */
export function viewMatrix(cam: Camera): Mat3 {
  return compose(
    scaling(cam.zoom, cam.zoom),
    rotation(-cam.rotation),
    translation(-cam.position.x, -cam.position.y),
  );
}

/**
 * View to pixels: put the origin in the middle of the canvas and flip Y.
 *
 * The whole of Section 1.1 in one matrix, and the only place in this file that knows a screen exists.
 * Keeping it separate is what lets the same camera drive a phone and a monitor.
 */
export function viewportMatrix(pixelWidth: number, pixelHeight: number): Mat3 {
  return multiply(translation(pixelWidth / 2, pixelHeight / 2), scaling(1, -1));
}

/** The full chain, world all the way to pixels. One matrix, built once per frame. */
export function worldToScreenMatrix(
  cam: Camera,
  pixelWidth: number,
  pixelHeight: number,
): Mat3 {
  return multiply(viewportMatrix(pixelWidth, pixelHeight), viewMatrix(cam));
}

export function worldToScreen(
  cam: Camera,
  pixelWidth: number,
  pixelHeight: number,
  p: Point,
): Point {
  return apply(worldToScreenMatrix(cam, pixelWidth, pixelHeight), p);
}

/**
 * Pixels back to world. What every click, tap and hover needs.
 *
 * Just the inverse of the chain above, which is the point: there is nothing to derive separately and
 * nothing to keep in step. Deriving a second formula by hand is how the two drift apart, and a
 * screen-to-world that is slightly wrong still returns a plausible position - so this is the function
 * whose round trip the build sweeps over the whole canvas.
 */
export function screenToWorld(
  cam: Camera,
  pixelWidth: number,
  pixelHeight: number,
  pixel: Point,
): Point | null {
  const back = inverse(worldToScreenMatrix(cam, pixelWidth, pixelHeight));
  return back === null ? null : apply(back, pixel);
}

/**
 * Change the zoom while holding one world point still on screen.
 *
 * $$\text{position}' = a - \frac{\text{zoom}}{\text{zoom}'}\,(a - \text{position})$$
 *
 * The default, and wrong, way to zoom is to change the number and leave the position alone. That zooms
 * about the **camera's centre**, so whatever you were looking at slides away as you zoom toward it -
 * which every reader has felt in a map that zooms out from under their finger.
 *
 * Solving for it is short. The anchor's view coordinates are $\text{zoom} \cdot R^{-1}(a - \text{pos})$,
 * so holding them fixed while zoom changes forces the displacement to shrink by exactly the ratio of
 * the two zooms. The rotation drops out, which is why it does not appear above.
 */
export function zoomAbout(cam: Camera, anchor: Point, newZoom: number): Camera {
  const next = Math.max(1e-3, newZoom);
  const k = cam.zoom / next;
  return {
    ...cam,
    zoom: next,
    position: {
      x: anchor.x - k * (anchor.x - cam.position.x),
      y: anchor.y - k * (anchor.y - cam.position.y),
    },
  };
}

/**
 * The camera a parallax layer should be drawn with: the same camera, moved less.
 *
 * A factor of 1 is the layer the action happens on. Below 1 the layer lags behind, which reads as
 * distance; a factor of 0 never moves at all, which is a sky. **Only the translation is scaled** -
 * touching the zoom as well would make distant layers change size as you pan, which is not what
 * distance looks like.
 */
export function parallax(cam: Camera, factor: number): Camera {
  return {
    ...cam,
    position: { x: cam.position.x * factor, y: cam.position.y * factor },
  };
}

/**
 * The axis-aligned world rectangle currently on screen, for culling and for knowing what to load.
 *
 * Taken as the bounding box of the four unprojected corners, so it stays correct under a rotated
 * camera - where the visible region is a tilted rectangle and its bounding box is deliberately larger.
 */
export function visibleWorld(
  cam: Camera,
  pixelWidth: number,
  pixelHeight: number,
): { min: Point; max: Point } | null {
  const corners = [
    { x: 0, y: 0 },
    { x: pixelWidth, y: 0 },
    { x: pixelWidth, y: pixelHeight },
    { x: 0, y: pixelHeight },
  ].map((c) => screenToWorld(cam, pixelWidth, pixelHeight, c));
  if (corners.some((c) => c === null)) return null;
  const xs = corners.map((c) => c!.x);
  const ys = corners.map((c) => c!.y);
  return {
    min: { x: Math.min(...xs), y: Math.min(...ys) },
    max: { x: Math.max(...xs), y: Math.max(...ys) },
  };
}

/** How many world units one pixel covers. The number that decides whether a sprite looks sharp. */
export function unitsPerPixel(cam: Camera): number {
  return 1 / cam.zoom;
}
