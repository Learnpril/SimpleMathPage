/** A vector's shadow on a direction, split into the part along it and the part across it. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addReadout, addSlider } from "../controls.ts";
import { split, vectorAt } from "./project-shared.ts";
import type { MountFn } from "../runner.ts";

const V = "#58a6ff";
const ALONG = "#7ee787";
const ACROSS = "#d2a8ff";
const DIR = "#f0883e";
const AXIS = "#30363d";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 300);

  const show = addReadout(el);
  const note = addReadout(el);
  const vAngle = addSlider(el, "the vector's angle", -180, 180, 55, draw);
  const speed = addSlider(el, "its length", 1, 6, 4, draw, "", 0.5);
  const dirAngle = addSlider(el, "the direction's angle", -180, 180, 0, draw);

  function draw() {
    clear();
    const ox = width / 2;
    const oy = height / 2 + 20;
    const unit = 32;
    // World y is up, so drawing negates it. Section 1.1's one conversion, in one place.
    const at = (p: { x: number; y: number }) => ({
      x: ox + p.x * unit,
      y: oy - p.y * unit,
    });

    line(ctx, { x: 0, y: oy }, { x: width, y: oy }, AXIS);
    line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, AXIS);

    const s = split(vAngle(), speed(), dirAngle());

    // The line the projection lands on, drawn right across the picture in both directions.
    const far = vectorAt(dirAngle(), 20);
    line(ctx, at({ x: -far.x, y: -far.y }), at(far), DIR, { dashed: true });
    arrow(ctx, at({ x: 0, y: 0 }), at(s.direction), DIR, 2);
    label(ctx, "direction, length 1", 10, 18, DIR);

    // The vector, then its two parts.
    arrow(ctx, at({ x: 0, y: 0 }), at(s.v), V, 2.6);
    arrow(ctx, at({ x: 0, y: 0 }), at(s.alongPart), ALONG, 2.6);
    // The across part starts where the along part ended, so the two visibly add up to the vector.
    arrow(ctx, at(s.alongPart), at(s.v), ACROSS, 2);
    fillDot(ctx, at(s.alongPart).x, at(s.alongPart).y, 4, ALONG);

    label(ctx, `the vector, length ${speed().toFixed(1)}`, 10, 32, V);
    label(ctx, `along  ${s.signed.toFixed(2)}`, 10, 46, ALONG);
    label(
      ctx,
      `across ${Math.hypot(s.acrossPart.x, s.acrossPart.y).toFixed(2)}`,
      10,
      60,
      ACROSS,
    );

    show(
      `dot ${s.raw.toFixed(3)} \u2192 the vector reaches ${s.signed.toFixed(3)} along the direction, ` +
        `${s.signed < 0 ? "which is backwards along it" : "measured from the origin"}`,
    );
    note(
      Math.abs(s.signed) < 0.02
        ? "at a right angle the projection is zero: the vector goes nowhere along the direction"
        : s.signed < 0
          ? "a negative projection means the vector points the other way along the line"
          : "the two parts always add back to the vector, and they are always at a right angle to each other",
    );
  }

  draw();

  return () => {};
};

export default mount;
