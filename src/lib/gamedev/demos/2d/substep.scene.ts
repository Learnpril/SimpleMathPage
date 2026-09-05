/** A fast mover, a thin wall, and the frame that steps straight over it without noticing. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addReadout, addSlider } from "../controls.ts";
import {
  FRAME,
  MOVER_SPEED,
  PHASE_RANGE,
  SUBSTEP_RANGE,
  THIN_WALL,
  VIEW,
  WALL_THICKNESS,
  screenOf,
  substepReport,
} from "./deflect-shared.ts";
import type { MountFn } from "../runner.ts";

const WALL = "#7d8590";
const FRAME_DOT = "#3b4552";
const SUBSTEP_DOT = "#58a6ff";
const CAUGHT = "#7ee787";
const MISSED = "#ff7b72";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const speed = addSlider(
    el,
    "speed",
    MOVER_SPEED.min,
    MOVER_SPEED.max,
    24,
    draw,
    " per second",
    MOVER_SPEED.step,
  );
  const substeps = addSlider(
    el,
    "substeps per frame",
    SUBSTEP_RANGE.min,
    SUBSTEP_RANGE.max,
    1,
    draw,
    "",
    1,
  );
  /* The control that makes the point: above the escape speed, whether the wall is noticed depends on where
     the frame boundaries happen to fall, and this slides them. */
  const phase = addSlider(
    el,
    "where in a frame it starts",
    PHASE_RANGE.min,
    PHASE_RANGE.max,
    0,
    draw,
    "",
    PHASE_RANGE.step,
  );

  function draw() {
    clear();
    const r = substepReport(speed(), substeps(), phase());
    const midY = VIEW.height / 2;

    // The wall, and the path the mover travels.
    const wallA = screenOf(THIN_WALL.min);
    const wallB = screenOf(THIN_WALL.max);
    ctx.save();
    ctx.fillStyle = r.tunnelled
      ? "rgba(255, 123, 114, 0.18)"
      : "rgba(126, 231, 135, 0.15)";
    ctx.fillRect(
      Math.min(wallA.x, wallB.x),
      Math.min(wallA.y, wallB.y),
      Math.abs(wallB.x - wallA.x),
      Math.abs(wallB.y - wallA.y),
    );
    ctx.strokeStyle = WALL;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(wallA.x, wallB.x),
      Math.min(wallA.y, wallB.y),
      Math.abs(wallB.x - wallA.x),
      Math.abs(wallB.y - wallA.y),
    );
    ctx.restore();

    line(ctx, { x: 0, y: midY }, { x: VIEW.width, y: midY }, FRAME_DOT, {
      width: 1,
    });

    // Where the mover is at each whole frame. Sparse at speed, which is the whole problem.
    for (const p of r.frames) {
      const q = screenOf(p);
      if (q.x < 0 || q.x > VIEW.width) continue;
      fillDot(ctx, q.x, q.y, 3, FRAME_DOT);
    }

    // The frame that decides it: where it began, and every substep inside it.
    const beganAt = screenOf(r.before);
    fillDot(ctx, beganAt.x, beganAt.y, 5, SUBSTEP_DOT);
    label(
      ctx,
      "this frame starts here",
      beganAt.x - 6,
      beganAt.y - 14,
      SUBSTEP_DOT,
      "right",
    );
    for (const p of r.substepsAt) {
      const q = screenOf(p);
      fillDot(ctx, q.x, q.y, 3.5, SUBSTEP_DOT);
    }

    if (r.hit) {
      const q = screenOf(r.hit);
      fillDot(ctx, q.x, q.y, 6.5, CAUGHT);
      label(ctx, "caught here", q.x + 10, q.y - 10, CAUGHT);
    } else {
      const past = r.substepsAt[r.substepsAt.length - 1];
      const q = screenOf(past);
      fillDot(ctx, q.x, q.y, 6.5, MISSED);
      label(ctx, "straight through", q.x + 10, q.y - 10, MISSED);
    }

    label(ctx, `wall ${WALL_THICKNESS} thick`, wallA.x - 8, 22, WALL, "right");
    label(
      ctx,
      "grey dots are whole frames \u00b7 blue are the substeps inside the frame that matters",
      12,
      VIEW.height - 10,
      DIM,
    );

    show(
      `${r.perFrame.toFixed(3)} per frame against a wall ${WALL_THICKNESS} thick \u00b7 ` +
        `escape speed ${r.threshold.toFixed(1)} \u00b7 ` +
        `${(r.chance * 100).toFixed(1)}% of start offsets tunnel at this speed`,
    );
    note(
      r.perFrame <= WALL_THICKNESS
        ? "one step is shorter than the wall is thick, so no alignment can slip past it"
        : r.tunnelled
          ? `this alignment steps over it \u2014 ${r.needed} substeps would be enough to stop that`
          : `this alignment happens to land inside, but slide the start offset and it will not \u2014 ${r.needed} substeps fixes it for good`,
    );
  }

  draw();

  return () => {};
};

export default mount;
