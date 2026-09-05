/** A guard's line of sight past three walls, and what happens when a wall is read as an infinite line. */
import {
  makeCanvas2D,
  addDragTargets,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import { pointOn } from "../../../gamedev2d/segment2d.ts";
import {
  BOUNDS,
  GUARD_AT,
  RADIUS_RANGE,
  SIGHT_RADIUS,
  START,
  UNIT,
  VIEW,
  WALLS,
  clearInDirection,
  screenOf,
  sightReport,
  sweepDisagreements,
  worldOf,
} from "./sight-shared.ts";
import type { MountFn } from "../runner.ts";

const WALL = "#7d8590";
const EXTENSION = "#3b4552";
const CLEAR = "#7ee787";
const BLOCKED = "#ff7b72";
const GUARD = "#d2a8ff";
const TARGET = "#58a6ff";
const DIM = "#636c76";

/** Spokes in the compass around the guard. 120 is three degrees each, which reads as a fan. */
const SPOKES = 120;

const mount: MountFn = (el) => {
  const { ctx, canvas, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const px = addSlider(
    el,
    "target x",
    -BOUNDS.x,
    BOUNDS.x,
    START.x,
    draw,
    "",
    0.05,
  );
  const py = addSlider(
    el,
    "target y",
    -BOUNDS.y,
    BOUNDS.y,
    START.y,
    draw,
    "",
    0.05,
  );
  /* A control rather than a constant, because the whole figure depends on it: at three units out the
     two tests agree exactly, and by ten the third wall's line has come into range. */
  const reach = addSlider(
    el,
    "how far out the spokes ask",
    RADIUS_RANGE.min,
    RADIUS_RANGE.max,
    SIGHT_RADIUS,
    draw,
    " units",
    RADIUS_RANGE.step,
  );
  const asLines = addCheckbox(
    el,
    "treat every wall as the infinite line it lies on",
    false,
    draw,
  );

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

  function draw() {
    clear();
    const target = { x: px(), y: py() };
    const wrong = asLines();
    const radius = reach();
    const r = sightReport(target);
    const guard = screenOf(GUARD_AT);

    // What the walls become if their ends are ignored. Drawn only when that is what is being asked.
    if (wrong) {
      for (const wall of WALLS) {
        line(
          ctx,
          screenOf(pointOn(wall, -12)),
          screenOf(pointOn(wall, 13)),
          EXTENSION,
          {
            dashed: true,
            width: 1,
          },
        );
      }
    }

    /* The compass: one spoke per direction, coloured by whether a target SIGHT_RADIUS away that way is
       visible. This is the Section's headline as a picture - tick the box and watch a third of the fan
       turn red without a single wall having moved. */
    for (let i = 0; i < SPOKES; i += 1) {
      const angle = (i / SPOKES) * Math.PI * 2;
      const visible = clearInDirection(angle, radius, wrong);
      const from = {
        x: GUARD_AT.x + Math.cos(angle) * 0.55,
        y: GUARD_AT.y + Math.sin(angle) * 0.55,
      };
      const to = {
        x: GUARD_AT.x + Math.cos(angle) * 1.35,
        y: GUARD_AT.y + Math.sin(angle) * 1.35,
      };
      line(ctx, screenOf(from), screenOf(to), visible ? CLEAR : BLOCKED, {
        width: 2,
      });
    }

    // The walls, drawn over the compass so their ends are unmistakable.
    for (const wall of WALLS) {
      line(ctx, screenOf(wall.a), screenOf(wall.b), WALL, { width: 3.5 });
      for (const end of [wall.a, wall.b]) {
        const q = screenOf(end);
        fillDot(ctx, q.x, q.y, 3, WALL);
      }
    }

    /* The sight line, and where it stopped. **The marker follows whichever test is selected**, which is
       the only way the interesting case reads: when the phantom wall blocks a view that is really clear,
       the point worth pointing at is on the wall's extension, not on the wall. */
    const to = screenOf(target);
    const clearNow = wrong ? r.clearIfLines : r.clear;
    const hitNow = wrong ? r.hitAtIfLines : r.hitAt;
    line(ctx, guard, to, clearNow ? CLEAR : BLOCKED, {
      width: 1.8,
      dashed: !clearNow,
    });
    if (!clearNow && hitNow) {
      const hit = screenOf(hitNow);
      fillDot(ctx, hit.x, hit.y, 4.5, BLOCKED);
      label(
        ctx,
        wrong && r.clear ? "blocked by nothing" : "blocked here",
        hit.x + 8,
        hit.y - 8,
        BLOCKED,
      );
    }

    fillDot(ctx, guard.x, guard.y, 6, GUARD);
    /* Outside the compass, not inside it. This label sat at +20 px, which is within the ring of spokes,
       so it was drawn over them and unreadable - reported by a reader looking at the rendered page,
       which is the half of this a build with no GPU cannot check. */
    label(ctx, "guard", guard.x - 1.35 * UNIT - 8, guard.y + 4, GUARD, "right");
    fillDot(ctx, to.x, to.y, 5.5, TARGET);
    label(ctx, "target", to.x + 10, to.y - 8, TARGET);

    // Top left, which is empty. At the bottom it collided with the compass's lowest spokes.
    label(
      ctx,
      `each spoke: can the guard see ${radius} units out that way?`,
      12,
      18,
      DIM,
    );

    const sweep = sweepDisagreements(radius);
    show(
      `the target is ${clearNow ? "visible" : "hidden"} \u00b7 ` +
        `of a full turn, ${sweep.clearDegrees.toFixed(2)}\u00B0 is really clear and ` +
        `${sweep.wrongClearDegrees.toFixed(2)}\u00B0 would be if the walls were lines`,
    );
    note(
      wrong
        ? sweep.degrees < 0.005
          ? `at ${radius} units out nothing is behind a wall's extension, so the two tests agree exactly \u2014 push the reach out`
          : `the walls now reach for ever, so ${sweep.degrees.toFixed(2)}\u00B0 of the view is blocked by wall that is not there \u2014 ` +
            "the fix is testing u as well as t"
        : r.disagrees
          ? "at this exact spot the two tests already disagree, so tick the box and watch the sight line change"
          : "every wall stops at its ends, which is what 0 \u2264 u \u2264 1 is for \u2014 tick the box to drop it",
    );
  }

  draw();

  return stopDragging;
};

export default mount;
