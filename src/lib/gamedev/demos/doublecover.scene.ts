/**
 * The same two orientations blended twice: once naively, once after the double-cover flip.
 */
import * as THREE from "three";
import {
  applyMat4,
  multiplyMat4,
  point,
  translation4,
  type Mat4,
} from "../matrices.ts";
import {
  angleBetweenQuats,
  dotQuat,
  fromAxisAngle,
  nlerpQuat,
  quatToMat4,
  rotateVector,
  shortWayFrom,
  type Quat,
} from "../quaternions.ts";
import { makeCanvas, addSlider, addReadout, addBoxWire } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const Y = { x: 0, y: 1, z: 0 };
/** Two headings only 40 degrees apart - but written so their quaternions point away. */
const FROM: Quat = fromAxisAngle(Y, 20)!;
const TO: Quat = fromAxisAngle(Y, 340)!;
const NOSE = { x: 0, y: 0, z: -1 };

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0.2, 4.4, 5.2);
  camera.lookAt(0, 0, 0);

  /** One object: a box, a nose arrow, and the trail its nose leaves over the whole blend. */
  function rig(centre: number, color: number) {
    const box = addBoxWire(scene, color);
    const nose = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color }),
    );
    const trail = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x545d68 }),
    );
    scene.add(nose, trail);

    return (target: Quat, t: number) => {
      const q = nlerpQuat(FROM, target, t)!;
      const m: Mat4 = multiplyMat4(translation4(centre, 0, 0), quatToMat4(q));
      box((c) => {
        const p = applyMat4(m, point(c[0] * 0.6, c[1] * 0.6, c[2] * 0.6));
        return [p.x, p.y, p.z];
      });

      const f = rotateVector(q, NOSE);
      nose.geometry.setFromPoints([
        new THREE.Vector3(centre, 0, 0),
        new THREE.Vector3(centre + f.x * 1.25, f.y * 1.25, f.z * 1.25),
      ]);

      // The whole route, not just where it is now. This is what makes the long way obvious.
      const path: THREE.Vector3[] = [];
      for (let i = 0; i <= 120; i += 1) {
        const step = rotateVector(nlerpQuat(FROM, target, i / 120)!, NOSE);
        path.push(
          new THREE.Vector3(
            centre + step.x * 1.25,
            step.y * 1.25,
            step.z * 1.25,
          ),
        );
      }
      trail.geometry.setFromPoints(path);

      return angleBetweenQuats(FROM, q);
    };
  }

  const naive = rig(-1.6, 0xf0883e);
  const fixed = rig(1.6, 0x39d3c3);

  const show = addReadout(el);
  const t = addSlider(
    el,
    "blend from one to the other",
    0,
    1,
    0.35,
    draw,
    "",
    0.01,
  );

  function draw() {
    const sweptNaive = naive(TO, t());
    const sweptFixed = fixed(shortWayFrom(FROM, TO), t());
    show(
      `dot is ${dotQuat(FROM, TO).toFixed(2)}, so the flip is needed  \u00B7  ` +
        `orange has turned ${sweptNaive.toFixed(0)}\u00B0, teal ${sweptFixed.toFixed(0)}\u00B0`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
