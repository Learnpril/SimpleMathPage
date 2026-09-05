/** A pannable, zoomable world in three parallax layers, with the pixel under the pointer read back. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { worldToScreen } from "../../../gamedev2d/camera2d.ts";
import {
  FLAG,
  LAYERS,
  RANGE,
  cameraFor,
  flagOnScreen,
  layerCamera,
  ridge,
  visible,
  worldUnderPixel,
} from "./camera-shared.ts";
import type { MountFn } from "../runner.ts";

const FLAG_COLOUR = "#f0883e";
const CURSOR = "#d2a8ff";
const GRID = "#1c2229";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, canvas, width, height, clear } = makeCanvas2D(el, 330);

  const show = addReadout(el);
  const note = addReadout(el);
  const cameraX = addSlider(
    el,
    "camera x",
    RANGE.cameraX.min,
    RANGE.cameraX.max,
    0,
    draw,
    "",
    0.2,
  );
  const cameraY = addSlider(
    el,
    "camera y",
    RANGE.cameraY.min,
    RANGE.cameraY.max,
    1,
    draw,
    "",
    0.2,
  );
  const zoom = addSlider(
    el,
    "zoom, pixels per unit",
    RANGE.zoom.min,
    RANGE.zoom.max,
    RANGE.zoom.min,
    draw,
    " px",
    1,
  );
  const anchorZoom = addCheckbox(
    el,
    "hold the flag still while zooming (uncheck to zoom about the camera)",
    true,
    draw,
  );

  /** The last pointer position, in drawing space. Null until the reader moves over the canvas. */
  let pointer: { x: number; y: number } | null = null;

  const onMove = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    // The canvas is scaled by CSS on a narrow screen, so displayed pixels are not drawing pixels.
    const drawn = parseFloat(canvas.style.width) || box.width;
    const k = box.width > 0 ? drawn / box.width : 1;
    pointer = {
      x: (event.clientX - box.left) * k,
      y: (event.clientY - box.top) * k,
    };
    draw();
  };
  const onLeave = () => {
    pointer = null;
    draw();
  };
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerleave", onLeave);

  function params() {
    return {
      cameraX: cameraX(),
      cameraY: cameraY(),
      zoom: zoom(),
      anchorZoom: anchorZoom(),
    };
  }

  function polyline(points: Array<{ x: number; y: number }>, colour: string) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    clear();
    const p = params();

    // Each layer is the same world drawn with a camera that has moved less. Far layers lag.
    LAYERS.forEach((layer, index) => {
      const cam = layerCamera(p, layer.factor);
      const at = (q: { x: number; y: number }) =>
        worldToScreen(cam, width, height, q);
      polyline(ridge(layer.factor, 1.6 + index * 0.5).map(at), layer.colour);
    });

    // The ground layer's own grid, so panning and zooming have something to be measured against.
    const ground = layerCamera(p, 1);
    for (let x = -24; x <= 24; x += 2) {
      const a = worldToScreen(ground, width, height, { x, y: -8 });
      const b = worldToScreen(ground, width, height, { x, y: 8 });
      line(ctx, a, b, GRID, { width: 1 });
    }
    for (let y = -8; y <= 8; y += 2) {
      const a = worldToScreen(ground, width, height, { x: -24, y });
      const b = worldToScreen(ground, width, height, { x: 24, y });
      line(ctx, a, b, GRID, { width: 1 });
    }

    // The flag: the landmark the anchor question is about.
    const flag = flagOnScreen(p, width, height);
    const flagBase = worldToScreen(ground, width, height, { x: FLAG.x, y: 0 });
    line(ctx, flagBase, flag, FLAG_COLOUR, { width: 2 });
    fillDot(ctx, flag.x, flag.y, 5, FLAG_COLOUR);
    label(ctx, "flag", flag.x + 8, flag.y - 4, FLAG_COLOUR);

    // The centre of the screen, which is where the camera is looking.
    line(
      ctx,
      { x: width / 2 - 7, y: height / 2 },
      { x: width / 2 + 7, y: height / 2 },
      TEXT,
      { width: 1 },
    );
    line(
      ctx,
      { x: width / 2, y: height / 2 - 7 },
      { x: width / 2, y: height / 2 + 7 },
      TEXT,
      { width: 1 },
    );

    // What the pointer is pointing at, converted back through the whole chain.
    const under = pointer ? worldUnderPixel(p, width, height, pointer) : null;
    if (pointer && under) {
      fillDot(ctx, pointer.x, pointer.y, 4, CURSOR);
      label(
        ctx,
        `world (${under.x.toFixed(2)}, ${under.y.toFixed(2)})`,
        pointer.x + 9,
        pointer.y - 6,
        CURSOR,
      );
    }

    const seen = visible(p, width, height);
    show(
      `camera at (${p.cameraX.toFixed(1)}, ${p.cameraY.toFixed(1)}) at ${p.zoom.toFixed(0)} px per unit \u00B7 ` +
        (seen
          ? `showing ${(seen.max.x - seen.min.x).toFixed(1)} by ${(seen.max.y - seen.min.y).toFixed(1)} units`
          : "nothing visible") +
        ` \u00B7 flag at pixel (${flag.x.toFixed(0)}, ${flag.y.toFixed(0)})`,
    );
    note(
      p.anchorZoom
        ? "sweep the zoom: the flag keeps its pixel, because the camera is moved to hold it there"
        : "sweep the zoom now: the flag slides away, because this zooms about the camera's own centre",
    );
  }

  draw();

  return () => {
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerleave", onLeave);
  };
};

export default mount;
