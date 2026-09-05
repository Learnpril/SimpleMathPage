/** The standard T·R·S beside any of the six orders, so the disagreement is on screen rather than described. */
import { makeCanvas2D, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addButtonRow, addReadout, addSlider } from "../controls.ts";
import {
  ORDERS,
  RANGE,
  SHAPE,
  distinctOutcomes,
  fittingScale,
  ordersAgree,
  transformedShape,
  type Order,
} from "./affine-shared.ts";
import type { MountFn } from "../runner.ts";

const BEFORE = "#484f58";
const STANDARD = "#7ee787";
const OTHER = "#f0883e";
const AGREES = "#39d3c3";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 330);

  const show = addReadout(el);
  const note = addReadout(el);
  let chosen: Order = "SRT";
  const pick = addButtonRow(
    el,
    ORDERS.map((order) => ({
      label: order.split("").join("\u00B7"),
      apply: () => {
        chosen = order;
        draw();
      },
    })),
  );
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
    1.4,
    draw,
    "\u00D7",
    0.05,
  );
  const scaleY = addSlider(
    el,
    "scale y",
    RANGE.scale.min,
    RANGE.scale.max,
    0.6,
    draw,
    "\u00D7",
    0.05,
  );
  const translateX = addSlider(
    el,
    "translate x",
    RANGE.translate.min,
    RANGE.translate.max,
    1.2,
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
    const halfWidth = width / 2;
    // Two panels side by side, each framed by the same derived scale so the two are comparable.
    const unit = fittingScale(halfWidth / 2, height / 2);
    const params = {
      angleDegrees: angle(),
      scaleX: scaleX(),
      scaleY: scaleY(),
      translateX: translateX(),
    };
    const agree = ordersAgree("TRS", chosen, params);
    const distinct = distinctOutcomes(params);

    line(ctx, { x: halfWidth, y: 0 }, { x: halfWidth, y: height }, GRID, {
      width: 1,
    });

    const panels: Array<[Order, number, string]> = [
      ["TRS", 0, STANDARD],
      [chosen, halfWidth, agree ? AGREES : OTHER],
    ];

    for (const [order, left, colour] of panels) {
      const ox = left + halfWidth / 2;
      const oy = height / 2;
      // World Y is up, so drawing negates it. Section 1.1's one conversion, in one place.
      const at = (p: { x: number; y: number }) => ({
        x: ox + p.x * unit,
        y: oy - p.y * unit,
      });

      line(ctx, { x: left, y: oy }, { x: left + halfWidth, y: oy }, GRID, {
        width: 1,
      });
      line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, GRID, { width: 1 });

      outline(SHAPE.map(at), BEFORE, 1);
      outline(transformedShape(order, params).map(at), colour);
      label(
        ctx,
        order.split("").join(" \u00B7 "),
        left + halfWidth / 2,
        20,
        colour,
        "center",
      );
      label(
        ctx,
        order === "TRS" ? "the usual one" : agree ? "same result" : "different",
        left + halfWidth / 2,
        36,
        order === "TRS" ? TEXT : colour,
        "center",
      );
    }

    pick(ORDERS.indexOf(chosen));
    show(
      `T \u00B7 R \u00B7 S against ${chosen.split("").join(" \u00B7 ")} \u2192 ` +
        `${agree ? "the same result" : "a different result"} \u00B7 ` +
        `at these settings the six orders give ${distinct} distinct outcome${distinct === 1 ? "" : "s"}`,
    );
    note(
      Math.abs(scaleX() - scaleY()) < 1e-9
        ? "with the two scale factors equal, rotation and scale commute, so several of the six collapse together"
        : "set the two scale factors equal and watch the count of distinct outcomes drop \u2014 that is why this bug hides",
    );
  }

  draw();

  return () => {};
};

export default mount;
