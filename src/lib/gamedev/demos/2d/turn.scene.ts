/** A turret turning toward a heading at a fixed rate, with the wrap on the difference as a checkbox. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { directionFromAngle, toDegrees } from "../../../gamedev2d/angles2d.ts";
import { START, simulate, stepsToArrive } from "./turn-shared.ts";
import type { MountFn } from "../runner.ts";

const NOW = "#7ee787";
const LONG = "#ff7b72";
const TARGET = "#d2a8ff";
const GHOST = "#484f58";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 320);

  const show = addReadout(el);
  const note = addReadout(el);
  const steps = addSlider(el, "steps taken", 0, 90, 0, draw, " steps");
  const target = addSlider(el, "target heading", -180, 180, -170, draw);
  const rate = addSlider(el, "turn rate", 1, 30, 4, draw, "\u00B0 per step");
  const wrap = addCheckbox(
    el,
    "wrap the difference (uncheck for the bug)",
    true,
    draw,
  );

  function draw() {
    clear();
    const radius = 108;
    const ox = width / 2;
    const oy = height / 2;
    // A heading is an angle in the world, so drawing it negates the angle, not the coordinates.
    const on = (angle: number, r: number) => ({
      x: ox + Math.cos(angle) * r,
      y: oy - Math.sin(angle) * r,
    });

    line(ctx, { x: 0, y: oy }, { x: width, y: oy }, GRID, { width: 1 });
    line(ctx, { x: ox, y: 0 }, { x: ox, y: height }, GRID, { width: 1 });

    const t = simulate(target(), rate(), steps(), wrap());
    const needed = stepsToArrive(target(), rate(), wrap());
    const colour = wrap() ? NOW : LONG;

    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.arc(ox, oy, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Every heading visited so far, as a trail. This is what "the long way round" looks like.
    for (const angle of t.angles) {
      const p = on(angle, radius);
      fillDot(ctx, p.x, p.y, 2, colour);
    }

    // Where it started, where it is aiming, and where it currently points.
    arrow(ctx, { x: ox, y: oy }, on(START, radius * 0.82), GHOST, 1.4);
    label(
      ctx,
      `start ${toDegrees(START).toFixed(0)}\u00B0`,
      on(START, radius * 0.95).x,
      on(START, radius * 0.95).y - 6,
      GHOST,
      "center",
    );

    const aim = (target() * Math.PI) / 180;
    line(ctx, { x: ox, y: oy }, on(aim, radius * 1.1), TARGET, {
      dashed: true,
      width: 1.5,
    });
    label(
      ctx,
      `target ${target()}\u00B0`,
      on(aim, radius * 1.24).x,
      on(aim, radius * 1.24).y + 4,
      TARGET,
      "center",
    );

    const facing = directionFromAngle(t.current);
    arrow(
      ctx,
      { x: ox, y: oy },
      { x: ox + facing.x * radius, y: oy - facing.y * radius },
      colour,
      3,
    );
    fillDot(ctx, ox, oy, 7, TEXT);
    label(
      ctx,
      `${toDegrees(t.current).toFixed(0)}\u00B0`,
      ox + facing.x * (radius + 22),
      oy - facing.y * (radius + 22) + 4,
      colour,
      "center",
    );

    show(
      `difference used ${toDegrees(t.difference).toFixed(0)}\u00B0 at ${rate()}\u00B0 per step \u00B7 ` +
        `${needed === null ? "never arrives" : `arrives after ${needed} steps`} \u00B7 ` +
        `now at ${toDegrees(t.current).toFixed(0)}\u00B0 after ${steps()}`,
    );
    note(
      wrap()
        ? "the wrapped difference is the short way round, so the turret never goes the long way to reach a nearby heading"
        : `unwrapped, ${toDegrees(START).toFixed(0)}\u00B0 to ${target()}\u00B0 reads as ${toDegrees(t.difference).toFixed(0)}\u00B0 \u2014 ` +
            `it still arrives, which is why this looks like an AI problem rather than an arithmetic one`,
    );
  }

  draw();

  return () => {};
};

export default mount;
