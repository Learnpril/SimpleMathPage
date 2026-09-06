/** A jump described by the height and time you want, and the arc a stepped loop actually produces. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addButtonRow, addReadout, addSlider } from "../controls.ts";
import {
  APEX_TIME_RANGE,
  FPS_RANGE,
  GROUND,
  HEIGHT_RANGE,
  INTEGRATORS,
  LAUNCH_X,
  VIEW,
  arcFor,
  exactArc,
  predictedDrift,
  requested,
  screenOf,
  type Integrator,
} from "./leap-shared.ts";
import type { MountFn } from "../runner.ts";

const GROUND_COLOUR = "#3b4552";
const EXACT = "#7d8590";
const ASKED = "#7ee787";
const STEPPED = "#58a6ff";
const SHORT = "#ff7b72";
const OVER = "#f0883e";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  let which: Integrator = "semi-implicit";

  const show = addReadout(el);
  const note = addReadout(el);
  const height = addSlider(
    el,
    "how high the jump should be",
    HEIGHT_RANGE.min,
    HEIGHT_RANGE.max,
    2,
    draw,
    " units",
    HEIGHT_RANGE.step,
  );
  const apexTime = addSlider(
    el,
    "how long to reach the top",
    APEX_TIME_RANGE.min,
    APEX_TIME_RANGE.max,
    0.4,
    draw,
    " s",
    APEX_TIME_RANGE.step,
  );
  const fps = addSlider(
    el,
    "frames per second",
    FPS_RANGE.min,
    FPS_RANGE.max,
    60,
    draw,
    "",
    FPS_RANGE.step,
  );
  const setActive = addButtonRow(
    el,
    INTEGRATORS.map((name, index) => ({
      label: name,
      apply: () => {
        which = name;
        setActive(index);
        draw();
      },
    })),
  );
  setActive(1);

  function draw() {
    clear();
    const asked = height();
    const arc = arcFor(asked, apexTime(), fps(), which);
    const reached = arc.peak - GROUND;
    const off = reached - asked;
    const colour = Math.abs(off) < 1e-6 ? ASKED : off < 0 ? SHORT : OVER;

    // The ground, and the height that was asked for, so the gap between them is the subject.
    const groundY = screenOf({ x: 0, y: GROUND }).y;
    line(
      ctx,
      { x: 0, y: groundY },
      { x: VIEW.width, y: groundY },
      GROUND_COLOUR,
      {
        width: 2,
      },
    );
    const askedY = screenOf({ x: 0, y: GROUND + asked }).y;
    line(ctx, { x: 0, y: askedY }, { x: VIEW.width, y: askedY }, ASKED, {
      width: 1,
      dashed: true,
    });
    label(ctx, `asked for ${asked.toFixed(1)}`, 12, askedY - 6, ASKED);

    // The true parabola, behind everything, as the thing the arithmetic promised.
    ctx.save();
    ctx.strokeStyle = EXACT;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    exactArc(asked, apexTime()).forEach((p, i) => {
      const q = screenOf(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    // The stepped arc, one dot per frame, so the timestep is visible rather than implied.
    ctx.save();
    ctx.strokeStyle = STEPPED;
    ctx.lineWidth = 2;
    ctx.beginPath();
    arc.points.forEach((p, i) => {
      const q = screenOf(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();
    for (const p of arc.points) {
      const q = screenOf(p);
      fillDot(ctx, q.x, q.y, 2.6, STEPPED);
    }

    // Where it actually peaked, and the gap to where it should have.
    const peakPoint = arc.points.reduce(
      (best, p) => (p.y > best.y ? p : best),
      arc.points[0],
    );
    const peakScreen = screenOf(peakPoint);
    fillDot(ctx, peakScreen.x, peakScreen.y, 5, colour);
    if (Math.abs(off) > 1e-6) {
      line(
        ctx,
        { x: peakScreen.x, y: peakScreen.y },
        { x: peakScreen.x, y: askedY },
        colour,
        { width: 1.5 },
      );
      label(
        ctx,
        `${off < 0 ? "short" : "over"} by ${Math.abs(off).toFixed(3)}`,
        peakScreen.x + 10,
        (peakScreen.y + askedY) / 2,
        colour,
      );
    }

    const launchScreen = screenOf({ x: LAUNCH_X, y: GROUND });
    fillDot(ctx, launchScreen.x, launchScreen.y, 4, DIM);
    label(
      ctx,
      "grey is the true parabola, blue is the stepped loop",
      12,
      18,
      DIM,
    );

    const r = requested(asked, apexTime());
    show(
      `${asked.toFixed(1)} units in ${apexTime().toFixed(2)} s means launch ${r.launch.toFixed(2)} and gravity ${r.gravity.toFixed(2)} \u00b7 ` +
        `${which} at ${fps()} fps reached ${reached.toFixed(3)}`,
    );
    note(
      which === "midpoint"
        ? "exact at every frame rate, for one extra multiply and one add \u2014 the arc and the parabola are the same line"
        : `predicted drift over the rise is ${predictedDrift(asked, apexTime(), fps(), which).toFixed(3)}, which is what the gap measures \u2014 ` +
            `halve the timestep and it halves`,
    );
  }

  draw();

  return () => {};
};

export default mount;
