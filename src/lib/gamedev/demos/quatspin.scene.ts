/**
 * One quaternion, its axis drawn, and the circle a corner travels as the angle opens up.
 */
import * as THREE from "three";
import { applyMat4, point, type Vec3 } from "../matrices.ts";
import { fromAxisAngle, quatToMat4, rotateVector } from "../quaternions.ts";
import { makeCanvas, addSlider, addReadout, addBoxWire } from "./ui.ts";
import type { MountFn } from "./runner.ts";

/** The corner we follow, so the reader has one thing to watch rather than eight. */
const MARK: Vec3 = { x: 0.45, y: 0.45, z: 0.45 };

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 310);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(2.9, 2.3, 3.9);
  camera.lookAt(0, 0, 0);

  const box = addBoxWire(scene, 0x39d3c3);

  // The axis, the full circle the marked corner would travel, and where it is right now.
  const axisLine = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({
      color: 0xd2a8ff,
      dashSize: 0.1,
      gapSize: 0.08,
    }),
  );
  scene.add(axisLine);

  const orbit = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x545d68 }),
  );
  scene.add(orbit);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(dot);

  const show = addReadout(el);
  const tilt = addSlider(el, "axis tilt", -90, 90, 55, draw);
  const bearing = addSlider(el, "axis bearing", -180, 180, 25, draw);
  const angle = addSlider(el, "angle to turn", -180, 180, 90, draw);

  function draw() {
    const t = (tilt() * Math.PI) / 180;
    const b = (bearing() * Math.PI) / 180;
    const h = Math.cos(t);
    const axis: Vec3 = {
      x: h * Math.sin(b),
      y: Math.sin(t),
      z: h * Math.cos(b),
    };

    const q = fromAxisAngle(axis, angle());
    if (q === null) return;
    const m = quatToMat4(q);

    box((c) => {
      const p = applyMat4(m, point(c[0] * 0.9, c[1] * 0.9, c[2] * 0.9));
      return [p.x, p.y, p.z];
    });

    axisLine.geometry.setFromPoints([
      new THREE.Vector3(-axis.x * 1.9, -axis.y * 1.9, -axis.z * 1.9),
      new THREE.Vector3(axis.x * 1.9, axis.y * 1.9, axis.z * 1.9),
    ]);
    axisLine.computeLineDistances();

    // Every place that corner could go: a circle centred on the axis, always.
    const ring: THREE.Vector3[] = [];
    for (let d = 0; d <= 120; d += 1) {
      const spun = rotateVector(fromAxisAngle(axis, (d / 120) * 360)!, MARK);
      ring.push(new THREE.Vector3(spun.x, spun.y, spun.z));
    }
    orbit.geometry.setFromPoints(ring);

    const here = rotateVector(q, MARK);
    dot.position.set(here.x, here.y, here.z);

    const half = Math.abs(angle()) / 2;
    show(
      `q = (${q.x.toFixed(2)}, ${q.y.toFixed(2)}, ${q.z.toFixed(2)}, ${q.w.toFixed(2)})` +
        `  \u00B7  w is cos of half the angle: cos(${half.toFixed(0)}\u00B0) = ${q.w.toFixed(2)}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
