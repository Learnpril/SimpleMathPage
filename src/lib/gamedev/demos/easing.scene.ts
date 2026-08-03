/**
 * Every easing curve at once, with a dot on the chosen one and the motion it produces below.
 */
import * as THREE from "three";
import { EASINGS } from "../easings.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const LEFT = -2;
const RIGHT = 2;
const FLOOR = -0.45;
const CEIL = 1.55;
const TRACK_Y = -1.35;

/** Curve space to scene space. */
const px = (t: number) => LEFT + t * (RIGHT - LEFT);
const py = (v: number) => FLOOR + v * (CEIL - FLOOR);

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 330);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
  camera.position.set(0, 0.1, 6.4);
  camera.lookAt(0, 0.1, 0);

  const addLine = (pts: THREE.Vector3[], color: number) => {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color }),
    );
    scene.add(l);
    return l;
  };

  // The unit box, so the reader can see which parts of a curve leave it.
  addLine(
    [
      new THREE.Vector3(px(0), py(0), 0),
      new THREE.Vector3(px(1), py(0), 0),
      new THREE.Vector3(px(1), py(1), 0),
      new THREE.Vector3(px(0), py(1), 0),
      new THREE.Vector3(px(0), py(0), 0),
    ],
    0x30363d,
  );

  const samples = (fn: (t: number) => number) => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i += 1) {
      const t = i / 160;
      pts.push(new THREE.Vector3(px(t), py(fn(t)), 0));
    }
    return pts;
  };

  // Every curve, dim. The gallery is the point: shapes are easier to compare side by side.
  for (const e of EASINGS) addLine(samples(e.fn), 0x3d444d);
  const chosenCurve = addLine(samples(EASINGS[0].fn), 0x39d3c3);

  const onCurve = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(onCurve);

  // The motion the curve actually produces, which is the thing a player sees.
  addLine(
    [
      new THREE.Vector3(px(0), TRACK_Y, 0),
      new THREE.Vector3(px(1), TRACK_Y, 0),
    ],
    0x30363d,
  );
  const mover = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0x39d3c3 }),
  );
  scene.add(mover);

  let chosen = 0;
  const show = addReadout(el);
  const setActive = addButtonRow(
    el,
    EASINGS.map((e, i) => ({
      label: e.name,
      apply: () => {
        chosen = i;
        chosenCurve.geometry.setFromPoints(samples(e.fn));
        draw();
      },
    })),
  );
  const t = addSlider(
    el,
    "progress through the move",
    0,
    1,
    0.35,
    draw,
    "",
    0.01,
  );

  function draw() {
    const e = EASINGS[chosen];
    const v = e.fn(t());
    onCurve.position.set(px(t()), py(v), 0);
    mover.position.set(px(v), TRACK_Y, 0);
    setActive(chosen);
    show(
      `${e.name}  \u00B7  ${e.says}  \u00B7  ` +
        `t ${t().toFixed(2)} becomes ${v.toFixed(2)}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
