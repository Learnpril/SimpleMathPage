/**
 * One arc, two rates: evenly spaced slerp ticks against nlerp ticks bunched at the ends.
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
  fromAxisAngle,
  nlerpQuat,
  quatToMat4,
  rotateVector,
  slerpQuat,
  type Quat,
} from "../quaternions.ts";
import { makeCanvas, addSlider, addReadout, addBoxWire } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const Y = { x: 0, y: 1, z: 0 };
const TOTAL = 150;
const FROM: Quat = fromAxisAngle(Y, 0)!;
const TO: Quat = fromAxisAngle(Y, TOTAL)!;
const NOSE = { x: 0, y: 0, z: -1 };
const REACH = 1.3;
const TICKS = 10;

type Blend = (from: Quat, to: Quat, t: number) => Quat | null;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0.2, 5.2, 4.6);
  camera.lookAt(0, 0, 0);

  /** One object, its arc, and a dot at every tenth of the way through the blend. */
  function rig(centre: number, color: number, blend: Blend) {
    const box = addBoxWire(scene, color);
    const arc = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x545d68 }),
    );
    scene.add(arc);

    const dots: THREE.Mesh[] = [];
    for (let i = 0; i <= TICKS; i += 1) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 10, 8),
        new THREE.MeshBasicMaterial({ color }),
      );
      scene.add(dot);
      dots.push(dot);
    }

    const tipAt = (t: number) => {
      const f = rotateVector(blend(FROM, TO, t)!, NOSE);
      return new THREE.Vector3(centre + f.x * REACH, f.y * REACH, f.z * REACH);
    };

    // The arc never changes, and neither do the ticks. Draw them once.
    const path: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i += 1) path.push(tipAt(i / 120));
    arc.geometry.setFromPoints(path);
    dots.forEach((d, i) => d.position.copy(tipAt(i / TICKS)));

    return (t: number) => {
      const q = blend(FROM, TO, t)!;
      const m: Mat4 = multiplyMat4(translation4(centre, 0, 0), quatToMat4(q));
      box((c) => {
        const p = applyMat4(m, point(c[0] * 0.55, c[1] * 0.55, c[2] * 0.55));
        return [p.x, p.y, p.z];
      });
      return angleBetweenQuats(FROM, q);
    };
  }

  const nlerpRig = rig(-1.7, 0xd2a8ff, nlerpQuat);
  const slerpRig = rig(1.7, 0x39d3c3, slerpQuat);

  const show = addReadout(el);
  const t = addSlider(
    el,
    "blend from start to end",
    0,
    1,
    0.23,
    draw,
    "",
    0.01,
  );

  function draw() {
    const turnedN = nlerpRig(t());
    const turnedS = slerpRig(t());
    const behind = turnedS - turnedN;
    show(
      `nlerp ${turnedN.toFixed(1)}\u00B0, slerp ${turnedS.toFixed(1)}\u00B0  \u00B7  ` +
        `nlerp is ${Math.abs(behind).toFixed(1)}\u00B0 ` +
        `${behind >= 0 ? "behind" : "ahead"}  \u00B7  slerp is always t \u00D7 ${TOTAL}\u00B0`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
