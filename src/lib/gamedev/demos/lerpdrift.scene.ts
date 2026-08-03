/**
 * What skipping the renormalize costs: the object shrinks, because the sandwich scales by |q|.
 */
import * as THREE from "three";
import {
  fromAxisAngle,
  lerpQuat,
  normalizeQuat,
  quatLength,
  rotateVector,
  type Quat,
} from "../quaternions.ts";
import {
  makeCanvas,
  addSlider,
  addCheckbox,
  addReadout,
  addBoxWire,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const Y = { x: 0, y: 1, z: 0 };
const FROM: Quat = fromAxisAngle(Y, 0)!;
const TO: Quat = fromAxisAngle(Y, 150)!;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 290);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(2.6, 2.4, 3.6);
  camera.lookAt(0, 0, 0);

  // Dashed grey is the size the object is supposed to be, so the shrink has a reference.
  const reference = addBoxWire(scene, 0x7d8590, { dashed: true });
  const actual = addBoxWire(scene, 0xf0883e);

  const show = addReadout(el);
  const t = addSlider(el, "blend from start to end", 0, 1, 0.5, draw, "", 0.01);
  const fix = addCheckbox(el, "normalize before using it", false, draw);

  function draw() {
    const raw = lerpQuat(FROM, TO, t());
    const q = fix() ? normalizeQuat(raw)! : raw;
    const len = quatLength(q);

    // Rotating through the sandwich, which scales by |q| squared when |q| is not 1.
    actual((c) => {
      const v = rotateVector(q, { x: c[0], y: c[1], z: c[2] });
      return [v.x, v.y, v.z];
    });
    // The same corners under a quaternion that has been normalized, whatever the checkbox says.
    const unit = normalizeQuat(raw)!;
    reference((c) => {
      const v = rotateVector(unit, { x: c[0], y: c[1], z: c[2] });
      return [v.x, v.y, v.z];
    });

    show(
      `|q| = ${len.toFixed(3)}, so the object is scaled by ` +
        `${(len * len).toFixed(3)}` +
        (fix() ? "  \u00B7  fixed" : "  \u00B7  shrinking"),
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
