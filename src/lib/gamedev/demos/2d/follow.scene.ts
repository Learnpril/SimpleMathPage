/** Two followers of the same target, one at 30 fps and one at 144, plotted against time. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  DURATION,
  RANGE,
  STEP_AT,
  timeToClose,
  traces,
} from "./follow-shared.ts";
import type { MountFn } from "../runner.ts";

const SLOW = "#ff7b72";
const FAST = "#58a6ff";
const TARGET = "#7d8590";
const AGREE = "#7ee787";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 320);

  const show = addReadout(el);
  const note = addReadout(el);
  const factor = addSlider(
    el,
    "per-frame fraction",
    RANGE.factor.min,
    RANGE.factor.max,
    0.1,
    draw,
    "",
    0.01,
  );
  const halfLife = addSlider(
    el,
    "half-life",
    RANGE.halfLife.min,
    RANGE.halfLife.max,
    0.12,
    draw,
    " s",
    0.01,
  );
  const useDecay = addCheckbox(
    el,
    "use exponential decay (uncheck for the per-frame lerp)",
    false,
    draw,
  );

  function params() {
    return {
      factor: factor(),
      halfLife: halfLife(),
      useDecay: useDecay(),
    };
  }

  function draw() {
    clear();
    const p = params();
    // A plot: time across, value up. Margins leave room for the axis labels.
    const left = 46;
    const right = width - 14;
    const top = 26;
    const bottom = height - 34;
    const at = (t: number, value: number) => ({
      x: left + (t / DURATION) * (right - left),
      // Value 0 sits at the bottom of the plot and 1 near the top. Y up, drawn downward.
      y: bottom - value * (bottom - top),
    });

    // The frame of the plot, and the two values worth naming.
    line(ctx, { x: left, y: bottom }, { x: right, y: bottom }, GRID, {
      width: 1,
    });
    line(ctx, { x: left, y: top }, { x: left, y: bottom }, GRID, { width: 1 });
    label(ctx, "1", left - 10, top + 4, TEXT, "right");
    label(ctx, "0", left - 10, bottom + 4, TEXT, "right");
    label(ctx, "time \u2192", right - 40, bottom + 20, TEXT);

    // The target: flat, then a step. Drawn as the thing both followers are chasing.
    const stepX = at(STEP_AT, 0).x;
    line(ctx, at(0, 0), { x: stepX, y: at(0, 0).y }, TARGET, {
      dashed: true,
      width: 1.5,
    });
    line(
      ctx,
      { x: stepX, y: at(0, 0).y },
      { x: stepX, y: at(0, 1).y },
      TARGET,
      { dashed: true, width: 1.5 },
    );
    line(ctx, { x: stepX, y: at(0, 1).y }, at(DURATION, 1), TARGET, {
      dashed: true,
      width: 1.5,
    });
    label(ctx, "target", stepX + 6, at(0, 1).y - 6, TARGET);

    /* The discriminator is how long each takes to arrive, not whether the curves overlap pixel for
       pixel. A step target guarantees a one-frame transient at the jump - see follow-shared.ts - so
       "do they agree instant by instant" is the wrong question and this is the right one. */
    const slowClose = timeToClose(p, 30);
    const fastClose = timeToClose(p, 144);
    const together =
      slowClose !== null &&
      fastClose !== null &&
      Math.abs(slowClose - fastClose) <= 1 / 30 + 1e-9;

    // Each follower's curve. Same code, same parameter, different number of calls per second.
    traces(p).forEach(({ fps, points }, index) => {
      const colour = together ? AGREE : index === 0 ? SLOW : FAST;
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((point, i) => {
        const q = at(point.t, point.value);
        if (i === 0) ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
      });
      ctx.stroke();
      ctx.restore();

      const last = points[points.length - 1];
      const end = at(last.t, last.value);
      fillDot(ctx, end.x, end.y, 3.5, colour);
      label(
        ctx,
        `${fps} fps`,
        end.x - 8,
        end.y + (index === 0 ? 16 : -8),
        colour,
        "right",
      );
    });

    const asTime = (seconds: number | null) =>
      seconds === null ? `over ${DURATION} s` : `${seconds.toFixed(3)} s`;
    show(
      `${p.useDecay ? `exponential decay, half-life ${p.halfLife.toFixed(2)} s` : `lerp(current, target, ${p.factor.toFixed(2)}) once per frame`} \u00B7 ` +
        `95% of the way in ${asTime(slowClose)} at 30 fps, ${asTime(fastClose)} at 144 fps`,
    );
    note(
      together
        ? "the two arrive within one 30 fps frame of each other \u2014 the frame rate has stopped mattering"
        : slowClose === null || fastClose === null
          ? "the slow screen does not even arrive within the run, while the fast one is long finished \u2014 " +
            "the same code, the same number"
          : `the faster screen arrives ${(slowClose / fastClose).toFixed(1)}\u00D7 sooner, which is the ratio of the ` +
            "two frame rates \u2014 the same code, the same number",
    );
  }

  draw();

  return () => {};
};

export default mount;
