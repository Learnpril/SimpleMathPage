/** Three pairings of circles and boxes, one test at a time, with the shape you drag doing the asking. */
import {
  makeCanvas2D,
  addDragTargets,
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
import {
  BOUNDS,
  KINDS,
  MOVING_RADIUS,
  START,
  STATIC_BOX,
  STATIC_CIRCLE,
  UNIT,
  VIEW,
  movingBoxAt,
  reportAt,
  screenOf,
  worldOf,
  type Kind,
} from "./shapes-shared.ts";
import type { MountFn } from "../runner.ts";

const APART = "#58a6ff";
const TOUCHING = "#f0883e";
const STATIC = "#7d8590";
const NEAREST = "#7ee787";
const WRONG = "#ff7b72";
const AXIS = "#3b4552";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  let kind: Kind = KINDS[0];

  const show = addReadout(el);
  const note = addReadout(el);
  const px = addSlider(el, "x", -BOUNDS.x, BOUNDS.x, START.x, draw, "", 0.05);
  const py = addSlider(el, "y", -BOUNDS.y, BOUNDS.y, START.y, draw, "", 0.05);
  const showWrong = addCheckbox(
    el,
    "also run the wrong version of this test",
    false,
    draw,
  );
  const setActive = addButtonRow(
    el,
    KINDS.map((k, index) => ({
      label: k,
      apply: () => {
        kind = k;
        setActive(index);
        draw();
      },
    })),
  );
  setActive(0);

  // Dragging is the natural way in; the two sliders are the keyboard path to the same position.
  const stopDragging = addDragTargets(
    canvas,
    () => [screenOf({ x: px(), y: py() })],
    (_index, sx, sy) => {
      const world = worldOf(sx, sy);
      px.set(Math.min(Math.max(world.x, -BOUNDS.x), BOUNDS.x));
      py.set(Math.min(Math.max(world.y, -BOUNDS.y), BOUNDS.y));
      draw();
    },
  );

  function strokeCircle(
    centre: { x: number; y: number },
    radius: number,
    colour: string,
    width = 2,
    dashed = false,
  ) {
    const c = screenOf(centre);
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * UNIT, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function strokeBox(
    box: { min: { x: number; y: number }; max: { x: number; y: number } },
    colour: string,
    width = 2,
    dashed = false,
  ) {
    const a = screenOf(box.min);
    const b = screenOf(box.max);
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.strokeRect(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.abs(b.x - a.x),
      Math.abs(b.y - a.y),
    );
    ctx.restore();
  }

  function draw() {
    clear();
    const p = { x: px(), y: py() };
    const r = reportAt(kind, p);
    const colour = r.hit ? TOUCHING : APART;

    // The axes, so a reader can see the box test really is about the two of them separately.
    line(
      ctx,
      { x: 0, y: VIEW.height / 2 },
      { x: VIEW.width, y: VIEW.height / 2 },
      AXIS,
      { width: 1 },
    );
    line(
      ctx,
      { x: VIEW.width / 2, y: 0 },
      { x: VIEW.width / 2, y: VIEW.height },
      AXIS,
      { width: 1 },
    );

    // The shape that stays put.
    if (kind === "two circles") {
      strokeCircle(STATIC_CIRCLE.centre, STATIC_CIRCLE.radius, STATIC);
    } else {
      strokeBox(STATIC_BOX, STATIC);
    }

    // What the test measured, drawn before the moving shape so the shape sits on top of it.
    if (kind === "two circles") {
      line(ctx, screenOf(STATIC_CIRCLE.centre), screenOf(p), colour, {
        width: 1.5,
      });
      // The reach: the two radii laid end to end along that same line.
      strokeCircle(
        STATIC_CIRCLE.centre,
        STATIC_CIRCLE.radius + MOVING_RADIUS,
        DIM,
        1,
        true,
      );
      label(
        ctx,
        "the sum of the radii",
        screenOf({ x: STATIC_CIRCLE.centre.x, y: STATIC_CIRCLE.centre.y }).x +
          6,
        screenOf({
          x: 0,
          y: STATIC_CIRCLE.centre.y - STATIC_CIRCLE.radius - MOVING_RADIUS,
        }).y - 8,
        DIM,
      );
    } else if (kind === "circle and box") {
      // The clamp, which is the whole test: centre to nearest point on the box.
      if (r.nearest) {
        const q = screenOf(r.nearest);
        line(ctx, screenOf(p), q, NEAREST, { width: 1.5 });
        fillDot(ctx, q.x, q.y, 4.5, NEAREST);
        label(ctx, "the clamped point", q.x + 8, q.y - 8, NEAREST);
      }
    } else {
      // Two ranges per axis, drawn along the edges of the canvas.
      const moving = movingBoxAt(p);
      const rows: Array<[number, number, number, string]> = [
        [STATIC_BOX.min.x, STATIC_BOX.max.x, VIEW.height - 26, STATIC],
        [moving.min.x, moving.max.x, VIEW.height - 18, colour],
      ];
      for (const [lo, hi, y, c] of rows) {
        line(
          ctx,
          { x: screenOf({ x: lo, y: 0 }).x, y },
          { x: screenOf({ x: hi, y: 0 }).x, y },
          c,
          { width: 3 },
        );
      }
      const cols: Array<[number, number, number, string]> = [
        [STATIC_BOX.min.y, STATIC_BOX.max.y, 14, STATIC],
        [moving.min.y, moving.max.y, 22, colour],
      ];
      for (const [lo, hi, x, c] of cols) {
        line(
          ctx,
          { x, y: screenOf({ x: 0, y: lo }).y },
          { x, y: screenOf({ x: 0, y: hi }).y },
          c,
          { width: 3 },
        );
      }
      /* Both labels sit **beside the bars they name**. The y one was at the top-left corner of the
         canvas while its bars run down the middle of the left edge, so the two vertical strips read as
         unexplained decoration - which is what a reader reported. Anchored to the static box's own y
         range, which never moves, so the label cannot drift away from what it is pointing at. */
      label(ctx, "x ranges", 12, VIEW.height - 30, DIM);
      label(
        ctx,
        "y ranges",
        32,
        (screenOf({ x: 0, y: STATIC_BOX.min.y }).y +
          screenOf({ x: 0, y: STATIC_BOX.max.y }).y) /
          2 +
          4,
        DIM,
      );
    }

    // The shape being dragged.
    if (kind === "two boxes") strokeBox(movingBoxAt(p), colour, 2.4);
    else strokeCircle(p, MOVING_RADIUS, colour, 2.4);
    const centre = screenOf(p);
    fillDot(ctx, centre.x, centre.y, 3.5, colour);

    /* The wrong version's verdict, drawn only when asked and only when it differs. A wrong answer that
       happens to agree here is not worth a mark on the picture. */
    if (showWrong() && r.naiveDisagrees) {
      strokeCircle(p, MOVING_RADIUS + 0.16, WRONG, 1.5, true);
      label(
        ctx,
        "the wrong test disagrees here",
        centre.x + 12,
        centre.y + 20,
        WRONG,
      );
    }

    label(ctx, "drag the shape, or use the sliders", 12, VIEW.height - 8, DIM);

    show(
      `${kind} \u00b7 ${r.detail} \u00b7 ` +
        `${r.hit ? `overlapping by ${Math.abs(r.separation).toFixed(2)}` : `apart by ${r.separation.toFixed(2)}`}`,
    );
    note(
      showWrong()
        ? r.naiveDisagrees
          ? kind === "two circles"
            ? "here the wrong test squares the radii separately and misses an overlap that is really there"
            : "here the wrong test grew the box by the radius, so its corners are square and it reports a hit too early"
          : kind === "two boxes"
            ? "there is no popular wrong version of the box test \u2014 it is two range checks and hard to get subtly wrong"
            : "the two agree at this position, which is why the bug survives testing \u2014 move toward a corner"
        : r.hit
          ? "one distance and one comparison, and no square root anywhere"
          : "a miss is proved by a single gap, which is the idea Section 5.3 generalises",
    );
  }

  draw();

  return stopDragging;
};

export default mount;
