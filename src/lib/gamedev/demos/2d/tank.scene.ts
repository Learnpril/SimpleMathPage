/** A turret on a tank: both frames drawn, with a checkbox that multiplies the two the wrong way round. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  applyToDirection,
  translationOf,
} from "../../../gamedev2d/matrix2d.ts";
import { axisLengths } from "../../../gamedev2d/spaces2d.ts";
import {
  RANGE,
  fittingScale,
  hullShape,
  transforms,
  turretShape,
  turretShear,
} from "./tank-shared.ts";
import type { MountFn } from "../runner.ts";

const HULL_COLOUR = "#58a6ff";
const TURRET_COLOUR = "#7ee787";
const WRONG = "#ff7b72";
const FRAME_X = "#f0883e";
const FRAME_Y = "#d2a8ff";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 330);

  const show = addReadout(el);
  const note = addReadout(el);
  const tankX = addSlider(
    el,
    "tank x",
    RANGE.tankX.min,
    RANGE.tankX.max,
    -1.5,
    draw,
    "",
    0.1,
  );
  const tankAngle = addSlider(
    el,
    "tank heading",
    RANGE.tankAngle.min,
    RANGE.tankAngle.max,
    25,
    draw,
  );
  const turretAngle = addSlider(
    el,
    "turret, relative to the hull",
    RANGE.turretAngle.min,
    RANGE.turretAngle.max,
    50,
    draw,
  );
  const hullScaleX = addSlider(
    el,
    "hull scale x",
    RANGE.hullScaleX.min,
    RANGE.hullScaleX.max,
    1,
    draw,
    "\u00D7",
    0.05,
  );
  const childFirst = addCheckbox(
    el,
    "multiply child \u00D7 parent (uncheck is correct)",
    false,
    draw,
  );

  function outline(
    points: Array<{ x: number; y: number }>,
    colour: string,
    lineWidth = 2,
  ) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    clear();
    // Derived from the slider ranges, never chosen: a rotating hull with a turret on it reaches
    // further than either shape alone.
    const unit = fittingScale(width / 2, height / 2);
    const ox = width / 2;
    const oy = height / 2;
    // World Y is up, so drawing negates it. Section 1.1's one conversion, in one place.
    const at = (p: { x: number; y: number }) => ({
      x: ox + p.x * unit,
      y: oy - p.y * unit,
    });

    line(ctx, { x: 0, y: oy }, { x: width, y: oy }, GRID, { width: 1 });
    line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, GRID, { width: 1 });
    label(ctx, "world origin", ox + 6, oy + 14, TEXT);

    const params = {
      tankX: tankX(),
      tankAngleDegrees: tankAngle(),
      hullScaleX: hullScaleX(),
      turretAngleDegrees: turretAngle(),
    };
    const wrong = childFirst();
    const { hull, turret } = transforms(params, wrong);
    const shear = turretShear(params);
    const stretched = axisLengths(turret);

    /* Each frame's own axes, drawn as its two matrix columns from its own origin. Seeing them is
       what makes "the child's coordinates are the parent's" concrete rather than a sentence. */
    function drawFrame(m: typeof hull, scale: number, faded: boolean) {
      const origin = at(translationOf(m));
      const xAxis = applyToDirection(m, { x: scale, y: 0 });
      const yAxis = applyToDirection(m, { x: 0, y: scale });
      arrow(
        ctx,
        origin,
        at({
          x: translationOf(m).x + xAxis.x,
          y: translationOf(m).y + xAxis.y,
        }),
        FRAME_X,
        faded ? 1 : 1.8,
      );
      arrow(
        ctx,
        origin,
        at({
          x: translationOf(m).x + yAxis.x,
          y: translationOf(m).y + yAxis.y,
        }),
        FRAME_Y,
        faded ? 1 : 1.8,
      );
      fillDot(ctx, origin.x, origin.y, 4, TEXT);
    }

    // Where the hull is, and where the turret ended up.
    outline(hullShape(params, wrong).map(at), HULL_COLOUR);
    drawFrame(hull, 1, true);
    label(
      ctx,
      "hull frame",
      at(translationOf(hull)).x + 8,
      at(translationOf(hull)).y + 18,
      HULL_COLOUR,
    );

    outline(turretShape(params, wrong).map(at), wrong ? WRONG : TURRET_COLOUR);
    drawFrame(turret, 0.7, false);
    label(
      ctx,
      wrong ? "turret, placed wrongly" : "turret frame",
      at(translationOf(turret)).x + 8,
      at(translationOf(turret)).y - 12,
      wrong ? WRONG : TURRET_COLOUR,
    );

    show(
      `${wrong ? "turret \u00D7 hull" : "hull \u00D7 turret"} \u00B7 ` +
        `the turret's own numbers never change: mounted at (0.25, 0) facing ${turretAngle()}\u00B0 in the hull's frame \u00B7 ` +
        `in the world it sits at (${translationOf(turret).x.toFixed(2)}, ${translationOf(turret).y.toFixed(2)})`,
    );
    note(
      wrong
        ? "child \u00D7 parent reads the hull's transform as though it were written in the turret's coordinates \u2014 " +
            "set every slider to zero and the two orders agree, which is why this ships"
        : Math.abs(shear) < 1e-9
          ? `the turret's axes are square, and its own scale is ${stretched.x.toFixed(2)} by ${stretched.y.toFixed(2)} \u00B7 ` +
            "stretch the hull to see what a parent's uneven scale does to a rotated child"
          : `the hull's uneven scale has sheared the turret: its axes are ${(
              (Math.acos(Math.min(1, Math.max(-1, shear))) * 180) /
              Math.PI
            ).toFixed(
              1,
            )}\u00B0 apart instead of 90\u00B0, and its own scale reads ${stretched.x.toFixed(2)} by ${stretched.y.toFixed(2)}`,
    );
  }

  draw();

  return () => {};
};

export default mount;
