/**
 * A cube with its own axes drawn on it, turned by a slider.
 */
import * as THREE from "three";
import { basisFromYaw, degToRad } from "../conventions.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(4.2, 3.4, 5.6);
  camera.lookAt(0, 0, 0);

  // The world's axes: faint, and they never move.
  const world = new THREE.AxesHelper(3.4);
  (world.material as THREE.Material).transparent = true;
  (world.material as THREE.Material).opacity = 0.22;
  scene.add(world, new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  // The cube, plus the axes that belong to it and move with it.
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 1.5, 1.5),
    new THREE.MeshNormalMaterial({ flatShading: true }),
  );
  cube.add(new THREE.AxesHelper(2.2));

  // Forward is local -Z. White, so it reads as a label rather than a fourth axis.
  cube.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(),
      2.6,
      0xffffff,
      0.35,
      0.18,
    ),
  );
  scene.add(cube);

  const show = addReadout(el);
  const yaw = addSlider(el, "Yaw", 0, 360, 0, draw);

  const fmt = (v: number[]) =>
    v
      .map((n) => (Math.abs(n) < 1e-4 ? 0 : Math.round(n * 100) / 100))
      .join(", ");

  function draw() {
    const radians = degToRad(yaw());
    cube.rotation.y = radians;

    // The same function the lesson shows, so the numbers match the picture.
    const b = basisFromYaw(radians);
    const forward = b.z.map((n) => -n);
    show(`cube's own X (${fmt(b.x)})    forward (${fmt(forward)})`);

    renderer.render(scene, camera);
  }

  draw();

  // Nothing animates on its own, so there is no motion to suppress for readers who
  // have asked for less of it. The slider is the only thing that changes anything.
  return () => renderer.dispose();
};

export default mount;
