/** One sprite under T·R·S, with the composed matrix printed live so you can see which numbers move. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addMatrixGrid, addReadout, addSlider } from "../controls.ts";
import {
  applyToDirection,
  determinant,
  rows,
  translationOf,
} from "../../../gamedev2d/matrix2d.ts";
import {
  RANGE,
  SHAPE,
  fittingScale,
  matrixFor,
  transformedShape,
} from "./affine-shared.ts";
import type { MountFn } from "../runner.ts";

const BEFORE = "#484f58";
const AFTER = "#7ee787";
const MIRRORED = "#ff7b72";
const AXIS_X = "#58a6ff";
const AXIS_Y = "#d2a8ff";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 320);

  const show = addReadout(el);
  // The translation column is tagged separately from the linear block, because which cells move when
  // you drag which slider is most of what makes a matrix stop feeling arbitrary.
  const grid = addMatrixGrid(el, 3, (row, col) =>
    row === 2 ? "fixed" : col === 2 ? "translate" : "linear",
  );
  const note = addReadout(el);
  const angle = addSlider(
    el,
    "rotate",
    RANGE.angle.min,
    RANGE.angle.max,
    30,
    draw,
  );
  const scaleX = addSlider(
    el,
    "scale x",
    RANGE.scale.min,
    RANGE.scale.max,
    1,
    draw,
    "\u00D7",
    0.05,
  );
  const scaleY = addSlider(
    el,
    "scale y",
    RANGE.scale.min,
    RANGE.scale.max,
    1,
    draw,
    "\u00D7",
    0.05,
  );
  const translateX = addSlider(
    el,
    "translate x",
    RANGE.translate.min,
    RANGE.translate.max,
    0.8,
    draw,
    "",
    0.1,
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
    // Derived from the slider ranges, never chosen: see `fittingScale`.
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

    const params = {
      angleDegrees: angle(),
      scaleX: scaleX(),
      scaleY: scaleY(),
      translateX: translateX(),
    };
    const m = matrixFor("TRS", params);
    const det = determinant(m);
    const mirrored = det < 0;

    outline(SHAPE.map(at), BEFORE);
    label(ctx, "before", at(SHAPE[9]).x - 4, at(SHAPE[9]).y - 8, BEFORE);

    // The two columns of the linear block are where the axes land. Drawing them makes the matrix
    // readable as geometry rather than as nine numbers.
    const origin = at({ x: 0, y: 0 });
    const xAxis = applyToDirection(m, { x: 1, y: 0 });
    const yAxis = applyToDirection(m, { x: 0, y: 1 });
    const from = at(translationOf(m));
    arrow(ctx, from, at({ x: m[2] + xAxis.x, y: m[5] + xAxis.y }), AXIS_X, 2);
    arrow(ctx, from, at({ x: m[2] + yAxis.x, y: m[5] + yAxis.y }), AXIS_Y, 2);
    label(
      ctx,
      "column 1",
      at({ x: m[2] + xAxis.x, y: m[5] + xAxis.y }).x + 6,
      at({ x: m[2] + xAxis.x, y: m[5] + xAxis.y }).y,
      AXIS_X,
    );
    label(
      ctx,
      "column 2",
      at({ x: m[2] + yAxis.x, y: m[5] + yAxis.y }).x + 6,
      at({ x: m[2] + yAxis.x, y: m[5] + yAxis.y }).y,
      AXIS_Y,
    );

    // The translation, which is the third column read straight off the matrix.
    line(ctx, origin, from, TEXT, { dashed: true, width: 1 });
    fillDot(ctx, from.x, from.y, 4, TEXT);

    outline(
      transformedShape("TRS", params).map(at),
      mirrored ? MIRRORED : AFTER,
    );

    grid(rows(m));
    show(
      `T \u00B7 R \u00B7 S \u00B7 the scale happens first and the translation last \u00B7 ` +
        `determinant ${det.toFixed(2)}, so area is \u00D7${Math.abs(det).toFixed(2)}` +
        `${mirrored ? " and the shape is mirrored" : ""}`,
    );
    note(
      `column 1 is where (1, 0) lands, column 2 is where (0, 1) lands, column 3 is the translation ` +
        `(${m[2].toFixed(2)}, ${m[5].toFixed(2)}) \u00B7 the bottom row stays 0 0 1 until Section 3.3`,
    );
  }

  draw();

  return () => {};
};

export default mount;
