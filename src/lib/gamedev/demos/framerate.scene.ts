/**
 * The same chase at 30 and 144 fps, done with a fixed factor above and with decay below.
 */
import * as THREE from "three";
import {
  START,
  TARGET,
  simulateDamped,
  simulateNaive,
} from "./framerate-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const SLOW = 30;
const FAST = 144;
const FACTOR = 0.1;
const HALF_LIFE = 0.15;

const SLOW_COLOR = 0xf0883e;
const FAST_COLOR = 0x58a6ff;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 250);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0, 7.2);
  camera.lookAt(0, 0, 0);

  const line = (pts: THREE.Vector3[], color: number) => {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    );
    scene.add(l);
    return l;
  };

  /** One row: a track, a start tick, a target tick, two dots and a connector between them. */
  function row(y: number) {
    line(
      [new THREE.Vector3(START, y, 0), new THREE.Vector3(TARGET, y, 0)],
      0x30363d,
    );
    line(
      [
        new THREE.Vector3(START, y - 0.28, 0),
        new THREE.Vector3(START, y + 0.28, 0),
      ],
      0x545d68,
    );
    line(
      [
        new THREE.Vector3(TARGET, y - 0.34, 0),
        new THREE.Vector3(TARGET, y + 0.34, 0),
      ],
      0x39d3c3,
    );

    const dot = (color: number) => {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 14, 10),
        new THREE.MeshBasicMaterial({ color }),
      );
      scene.add(m);
      return m;
    };
    const slow = dot(SLOW_COLOR);
    const fast = dot(FAST_COLOR);
    // Vertical means the two frame rates agree. Slanted means they do not.
    const link = line([new THREE.Vector3(), new THREE.Vector3()], 0x7d8590);

    return (slowX: number, fastX: number) => {
      slow.position.set(slowX, y + 0.16, 0);
      fast.position.set(fastX, y - 0.16, 0);
      link.geometry.setFromPoints([
        new THREE.Vector3(slowX, y + 0.16, 0),
        new THREE.Vector3(fastX, y - 0.16, 0),
      ]);
    };
  }

  const naiveRow = row(0.95);
  const dampedRow = row(-0.95);

  const show = addReadout(el);
  const time = addSlider(
    el,
    "seconds since the target moved",
    0,
    1.2,
    0.3,
    draw,
    " s",
    0.01,
  );

  function draw() {
    const t = time();
    const nSlow = simulateNaive(SLOW, t, FACTOR);
    const nFast = simulateNaive(FAST, t, FACTOR);
    const dSlow = simulateDamped(SLOW, t, HALF_LIFE);
    const dFast = simulateDamped(FAST, t, HALF_LIFE);

    naiveRow(nSlow, nFast);
    dampedRow(dSlow, dFast);

    show(
      `fixed factor: ${Math.abs(nSlow - nFast).toFixed(2)} apart  \u00B7  ` +
        `from the timestep: ${Math.abs(dSlow - dFast).toFixed(2)} apart`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
