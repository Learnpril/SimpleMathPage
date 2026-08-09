/**
 * One corridor, projected by our own matrices, with and without the divide by w.
 */
import * as THREE from "three";
import { extentAt, ndcOf, orthographic, perspective } from "../projection.ts";
import type { Mat4, Vec3 } from "../matrices.ts";
import { makeCanvas, addSlider, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const ASPECT = 16 / 9;
const NEAR = 0.5;
const FAR = 40;
/** Both projections frame the same amount of world here, so only the divide differs. */
const MATCH_AT = 4;

const GATE_ZS = [3, 4.5, 6.5, 9.5, 14, 20, 28];
const HALF_WIDTH = 2.2;
const FLOOR_Y = -1;
const GATE_TOP = 0.8;
const LANES = [-2.2, -1.1, 0, 1.1, 2.2];

const FLOOR = 0x565f6a;
const GATE = 0x39d3c3;
const FRAME = 0x6e7681;

type Seg = [Vec3, Vec3];

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const halfH = 1.12;
  const halfW = (halfH * width) / height;
  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH,
    -halfH,
    0.1,
    10,
  );
  camera.position.z = 5;

  const addSegments = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.LineSegments(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.06, gapSize: 0.05 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (segs: Seg[], proj: Mat4) => {
      const pts: THREE.Vector3[] = [];
      for (const [a, b] of segs) {
        const na = ndcOf(proj, a);
        const nb = ndcOf(proj, b);
        // Projection maps straight lines to straight lines, so two endpoints are enough.
        if (na === null || nb === null) continue;
        pts.push(
          new THREE.Vector3(na.x, na.y, 0),
          new THREE.Vector3(nb.x, nb.y, 0),
        );
      }
      geom.setFromPoints(pts);
      if (dashed) mesh.computeLineDistances();
    };
  };

  // The NDC box: anything outside this is off screen.
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1, -1, 0),
        new THREE.Vector3(1, -1, 0),
        new THREE.Vector3(1, 1, 0),
        new THREE.Vector3(-1, 1, 0),
        new THREE.Vector3(-1, -1, 0),
      ]),
      new THREE.LineBasicMaterial({ color: FRAME }),
    ),
  );
  // Eye level. The floor lines run at it under perspective and never reach it otherwise.
  const horizon = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(1, 0, 0),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x484f58,
      dashSize: 0.05,
      gapSize: 0.04,
    }),
  );
  horizon.computeLineDistances();
  scene.add(horizon);

  const floorLines = addSegments(FLOOR);
  const gateLines = addSegments(GATE);

  const show = addReadout(el);
  const fov = addSlider(el, "vertical field of view", 42, 95, 55, draw);
  const ortho = addCheckbox(el, "orthographic, so no divide by w", false, draw);

  const nearZ = GATE_ZS[0];
  const farZ = GATE_ZS[GATE_ZS.length - 1];

  function draw() {
    const proj = ortho()
      ? orthographic(
          extentAt(fov(), ASPECT, MATCH_AT).halfHeight,
          ASPECT,
          NEAR,
          FAR,
        )
      : perspective(fov(), ASPECT, NEAR, FAR);

    // A floor grid: lanes running away, plus a rung at each gate.
    const floor: Seg[] = [];
    for (const x of LANES) {
      floor.push([
        { x, y: FLOOR_Y, z: -nearZ },
        { x, y: FLOOR_Y, z: -farZ },
      ]);
    }
    for (const z of GATE_ZS) {
      floor.push([
        { x: -HALF_WIDTH, y: FLOOR_Y, z: -z },
        { x: HALF_WIDTH, y: FLOOR_Y, z: -z },
      ]);
    }
    floorLines(floor, proj);

    // Gates: two uprights and a top bar at each depth.
    const gates: Seg[] = [];
    for (const z of GATE_ZS) {
      for (const side of [-1, 1]) {
        gates.push([
          { x: side * HALF_WIDTH, y: FLOOR_Y, z: -z },
          { x: side * HALF_WIDTH, y: GATE_TOP, z: -z },
        ]);
      }
      gates.push([
        { x: -HALF_WIDTH, y: GATE_TOP, z: -z },
        { x: HALF_WIDTH, y: GATE_TOP, z: -z },
      ]);
    }
    gateLines(gates, proj);

    const nearGate = ndcOf(proj, { x: HALF_WIDTH, y: FLOOR_Y, z: -nearZ })!;
    const farGate = ndcOf(proj, { x: HALF_WIDTH, y: FLOOR_Y, z: -farZ })!;
    const shrink = (farGate.x / nearGate.x) * 100;
    show(
      `${ortho() ? "orthographic" : "perspective"}  \u00B7  the gate at ${farZ} m is ` +
        `${shrink.toFixed(0)}% as wide as the one at ${nearZ} m`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
