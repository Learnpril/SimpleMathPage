/** Two convex polygons, every candidate axis, and the shadows on the one that proves a miss. */
import {
  makeCanvas2D,
  addDragTargets,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { candidateAxes } from "../../../gamedev2d/sat2d.ts";
import {
  BOUNDS,
  SPIN_RANGE,
  START,
  VIEW,
  fixedAt,
  movingAt,
  satReport,
  screenOf,
  shadowSegment,
  worldOf,
} from "./separate-shared.ts";
import type { MountFn } from "../runner.ts";

const FIXED_COLOUR = "#7d8590";
const MOVING_COLOUR = "#58a6ff";
const TOUCHING = "#f0883e";
const PROOF = "#7ee787";
const OTHER_AXIS = "#3b4552";
const PUSH = "#d2a8ff";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const px = addSlider(el, "x", -BOUNDS.x, BOUNDS.x, START.x, draw, "", 0.05);
  const py = addSlider(el, "y", -BOUNDS.y, BOUNDS.y, START.y, draw, "", 0.05);
  const spin = addSlider(
    el,
    "turn the triangle",
    SPIN_RANGE.min,
    SPIN_RANGE.max,
    0,
    draw,
    "\u00B0",
    1,
  );
  const spinFixed = addSlider(
    el,
    "turn the pentagon",
    SPIN_RANGE.min,
    SPIN_RANGE.max,
    0,
    draw,
    "\u00B0",
    1,
  );
  const showAll = addCheckbox(el, "show every candidate axis", false, draw);

  // Dragging is the natural way in; the sliders are the keyboard path to the same configuration.
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

  function strokePolygon(
    poly: readonly { x: number; y: number }[],
    colour: string,
    width = 2.2,
  ) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    poly.forEach((p, i) => {
      const q = screenOf(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    for (const p of poly) {
      const q = screenOf(p);
      fillDot(ctx, q.x, q.y, 2.6, colour);
    }
  }

  function draw() {
    clear();
    const a = fixedAt(spinFixed());
    const b = movingAt({ x: px(), y: py() }, spin());
    const r = satReport(a, b);
    const origin = screenOf({ x: 0, y: 0 });

    /* Every candidate axis as a spoke through the origin, so "the axes are the edges turned ninety
       degrees" is something a reader can count rather than take on faith. */
    if (showAll()) {
      for (const axis of candidateAxes(a, b)) {
        line(
          ctx,
          { x: origin.x - axis.x * 200, y: origin.y + axis.y * 200 },
          { x: origin.x + axis.x * 200, y: origin.y - axis.y * 200 },
          OTHER_AXIS,
          { width: 1 },
        );
      }
    }

    /* The axis that settles it, with both shadows drawn along it. When they miss there is a visible gap
       between the two shadows, and that gap **is** the proof. */
    if (r.proof) {
      const axis = r.proof;
      line(
        ctx,
        { x: origin.x - axis.x * 220, y: origin.y + axis.y * 220 },
        { x: origin.x + axis.x * 220, y: origin.y - axis.y * 220 },
        PROOF,
        { width: 1.2, dashed: true },
      );
      for (const [poly, colour] of [
        [a, FIXED_COLOUR],
        [b, MOVING_COLOUR],
      ] as const) {
        const shadow = shadowSegment(poly, axis);
        // Offset the two shadows slightly apart so they can both be seen where they nearly meet.
        const across = { x: -axis.y, y: axis.x };
        const nudge = colour === FIXED_COLOUR ? 7 : -7;
        const from = screenOf(shadow.from);
        const to = screenOf(shadow.to);
        line(
          ctx,
          { x: from.x + across.x * nudge, y: from.y - across.y * nudge },
          { x: to.x + across.x * nudge, y: to.y - across.y * nudge },
          colour,
          { width: 4 },
        );
        // A tick at each end of the shape's own projection lines, joining shape to shadow.
        for (const end of [shadow.from, shadow.to]) {
          const q = screenOf(end);
          fillDot(
            ctx,
            q.x + across.x * nudge,
            q.y - across.y * nudge,
            3,
            colour,
          );
        }
      }
      label(
        ctx,
        "this axis separates them",
        origin.x + 10,
        origin.y - 10,
        PROOF,
      );
    }

    strokePolygon(a, FIXED_COLOUR);
    strokePolygon(b, r.hit ? TOUCHING : MOVING_COLOUR, 2.6);

    /* When they do overlap there is no proof to draw, so the shallowest axis is drawn instead - the
       direction Section 5.4 will push along. */
    if (r.hit && r.push) {
      const from = screenOf({ x: 0, y: 0 });
      arrow(
        ctx,
        from,
        {
          x: from.x + r.push.axis.x * r.push.depth * 42,
          y: from.y - r.push.axis.y * r.push.depth * 42,
        },
        PUSH,
        2.4,
      );
      label(ctx, "shallowest overlap", from.x + 12, from.y + 18, PUSH);
    }

    label(
      ctx,
      "drag the triangle \u00b7 every axis is one shape's edge, turned ninety degrees",
      12,
      VIEW.height - 10,
      DIM,
    );

    const offered = candidateAxes(a, b).length;
    show(
      `${offered} candidate axes, ${r.distinct} of them distinct \u00b7 ` +
        (r.hit
          ? `no axis separates them, so they overlap \u00b7 shallowest by ${r.push?.depth.toFixed(3)}`
          : `axis ${r.tried} of ${offered} already proved a miss`),
    );
    note(
      r.hit
        ? r.pushDisagrees
          ? "note the shallowest axis: with unnormalized axes the code would have chosen a different one here"
          : "every axis had to be checked before this could be said \u2014 overlapping is the expensive case"
        : "one axis with a gap is the whole proof, which is why the loop stops as soon as it finds one",
    );
  }

  draw();

  return stopDragging;
};

export default mount;
