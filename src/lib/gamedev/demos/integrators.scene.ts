/** The same throw stepped three ways, with the exact parabola underneath for comparison. */
import * as THREE from "three";
import {
  METHODS,
  exactPath,
  maxErrorOf,
  path,
  type Method,
} from "./integrators-shared.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addPolyline,
  addKey,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const COLOUR: Record<Method, number> = {
  explicit: 0xff7b72,
  "semi-implicit": 0x39d3c3,
  Verlet: 0x7ee787,
};
const TRUTH = 0x8b949e;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 290);

  const scene = new THREE.Scene();
  scene.background = background;
  const aspect = width / height;
  const halfHeight = 1.5;
  const camera = new THREE.OrthographicCamera(
    -halfHeight * aspect,
    halfHeight * aspect,
    halfHeight,
    -halfHeight,
    0.1,
    100,
  );
  camera.position.set(halfHeight * aspect - 0.4, 0.55, 10);

  const ground = addPolyline(scene, TRUTH);
  ground([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(20, 0, 0)]);
  const truth = addPolyline(scene, TRUTH, {
    dashed: true,
    dashSize: 0.1,
    gapSize: 0.08,
  });
  const lines = METHODS.map((m) => addPolyline(scene, COLOUR[m]));

  const show = addReadout(el);
  const key = addKey(el, [TRUTH, ...METHODS.map((m) => COLOUR[m])]);
  const rate = addSlider(
    el,
    "physics ticks per second",
    5,
    90,
    12,
    draw,
    " Hz",
    1,
  );

  function draw() {
    const fps = rate();
    truth(exactPath().map((p) => new THREE.Vector3(p.x, p.y, 0)));
    METHODS.forEach((m, i) => {
      lines[i](path(m, fps).map((p) => new THREE.Vector3(p.x, p.y, 0)));
    });

    key([
      "exact parabola",
      ...METHODS.map((m) => `${m}: out by ${maxErrorOf(m, fps).toFixed(3)} m`),
    ]);
    show(
      `${fps} ticks per second, so each step covers ${(1 / fps).toFixed(3)} s \u00B7 ` +
        `Verlet sits on the exact curve at every rate, because gravity is the same everywhere`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
