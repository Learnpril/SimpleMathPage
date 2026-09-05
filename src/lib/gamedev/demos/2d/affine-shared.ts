/**
 * One shape, three operations, and the six orders they can be applied in.
 *
 * Shared by both of this Section's scenes, so the sprite, the slider ranges and the framing cannot drift
 * apart between them. As in Section 2.3 the pixels-per-unit is **derived** rather than chosen: a
 * transform's reach depends on the scale and the translation, and a hand-picked scale is how a rotated
 * shape ends up half off the canvas.
 */
import {
  compose,
  identity,
  rotation,
  scaling,
  translation,
  type Mat3,
} from "../../../gamedev2d/matrix2d.ts";
import { applyAll } from "../../../gamedev2d/matrix2d.ts";
import { length } from "../../../gamedev2d/length2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

/**
 * An F. Deliberately not symmetric in either axis, so a rotation, a non-uniform scale and a reflection
 * are each unmistakable - a square or a circle would hide all three.
 */
export const SHAPE: readonly Point[] = [
  { x: 0, y: 0 },
  { x: 0.32, y: 0 },
  { x: 0.32, y: 0.55 },
  { x: 0.95, y: 0.55 },
  { x: 0.95, y: 0.85 },
  { x: 0.32, y: 0.85 },
  { x: 0.32, y: 1.1 },
  { x: 1.2, y: 1.1 },
  { x: 1.2, y: 1.4 },
  { x: 0, y: 1.4 },
];

/** What the sliders can reach. The framing is derived from these, so the two cannot disagree. */
export const RANGE = {
  angle: { min: -180, max: 180 },
  scale: { min: 0.5, max: 1.5 },
  translate: { min: 0, max: 1.5 },
};

export type Params = {
  angleDegrees: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
};

/**
 * The six orders, named as the **matrix product, left to right**.
 *
 * So `"TRS"` is $T R S$, and because points are columns on the right that means the scale happens first
 * and the translation last. `"TRS"` is the one nearly every engine uses, which is why it is first.
 */
export type Order = "TRS" | "TSR" | "RTS" | "RST" | "STR" | "SRT";

export const ORDERS: readonly Order[] = [
  "TRS",
  "TSR",
  "RTS",
  "RST",
  "STR",
  "SRT",
];

/** The three ingredients, built from the current slider values. */
export function partsOf(p: Params): Record<"T" | "R" | "S", Mat3> {
  return {
    T: translation(p.translateX, 0),
    R: rotation((p.angleDegrees * Math.PI) / 180),
    S: scaling(p.scaleX, p.scaleY),
  };
}

/** The composed matrix for an order, read left to right exactly as it is written. */
export function matrixFor(order: Order, p: Params): Mat3 {
  const parts = partsOf(p);
  return compose(...order.split("").map((letter) => parts[letter as "T"]));
}

export function transformedShape(order: Order, p: Params): Point[] {
  return applyAll(matrixFor(order, p), SHAPE);
}

/**
 * How far from the origin any of the six orders can put any corner, in world units.
 *
 * Every order is some arrangement of the three, and the worst case is the one that scales **last**,
 * because then the scale multiplies the translation too: $|S(Rp + t)| \le s_{max}(r_{max} + t_{max})$.
 * That single bound therefore covers all six, which a build-time sweep over the whole slider space
 * confirms rather than assumes.
 */
export function extentBound(): number {
  const corner = Math.max(...SHAPE.map((p) => length(p)));
  return RANGE.scale.max * (corner + RANGE.translate.max);
}

/** Pixels per world unit, so nothing any of the six orders draws can leave its panel. */
export function fittingScale(
  halfWidth: number,
  halfHeight: number,
  margin = 10,
): number {
  const bound = extentBound();
  return Math.min((halfWidth - margin) / bound, (halfHeight - margin) / bound);
}

/** Do two orders put every corner in the same place? The question the page is really asking. */
export function ordersAgree(a: Order, b: Order, p: Params): boolean {
  const first = transformedShape(a, p);
  const second = transformedShape(b, p);
  return first.every(
    (q, i) =>
      Math.abs(q.x - second[i].x) < 1e-9 && Math.abs(q.y - second[i].y) < 1e-9,
  );
}

/**
 * How many genuinely different results the six orders produce at these settings.
 *
 * Counted rather than claimed, because the answer changes: under **uniform** scale, rotation and scale
 * commute, so several of the six collapse together. That collapse is the reason transform-order bugs
 * survive - they are invisible until an artist sets a non-uniform scale.
 */
export function distinctOutcomes(p: Params): number {
  const seen: Order[] = [];
  for (const order of ORDERS) {
    if (!seen.some((other) => ordersAgree(order, other, p))) seen.push(order);
  }
  return seen.length;
}

/** The identity, for a panel that wants to draw "before" using the same code path as "after". */
export const NO_TRANSFORM: Mat3 = identity();
