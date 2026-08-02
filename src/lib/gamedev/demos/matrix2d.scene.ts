/**
 * A 2x2 matrix as a machine that moves the plane, with its two columns as the controls.
 */
import * as THREE from "three";
import { applyMat2, determinant2, type Mat2 } from "../matrices.ts";
import {
  makeCanvas,
  addSlider,
  addCheckbox,
  addReadout,
  addButtonRow,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const U = 46; // screen pixels per 1 unit of the grid

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.OrthographicCamera(
    -width / 2,
    width / 2,
    height / 2,
    -height / 2,
    0.1,
    100,
  );
  camera.position.z = 10;

  const line = (pts: THREE.Vector3[], colour: number, opacity = 1) =>
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({
        color: colour,
        transparent: opacity < 1,
        opacity,
      }),
    );

  const gridPts: THREE.Vector3[] = [];
  for (let n = -8; n <= 8; n++) {
    gridPts.push(
      new THREE.Vector3(n * U, -height / 2, 0),
      new THREE.Vector3(n * U, height / 2, 0),
      new THREE.Vector3(-width / 2, n * U, 0),
      new THREE.Vector3(width / 2, n * U, 0),
    );
  }
  scene.add(line(gridPts, 0x21262d));

  scene.add(
    line(
      [
        new THREE.Vector3(-width / 2, 0, 0),
        new THREE.Vector3(width / 2, 0, 0),
        new THREE.Vector3(0, -height / 2, 0),
        new THREE.Vector3(0, height / 2, 0),
      ],
      0x484f58,
    ),
  );

  // Where the unit square started, so you have something to compare against.
  const before = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(U, 0, 1),
      new THREE.Vector3(U, U, 1),
      new THREE.Vector3(0, U, 1),
      new THREE.Vector3(0, 0, 1),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x7d8590,
      dashSize: 6,
      gapSize: 5,
    }),
  );
  before.computeLineDistances();
  scene.add(before);

  // The square after the matrix has moved it.
  const fillGeom = new THREE.BufferGeometry();
  fillGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(18), 3),
  );
  const fillMat = new THREE.MeshBasicMaterial({
    color: 0x39d3c3,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  scene.add(new THREE.Mesh(fillGeom, fillMat));

  const edgeGeom = new THREE.BufferGeometry();
  edgeGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(15), 3),
  );
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x39d3c3 });
  scene.add(new THREE.Line(edgeGeom, edgeMat));

  // The two columns, as arrows. These are the whole point of the scene.
  const arrow = (colour: number) => {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 2),
      U,
      colour,
      12,
      8,
    );
    scene.add(a);
    return a;
  };
  const iArrow = arrow(0xff7b72);
  const jArrow = arrow(0x7ee787);

  const show = addReadout(el);

  const ix = addSlider(el, "x axis \u2192 x", -3, 3, 1, draw, "", 0.1);
  const iy = addSlider(el, "x axis \u2192 y", -3, 3, 0, draw, "", 0.1);
  const jx = addSlider(el, "y axis \u2192 x", -3, 3, 0, draw, "", 0.1);
  const jy = addSlider(el, "y axis \u2192 y", -3, 3, 1, draw, "", 0.1);
  const showBefore = addCheckbox(el, "show the original square", true, draw);

  const set = (a: number, b: number, c: number, d: number) => {
    ix.set(a);
    iy.set(b);
    jx.set(c);
    jy.set(d);
    draw();
  };

  addButtonRow(el, [
    { label: "Identity", apply: () => set(1, 0, 0, 1) },
    { label: "Scale 2\u00D7", apply: () => set(2, 0, 0, 2) },
    { label: "Rotate", apply: () => set(0.7, 0.7, -0.7, 0.7) },
    { label: "Shear", apply: () => set(1, 0, 1, 1) },
    { label: "Mirror", apply: () => set(-1, 0, 0, 1) },
    { label: "Collapse", apply: () => set(1, 0.5, 2, 1) },
  ]);

  function draw() {
    const m: Mat2 = { i: { x: ix(), y: iy() }, j: { x: jx(), y: jy() } };

    // The unit square's corners, each pushed through the matrix.
    const pts = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ]
      .map((c) => applyMat2(m, c))
      .map((c) => new THREE.Vector3(c.x * U, c.y * U, 1.5));

    fillGeom.setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    edgeGeom.setFromPoints([pts[0], pts[1], pts[2], pts[3], pts[0]]);

    const det = determinant2(m);
    const collapsed = Math.abs(det) < 1e-6;
    const flipped = det < 0;

    // Purple when the plane has been turned over, which the determinant's sign reports.
    const colour = flipped ? 0xd2a8ff : 0x39d3c3;
    fillMat.color.setHex(colour);
    edgeMat.color.setHex(colour);
    fillMat.opacity = collapsed ? 0 : 0.3;
    before.visible = showBefore();

    const place = (a: THREE.ArrowHelper, v: { x: number; y: number }) => {
      const len = Math.hypot(v.x, v.y);
      a.visible = len > 1e-6;
      if (a.visible) {
        a.setDirection(new THREE.Vector3(v.x, v.y, 0).normalize());
        a.setLength(len * U, 12, 8);
      }
    };
    place(iArrow, m.i);
    place(jArrow, m.j);

    const f = (n: number) => n.toFixed(1);
    show(
      `x axis \u2192 (${f(m.i.x)}, ${f(m.i.y)})    ` +
        `y axis \u2192 (${f(m.j.x)}, ${f(m.j.y)})    ` +
        `determinant ${det.toFixed(2)}  ` +
        (collapsed
          ? "\u2190 flattened to a line"
          : flipped
            ? `\u2190 mirrored, area \u00D7 ${Math.abs(det).toFixed(2)}`
            : `\u2190 area \u00D7 ${det.toFixed(2)}`),
    );

    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
