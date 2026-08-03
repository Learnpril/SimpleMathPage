/**
 * Exponential decay against a critically damped spring, and the difference at the very start.
 */
import * as THREE from "three";
import { HALF_LIFE, SMOOTH_TIME, decayAt, springAt } from "./spring-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const SECONDS = 1;
const LEFT = -2;
const RIGHT = 2;
const FLOOR = -0.5;
const CEIL = 1.35;
const TRACK_Y = -1.4;

const px = (t: number) => LEFT + (t / SECONDS) * (RIGHT - LEFT);
const py = (v: number) => FLOOR + v * (CEIL - FLOOR);

const DECAY = 0xf0883e;
const SPRING = 0x39d3c3;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0, 6.2);
  camera.lookAt(0, 0, 0);

  const addLine = (pts: THREE.Vector3[], color: number) => {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    );
    scene.add(l);
    return l;
  };

  // The target line, and the floor the move starts from.
  addLine(
    [
      new THREE.Vector3(px(0), py(1), 0),
      new THREE.Vector3(px(SECONDS), py(1), 0),
    ],
    0x30363d,
  );
  addLine(
    [
      new THREE.Vector3(px(0), py(0), 0),
      new THREE.Vector3(px(SECONDS), py(0), 0),
    ],
    0x30363d,
  );

  const curve = (f: (t: number) => number, color: number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 200; i += 1) {
      const t = (i / 200) * SECONDS;
      pts.push(new THREE.Vector3(px(t), py(f(t)), 0));
    }
    return addLine(pts, color);
  };
  curve(decayAt, DECAY);
  curve(springAt, SPRING);

  const dot = (color: number, r: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r, 12, 8),
      new THREE.MeshBasicMaterial({ color }),
    );
    scene.add(m);
    return m;
  };
  const onDecay = dot(DECAY, 0.075);
  const onSpring = dot(SPRING, 0.075);

  addLine(
    [
      new THREE.Vector3(px(0), TRACK_Y, 0),
      new THREE.Vector3(px(SECONDS), TRACK_Y, 0),
    ],
    0x30363d,
  );
  const movingDecay = dot(DECAY, 0.12);
  const movingSpring = dot(SPRING, 0.12);

  const show = addReadout(el);
  const time = addSlider(
    el,
    "seconds since the target appeared",
    0,
    SECONDS,
    0.05,
    draw,
    " s",
    0.005,
  );

  function draw() {
    const t = time();
    const d = decayAt(t);
    const s = springAt(t);

    onDecay.position.set(px(t), py(d), 0);
    onSpring.position.set(px(t), py(s), 0);
    movingDecay.position.set(px(d * SECONDS), TRACK_Y + 0.16, 0);
    movingSpring.position.set(px(s * SECONDS), TRACK_Y - 0.16, 0);

    show(
      `at ${t.toFixed(3)} s: decay has closed ${(d * 100).toFixed(1)}%, ` +
        `spring ${(s * 100).toFixed(1)}%`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
