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

import arcmath from "./arcmath.ts";
import depthprec from "./depthprec.ts";
import screenmath from "./screenmath.ts";
import signeddist from "./signeddist.ts";
import satmath from "./satmath.ts";
import mtv from "./mtv.ts";
import bouncing from "./bouncing.ts";
import impulse from "./impulse.ts";
import accumulator from "./accumulator.ts";
import determinism from "./determinism.ts";

// ---- 2D module. Its demos live in `2d/` and never import Three.js. ----
import resolution2d from "./2d/resolution.ts";
import kinds2d from "./2d/kinds.ts";
import range2d from "./2d/range.ts";
import acos2d from "./2d/acos.ts";
import shoelace2d from "./2d/shoelace.ts";
import atan2d from "./2d/atan.ts";
import homogeneous2d from "./2d/homogeneous.ts";
import localworld2d from "./2d/localworld.ts";
import screentoworld2d from "./2d/screentoworld.ts";
import timestep2d from "./2d/timestep.ts";
import remap2d from "./2d/remap.ts";
import joins2d from "./2d/joins.ts";
import hittest2d from "./2d/hittest.ts";
import param2d from "./2d/param.ts";
import normals2d from "./2d/normals.ts";
import pushout2d from "./2d/pushout.ts";
import airtime2d from "./2d/airtime.ts";
import pieces2d from "./2d/pieces.ts";
import {
  angleCheck2d,
  cameraCheck2d,
  collideCheck2d,
  crossCheck2d,
  curveCheck2d,
  dotCheck2d,
  easeCheck2d,
  lengthCheck2d,
  matrixCheck2d,
  physicsCheck2d,
  platformerCheck2d,
  rotateCheck2d,
  responseCheck2d,
  satCheck2d,
  screenCheck2d,
  segmentCheck2d,
  spaceCheck2d,
  timeCheck2d,
  vectorCheck2d,
} from "./2d/checks2d.ts";
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
  splineCheck,
  projectionCheck,
  screenCheck,
  geometryCheck,
  collisionCheck,
  responseCheck,
  dynamicsCheck,
  integratorCheck,
  capstoneCheck,
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
  spline: {
    title: "A path through the points, with the tangents it picked",
    visual: () => import("./spline.scene.ts"),
    visualFile: "lib/gamedev/demos/spline.scene.ts",
    hint: "Drag a waypoint, or pick one with the buttons and use the x and y sliders.",
    check: splineCheck,
  },
  arclength: {
    title: "Even steps in t against even steps in distance",
    visual: () => import("./arclength.scene.ts"),
    visualFile: "lib/gamedev/demos/arclength.scene.ts",
  },
  projcompare: {
    title: "One corridor, with and without the divide by w",
    visual: () => import("./projcompare.scene.ts"),
    visualFile: "lib/gamedev/demos/projcompare.scene.ts",
  },
  frustum: {
    title: "The frustum as a solid, and what survives culling",
    visual: () => import("./frustum.scene.ts"),
    visualFile: "lib/gamedev/demos/frustum.scene.ts",
    check: projectionCheck,
  },
  picking: {
    title: "A cursor becomes a ray, and the ray finds something",
    visual: () => import("./picking.scene.ts"),
    visualFile: "lib/gamedev/demos/picking.scene.ts",
    check: screenCheck,
  },
  marker: {
    title:
      "World positions turned into pixels, with and without the depth check",
    visual: () => import("./marker.scene.ts"),
    visualFile: "lib/gamedev/demos/marker.scene.ts",
  },
  rayplane: {
    title: "A ray meeting the floor, and the distance running away with itself",
    visual: () => import("./rayplane.scene.ts"),
    visualFile: "lib/gamedev/demos/rayplane.scene.ts",
    check: geometryCheck,
  },
  closest: {
    title: "One point, and the nearest spot on four different shapes",
    visual: () => import("./closest.scene.ts"),
    visualFile: "lib/gamedev/demos/closest.scene.ts",
  },
  overlap: {
    title: "Four pairs of volumes, one number deciding all four",
    visual: () => import("./overlap.scene.ts"),
    visualFile: "lib/gamedev/demos/overlap.scene.ts",
    check: collisionCheck,
  },
  slabs: {
    title: "A box as three overlapping stretches of the ray",
    visual: () => import("./slabs.scene.ts"),
    visualFile: "lib/gamedev/demos/slabs.scene.ts",
  },
  slide: {
    title:
      "One velocity, split into the part a surface blocks and the part that slides",
    visual: () => import("./slide.scene.ts"),
    visualFile: "lib/gamedev/demos/slide.scene.ts",
    check: responseCheck,
  },
  tunnel: {
    title: "A sphere fast enough to skip straight over a wall",
    visual: () => import("./tunnel.scene.ts"),
    visualFile: "lib/gamedev/demos/tunnel.scene.ts",
  },
  jump: {
    title:
      "A jump asked for as a height and a duration, with the gravity that gives it",
    visual: () => import("./jump.scene.ts"),
    visualFile: "lib/gamedev/demos/jump.scene.ts",
    check: dynamicsCheck,
  },
  drag: {
    title: "The same shot through vacuum and through air",
    visual: () => import("./drag.scene.ts"),
    visualFile: "lib/gamedev/demos/drag.scene.ts",
  },
  integrators: {
    title: "One throw stepped three ways, against the answer we already know",
    visual: () => import("./integrators.scene.ts"),
    visualFile: "lib/gamedev/demos/integrators.scene.ts",
    check: integratorCheck,
  },
  stability: {
    title:
      "A spring drawn as position against velocity, where added energy shows",
    visual: () => import("./stability.scene.ts"),
    visualFile: "lib/gamedev/demos/stability.scene.ts",
  },
  capstone: {
    title: "The whole controller, with each piece switchable off",
    visual: () => import("./capstone.scene.ts"),
    visualFile: "lib/gamedev/demos/capstone.scene.ts",
    check: capstoneCheck,
  },
  capstonecam: {
    title: "Three ways to point a camera at the same character",
    visual: () => import("./capstonecam.scene.ts"),
    visualFile: "lib/gamedev/demos/capstonecam.scene.ts",
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
  arcmath: {
    title: "How uneven a uniform-t walk actually is",
    demo: arcmath,
    file: "lib/gamedev/demos/arcmath.ts",
  },
  depthprec: {
    title: "What the near plane costs, and what the far plane does not",
    demo: depthprec,
    file: "lib/gamedev/demos/depthprec.ts",
  },
  screenmath: {
    title: "Pixels, the behind-you trap, and the pole to avoid",
    demo: screenmath,
    file: "lib/gamedev/demos/screenmath.ts",
  },
  signeddist: {
    title: "Walking out of a box, one number reporting both side and distance",
    demo: signeddist,
    file: "lib/gamedev/demos/signeddist.ts",
  },
  satmath: {
    title: "Two boxes that pass six tests and fail the seventh",
    demo: satmath,
    file: "lib/gamedev/demos/satmath.ts",
  },
  mtv: {
    title: "Three ways out of one overlap, and the only usable one",
    demo: mtv,
    file: "lib/gamedev/demos/mtv.ts",
  },
  bouncing: {
    title: "What restitution and friction each take away",
    demo: bouncing,
    file: "lib/gamedev/demos/bouncing.ts",
  },
  impulse: {
    title: "The same push, given all at once or spread over a moment",
    demo: impulse,
    file: "lib/gamedev/demos/impulse.ts",
  },
  accumulator: {
    title: "Which frames get a physics tick, and what is left over",
    demo: accumulator,
    file: "lib/gamedev/demos/accumulator.ts",
  },
  determinism: {
    title: "What a fixed timestep promises, and what it does not",
    demo: determinism,
    file: "lib/gamedev/demos/determinism.ts",
  },

  // ---- 2D module ----------------------------------------------------------------

  "2d-axes": {
    title: "One point, read as world units and as canvas pixels at once",
    visual: () => import("./2d/axes.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/axes.scene.ts",
    check: screenCheck2d,
  },
  "2d-spin": {
    title:
      "The same angle, turning one way in the maths and the other on the canvas",
    visual: () => import("./2d/spin.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/spin.scene.ts",
  },
  "2d-resolution": {
    title: "One world point on three canvases",
    demo: resolution2d,
    file: "lib/gamedev/demos/2d/resolution.ts",
  },
  "2d-arrow": {
    title: "Two places, the arrow between them, and an origin that moves",
    visual: () => import("./2d/arrow.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/arrow.scene.ts",
    hint: "Drag either place, or pick one with the buttons and use the sliders.",
    check: vectorCheck2d,
  },
  "2d-kinds": {
    title:
      "Which combinations mean something, and which only look like they do",
    demo: kinds2d,
    file: "lib/gamedev/demos/2d/kinds.ts",
  },
  "2d-diagonal": {
    title: "Every direction a player can hold, and the two shapes they trace",
    visual: () => import("./2d/diagonal.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/diagonal.scene.ts",
    hint: "Sweep the direction slider and watch the red arrow's length change while the teal one does not.",
    check: lengthCheck2d,
  },
  "2d-range": {
    title:
      "Range checks without the square root, and the two ways to break one",
    demo: range2d,
    file: "lib/gamedev/demos/2d/range.ts",
  },
  "2d-cone": {
    title:
      "A guard's vision cone, and the same test with the normalize removed",
    visual: () => import("./2d/cone.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/cone.scene.ts",
    hint: "Hold the target angle at 60° and sweep the distance with the checkbox off.",
    check: dotCheck2d,
  },
  "2d-project": {
    title:
      "One vector split into the part along a direction and the part across it",
    visual: () => import("./2d/project.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/project.scene.ts",
  },
  "2d-acos": {
    title: "The clamp before acos, and what leaving it out costs",
    demo: acos2d,
    file: "lib/gamedev/demos/2d/acos.ts",
  },
  "2d-side": {
    title:
      "A point crossing a directed line, and the sign that flips as it does",
    visual: () => import("./2d/side.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/side.scene.ts",
    hint: "Sweep the point's y past the line, then tick the last box to read the line the other way.",
    check: crossCheck2d,
  },
  "2d-shoelace": {
    title: "The sign as a winding, the size as an area",
    demo: shoelace2d,
    file: "lib/gamedev/demos/2d/shoelace.ts",
  },
  "2d-aim": {
    title: "A turret aiming at a target, with atan2 and without it",
    visual: () => import("./2d/aim.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/aim.scene.ts",
    hint: "Drag the target or use the sliders, then uncheck atan2 and move it to the left half.",
    check: angleCheck2d,
  },
  "2d-atan": {
    title: "The same four targets, read by atan2 and by plain atan",
    demo: atan2d,
    file: "lib/gamedev/demos/2d/atan.ts",
  },
  "2d-pivot": {
    title: "One sprite, one pivot, and the translate that gets forgotten",
    visual: () => import("./2d/pivot.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/pivot.scene.ts",
    check: rotateCheck2d,
  },
  "2d-turn": {
    title: "A turret turning toward a heading, the short way and the long way",
    visual: () => import("./2d/turn.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/turn.scene.ts",
    hint: "Push the steps slider up and count, then uncheck the wrap and push it again.",
  },
  "2d-affine": {
    title: "One sprite under T·R·S, with the matrix that did it printed live",
    visual: () => import("./2d/affine.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/affine.scene.ts",
    hint: "Drag one slider at a time and watch which cells of the matrix move.",
    check: matrixCheck2d,
  },
  "2d-homogeneous": {
    title: "A place and a displacement through the same matrix",
    demo: homogeneous2d,
    file: "lib/gamedev/demos/2d/homogeneous.ts",
  },
  "2d-orders": {
    title: "T·R·S beside the five other orders",
    visual: () => import("./2d/orders.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/orders.scene.ts",
    hint: "Click through the six orders, then set the two scale factors equal and click through again.",
  },
  "2d-tank": {
    title: "A turret on a tank, with both frames drawn",
    visual: () => import("./2d/tank.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/tank.scene.ts",
    hint: "Drive the tank and watch the turret's own numbers stay put, then stretch the hull.",
    check: spaceCheck2d,
  },
  "2d-localworld": {
    title: "Out to the world, back again, and what shear does on the way",
    demo: localworld2d,
    file: "lib/gamedev/demos/2d/localworld.ts",
  },
  "2d-camera": {
    title: "A pannable, zoomable world in three parallax layers",
    visual: () => import("./2d/camera.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/camera.scene.ts",
    hint: "Move your pointer over the scene to read the world position under it.",
    check: cameraCheck2d,
  },
  "2d-screentoworld": {
    title: "A pixel to a world point and back, and the two ways to change zoom",
    demo: screentoworld2d,
    file: "lib/gamedev/demos/2d/screentoworld.ts",
  },
  "2d-follow": {
    title: "The same follower at 30 fps and at 144 fps, chasing one step",
    visual: () => import("./2d/follow.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/follow.scene.ts",
    hint: "Compare the two curves, then tick the box and compare them again.",
    check: timeCheck2d,
  },
  "2d-timestep": {
    title: "What a second of smoothing leaves behind, at two frame rates",
    demo: timestep2d,
    file: "lib/gamedev/demos/2d/timestep.ts",
  },
  "2d-gallery": {
    title: "Six easings at one instant, with the speed profile marked",
    visual: () => import("./2d/gallery.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/gallery.scene.ts",
    hint: "Sweep t and watch which sprite is ahead, then compare the spacing of the faint marks.",
    check: easeCheck2d,
  },
  "2d-remap": {
    title: "The four functions that remove the arithmetic, and the one gotcha",
    demo: remap2d,
    file: "lib/gamedev/demos/2d/remap.ts",
  },
  "2d-path": {
    title: "A Bezier with draggable handles, built by repeated lerping",
    visual: () => import("./2d/path.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/path.scene.ts",
    hint: "Drag the points, or pick a preset, then sweep t with the construction lines showing.",
    check: curveCheck2d,
  },
  "2d-travel": {
    title: "The same curve travelled by t, and travelled by distance",
    visual: () => import("./2d/travel.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/travel.scene.ts",
    hint: "Watch where the blue marks bunch up, then tick the box and watch them even out.",
  },
  "2d-joins": {
    title: "Two curves sharing an endpoint, and still cornering",
    demo: joins2d,
    file: "lib/gamedev/demos/2d/joins.ts",
  },
  "2d-shapes": {
    title: "Three pairings of circles and boxes, one test at a time",
    visual: () => import("./2d/shapes.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/shapes.scene.ts",
    hint: "Pick a pairing, drag the shape into the other one, then tick the box and head for a corner.",
    check: collideCheck2d,
  },
  "2d-corners": {
    title: "Where a circle's centre can be and still touch a box",
    visual: () => import("./2d/corners.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/corners.scene.ts",
    hint: "Grow the radius and watch the gap between the two outlines open up at the corners.",
  },
  "2d-hittest": {
    title: "The clamp, and the two popular ways to get these tests wrong",
    demo: hittest2d,
    file: "lib/gamedev/demos/2d/hittest.ts",
  },
  "2d-nearest": {
    title: "The nearest point on a wall, with the clamp and without it",
    visual: () => import("./2d/nearest.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/nearest.scene.ts",
    hint: "Drag into the shaded regions past either end, where the two answers come apart.",
    check: segmentCheck2d,
  },
  "2d-sight": {
    title: "A guard's line of sight, and the same walls read as infinite lines",
    visual: () => import("./2d/sight.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/sight.scene.ts",
    hint: "Watch the fan of spokes around the guard, then tick the box and watch a third of it turn red.",
  },
  "2d-param": {
    title: "One equation, three domains, and the divisions that need a guard",
    demo: param2d,
    file: "lib/gamedev/demos/2d/param.ts",
  },
  "2d-separate": {
    title: "Two polygons, every candidate axis, and the one that settles it",
    visual: () => import("./2d/separate.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/separate.scene.ts",
    hint: "Drag and turn the triangle, then tick the box to see all eight axes at once.",
    check: satCheck2d,
  },
  "2d-concave": {
    title:
      "The same test on a concave shape, reporting hits that are not there",
    visual: () => import("./2d/concave.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/concave.scene.ts",
    hint: "The square starts in the notch, touching nothing, and the test says otherwise.",
  },
  "2d-normals": {
    title: "Where the axes come from, and why they are normalized",
    demo: normals2d,
    file: "lib/gamedev/demos/2d/normals.ts",
  },
  "2d-deflect": {
    title:
      "A velocity split against a wall, sliding at one end and bouncing at the other",
    visual: () => import("./2d/deflect.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/deflect.scene.ts",
    hint: "Sweep the velocity past the wall's angle to see the guard, then raise restitution.",
    check: responseCheck2d,
  },
  "2d-substep": {
    title: "A thin wall, a fast mover, and the frame that steps over it",
    visual: () => import("./2d/substep.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/substep.scene.ts",
    hint: "Past the escape speed, slide the start offset and watch the hit appear and disappear.",
  },
  "2d-pushout": {
    title: "The position fix, the guard, and what a corner costs",
    demo: pushout2d,
    file: "lib/gamedev/demos/2d/pushout.ts",
  },
  "2d-leap": {
    title:
      "A jump asked for by height and time, and the arc a loop actually produces",
    visual: () => import("./2d/leap.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/leap.scene.ts",
    hint: "Drop the frame rate to see the gap open up, then switch to the midpoint step.",
    check: physicsCheck2d,
  },
  "2d-stepper": {
    title:
      "Three ways to step one throw, and the exact parabola between two of them",
    visual: () => import("./2d/stepper.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/stepper.scene.ts",
    hint: "The crosses are the average of the orange and blue traces; they sit on the grey curve.",
  },
  "2d-airtime": {
    title: "A jump you can describe, turned into the numbers a loop needs",
    demo: airtime2d,
    file: "lib/gamedev/demos/2d/airtime.ts",
  },
  "2d-platformer": {
    title: "One scripted run, with the two forgiving windows on switches",
    visual: () => import("./2d/platformer.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/platformer.scene.ts",
    hint: "Scrub to about 0.95 s and watch the ledge, then switch coyote time off and scrub the same moment again.",
    check: platformerCheck2d,
  },
  "2d-peraxis": {
    title:
      "The same charge at the same step, resolved one axis at a time and both at once",
    visual: () => import("./2d/peraxis.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/peraxis.scene.ts",
    hint: "Below 45 units per second both land in the same place, so only the ticks move - each one is a 60 fps frame. At 45 the red one leaves the level.",
  },
  "2d-jitter": {
    title:
      "Where the character appears to sit, under each of the four things you could round",
    visual: () => import("./2d/jitter.scene.ts"),
    visualFile: "lib/gamedev/demos/2d/jitter.scene.ts",
    hint: "Land the slider on 1.875, 3.75 or 5.625 and every row goes still - those are whole-pixel advances.",
  },
  "2d-pieces": {
    title:
      "The six constants this character is made of, and where each came from",
    demo: pieces2d,
    file: "lib/gamedev/demos/2d/pieces.ts",
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
