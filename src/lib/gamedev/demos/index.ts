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

import dtmath from "./dtmath.ts";
import eulerorders from "./eulerorders.ts";
import jumparc from "./jumparc.ts";
import remapping from "./remapping.ts";
import pipeline from "./pipeline.ts";
import precision from "./precision.ts";
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
  trsCheck,
  spacesCheck,
  normalsCheck,
  gimbalCheck,
  quatCheck,
  slerpCheck,
  dtCheck,
  easingCheck,
  bezierCheck,
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
  spinorbit: {
    title: "One turn and one move, in both orders",
    visual: () => import("./spinorbit.scene.ts"),
    visualFile: "lib/gamedev/demos/spinorbit.scene.ts",
  },
  trsorder: {
    title: "The same box under all six orderings",
    visual: () => import("./trsorder.scene.ts"),
    visualFile: "lib/gamedev/demos/trsorder.scene.ts",
    check: trsCheck,
  },
  parenting: {
    title: "A child that moves because its parent did",
    visual: () => import("./parenting.scene.ts"),
    visualFile: "lib/gamedev/demos/parenting.scene.ts",
    check: spacesCheck,
  },
  normals: {
    title: "A squashed sphere, with its normals drawn twice",
    visual: () => import("./normals.scene.ts"),
    visualFile: "lib/gamedev/demos/normals.scene.ts",
    check: normalsCheck,
  },
  gimbal: {
    title: "Three nested rings, and the moment two of them agree",
    visual: () => import("./gimbal.scene.ts"),
    visualFile: "lib/gamedev/demos/gimbal.scene.ts",
    check: gimbalCheck,
  },
  quatspin: {
    title: "One axis, one angle, and the four numbers that hold them",
    visual: () => import("./quatspin.scene.ts"),
    visualFile: "lib/gamedev/demos/quatspin.scene.ts",
    check: quatCheck,
  },
  doublecover: {
    title: "The long way round, and the sign flip that prevents it",
    visual: () => import("./doublecover.scene.ts"),
    visualFile: "lib/gamedev/demos/doublecover.scene.ts",
  },
  slerpspeed: {
    title: "One arc, two rates",
    visual: () => import("./slerpspeed.scene.ts"),
    visualFile: "lib/gamedev/demos/slerpspeed.scene.ts",
    check: slerpCheck,
  },
  lerpdrift: {
    title: "What forgetting to renormalize costs",
    visual: () => import("./lerpdrift.scene.ts"),
    visualFile: "lib/gamedev/demos/lerpdrift.scene.ts",
  },
  framerate: {
    title: "The same chase at two frame rates, done twice",
    visual: () => import("./framerate.scene.ts"),
    visualFile: "lib/gamedev/demos/framerate.scene.ts",
    check: dtCheck,
  },
  easing: {
    title: "The whole gallery, and the movement each curve produces",
    visual: () => import("./easing.scene.ts"),
    visualFile: "lib/gamedev/demos/easing.scene.ts",
    check: easingCheck,
  },
  spring: {
    title: "Decay leaves at full speed, a spring has to get going",
    visual: () => import("./spring.scene.ts"),
    visualFile: "lib/gamedev/demos/spring.scene.ts",
  },
  bezier: {
    title: "A cubic Bezier, and the repeated lerps that build it",
    visual: () => import("./bezier.scene.ts"),
    visualFile: "lib/gamedev/demos/bezier.scene.ts",
    hint: "Drag a control point, or pick one with the buttons and use the x and y sliders.",
    check: bezierCheck,
  },
  bezierjoin: {
    title: "One seam, three grades of smooth",
    visual: () => import("./bezierjoin.scene.ts"),
    visualFile: "lib/gamedev/demos/bezierjoin.scene.ts",
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

  pipeline: {
    title: "One point, written out in each space it passes through",
    demo: pipeline,
    file: "lib/gamedev/demos/pipeline.ts",
  },
  eulerorders: {
    title: "One set of three angles, read six different ways",
    demo: eulerorders,
    file: "lib/gamedev/demos/eulerorders.ts",
  },
  precision: {
    title: "What each conversion costs, and where the loss lands",
    demo: precision,
    file: "lib/gamedev/demos/precision.ts",
  },
  dtmath: {
    title: "Settling time against frame rate, both ways",
    demo: dtmath,
    file: "lib/gamedev/demos/dtmath.ts",
  },
  remapping: {
    title: "Turning a quantity into a fraction, and back into another quantity",
    demo: remapping,
    file: "lib/gamedev/demos/remapping.ts",
  },
  jumparc: {
    title: "A jump arc, and why its control point sits twice as high",
    demo: jumparc,
    file: "lib/gamedev/demos/jumparc.ts",
  },
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
