/** A velocity split against a wall into the part along it and the part into it, with restitution blending. */
import {
  makeCanvas2D,
  arrow,
  dot as fillDot,
  label,
  line,
} from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  CONTACT,
  RESTITUTION_RANGE,
  VELOCITY_RANGE,
  VIEW,
  WALL_DRAW_LENGTH,
  WALL_RANGE,
  deflectReport,
  screenOf,
  tipOf,
} from "./deflect-shared.ts";
import type { MountFn } from "../runner.ts";

const WALL = "#7d8590";
const INCOMING = "#58a6ff";
const NORMAL_PART = "#ff7b72";
const TANGENT_PART = "#7ee787";
const RESULT = "#ffd866";
const NORMAL = "#d2a8ff";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, VIEW.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const wallAngle = addSlider(
    el,
    "the wall's angle",
    WALL_RANGE.min,
    WALL_RANGE.max,
    -18,
    draw,
    "\u00B0",
    1,
  );
  const velocityAngle = addSlider(
    el,
    "the velocity's angle",
    VELOCITY_RANGE.min,
    VELOCITY_RANGE.max,
    -125,
    draw,
    "\u00B0",
    1,
  );
  const restitution = addSlider(
    el,
    "restitution: 0 slides, 1 bounces",
    RESTITUTION_RANGE.min,
    RESTITUTION_RANGE.max,
    0,
    draw,
    "",
    RESTITUTION_RANGE.step,
  );
  const showParts = addCheckbox(el, "show the two components", true, draw);

  function draw() {
    clear();
    const r = deflectReport(wallAngle(), velocityAngle(), restitution());
    const at = screenOf(CONTACT);

    // The wall, drawn long enough to read as a surface rather than a segment.
    line(
      ctx,
      screenOf({
        x: CONTACT.x - r.along.x * WALL_DRAW_LENGTH,
        y: CONTACT.y - r.along.y * WALL_DRAW_LENGTH,
      }),
      screenOf({
        x: CONTACT.x + r.along.x * WALL_DRAW_LENGTH,
        y: CONTACT.y + r.along.y * WALL_DRAW_LENGTH,
      }),
      WALL,
      { width: 3.5 },
    );
    // Its outward normal, short and unit length, so the reader can see what everything is measured against.
    arrow(ctx, at, screenOf(tipOf(r.normal)), NORMAL, 1.6);
    label(
      ctx,
      "n",
      screenOf(tipOf(r.normal)).x + 8,
      screenOf(tipOf(r.normal)).y - 4,
      NORMAL,
    );

    /* The incoming velocity, drawn arriving **at** the contact rather than leaving it, because that is what
       it is doing. Everything else leaves the contact. */
    arrow(
      ctx,
      screenOf({ x: CONTACT.x - r.velocity.x, y: CONTACT.y - r.velocity.y }),
      at,
      INCOMING,
      2.6,
    );
    label(
      ctx,
      "v",
      screenOf({ x: CONTACT.x - r.velocity.x, y: CONTACT.y - r.velocity.y }).x -
        10,
      screenOf({ x: CONTACT.x - r.velocity.x, y: CONTACT.y - r.velocity.y }).y -
        6,
      INCOMING,
    );

    /* The split, drawn from the contact so the two parts visibly add to the incoming arrow. Dashed, since
       they are a decomposition rather than a motion anything performs. */
    if (showParts()) {
      for (const [part, colour, name] of [
        [r.normalComponent, NORMAL_PART, "into the wall"],
        [r.tangentComponent, TANGENT_PART, "along the wall"],
      ] as const) {
        const tip = screenOf(tipOf(part));
        line(ctx, at, tip, colour, { width: 2, dashed: true });
        fillDot(ctx, tip.x, tip.y, 3, colour);
        label(
          ctx,
          name,
          tip.x + 8,
          tip.y + (colour === NORMAL_PART ? -8 : 14),
          colour,
        );
      }
    }

    // The result, which is the only arrow that describes what actually happens next.
    arrow(ctx, at, screenOf(tipOf(r.responded)), RESULT, 3);
    fillDot(ctx, at.x, at.y, 4.5, RESULT);

    label(ctx, "the wall", 12, 18, WALL);
    label(
      ctx,
      r.intoWall
        ? "moving into the wall, so the response applies"
        : "moving away from the wall, so nothing is changed",
      12,
      32,
      r.intoWall ? DIM : NORMAL_PART,
    );

    const speed = Math.hypot(r.velocity.x, r.velocity.y);
    const kept = Math.hypot(r.responded.x, r.responded.y);
    show(
      `${r.angleFromWall.toFixed(0)}\u00B0 from the wall \u00b7 ` +
        `a slide keeps ${(r.kept * 100).toFixed(1)}% of the speed \u00b7 ` +
        `this response keeps ${((kept / speed) * 100).toFixed(1)}%`,
    );
    note(
      !r.intoWall
        ? "the guard matters here: applied anyway, a slide would cancel the outward part and glue it to the surface"
        : restitution() < 0.01
          ? "restitution 0: the into-the-wall part is dropped, and what is left runs along the surface"
          : restitution() > 0.99
            ? "restitution 1: the same part is reversed instead of dropped, so the speed is unchanged"
            : `restitution ${restitution().toFixed(2)}: the part is reversed and shrunk, which is most real surfaces`,
    );
  }

  draw();

  return () => {};
};

export default mount;
