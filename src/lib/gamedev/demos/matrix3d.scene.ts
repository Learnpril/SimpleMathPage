/**
 * The same idea with one more axis: a unit cube, three columns, and volume as the determinant.
 */
import * as THREE from "three";
import { applyMat3, determinant3, type Mat3 } from "../matrices.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(4.6, 3.6, 6);
  camera.lookAt(0.5, 0.5, 0.5);

  scene.add(new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  // The eight corners of the unit cube, and the twelve edges joining them.
  const CORNERS = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 1, y: 0, z: 1 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
    { x: 1, y: 1, z: 1 },
    { x: 0, y: 1, z: 1 },
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

  const edgeGeom = new THREE.BufferGeometry();
  edgeGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(EDGES.length * 6), 3),
  );
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x39d3c3 });
  scene.add(new THREE.LineSegments(edgeGeom, edgeMat));

  const arrow = (colour: number) => {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      colour,
      0.16,
      0.09,
    );
    scene.add(a);
    return a;
  };
  const iArrow = arrow(0xff7b72);
  const jArrow = arrow(0x7ee787);
  const kArrow = arrow(0x58a6ff);

  const show = addReadout(el);

  // Three scales plus one shear entry: enough to reach every interesting case without
  // putting nine sliders on the page.
  const sx = addSlider(el, "x axis length", -2, 2, 1, draw, "", 0.1);
  const sy = addSlider(el, "y axis length", -2, 2, 1, draw, "", 0.1);
  const sz = addSlider(el, "z axis length", -2, 2, 1, draw, "", 0.1);
  const sh = addSlider(el, "lean the y axis", -2, 2, 0, draw, "", 0.1);

  const set = (a: number, b: number, c: number, d: number) => {
    sx.set(a);
    sy.set(b);
    sz.set(c);
    sh.set(d);
    draw();
  };

  addButtonRow(el, [
    { label: "Identity", apply: () => set(1, 1, 1, 0) },
    { label: "Double", apply: () => set(2, 2, 2, 0) },
    { label: "Squash", apply: () => set(1, 0.3, 1, 0) },
    { label: "Lean", apply: () => set(1, 1, 1, 1) },
    { label: "Mirror", apply: () => set(-1, 1, 1, 0) },
    { label: "Flatten", apply: () => set(1, 0, 1, 0) },
  ]);

  function draw() {
    const m: Mat3 = {
      i: { x: sx(), y: 0, z: 0 },
      j: { x: sh(), y: sy(), z: 0 },
      k: { x: 0, y: 0, z: sz() },
    };

    const moved = CORNERS.map((c) => applyMat3(m, c));
    const pts: THREE.Vector3[] = [];
    for (const [a, b] of EDGES) {
      pts.push(
        new THREE.Vector3(moved[a].x, moved[a].y, moved[a].z),
        new THREE.Vector3(moved[b].x, moved[b].y, moved[b].z),
      );
    }
    edgeGeom.setFromPoints(pts);

    const det = determinant3(m);
    const flat = Math.abs(det) < 1e-6;
    const flipped = det < 0;
    edgeMat.color.setHex(flipped ? 0xd2a8ff : 0x39d3c3);

    const place = (
      a: THREE.ArrowHelper,
      v: { x: number; y: number; z: number },
    ) => {
      const len = Math.hypot(v.x, v.y, v.z);
      a.visible = len > 1e-6;
      if (a.visible) {
        a.setDirection(new THREE.Vector3(v.x, v.y, v.z).normalize());
        a.setLength(len, 0.16, 0.09);
      }
    };
    place(iArrow, m.i);
    place(jArrow, m.j);
    place(kArrow, m.k);

    show(
      `determinant ${det.toFixed(2)}  ` +
        (flat
          ? "\u2190 the cube flattened, all volume gone"
          : flipped
            ? `\u2190 turned inside out, volume \u00D7 ${Math.abs(det).toFixed(2)}`
            : `\u2190 volume \u00D7 ${det.toFixed(2)}`),
    );

    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
