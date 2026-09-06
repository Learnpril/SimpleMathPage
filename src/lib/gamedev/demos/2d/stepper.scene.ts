/** Three ways to step one throw, plotted against the truth: two bracket it and their average is it. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  FPS_RANGE,
  THROW_HEIGHT,
  THROW_TIME,
  VIEW,
  allTraces,
  bracketAt,
} from "./leap-shared.ts";
import type { MountFn } from "../runner.ts";

const EXACT = "#7d8590";
const EXPLICIT = "#f0883e";
const SEMI = "#58a6ff";
const MIDPOINT = "#7ee787";
const AVERAGE = "#d2a8ff";
const GRID = "#252b33";
const TEXT = "#9198a1";
const DIM = "#636c76";

const COLOURS = [EXPLICIT, SEMI, MIDPOINT] as const;

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const fps = addSlider(
    el,
    "frames per second",
    FPS_RANGE.min,
    FPS_RANGE.max,
    12,
    draw,
    "",
    FPS_RANGE.step,
  );
  const showAverage = addCheckbox(
    el,
    "plot the average of the two Euler steps",
    true,
    draw,
  );

  function draw() {
    clear();
    const traces = allTraces(fps());
    const steps = traces[0].heights.length - 1;

    // A plot: step number across, height up. Margins leave room for the labels.
    const left = 44;
    const right = VIEW.width - 16;
    const top = 26;
    const bottom = VIEW.height - 34;
    // Enough headroom that the explicit trace, which is the highest, always fits.
    const tallest = Math.max(...traces.flatMap((t) => t.heights), THROW_HEIGHT);
    const at = (stepIndex: number, h: number) => ({
      x: left + (stepIndex / steps) * (right - left),
      y: bottom - (h / (tallest * 1.08)) * (bottom - top),
    });

    line(ctx, { x: left, y: bottom }, { x: right, y: bottom }, GRID, {
      width: 1,
    });
    line(ctx, { x: left, y: top }, { x: left, y: bottom }, GRID, { width: 1 });
    label(ctx, "0", left - 8, bottom + 4, TEXT, "right");
    label(ctx, tallest.toFixed(1), left - 8, top + 10, TEXT, "right");
    label(ctx, "steps \u2192", right - 44, bottom + 20, TEXT);

    // The truth, drawn first and thickest, as the thing the other three are approximating.
    ctx.save();
    ctx.strokeStyle = EXACT;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    traces[0].exact.forEach((h, i) => {
      const q = at(i, h);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    // The three stepped versions, with a dot per step so the timestep stays visible.
    traces.forEach((trace, index) => {
      ctx.save();
      ctx.strokeStyle = COLOURS[index];
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      trace.heights.forEach((h, i) => {
        const q = at(i, h);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < trace.heights.length; i += 1) {
        const q = at(i, trace.heights[i]);
        fillDot(ctx, q.x, q.y, 2.4, COLOURS[index]);
      }
      const last = at(steps, trace.heights[steps]);
      label(
        ctx,
        trace.which,
        last.x - 6,
        last.y + (index === 0 ? -8 : 12),
        COLOURS[index],
        "right",
      );
    });

    /* The average of the two Euler traces, which lands on the exact curve. Drawn as crosses rather than a
       line so it reads as a claim about the grey curve rather than as a fourth method. */
    if (showAverage()) {
      for (let i = 0; i <= steps; i += 1) {
        const mean = (traces[0].heights[i] + traces[1].heights[i]) / 2;
        const q = at(i, mean);
        line(
          ctx,
          { x: q.x - 4, y: q.y - 4 },
          { x: q.x + 4, y: q.y + 4 },
          AVERAGE,
          { width: 1.4 },
        );
        line(
          ctx,
          { x: q.x - 4, y: q.y + 4 },
          { x: q.x + 4, y: q.y - 4 },
          AVERAGE,
          { width: 1.4 },
        );
      }
      label(ctx, "their average", left + 8, top + 14, AVERAGE);
    }

    label(ctx, "grey is the exact parabola", left + 8, top, DIM);

    const apexStep = Math.max(1, Math.round(THROW_TIME * fps()));
    const b = bracketAt(fps(), Math.min(apexStep, steps));
    show(
      `at the apex step: explicit ${b.explicit.toFixed(4)}, exact ${b.exact.toFixed(4)}, semi-implicit ${b.semi.toFixed(4)} \u00b7 ` +
        `midpoint ${b.midpoint.toFixed(4)}`,
    );
    note(
      `the two Euler forms are wrong by the same amount in opposite directions, so their average is exact to ` +
        `${Math.abs(b.averageError) < 1e-12 ? "floating-point dust" : b.averageError.toExponential(1)} \u2014 and the midpoint step is that average, computed directly`,
    );
  }

  draw();

  return () => {};
};

export default mount;
