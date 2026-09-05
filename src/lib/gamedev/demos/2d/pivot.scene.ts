/** A sprite rotated about a pivot, with a checkbox that drops the final translate back. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import {
  addButtonRow,
  addCheckbox,
  addReadout,
  addSlider,
} from "../controls.ts";
import { distance, length } from "../../../gamedev2d/length2d.ts";
import {
  PIVOT_RANGE,
  SPRITE,
  SPRITE_CENTRE,
  SPRITE_TIP,
  fittingScale,
  missBy,
  orbitCentre,
  transformed,
} from "./pivot-shared.ts";
import type { MountFn } from "../runner.ts";

const BEFORE = "#484f58";
const AFTER = "#7ee787";
const WRONG = "#ff7b72";
const PIVOT = "#f0883e";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 340);

  const show = addReadout(el);
  const note = addReadout(el);
  const angle = addSlider(el, "angle", -180, 180, 40, draw);
  const preset = addButtonRow(el, [
    { label: "pivot at the origin", apply: () => place(0, 0) },
    {
      label: "pivot at the sprite's centre",
      apply: () => place(SPRITE_CENTRE.x, SPRITE_CENTRE.y),
    },
  ]);
  const pivotX = addSlider(
    el,
    "pivot x",
    PIVOT_RANGE.minX,
    PIVOT_RANGE.maxX,
    SPRITE_CENTRE.x,
    draw,
    "",
    0.1,
  );
  const pivotY = addSlider(
    el,
    "pivot y",
    PIVOT_RANGE.minY,
    PIVOT_RANGE.maxY,
    SPRITE_CENTRE.y,
    draw,
    "",
    0.1,
  );
  const translateBack = addCheckbox(
    el,
    "translate back afterwards (uncheck for the bug)",
    true,
    draw,
  );

  function place(x: number, y: number) {
    pivotX.set(x);
    pivotY.set(y);
    draw();
  }

  function outline(
    points: Array<{ x: number; y: number }>,
    colour: string,
    lineWidth = 2,
    dashed = false,
  ) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = lineWidth;
    if (dashed) ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    clear();
    // Derived from the geometry, not chosen: see `fittingScale`. A hand-picked scale put the
    // rotated shape off the canvas at an eighth of the slider settings.
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
    label(ctx, "origin", ox + 6, oy + 14, TEXT);

    const pivot = { x: pivotX(), y: pivotY() };
    const back = translateBack();
    const result = transformed(angle(), pivot, back);
    const miss = missBy(angle(), pivot);
    const displaced = length(miss) > 1e-6;

    outline(SPRITE.map(at), BEFORE);
    label(ctx, "before", at(SPRITE[0]).x - 6, at(SPRITE[0]).y + 16, BEFORE);

    // What the shape is actually turning around, which is the origin when the last step is missing.
    const centre = at(orbitCentre(pivot, back));
    const radius = distance(orbitCentre(pivot, back), result[3]) * unit;
    ctx.save();
    ctx.strokeStyle = back ? PIVOT : WRONG;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // With the bug on, show where it should have landed, so the arrow joins two visible things.
    if (!back && displaced) {
      const correct = transformed(angle(), pivot, true).map(at);
      outline(correct, AFTER, 1, true);
      label(ctx, "should be here", correct[3].x + 8, correct[3].y - 6, AFTER);
      arrow(ctx, at(result[0]), correct[0], WRONG, 1.4);
    }

    outline(result.map(at), back ? AFTER : WRONG);

    // The pivot. When the translate happens it is a fixed point: it does not move at all.
    const pin = at(pivot);
    fillDot(ctx, pin.x, pin.y, 5, PIVOT);
    label(ctx, "pivot", pin.x + 8, pin.y - 8, PIVOT);

    // Only one of the two buttons can be describing the current pivot, and usually neither is.
    const near = (p: { x: number; y: number }) =>
      Math.abs(pivot.x - p.x) < 1e-9 && Math.abs(pivot.y - p.y) < 1e-9;
    preset(near({ x: 0, y: 0 }) ? 0 : near(SPRITE_CENTRE) ? 1 : -1);

    show(
      `rotating by ${angle()}\u00B0 about (${pivot.x.toFixed(1)}, ${pivot.y.toFixed(1)}) \u00B7 ` +
        `${back ? "subtract the pivot, rotate, add it back" : "subtract the pivot, rotate, and stop there"}`,
    );
    note(
      back
        ? `the pivot is the one place that does not move, and the tip stays ${distance(pivot, SPRITE_TIP).toFixed(2)} units ` +
            `from it at every angle \u2014 that is the dashed circle`
        : !displaced
          ? "with the pivot at the origin there is nothing to add back, so the broken version is exactly right"
          : `it rotated correctly and landed (${miss.x.toFixed(1)}, ${miss.y.toFixed(1)}) away, which is the pivot itself \u00B7 ` +
            `the dashed circle has the same radius, ${distance(pivot, SPRITE_TIP).toFixed(2)}, and is round the origin instead \u2014 ` +
            `that is what it turned about`,
    );
  }

  draw();

  return () => {};
};

export default mount;
