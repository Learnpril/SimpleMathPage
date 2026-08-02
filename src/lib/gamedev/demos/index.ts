/**
 * The demo registry. `DemoPanel` takes a name and looks it up here.
 *
 * A registry rather than a prop holding the function, because the panel needs the entry in
 * two places - Astro's frontmatter at build time and the browser when a scene mounts - and
 * a function cannot be serialised across that boundary. A name can.
 *
 * Two shapes of entry:
 *
 * - **visual** - a scene plus the source that draws it. No numbers are shown; the picture
 *   is the explanation. A `check` verifies the arithmetic behind it during the build.
 * - **values** - a `demo` plus its source. Keep these short; a long table is a wall.
 */
import type { DemoEntry } from "./runner.ts";

import wrapping from "./wrapping.ts";
import lerpAngles from "./lerp-angles.ts";
import nanGuard from "./nan-guard.ts";
import squaredDistance from "./squared-distance.ts";
import acosClamp from "./acos-clamp.ts";

import {
  basisCheck,
  windingCheck,
  coneCheck,
  turretCheck,
  diagonalCheck,
  lookatCheck,
  displacementCheck,
  matrixCheck,
  homogeneousCheck,
} from "./checks.ts";

export const DEMOS: Record<string, DemoEntry> = {
  // ---- Scenes -------------------------------------------------------------------
  "axes-intro": {
    title: "Three axes, and where a number puts you",
    visual: () => import("./axes-intro.scene.ts"),
    visualFile: "lib/gamedev/demos/axes-intro.scene.ts",
  },
  displacement: {
    title: "Subtracting one place from another",
    visual: () => import("./displacement.scene.ts"),
    visualFile: "lib/gamedev/demos/displacement.scene.ts",
    check: displacementCheck,
  },
  matrix2d: {
    title: "A matrix, and the two places its columns send the axes",
    visual: () => import("./matrix2d.scene.ts"),
    visualFile: "lib/gamedev/demos/matrix2d.scene.ts",
    check: matrixCheck,
  },
  matrix3d: {
    title: "The same machine in three dimensions",
    visual: () => import("./matrix3d.scene.ts"),
    visualFile: "lib/gamedev/demos/matrix3d.scene.ts",
  },
  wcomponent: {
    title: "One value, sent through the same matrix twice",
    visual: () => import("./wcomponent.scene.ts"),
    visualFile: "lib/gamedev/demos/wcomponent.scene.ts",
    check: homogeneousCheck,
  },
  matrix4: {
    title: "A 4x4 matrix, and the sixteen numbers behind it",
    visual: () => import("./matrix4.scene.ts"),
    visualFile: "lib/gamedev/demos/matrix4.scene.ts",
  },
  basis: {
    title: "An object's own axes, and where forward points",
    visual: () => import("./basis.scene.ts"),
    visualFile: "lib/gamedev/demos/basis.scene.ts",
    check: basisCheck,
  },
  diagonal: {
    title: "Every direction you can move, and how fast you go in each",
    visual: () => import("./diagonal.scene.ts"),
    visualFile: "lib/gamedev/demos/diagonal.scene.ts",
    check: diagonalCheck,
  },
  cone: {
    title: "A vision cone, driven by one dot product",
    visual: () => import("./cone.scene.ts"),
    visualFile: "lib/gamedev/demos/cone.scene.ts",
    check: coneCheck,
  },
  winding: {
    title: "One triangle, two normals, decided by corner order",
    visual: () => import("./winding.scene.ts"),
    visualFile: "lib/gamedev/demos/winding.scene.ts",
    check: windingCheck,
  },
  lookat: {
    title: "A camera that turns to face whatever you point it at",
    visual: () => import("./lookat.scene.ts"),
    visualFile: "lib/gamedev/demos/lookat.scene.ts",
    check: lookatCheck,
  },
  turret: {
    title: "A turret that turns the short way",
    visual: () => import("./turret.scene.ts"),
    visualFile: "lib/gamedev/demos/turret.scene.ts",
    hint: "Move your pointer over the scene.",
    check: turretCheck,
  },

  // ---- Values -------------------------------------------------------------------

  "nan-guard": {
    title: "A NaN walks past the check meant to stop it",
    demo: nanGuard,
    file: "lib/gamedev/demos/nan-guard.ts",
  },
  "squared-distance": {
    title: "Range checks without the square root",
    demo: squaredDistance,
    file: "lib/gamedev/demos/squared-distance.ts",
  },
  "acos-clamp": {
    title: "Why angleBetween clamps before calling acos",
    demo: acosClamp,
    file: "lib/gamedev/demos/acos-clamp.ts",
  },
  wrapping: {
    title: "Raw versus wrapped angle differences",
    demo: wrapping,
    file: "lib/gamedev/demos/wrapping.ts",
  },
  "lerp-angles": {
    title: "Interpolating an angle the long way and the short way",
    demo: lerpAngles,
    file: "lib/gamedev/demos/lerp-angles.ts",
  },
};
