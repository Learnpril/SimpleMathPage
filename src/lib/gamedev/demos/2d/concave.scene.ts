/** A concave shape, and the region where the separating axis test reports a hit that is not there. */
import {
  makeCanvas2D,
  addDragTargets,
  dot as fillDot,
  label,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { polygonsOverlap } from "../../../gamedev2d/sat2d.ts";
import {
  BOUNDS,
  CHEVRON,
  CHEVRON_HULL,
  PROBE_START,
  UNIT,
  VIEW,
  concaveFalseArea,
  falseRegionCells,
  probeAt,
  satIsWrongAt,
  screenOf,
  worldOf,
} from "./separate-shared.ts";
import type { MountFn } from "../runner.ts";

const SHAPE = "#7d8590";
const HULL = "#3b4552";
const HONEST = "#7ee787";
const LYING = "#ff7b72";
const APART = "#58a6ff";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  // Both are fixed for the life of the scene, so neither is recomputed on a drag.
  const cells = falseRegionCells();
  const measured = concaveFalseArea(300);
  const hull = CHEVRON_HULL;

  const show = addReadout(el);
  const note = addReadout(el);
  const px = addSlider(
    el,
    "x",
    -BOUNDS.x,
    BOUNDS.x,
    PROBE_START.x,
    draw,
    "",
    0.05,
  );
  const py = addSlider(
    el,
    "y",
    -BOUNDS.y,
    BOUNDS.y,
    PROBE_START.y,
    draw,
    "",
    0.05,
  );
  const showRegion = addCheckbox(
    el,
    "shade every place the test is wrong",
    true,
    draw,
  );

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
    dashed = false,
  ) {
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([5, 4]);
    ctx.beginPath();
    poly.forEach((p, i) => {
      const q = screenOf(p);
      if (i === 0) ctx.moveTo(q.x, q.y);
      else ctx.lineTo(q.x, q.y);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    clear();
    const p = { x: px(), y: py() };
    const probe = probeAt(p);
    const sat = polygonsOverlap(CHEVRON, probe);
    const lying = satIsWrongAt(p);

    // The measured false region, cell by cell. Precomputed, so this is only drawing.
    if (showRegion()) {
      ctx.save();
      ctx.fillStyle = "rgba(255, 123, 114, 0.22)";
      for (const cell of cells) {
        const q = screenOf({ x: cell.x, y: cell.y });
        const side = cell.size * UNIT;
        ctx.fillRect(q.x - side / 2, q.y - side / 2, side + 0.5, side + 0.5);
      }
      ctx.restore();
    }

    /* The convex hull, which is roughly the shape a convex test can describe. Dashed, and labelled as an
       approximation rather than as the answer: a concave polygon's reflex edges contribute normals of
       their own, so the hull bounds the error without being equal to it. */
    strokePolygon(hull, HULL, 1.4, true);
    strokePolygon(CHEVRON, SHAPE, 2.4);
    for (const corner of CHEVRON) {
      const q = screenOf(corner);
      fillDot(ctx, q.x, q.y, 2.6, SHAPE);
    }

    strokePolygon(probe, lying ? LYING : sat ? HONEST : APART, 2.4);
    const centre = screenOf(p);
    fillDot(ctx, centre.x, centre.y, 3.5, lying ? LYING : sat ? HONEST : APART);

    label(ctx, "the shape", 12, 18, SHAPE);
    label(
      ctx,
      "its convex hull, roughly what a convex test sees",
      12,
      32,
      HULL,
    );
    label(
      ctx,
      "drag the square into the notch \u00b7 shaded means the test is lying",
      12,
      VIEW.height - 10,
      DIM,
    );

    show(
      `the test says ${sat ? "overlap" : "apart"} \u00b7 ` +
        `${lying ? "and nothing is actually touching" : sat ? "and it is right" : "and it is right"} \u00b7 ` +
        `${(measured.fraction * 100).toFixed(2)}% of the area around this shape is a false positive`,
    );
    note(
      lying
        ? "no corner of either shape is inside the other and no edges cross \u2014 the test simply cannot describe a notch"
        : sat
          ? "a real overlap, reported correctly \u2014 SAT is not broken, it is being asked about the wrong kind of shape"
          : "outside the shape and outside its hull too, so every axis agrees and the answer is right",
    );
  }

  draw();

  return stopDragging;
};

export default mount;
