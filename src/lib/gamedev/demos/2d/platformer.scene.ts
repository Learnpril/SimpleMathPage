/** One scripted run through a level, scrubbable, with the two forgiving windows on switches. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { boxOf } from "../../../gamedev2d/platformer2d.ts";
import {
  COYOTE_WINDOW,
  JUMP_WINDOW,
  LANDMARKS,
  RUN_STEPS,
  SOLID_CELLS,
  TIME_RANGE,
  VIEW,
  cellRect,
  clampCamera,
  frameAt,
  rectOf,
  runScript,
  screenOf,
  trailTo,
} from "./platformer-shared.ts";
import type { MountFn } from "../runner.ts";

const TILE_FILL = "#2b3138";
const TILE_TOP = "#3b4552";
const TRAIL = "#4a5560";
const GROUNDED = "#7ee787";
const AIRBORNE = "#58a6ff";
const COYOTE = "#f0883e";
const BUFFER = "#d2a8ff";
const JUMPED = "#ff7b72";
const DIM = "#7d8590";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const time = addSlider(
    el,
    "scrub through the run",
    TIME_RANGE.min,
    TIME_RANGE.max,
    0,
    draw,
    " s",
    TIME_RANGE.step,
  );
  const coyoteOn = addCheckbox(el, "coyote time", true, draw);
  const bufferOn = addCheckbox(el, "jump buffering", true, draw);

  function options() {
    return {
      coyote: coyoteOn() ? COYOTE_WINDOW : 0,
      buffer: bufferOn() ? JUMP_WINDOW : 0,
    };
  }

  function draw() {
    clear();
    const opts = options();
    const frame = frameAt(time(), opts);
    const camera = clampCamera(frame.state.cameraX);

    // The level. One fill for every solid cell, with a brighter top edge so surfaces read as surfaces.
    for (const { cx, cy } of SOLID_CELLS) {
      const r = cellRect(cx, cy, camera);
      if (r.x + r.w < 0 || r.x > VIEW.width) continue;
      ctx.fillStyle = TILE_FILL;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      line(ctx, { x: r.x, y: r.y }, { x: r.x + r.w, y: r.y }, TILE_TOP, {
        width: 1,
      });
    }

    // Where it has been, so the whole run is legible from any one moment of it.
    const trail = trailTo(frame, opts);
    ctx.save();
    ctx.strokeStyle = TRAIL;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    trail.forEach((p, i) => {
      const q = screenOf(p, camera);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.stroke();
    ctx.restore();

    // Every jump that has already fired, marked where it happened.
    for (const f of runScript(opts)) {
      if (f.step > frame.step || !f.state.jumped) continue;
      const q = screenOf(f.state.character.position, camera);
      fillDot(ctx, q.x, q.y, 4, JUMPED);
    }

    // The character.
    const box = rectOf(boxOf(frame.state.character), camera);
    const colour = frame.state.character.grounded ? GROUNDED : AIRBORNE;
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.restore();

    /* The two windows, drawn as bars beside the character rather than in a corner. A label parked in the
       corner of the canvas has been the one recurring flaw in these figures: correct, and nowhere near the
       thing it describes. */
    const barX = box.x + box.w + 8;
    const bars: Array<[string, number, string]> = [
      ["coyote", coyoteOn() ? frame.coyote : 0, COYOTE],
      ["buffer", bufferOn() ? frame.buffer : 0, BUFFER],
    ];
    bars.forEach(([name, value, tint], i) => {
      const y = box.y + 4 + i * 13;
      ctx.fillStyle = TILE_FILL;
      ctx.fillRect(barX, y, 46, 7);
      ctx.fillStyle = tint;
      ctx.fillRect(barX, y, 46 * value, 7);
      label(ctx, name, barX + 51, y + 7, value > 0 ? tint : DIM);
    });

    // The camera's own centre, which is what "follows without jitter" is about.
    line(
      ctx,
      { x: VIEW.width / 2, y: 0 },
      { x: VIEW.width / 2, y: VIEW.height },
      DIM,
      { width: 1, dashed: true },
    );
    const trench = screenOf({ x: LANDMARKS.trench.from, y: 0 }, camera);
    label(ctx, "ledge", trench.x - 34, VIEW.height - 8, DIM, "right");

    const foot = boxOf(frame.state.character).min.y;
    const inTrench = foot < LANDMARKS.floorTop - 1e-9;
    show(
      `t ${time().toFixed(2)} s \u00b7 step ${frame.step} of ${RUN_STEPS} \u00b7 x ${frame.state.character.position.x.toFixed(2)} \u00b7 ` +
        `${frame.state.character.grounded ? "on the ground" : "in the air"}${inTrench ? " \u00b7 down in the trench" : ""}`,
    );
    note(
      !coyoteOn() && !bufferOn()
        ? "both windows off: the press after the ledge does nothing, and so does the one before landing"
        : !coyoteOn()
          ? "coyote time off: the jump pressed after the ledge is refused, so it drops into the trench"
          : !bufferOn()
            ? "buffering off: the press before landing is thrown away, and the second jump never happens"
            : "both windows on: the first jump is pressed after the ledge, the second before landing, and both work",
    );
  }

  draw();

  return () => {};
};

export default mount;
