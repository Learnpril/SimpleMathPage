/** Every direction a player can hold, drawn as the square you get and the circle you wanted. */
import { makeCanvas2D, arrow, dot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addSlider, addReadout } from "../controls.ts";
import {
  circleLoop,
  rawAt,
  fixedAt,
  speedRatio,
  squareLoop,
} from "./diagonal-shared.ts";
import type { MountFn } from "../runner.ts";

const RAW = "#ff7b72";
const FIXED = "#39d3c3";
const AXIS = "#30363d";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 320);

  const show = addReadout(el);
  const note = addReadout(el);
  const heading = addSlider(el, "direction held", 0, 360, 45, draw);

  function draw() {
    clear();
    const cx = width / 2;
    const cy = height / 2;
    const unit = 96;
    // World y is up, so drawing negates it. Section 1.1's one conversion, in one place.
    const at = (v: { x: number; y: number }) => ({
      x: cx + v.x * unit,
      y: cy - v.y * unit,
    });

    line(ctx, { x: cx - 150, y: cy }, { x: cx + 150, y: cy }, AXIS);
    line(ctx, { x: cx, y: cy - 150 }, { x: cx, y: cy + 150 }, AXIS);

    // The two reachable sets: the square raw input traces, the circle normalizing gives.
    const trace = (loop: Array<{ x: number; y: number }>, colour: string) => {
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      loop.forEach((v, i) => {
        const p = at(v);
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();
    };
    trace(squareLoop(), RAW);
    trace(circleLoop(), FIXED);

    const radians = (heading() * Math.PI) / 180;
    const raw = rawAt(radians);
    const fixed = fixedAt(radians);
    const ratio = speedRatio(radians);

    arrow(ctx, { x: cx, y: cy }, at(raw), RAW, 2.4);
    arrow(ctx, { x: cx, y: cy }, at(fixed), FIXED, 2.4);
    dot(ctx, at(raw).x, at(raw).y, 4, RAW);
    dot(ctx, at(fixed).x, at(fixed).y, 4, FIXED);

    label(ctx, "raw input", 10, 18, RAW);
    label(ctx, `reaches the square, length ${ratio.toFixed(3)}`, 10, 32, TEXT);
    label(ctx, "normalized", 10, 52, FIXED);
    label(ctx, "reaches the circle, length 1.000", 10, 66, TEXT);

    show(
      `holding ${heading()}\u00B0: raw input is ${ratio.toFixed(3)} long, normalized is 1.000 \u00B7 ` +
        `${((ratio - 1) * 100).toFixed(1)}% faster than intended`,
    );
    note(
      ratio > 1.4
        ? "a full diagonal is the worst case: root two, so 41% faster than walking along an axis"
        : ratio < 1.001
          ? "along an axis the two agree exactly, which is why this bug hides during testing"
          : "anywhere off an axis the raw version is already too fast",
    );
  }

  draw();

  return () => {};
};

export default mount;
