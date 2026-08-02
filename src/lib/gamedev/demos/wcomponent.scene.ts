/**
 * The same three numbers, transformed twice: once as a place, once as a direction.
 */
import * as THREE from "three";
import {
  applyMat4,
  translation4,
  point,
  direction,
  type Vec4,
} from "../matrices.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

// One value, used both ways. Everything in the scene comes from these three numbers.
const VX = 2;
const VY = 0;
const VZ = -2;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(5.5, 5, 8);
  camera.lookAt(0, 0, 0);

  const ball = (colour: number, opacity = 1) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 12),
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: opacity < 1,
        opacity,
      }),
    );
    scene.add(m);
    return m;
  };

  const arrow = (colour: number, opacity = 1) => {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      colour,
      0.26,
      0.14,
    );
    (a.line.material as THREE.Material).transparent = opacity < 1;
    (a.line.material as THREE.Material).opacity = opacity;
    (a.cone.material as THREE.Material).transparent = opacity < 1;
    (a.cone.material as THREE.Material).opacity = opacity;
    scene.add(a);
    return a;
  };

  // Faint originals, so you can see what moved and what did not.
  const ghostBall = ball(0xf0883e, 0.25);
  ghostBall.position.set(VX, VY, VZ);
  const ghostArrow = arrow(0x58a6ff, 0.25);

  const movedBall = ball(0xf0883e);
  const movedArrow = arrow(0x58a6ff);

  const show = addReadout(el);
  const tx = addSlider(el, "move along x", -4, 4, 2, draw, "", 0.5);
  const ty = addSlider(el, "move along y", -4, 4, 1, draw, "", 0.5);
  const tz = addSlider(el, "move along z", -4, 4, 0, draw, "", 0.5);

  const setArrow = (a: THREE.ArrowHelper, from: THREE.Vector3, v: Vec4) => {
    const len = Math.hypot(v.x, v.y, v.z);
    a.position.copy(from);
    a.visible = len > 1e-6;
    if (a.visible) {
      a.setDirection(new THREE.Vector3(v.x, v.y, v.z).normalize());
      a.setLength(len, 0.26, 0.14);
    }
  };

  function draw() {
    const T = translation4(tx(), ty(), tz());

    // Identical numbers. The only difference is the fourth one.
    const asPlace = applyMat4(T, point(VX, VY, VZ));
    const asDirection = applyMat4(T, direction(VX, VY, VZ));

    movedBall.position.set(asPlace.x, asPlace.y, asPlace.z);
    setArrow(ghostArrow, new THREE.Vector3(), direction(VX, VY, VZ));
    setArrow(movedArrow, new THREE.Vector3(), asDirection);

    const f = (v: Vec4) =>
      `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`;
    show(
      `place  w=1 \u2192 ${f(asPlace)} moved     ` +
        `direction  w=0 \u2192 ${f(asDirection)} unchanged`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
