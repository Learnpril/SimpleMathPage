/**
 * One rotation and one translation, applied in both orders, side by side.
 */
import * as THREE from "three";
import {
  applyMat4,
  multiplyMat4,
  point,
  rotationY4,
  translation4,
  type Mat4,
} from "../matrices.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addBoxWire,
  type Place,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

/** Send the unit box's corners through a matrix. */
const via =
  (m: Mat4): Place =>
  (c) => {
    const p = applyMat4(m, point(c[0], c[1], c[2]));
    return [p.x, p.y, p.z];
  };

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0.5, 7.5, 8.5);
  camera.lookAt(0, 0, 0);

  const spinBox = addBoxWire(scene, 0x39d3c3);
  const orbitBox = addBoxWire(scene, 0xf0883e);

  // The origin, and the circle the orbiting box turns out to be stuck on.
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x7d8590 }),
    ),
  );
  const ring = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x545d68 }),
  );
  scene.add(ring);

  const show = addReadout(el);
  const spin = addSlider(el, "turn about y", 0, 360, 50, draw);
  const dist = addSlider(el, "move out along x", 0, 4, 2.5, draw, "", 0.1);

  function draw() {
    const R = rotationY4(spin());
    const T = translation4(dist(), 0, 0);

    // Turn first, then move. The box spins where it stands.
    const turnThenMove = multiplyMat4(T, R);
    // Move first, then turn. The turn now swings the whole offset around the origin.
    const moveThenTurn = multiplyMat4(R, T);

    spinBox(via(turnThenMove));
    orbitBox(via(moveThenTurn));

    const pts: THREE.Vector3[] = [];
    for (let d = 0; d <= 72; d += 1) {
      const a = (d / 72) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(Math.cos(a) * dist(), 0, Math.sin(a) * dist()),
      );
    }
    ring.geometry.setFromPoints(pts);

    const a = applyMat4(turnThenMove, point(0, 0, 0));
    const b = applyMat4(moveThenTurn, point(0, 0, 0));
    show(
      `teal sits at (${a.x.toFixed(1)}, ${a.z.toFixed(1)})  ·  ` +
        `orange sits at (${b.x.toFixed(1)}, ${b.z.toFixed(1)})`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
