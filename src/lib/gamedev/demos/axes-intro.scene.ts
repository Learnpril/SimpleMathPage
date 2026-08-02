/**
 * Three labelled axes, a grid, and one point you can move with sliders.
 */
import * as THREE from "three";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(5, 4.5, 7);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  // Three coloured arrows from the origin, one per axis.
  const axis = (dir: THREE.Vector3, colour: number, label: string) => {
    const arrow = new THREE.ArrowHelper(
      dir,
      new THREE.Vector3(),
      3.4,
      colour,
      0.3,
      0.16,
    );
    scene.add(arrow);

    // A text sprite for the label, so it always faces the camera.
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold 48px sans-serif";
    ctx.fillStyle = "#" + colour.toString(16).padStart(6, "0");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 32, 32);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true }),
    );
    sprite.scale.set(0.6, 0.6, 1);
    sprite.position.copy(dir).multiplyScalar(3.8);
    scene.add(sprite);
  };

  axis(new THREE.Vector3(1, 0, 0), 0xff7b72, "X");
  axis(new THREE.Vector3(0, 1, 0), 0x7ee787, "Y");
  axis(new THREE.Vector3(0, 0, 1), 0x58a6ff, "Z");

  // A movable point, so you can feel what each number does.
  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(dot);

  const show = addReadout(el);
  const xSlider = addSlider(el, "X (red, right)", -3, 3, 2, draw, "");
  const ySlider = addSlider(el, "Y (green, up)", -3, 3, 1, draw, "");
  const zSlider = addSlider(el, "Z (blue, forward)", -3, 3, -1, draw, "");

  function draw() {
    const x = xSlider();
    const y = ySlider();
    const z = zSlider();
    dot.position.set(x, y, z);
    show(`position: (${x}, ${y}, ${z})`);
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
