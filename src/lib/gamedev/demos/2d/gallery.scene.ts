/** Six easings at one instant: the curve, and a sprite that has got that far along its track. */
import { makeCanvas2D, dot as fillDot, label, line } from "../canvas2d.ts";
// From `controls.ts`, not `ui.ts`: the latter imports Three.js and this track must not.
import { addCheckbox, addReadout, addSlider } from "../controls.ts";
import {
  GALLERY,
  LAYOUT,
  ghostTimes,
  rowCentre,
  trackX,
} from "./gallery-shared.ts";
import type { MountFn } from "../runner.ts";

const CURVE = "#58a6ff";
const SPRITE = "#7ee787";
const PAST = "#f0883e";
const GHOST = "#3b4552";
const GRID = "#252b33";
const TEXT = "#9198a1";
const DIM = "#636c76";

const mount: MountFn = (el) => {
  const { ctx, clear } = makeCanvas2D(el, LAYOUT.height);

  const show = addReadout(el);
  const note = addReadout(el);
  const time = addSlider(
    el,
    "t, the fraction of the way through",
    0,
    1,
    0.25,
    draw,
    "",
    0.01,
  );
  const ghosts = addCheckbox(
    el,
    "mark eleven equally spaced instants (the spacing is the speed)",
    true,
    draw,
  );

  function draw() {
    clear();
    const t = time();
    const target = trackX(1);

    label(ctx, "the curve", LAYOUT.curve.left, 16, TEXT);
    label(ctx, "the sprite on its track", LAYOUT.track.left, 16, TEXT);
    label(ctx, "target", target, LAYOUT.height - 8, DIM, "center");

    GALLERY.forEach((entry, row) => {
      const centre = rowCentre(row);
      label(ctx, entry.name, LAYOUT.nameX, centre - 4, CURVE);
      label(ctx, entry.reads, LAYOUT.nameX, centre + 11, DIM);

      // ---- The curve, plotted small. t across, eased value up. ----
      const box = LAYOUT.curve;
      const bottom = centre + box.height / 2;
      const top = centre - box.height / 2;
      // The plot's vertical range covers 0 to 1 only, so an overshoot leaves the box on purpose.
      const curveY = (value: number) => bottom - value * (bottom - top);
      line(
        ctx,
        { x: box.left, y: bottom },
        { x: box.left + box.width, y: bottom },
        GRID,
        { width: 1 },
      );
      line(ctx, { x: box.left, y: top }, { x: box.left, y: bottom }, GRID, {
        width: 1,
      });
      ctx.save();
      ctx.strokeStyle = CURVE;
      ctx.lineWidth = 1.6;
      // Clipped to the box, so the one curve that leaves it is cut off rather than overlapping a row.
      ctx.beginPath();
      ctx.rect(box.left, top - 2, box.width, box.height + 4);
      ctx.clip();
      ctx.beginPath();
      for (let i = 0; i <= 60; i += 1) {
        const u = i / 60;
        const x = box.left + u * box.width;
        const y = curveY(entry.easing(u));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      // Where the reader currently is on that curve.
      fillDot(
        ctx,
        box.left + t * box.width,
        curveY(entry.easing(t)),
        2.5,
        SPRITE,
      );

      // ---- The track, and the sprite on it. ----
      line(
        ctx,
        { x: LAYOUT.track.left, y: centre },
        { x: target, y: centre },
        GRID,
        { width: 1 },
      );
      line(
        ctx,
        { x: target, y: centre - 9 },
        { x: target, y: centre + 9 },
        GRID,
        { width: 1 },
      );

      /* Equal steps in time, so unequal spacing is the curve's speed made visible. This is the whole
         reason the gallery is a gallery: six speed profiles, side by side, at a glance. */
      if (ghosts()) {
        for (const u of ghostTimes()) {
          fillDot(ctx, trackX(entry.easing(u)), centre, 1.8, GHOST);
        }
      }

      const value = entry.easing(t);
      fillDot(
        ctx,
        trackX(value),
        centre,
        LAYOUT.dotRadius,
        value > 1 ? PAST : SPRITE,
      );
    });

    // ---- The numbers that decide what is being looked at, computed rather than described. ----
    const at = (name: string) =>
      GALLERY.find((entry) => entry.name === name)!.easing(t);
    const pct = (value: number) => `${(value * 100).toFixed(0)}%`;
    show(
      `at t = ${t.toFixed(2)}, ${pct(t)} of the time has gone \u00B7 ` +
        `easeInQuad has covered ${pct(at("easeInQuad"))}, linear ${pct(at("linear"))}, ` +
        `easeOutQuad ${pct(at("easeOutQuad"))}`,
    );

    const past = GALLERY.filter((entry) => entry.easing(t) > 1);
    note(
      past.length > 0
        ? `${past.map((entry) => entry.name).join(" and ")} ${past.length > 1 ? "are" : "is"} past the target by ` +
            `${past.map((entry) => pct(entry.easing(t) - 1)).join(" and ")} of the distance \u2014 fine for a sprite, ` +
            "not for an opacity"
        : "every curve is short of the target, so any of these is safe on a value with a hard ceiling",
    );
  }

  draw();

  return () => {};
};

export default mount;
