/** The same positive angle, turning one way in the maths and the other way on the canvas. */
import { makeCanvas2D, arrow, dot, label } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addSlider, addReadout } from "../controls.ts";
import { directionFromAngle } from "../../../gamedev2d/screen.ts";
import type { MountFn } from "../runner.ts";

const RIGHT = "#39d3c3";
const WRONG = "#ff7b72";
const DIM = "#484f58";
const TEXT = "#9198a1";

const mount: MountFn = (el) => {
  const { ctx, width, height, clear } = makeCanvas2D(el, 280);

  const show = addReadout(el);
  const angle = addSlider(el, "angle", 0, 360, 40, draw);

  function draw() {
    clear();
    const radians = (angle() * Math.PI) / 180;
    const reach = 78;
    const centres = [
      { x: width * 0.28, y: height * 0.52, colour: RIGHT },
      { x: width * 0.72, y: height * 0.52, colour: WRONG },
    ];

    // Left: converted properly. The world direction has its y negated at the drawing step only.
    const d = directionFromAngle(radians);
    arrow(
      ctx,
      centres[0],
      { x: centres[0].x + d.x * reach, y: centres[0].y - d.y * reach },
      RIGHT,
      2.4,
    );

    // Right: the same angle handed straight to the canvas, with no flip. It turns the other way.
    arrow(
      ctx,
      centres[1],
      { x: centres[1].x + d.x * reach, y: centres[1].y + d.y * reach },
      WRONG,
      2.4,
    );

    for (const c of centres) {
      // The +x axis each arrow is measured from, and the arc it has swept.
      arrow(ctx, c, { x: c.x + reach + 14, y: c.y }, DIM, 1.2);
      dot(ctx, c.x, c.y, 4, c.colour);
      ctx.save();
      ctx.strokeStyle = c.colour;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      const downward = c.colour === WRONG;
      ctx.arc(c.x, c.y, 34, 0, downward ? radians : -radians, !downward);
      ctx.stroke();
      ctx.restore();
    }

    label(
      ctx,
      "y negated when drawing",
      centres[0].x,
      height - 26,
      RIGHT,
      "center",
    );
    label(
      ctx,
      "counter-clockwise, as the unit circle says",
      centres[0].x,
      height - 12,
      TEXT,
      "center",
    );
    label(ctx, "angle used raw", centres[1].x, height - 26, WRONG, "center");
    label(
      ctx,
      "clockwise, because y grows downward",
      centres[1].x,
      height - 12,
      TEXT,
      "center",
    );

    show(
      `${angle()}\u00B0 \u00B7 the direction is (${d.x.toFixed(2)}, ${d.y.toFixed(2)}) in world units, ` +
        `and drawing it needs y flipped to (${d.x.toFixed(2)}, ${(-d.y).toFixed(2)})`,
    );
  }

  draw();

  return () => {};
};

export default mount;
