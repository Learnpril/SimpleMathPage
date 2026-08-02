/**
 * A cube driven by a 4x4 matrix, with the sixteen numbers shown as they change.
 */
import * as THREE from "three";
import {
  applyMat4,
  multiplyMat4,
  rotationY4,
  scale4,
  translation4,
  rowsOf,
  point,
  type Mat4,
} from "../matrices.ts";
import { makeCanvas, addSlider, addReadout, addMatrixGrid } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const CORNERS = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
];
const EDGES = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(5.5, 4.5, 7.5);
  camera.lookAt(0, 0, 0);

  // Where the cube started, dashed.
  const ghostPts: THREE.Vector3[] = [];
  for (const [a, b] of EDGES) {
    ghostPts.push(
      new THREE.Vector3(...(CORNERS[a] as [number, number, number])),
      new THREE.Vector3(...(CORNERS[b] as [number, number, number])),
    );
  }
  const ghost = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(ghostPts),
    new THREE.LineDashedMaterial({
      color: 0x7d8590,
      dashSize: 0.12,
      gapSize: 0.1,
    }),
  );
  ghost.computeLineDistances();
  scene.add(ghost);

  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(EDGES.length * 6), 3),
  );
  scene.add(
    new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({ color: 0x39d3c3 }),
    ),
  );

  // The origin's destination - which is exactly what the fourth column holds.
  const originDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(originDot);

  const show = addReadout(el);
  const tx = addSlider(el, "translate x", -3, 3, 1.5, draw, "", 0.5);
  const ty = addSlider(el, "translate y", -3, 3, 0.5, draw, "", 0.5);
  const spin = addSlider(el, "rotate about y", 0, 360, 30, draw);
  const size = addSlider(el, "scale", 0.5, 2, 1, draw, "\u00D7", 0.1);

  /* The translation column is the interesting one, so it gets its own colour. The bottom
     row never changes for these transforms, and saying so is worth a dimmer shade. */
  const setGrid = addMatrixGrid(el, 4, (row, col) =>
    row === 3 ? "fixed" : col === 3 ? "translate" : "basis",
  );

  function draw() {
    // Scale first, then rotate, then translate. Section 2.3 is about why that order.
    const m: Mat4 = multiplyMat4(
      translation4(tx(), ty(), 0),
      multiplyMat4(rotationY4(spin()), scale4(size(), size(), size())),
    );

    const moved = CORNERS.map((c) => applyMat4(m, point(c[0], c[1], c[2])));
    const pts: THREE.Vector3[] = [];
    for (const [a, b] of EDGES) {
      pts.push(
        new THREE.Vector3(moved[a].x, moved[a].y, moved[a].z),
        new THREE.Vector3(moved[b].x, moved[b].y, moved[b].z),
      );
    }
    geom.setFromPoints(pts);

    originDot.position.set(m.t.x, m.t.y, m.t.z);
    setGrid(rowsOf(m));

    show(
      `the orange dot is where the origin landed: ` +
        `(${m.t.x.toFixed(1)}, ${m.t.y.toFixed(1)}, ${m.t.z.toFixed(1)})`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
