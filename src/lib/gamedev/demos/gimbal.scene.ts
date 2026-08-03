/**
 * Three nested gimbal rings, and the two rotation axes that collapse onto each other at 90.
 */
import * as THREE from "three";
import {
  IDENTITY4,
  applyMat4,
  multiplyMat4,
  point,
  rotationX4,
  rotationY4,
  type Mat4,
  type Vec3,
} from "../matrices.ts";
import {
  YAW_PITCH_ROLL,
  axisInWorld,
  axisSeparation,
  forwardOf,
  fromEuler,
  type Axis,
  type Euler,
} from "../euler.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addButtonRow,
  addBoxWire,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const YAW = 0x58a6ff;
const PITCH = 0x7ee787;
const ROLL = 0xd2a8ff;

/** A ring of the given radius, lying in the plane its own axis is perpendicular to. */
function addRing(
  scene: THREE.Scene,
  color: number,
  axis: Axis,
  radius: number,
): (m: Mat4) => void {
  const geom = new THREE.BufferGeometry();
  scene.add(new THREE.Line(geom, new THREE.LineBasicMaterial({ color })));
  return (m: Mat4) => {
    const pts: THREE.Vector3[] = [];
    for (let d = 0; d <= 96; d += 1) {
      const t = (d / 96) * Math.PI * 2;
      const u = Math.cos(t) * radius;
      const v = Math.sin(t) * radius;
      const local =
        axis === "Y"
          ? point(u, 0, v)
          : axis === "X"
            ? point(0, u, v)
            : point(u, v, 0);
      const p = applyMat4(m, local);
      pts.push(new THREE.Vector3(p.x, p.y, p.z));
    }
    geom.setFromPoints(pts);
  };
}

/** A dashed line through the origin, so an axis can be seen rather than inferred. */
function addAxisLine(
  scene: THREE.Scene,
  color: number,
  half: number,
): (d: Vec3) => void {
  const geom = new THREE.BufferGeometry();
  const mesh = new THREE.LineSegments(
    geom,
    new THREE.LineDashedMaterial({ color, dashSize: 0.1, gapSize: 0.08 }),
  );
  scene.add(mesh);
  return (d: Vec3) => {
    geom.setFromPoints([
      new THREE.Vector3(-d.x * half, -d.y * half, -d.z * half),
      new THREE.Vector3(d.x * half, d.y * half, d.z * half),
    ]);
    mesh.computeLineDistances();
  };
}

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(3.4, 2.6, 4.6);
  camera.lookAt(0, 0, 0);

  const yawRing = addRing(scene, YAW, "Y", 1.75);
  const pitchRing = addRing(scene, PITCH, "X", 1.42);
  const rollRing = addRing(scene, ROLL, "Z", 1.1);

  // The two axes that matter: the fixed outer one, and the inner one being carried around.
  const outerAxis = addAxisLine(scene, YAW, 2.1);
  const innerAxis = addAxisLine(scene, ROLL, 1.95);

  const body = addBoxWire(scene, 0x7d8590);
  const nose = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x39d3c3 }),
  );
  scene.add(nose);

  const show = addReadout(el);

  const setActive = addButtonRow(el, [
    { label: "Level", apply: () => preset(25, 0, 15, 0) },
    { label: "Nose up 90\u00B0", apply: () => preset(25, 90, 15, 1) },
    { label: "Nose down 90\u00B0", apply: () => preset(25, -90, 15, 2) },
  ]);

  const yaw = addSlider(el, "yaw, about world Y", -180, 180, 25, draw);
  const pitch = addSlider(el, "pitch, about the carried X", -90, 90, 20, draw);
  const roll = addSlider(el, "roll, about the carried Z", -180, 180, 15, draw);

  function preset(y: number, p: number, r: number, index: number) {
    yaw.set(y);
    pitch.set(p);
    roll.set(r);
    setActive(index);
    draw();
  }

  function draw() {
    const e: Euler = { x: pitch(), y: yaw(), z: roll() };

    // Each ring is oriented by the rings outside it, and by nothing inside it.
    const middle = rotationY4(e.y);
    const inner = multiplyMat4(middle, rotationX4(e.x));
    const full = fromEuler(e, YAW_PITCH_ROLL);

    yawRing(IDENTITY4);
    pitchRing(middle);
    rollRing(inner);

    outerAxis(axisInWorld(e, YAW_PITCH_ROLL, 0));
    innerAxis(axisInWorld(e, YAW_PITCH_ROLL, 2));

    body((c) => {
      const p = applyMat4(full, point(c[0] * 0.7, c[1] * 0.7, c[2] * 0.7));
      return [p.x, p.y, p.z];
    });

    const f = forwardOf(full);
    nose.geometry.setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(f.x * 1.5, f.y * 1.5, f.z * 1.5),
    ]);

    const apart = axisSeparation(e, YAW_PITCH_ROLL);
    const verdict =
      apart < 0.5
        ? "  \u00B7  gimbal lock"
        : apart < 5
          ? "  \u00B7  nearly locked"
          : "";
    show(`yaw and roll axes are ${apart.toFixed(1)}\u00B0 apart${verdict}`);
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
