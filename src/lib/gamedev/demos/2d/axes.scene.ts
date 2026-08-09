/** One point, read as world units and as canvas pixels at the same time. */
import { makeCanvas2D, arrow, dot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addSlider, addCheckbox, addReadout } from "../controls.ts";
import { pixelsPerUnit, worldToScreen } from "../../../gamedev2d/screen.ts";
import { VIEW, WORLD_HEIGHT, bothReadings, pointFrom } from "./axes-shared.ts";
import type { MountFn } from "../runner.ts";

const GRID = "#252b33";
const SCREEN_AXIS = "#f0883e";
const WORLD_AXIS = "#39d3c3";
const POINT = "#d2a8ff";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 340);

  const show = addReadout(el);
  const across = addSlider(el, "across", 0, 16, 3, draw, " units", 0.1);
  const second = addSlider(
    el,
    "the second coordinate",
    0,
    8.7,
    2,
    draw,
    "",
    0.1,
  );
  const canvasStyle = addCheckbox(
    el,
    "read the second coordinate the way a canvas does: down from the top",
    false,
    draw,
  );

  function draw() {
    clear();
    const scale = pixelsPerUnit(VIEW);

    // A unit grid, so "one unit" is a visible amount rather than an abstraction.
    for (let u = 0; u <= 16; u += 1) {
      const x = u * scale;
      line(ctx, { x, y: 0 }, { x, y: height }, GRID, { width: 1 });
    }
    for (let v = 0; v <= Math.ceil(WORLD_HEIGHT); v += 1) {
      const y = height - v * scale;
      line(ctx, { x: 0, y }, { x: width, y }, GRID, { width: 1 });
    }

    // The canvas's own axes: origin top-left, Y counting downward.
    arrow(ctx, { x: 0, y: 0 }, { x: 74, y: 0 }, SCREEN_AXIS);
    arrow(ctx, { x: 0, y: 0 }, { x: 0, y: 74 }, SCREEN_AXIS);
    label(ctx, "screen +x", 80, 12, SCREEN_AXIS);
    label(ctx, "screen +y, downward", 6, 88, SCREEN_AXIS);
    label(ctx, "(0, 0) for the canvas", 6, 100, TEXT);

    // The world's axes: origin bottom-left, Y counting upward.
    arrow(ctx, { x: 0, y: height }, { x: 74, y: height }, WORLD_AXIS);
    arrow(ctx, { x: 0, y: height }, { x: 0, y: height - 74 }, WORLD_AXIS);
    label(ctx, "world +x", 80, height - 6, WORLD_AXIS);
    label(ctx, "world +y, upward", 6, height - 84, WORLD_AXIS);
    label(ctx, "(0, 0) for the maths", 6, height - 96, TEXT);

    const p = pointFrom(across(), second(), canvasStyle());
    const both = bothReadings(p);
    const at = worldToScreen(p, VIEW);

    // Dashed guides to each origin, so both readings are visible as distances.
    line(ctx, { x: at.x, y: at.y }, { x: at.x, y: 0 }, SCREEN_AXIS, {
      dashed: true,
      width: 1,
    });
    line(ctx, { x: at.x, y: 0 }, { x: 0, y: 0 }, SCREEN_AXIS, {
      dashed: true,
      width: 1,
    });
    line(ctx, { x: at.x, y: at.y }, { x: at.x, y: height }, WORLD_AXIS, {
      dashed: true,
      width: 1,
    });
    line(ctx, { x: at.x, y: height }, { x: 0, y: height }, WORLD_AXIS, {
      dashed: true,
      width: 1,
    });

    dot(ctx, at.x, at.y, 6, POINT);
    label(
      ctx,
      `world (${both.world.x.toFixed(1)}, ${both.world.y.toFixed(1)})`,
      at.x + 12,
      at.y - 4,
      WORLD_AXIS,
    );
    label(
      ctx,
      `screen (${Math.round(both.screen.x)}, ${Math.round(both.screen.y)}) px`,
      at.x + 12,
      at.y + 10,
      SCREEN_AXIS,
    );

    show(
      canvasStyle()
        ? `the slider counts down from the top, so raising it moves the dot down \u00B7 ${scale} pixels to a unit`
        : `the slider counts up from the bottom, so raising it moves the dot up \u00B7 ${scale} pixels to a unit`,
    );
  }

  draw();

  return () => {};
};

export default mount;
