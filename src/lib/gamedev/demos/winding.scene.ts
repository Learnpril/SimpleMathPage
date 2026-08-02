/**
 * A triangle whose normal flips when you list its corners the other way round.
 */
import * as THREE from "three";
import {
  corners,
  edges,
  normalFor,
  eyeFromAzimuth,
  frontFaces,
  CENTROID,
} from "./winding-shared.ts";
import { makeCanvas, addSlider, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(6, 6, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  const origin = new THREE.Vector3(...CENTROID);

  // One geometry, two meshes. Each material draws only the side it owns, so the colour
  // under your eye tells you which face you are looking at.
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(9), 3),
  );
  const face = (colour: number, side: THREE.Side) => {
    const m = new THREE.Mesh(
      geom,
      new THREE.MeshBasicMaterial({
        color: colour,
        side,
        transparent: true,
        opacity: 0.8,
      }),
    );
    m.position.y = 0.01; // off the grid, or the two surfaces flicker against each other
    scene.add(m);
    return m;
  };
  face(0x7ee787, THREE.FrontSide);
  face(0xff7b72, THREE.BackSide);

  const normal = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    origin,
    2.2,
    0xf0883e,
    0.35,
    0.18,
  );
  const e1 = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0.03, 0),
    1,
    0x58a6ff,
    0.28,
    0.15,
  );
  const e2 = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 0.03, 0),
    1,
    0xd2a8ff,
    0.28,
    0.15,
  );
  scene.add(normal, e1, e2);

  const show = addReadout(el);
  const flipped = addCheckbox(
    el,
    "List the corners the other way round",
    false,
    draw,
  );
  const view = addSlider(el, "View angle", 0, 359, 35, draw);

  function draw() {
    const [a, b, c] = corners(flipped());

    // The vertex order in the buffer *is* the winding. Nothing else changes.
    const pos = geom.getAttribute("position") as THREE.BufferAttribute;
    pos.set(new Float32Array([...a, ...b, ...c]));
    pos.needsUpdate = true;
    geom.computeBoundingSphere();

    const n = normalFor(flipped());
    normal.setDirection(new THREE.Vector3(...n));

    const edge = edges(flipped());
    for (const [arrow, v] of [
      [e1, edge.e1],
      [e2, edge.e2],
    ] as const) {
      arrow.setDirection(new THREE.Vector3(...v).normalize());
      arrow.setLength(Math.hypot(...v), 0.28, 0.15);
    }

    const eye = eyeFromAzimuth(view());
    camera.position.set(...(eye as [number, number, number]));
    camera.lookAt(origin);

    show(
      frontFaces(n, eye, CENTROID)
        ? "you are looking at the front (green)"
        : "you are looking at the back (red)",
    );
    renderer.render(scene, camera);
  }

  draw();

  // Both controls are discrete, so a frame per input is enough and nothing animates.
  return () => renderer.dispose();
};

export default mount;
