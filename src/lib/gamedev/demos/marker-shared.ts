/**
 * Health bars: world positions turned into pixel positions, and the check people forget.
 *
 * The camera sits at the origin and only yaws, so a world point becomes a view point by
 * rotating it the opposite way. That keeps the arithmetic small enough to see, while still
 * putting objects behind the camera as it turns - which is the case that matters.
 */
import { applyMat4, point, rotationY4 } from "../matrices.ts";
import type { Vec3 } from "../matrices.ts";
import { perspective, projectToScreen } from "../projection.ts";

export const SCREEN_W = 480;
export const SCREEN_H = 270;
export const ASPECT = SCREEN_W / SCREEN_H;
export const FOV = 55;

export const OBJECTS: ReadonlyArray<{ name: string; at: Vec3 }> = [
  { name: "A", at: { x: 0, y: 0.4, z: -9 } },
  { name: "B", at: { x: 6, y: 0.9, z: -5 } },
  { name: "C", at: { x: -7, y: -0.5, z: -4 } },
  { name: "D", at: { x: 2, y: 1.2, z: 7 } },
  { name: "E", at: { x: -3, y: 0.2, z: 9 } },
];

const PROJ = perspective(FOV, ASPECT, 0.5, 60);

/** Where each object would be drawn, and whether it is actually in front of the camera. */
export function markers(yawDegrees: number) {
  // Turning the camera left is the same as turning the world right. Section 2.4's inverse.
  const toView = rotationY4(-yawDegrees);
  return OBJECTS.map((o) => {
    const v = applyMat4(toView, point(o.at.x, o.at.y, o.at.z));
    const s = projectToScreen(
      PROJ,
      { x: v.x, y: v.y, z: v.z },
      SCREEN_W,
      SCREEN_H,
    );
    return { name: o.name, ...s };
  });
}

/** How many markers a correct implementation draws, against how many a careless one draws. */
export function markerCounts(yawDegrees: number): {
  correct: number;
  careless: number;
} {
  const all = markers(yawDegrees);
  const onScreenIgnoringDepth = all.filter(
    (m) => m.x >= 0 && m.x <= SCREEN_W && m.y >= 0 && m.y <= SCREEN_H,
  ).length;
  return {
    correct: all.filter((m) => m.onScreen).length,
    careless: onScreenIgnoringDepth,
  };
}
