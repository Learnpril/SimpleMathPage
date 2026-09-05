/** A turret aiming at a target, with a checkbox that swaps atan2 for atan and breaks half the plane. */
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
import { TURRET, UNIT, report, screenOf, worldOf } from "./aim-shared.ts";
import type { MountFn } from "../runner.ts";

const GOOD = "#7ee787";
const BAD = "#ff7b72";
const TARGET = "#d2a8ff";
const GRID = "#252b33";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, canvas, width, height, clear } = makeCanvas2D(el, 320);

  const show = addReadout(el);
  const note = addReadout(el);
  const tx = addSlider(el, "target x", -8, 8, -4, draw, "", 0.1);
  const ty = addSlider(el, "target y", -4, 4, 2, draw, "", 0.1);
  const useAtan2 = addCheckbox(
    el,
    "use atan2 (uncheck for plain atan)",
    true,
    draw,
  );

  const ox = () => width / 2;
  const oy = () => height / 2;

  // Dragging is a convenience; the sliders above are the accessible path to the same values.
  const stopDragging = addDragTargets(
    canvas,
    () => [screenOf(report(tx(), ty(), useAtan2()).target, ox(), oy())],
    (_index, x, y) => {
      const world = worldOf(x, y, ox(), oy());
      tx.set(Math.min(Math.max(world.x, -8), 8));
      ty.set(Math.min(Math.max(world.y, -4), 4));
      draw();
    },
  );

  function draw() {
    clear();
    const at = (p: { x: number; y: number }) => screenOf(p, ox(), oy());
    const centre = at(TURRET);

    line(ctx, { x: 0, y: centre.y }, { x: width, y: centre.y }, GRID, {
      width: 1,
    });
    line(ctx, { x: centre.x, y: 0 }, { x: centre.x, y: height }, GRID, {
      width: 1,
    });
    label(ctx, "0\u00B0", centre.x + 14, centre.y - 8, TEXT);

    const r = report(tx(), ty(), useAtan2());
    // Above 0.999 the barrel is on the target for any purpose a game has.
    const aiming = r.alignment > 0.999;
    const colour = aiming ? GOOD : BAD;

    // The unit circle the angle is measured on, so the arc has something to sit against.
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, UNIT * 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // The angle itself, swept from the +x axis. Counter-clockwise in the world is clockwise here.
    ctx.save();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      centre.x,
      centre.y,
      UNIT * 1.2,
      0,
      -r.angle,
      r.angle > 0, // counter-clockwise in world means anticlockwise sweep on a flipped canvas
    );
    ctx.stroke();
    ctx.restore();

    // Where the target is, and the line the turret should be lying along.
    const target = at(r.target);
    line(ctx, centre, target, TARGET, { dashed: true, width: 1 });
    fillDot(ctx, target.x, target.y, 6, TARGET);
    label(
      ctx,
      `target (${r.target.x.toFixed(1)}, ${r.target.y.toFixed(1)})`,
      target.x + 10,
      target.y - 8,
      TARGET,
    );

    // The barrel, drawn from the angle rather than from the target: that is what makes the bug visible.
    arrow(
      ctx,
      centre,
      at({ x: r.facing.x * 3.4, y: r.facing.y * 3.4 }),
      colour,
      3,
    );
    fillDot(ctx, centre.x, centre.y, 7, TEXT);
    label(ctx, "turret", centre.x - 6, centre.y + 22, TEXT, "center");
    label(
      ctx,
      `${r.degrees.toFixed(1)}\u00B0`,
      centre.x + Math.cos(-r.angle) * UNIT * 1.5,
      centre.y + Math.sin(-r.angle) * UNIT * 1.5 + 4,
      colour,
      "center",
    );

    show(
      `${useAtan2() ? "atan2(y, x)" : "atan(y / x)"} = ${r.degrees.toFixed(1)}\u00B0 ` +
        `(${r.angle.toFixed(3)} rad) \u00B7 barrel \u00B7 target = ${r.alignment.toFixed(3)} \u2192 ` +
        `${aiming ? "pointing at it" : "not pointing at it"}`,
    );
    note(
      useAtan2()
        ? "atan2 reads the sign of both components, so every one of the four quadrants comes out right"
        : `atan divided y by x and lost the signs: ${
            r.target.x < 0
              ? `atan2 would have said ${r.correctDegrees.toFixed(1)}\u00B0, exactly half a turn from this`
              : "with x positive it happens to agree, which is why this bug survives testing"
          }`,
    );
  }

  draw();

  return stopDragging;
};

export default mount;
