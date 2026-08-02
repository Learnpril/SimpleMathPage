/**
 * Every direction a character can move, and how fast it goes in each one.
 */
import * as THREE from "three";
import {
  rawInput,
  velocityFrom,
  length,
  type Vec2,
} from "./diagonal-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const SPEED = 6;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;

  // One unit on screen is one unit of speed, scaled so the square's corners fit.
  const halfH = SPEED * 1.65;
  const camera = new THREE.OrthographicCamera(
    -halfH * (width / height),
    halfH * (width / height),
    halfH,
    -halfH,
    0.1,
    100,
  );
  camera.position.z = 10;

  const line = (points: THREE.Vector3[], colour: number, opacity = 1) => {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: colour,
        transparent: true,
        opacity,
      }),
    );
    scene.add(l);
    return l;
  };

  line(
    [new THREE.Vector3(-halfH, 0, 0), new THREE.Vector3(halfH, 0, 0)],
    0x30363d,
  );
  line(
    [new THREE.Vector3(0, -halfH, 0), new THREE.Vector3(0, halfH, 0)],
    0x30363d,
  );

  // Sweep every direction and plot the resulting speed. Both outlines come out of the
  // same `velocityFrom` the lesson shows - only the normalize flag differs.
  const trace = (normalize: boolean) => {
    const pts: THREE.Vector3[] = [];
    for (let deg = 0; deg <= 360; deg += 1) {
      const v = velocityFrom(rawInput(deg), SPEED, normalize);
      pts.push(new THREE.Vector3(v.x, v.y, 0));
    }
    return pts;
  };
  line(trace(true), 0x39d3c3); // a circle: one speed in every direction
  line(trace(false), 0xff7b72); // a square: the corners are 41% further out

  // The eight directions a keyboard can produce, marked on the raw outline.
  for (let deg = 0; deg < 360; deg += 45) {
    const v = velocityFrom(rawInput(deg), SPEED, false);
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.14, 12),
      new THREE.MeshBasicMaterial({ color: 0xff7b72 }),
    );
    dot.position.set(v.x, v.y, 0);
    scene.add(dot);
  }

  const marker = (colour: number) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 20),
      new THREE.MeshBasicMaterial({ color: colour }),
    );
    scene.add(m);
    return m;
  };
  const fixedDot = marker(0x39d3c3);
  const naiveDot = marker(0xff7b72);
  const fixedArm = line(
    [new THREE.Vector3(), new THREE.Vector3()],
    0x39d3c3,
    0.45,
  );
  const naiveArm = line(
    [new THREE.Vector3(), new THREE.Vector3()],
    0xff7b72,
    0.45,
  );

  const show = addReadout(el);
  const direction = addSlider(el, "Direction", 0, 360, 45, draw);

  function draw() {
    const input = rawInput(direction());
    const fixed = velocityFrom(input, SPEED, true);
    const naive = velocityFrom(input, SPEED, false);

    const place = (dot: THREE.Mesh, arm: THREE.Line, v: Vec2) => {
      dot.position.set(v.x, v.y, 0);
      arm.geometry.setFromPoints([
        new THREE.Vector3(),
        new THREE.Vector3(v.x, v.y, 0),
      ]);
    };
    place(fixedDot, fixedArm, fixed);
    place(naiveDot, naiveArm, naive);

    show(
      `input (${input.x.toFixed(2)}, ${input.y.toFixed(2)}) length ${length(input).toFixed(2)}` +
        `    teal ${length(fixed).toFixed(1)}   red ${length(naive).toFixed(1)} units per second`,
    );
    renderer.render(scene, camera);
  }

  draw();

  // The slider is the only thing that moves anything, so nothing animates on its own.
  return () => renderer.dispose();
};

export default mount;
