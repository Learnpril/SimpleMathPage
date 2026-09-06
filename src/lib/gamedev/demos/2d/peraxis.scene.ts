/** The same charge at the same step, resolved one axis at a time and both at once. */
import { makeCanvas2D, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addReadout, addSlider } from "../controls.ts";
import { boxOf } from "../../../gamedev2d/platformer2d.ts";
import {
  CHARGE_FACE,
  CHARGE_SPEED_RANGE,
  CHARGE_TICK_SECONDS,
  CHARGE_TICK_STEPS,
  CHARGE_UNIT,
  CHARGE_VIEW,
  COLS,
  LANDMARKS,
  SOLID_CELLS,
  TILE,
  chargeAtStep,
  chargeRectOf,
  chargeScreenOf,
  chargeSummary,
  tileBoxOf,
} from "./platformer-shared.ts";
import type { MountFn } from "../runner.ts";

const TILE_FILL = "#2b3138";
const TILE_TOP = "#3b4552";
const RIGHT = "#7ee787";
const WRONG = "#ff7b72";
const DIM = "#7d8590";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, CHARGE_VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const speed = addSlider(
    el,
    "how fast it is running",
    CHARGE_SPEED_RANGE.min,
    CHARGE_SPEED_RANGE.max,
    45,
    draw,
    " units per second",
    CHARGE_SPEED_RANGE.step,
  );

  const summary = chargeSummary();

  /**
   * The path, plus a tick every twentieth of a second.
   *
   * The ticks are the only thing in this figure that changes below the naive version's failure speed, because
   * below it both methods finish in exactly the same place - which is the claim. Without them the picture is
   * identical at every speed from 4 to 44 and the slider looks broken.
   */
  function path(
    points: readonly { x: number; y: number }[],
    colour: string,
    width: number,
    tickOffset: number,
  ) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach((p, i) => {
      const q = chargeScreenOf(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    points.forEach((p, i) => {
      if (i % CHARGE_TICK_STEPS !== 0) return;
      const q = chargeScreenOf(p);
      if (q.x < -20 || q.x > CHARGE_VIEW.width + 20) return;
      line(
        ctx,
        { x: q.x, y: q.y + tickOffset },
        { x: q.x, y: q.y + tickOffset + Math.sign(tickOffset) * 6 },
        colour,
        { width: 1 },
      );
    });
  }

  function draw() {
    clear();
    const v = speed();
    const good = chargeAtStep(v, true);
    const bad = chargeAtStep(v, false);

    for (const { cx, cy } of SOLID_CELLS) {
      const r = chargeRectOf(tileBoxOf(cx, cy));
      if (r.x + r.w < 0 || r.x > CHARGE_VIEW.width) continue;
      ctx.fillStyle = TILE_FILL;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      line(ctx, { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, TILE_TOP, {
        width: 1,
      });
    }

    // The face it should stop against, drawn so "stopped at the face" is something to look at.
    const faceTop = chargeScreenOf({
      x: LANDMARKS.step.from,
      y: LANDMARKS.step.top,
    });
    const faceBottom = chargeScreenOf({
      x: LANDMARKS.step.from,
      y: LANDMARKS.floorTop - 0.6,
    });
    line(ctx, faceTop, faceBottom, DIM, { width: 1, dashed: true });
    /* Left-aligned to the *right* of the face. Right-aligned to its left, the text ran off the canvas and
       arrived as "e face it must stop" - the third label-placement flaw in this Module, and the third one no
       build assertion could see. */
    label(ctx, "must stop here", faceTop.x + 8, faceTop.y - 10, DIM);

    // The right edge of the level, so leaving it reads as leaving it.
    const edge = chargeScreenOf({ x: COLS * TILE, y: 0 });
    line(ctx, { x: edge.x, y: 0 }, { x: edge.x, y: CHARGE_VIEW.height }, DIM, {
      width: 1,
    });
    label(ctx, "end of the level", edge.x - 6, 16, DIM, "right");

    /* Red drawn thick and green thin on top, with their time ticks on opposite sides. Below the failure speed
       the two paths are the same line to the last bit, so drawing them at equal weight hid one of them
       completely and the figure looked like it had only ever had one. A red halo around a green core is the
       honest way to show agreement without moving either of them. */
    path(bad.points, WRONG, 6, 4);
    path(good.points, RIGHT, 2, -4);

    for (const [charge, colour, width] of [
      [bad, WRONG, 5],
      [good, RIGHT, 2],
    ] as const) {
      const r = chargeRectOf(boxOf(charge.end));
      ctx.save();
      ctx.strokeStyle = colour;
      ctx.lineWidth = width;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.restore();
    }

    const describe = (c: typeof good) =>
      c.stoppedAtFace
        ? `stopped at ${CHARGE_FACE}`
        : c.escaped
          ? `left the level, still falling`
          : `ended at x ${c.end.position.x.toFixed(3)}`;

    show(
      `at ${v} units per second one fixed step moves ${(v / 120).toFixed(4)} units, and one tick to the next is a 60 fps frame \u2014 ${(v * CHARGE_TICK_SECONDS).toFixed(3)} units \u00b7 ` +
        `green one axis at a time: ${describe(good)} \u00b7 red both at once: ${describe(bad)}`,
    );
    note(
      bad.stoppedAtFace
        ? `Both land in the same place, so the green line sits inside the red one \u2014 which is why the naive version ships. ` +
            `Only the ticks change down here. Push the slider to ${summary.firstCombinedFailure} and the red one leaves.`
        : `Resolving both axes at once fails at ${summary.combinedFailures} of the ${summary.total} speeds on this slider, from ${summary.firstCombinedFailure} up. ` +
            `One axis at a time fails at ${summary.perAxisFailures}. Slide back below ${summary.firstCombinedFailure} and they agree again.`,
    );
  }

  draw();

  return () => {};
};

export default mount;
