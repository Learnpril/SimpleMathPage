/** Where the character appears to sit, frame by frame, under each of the four things you could round. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addReadout, addSlider } from "../controls.ts";
import {
  JITTER_FRAMES,
  JITTER_SPEED_RANGE,
  PIXELS_PER_UNIT,
  SNAPS,
  advancesWholePixels,
  jitterTrace,
  perFramePixels,
} from "./platformer-shared.ts";
import type { MountFn } from "../runner.ts";

const VIEW = { width: 620, height: 336 } as const;
const LEFT = 104;
const RIGHT = 604;
const TOP = 30;
const STRIP = 72;

/** One art pixel, in canvas pixels. The whole figure is about sub-pixel motion, so it needs magnifying. */
const MAGNIFY = 22;

const GRID = "#2b3138";
const GRID_LABEL = "#636c76";
const DIM = "#7d8590";
const COLOURS: Record<string, string> = {
  neither: "#7d8590",
  "camera only": "#ff7b72",
  both: "#f0883e",
  "the offset": "#7ee787",
};

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const speed = addSlider(
    el,
    "how fast the character is running",
    JITTER_SPEED_RANGE.min,
    JITTER_SPEED_RANGE.max,
    6,
    draw,
    " units per second",
    JITTER_SPEED_RANGE.step,
  );

  function draw() {
    clear();
    const v = speed();
    const traces = SNAPS.map((snap) => ({
      snap,
      values: jitterTrace(snap, v, JITTER_FRAMES),
    }));

    /* A common baseline for all four strips, so they can be compared directly. The steady-state lag grows
       with speed, so it has to be recomputed rather than fixed. */
    const all = traces.flatMap((t) => t.values);
    const baseline = Math.round(all.reduce((a, b) => a + b, 0) / all.length);
    const stepX = (RIGHT - LEFT) / (JITTER_FRAMES - 1);

    traces.forEach(({ snap, values }, row) => {
      const centre = TOP + row * STRIP + STRIP / 2;
      const colour = COLOURS[snap];

      // Whole art pixels as horizontal rules, which is what "lands on a pixel" means.
      for (const offset of [-1, 0, 1]) {
        const y = centre - offset * MAGNIFY;
        line(ctx, { x: LEFT, y }, { x: RIGHT, y }, GRID, { width: 1 });
        if (row === 0)
          label(ctx, `${baseline + offset} px`, RIGHT + 2, y + 3, GRID_LABEL);
      }

      label(ctx, `round ${snap}`, LEFT - 8, centre - 4, colour, "right");
      const wobble = Math.max(...values) - Math.min(...values);
      const onGrid = values.every((x) => Math.abs(x - Math.round(x)) < 1e-9);
      label(
        ctx,
        wobble < 1e-9
          ? onGrid
            ? "still, and on the grid"
            : "still, but between pixels"
          : `slides ${wobble.toFixed(2)} px`,
        LEFT - 8,
        centre + 10,
        wobble < 1e-9 && onGrid ? colour : DIM,
        "right",
      );

      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      values.forEach((value, i) => {
        const x = LEFT + i * stepX;
        const y = centre - (value - baseline) * MAGNIFY;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.restore();
      values.forEach((value, i) => {
        const x = LEFT + i * stepX;
        const y = centre - (value - baseline) * MAGNIFY;
        fillDot(ctx, x, y, 2.4, colour);
      });
    });

    label(ctx, `one frame at 60 fps \u2192`, LEFT, TOP - 12, DIM);
    label(
      ctx,
      `one art pixel is drawn ${MAGNIFY} screen pixels tall`,
      RIGHT,
      TOP - 12,
      DIM,
      "right",
    );

    const advance = perFramePixels(v);
    const whole = advancesWholePixels(v);
    show(
      `at ${PIXELS_PER_UNIT} art pixels to the world unit, ${v} units per second advances ${advance.toFixed(3)} pixels per frame` +
        (whole ? " \u2014 a whole number of them" : ""),
    );
    note(
      whole
        ? "On a whole-pixel advance nothing shimmers, whatever you round \u2014 so the bug is not the camera, it is a fraction being rounded. Nudge the slider off this value."
        : `Rounding the camera alone slides the character backwards against a still background. Rounding both positions separately still slides a full pixel, ` +
            `because two rounded numbers with a constant difference alternate between the integers either side of it. Rounding the offset holds still and lands on the grid.`,
    );
  }

  draw();

  return () => {};
};

export default mount;
