/**
 * A child attached to a parent, and the same child with its parent ignored.
 */
import * as THREE from "three";
import {
  applyMat4,
  multiplyMat4,
  point,
  rotationY4,
  scale4,
  translation4,
  type Mat4,
} from "../matrices.ts";
import { toWorld } from "../spaces.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addBoxWire,
  type Place,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

/** Where the child sits in its parent's space. This never changes, whatever the parent does. */
const CHILD_OFFSET = { x: 0, y: 0.6, z: 1.3 };

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
  camera.position.set(4.5, 4.5, 6.5);
  camera.lookAt(0, 0.5, 0);

  const parentBox = addBoxWire(scene, 0x58a6ff);
  const childBox = addBoxWire(scene, 0x39d3c3);
  // The same child placed as if its local transform were a world transform.
  const looseBox = addBoxWire(scene, 0xf0883e, { dashed: true });

  // The link from parent origin to child origin, which is what "attached" means.
  const link = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x7d8590 }),
  );
  scene.add(link);

  const show = addReadout(el);
  const parentTurn = addSlider(el, "parent yaw", 0, 360, 35, draw);
  const parentX = addSlider(el, "parent along x", -3, 3, 1, draw, "", 0.5);
  const childTurn = addSlider(
    el,
    "child yaw, in parent space",
    0,
    360,
    0,
    draw,
  );

  function draw() {
    // Each object's own transform, in its own space. Neither knows about the other.
    const parentLocal = multiplyMat4(
      translation4(parentX(), 0, 0),
      rotationY4(parentTurn()),
    );
    const childLocal = multiplyMat4(
      translation4(CHILD_OFFSET.x, CHILD_OFFSET.y, CHILD_OFFSET.z),
      multiplyMat4(rotationY4(childTurn()), scale4(0.45, 0.45, 0.45)),
    );

    // Parenting is one multiplication. That is the entire mechanism.
    const childWorld = toWorld([parentLocal, childLocal]);

    parentBox(via(parentLocal));
    childBox(via(childWorld));
    looseBox(via(childLocal));

    const a = applyMat4(parentLocal, point(0, 0, 0));
    const b = applyMat4(childWorld, point(0, 0, 0));
    link.geometry.setFromPoints([
      new THREE.Vector3(a.x, a.y, a.z),
      new THREE.Vector3(b.x, b.y, b.z),
    ]);

    show(
      `child local (${CHILD_OFFSET.x.toFixed(1)}, ${CHILD_OFFSET.y.toFixed(1)}, ` +
        `${CHILD_OFFSET.z.toFixed(1)}) never changes  ·  ` +
        `child world (${b.x.toFixed(1)}, ${b.y.toFixed(1)}, ${b.z.toFixed(1)})`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
