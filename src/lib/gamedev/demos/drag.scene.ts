/** The same shot with and without drag, and the lopsided arc drag produces. */
import * as THREE from "three";
import { EARTH_GRAVITY, terminalSpeed } from "../dynamics.ts";
import {
  arc,
  peakDistanceFraction,
  peakTimeFraction,
  rangeOf,
} from "./drag-shared.ts";
import { makeCanvas, addSlider, addReadout, addPolyline } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const WITH_DRAG = 0x39d3c3;
const VACUUM = 0x8b949e;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 270);

  const scene = new THREE.Scene();
  scene.background = background;
  const aspect = width / height;
  const halfWidth = 8.4;
  const camera = new THREE.OrthographicCamera(
    -halfWidth,
    halfWidth,
    halfWidth / aspect,
    -halfWidth / aspect,
    0.1,
    100,
  );
  camera.position.set(halfWidth - 0.8, halfWidth / aspect - 0.5, 10);

  const ground = addPolyline(scene, VACUUM);
  ground([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(30, 0, 0)]);
  const vacuumArc = addPolyline(scene, VACUUM, {
    dashed: true,
    dashSize: 0.3,
    gapSize: 0.25,
  });
  const draggedArc = addPolyline(scene, WITH_DRAG);

  const landed = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 9),
    new THREE.MeshBasicMaterial({ color: WITH_DRAG }),
  );
  scene.add(landed);

  const show = addReadout(el);
  const shape = addReadout(el);
  const angle = addSlider(el, "launch angle", 15, 75, 45, draw);
  const drag = addSlider(
    el,
    "how thick the air is",
    0,
    1.5,
    0.4,
    draw,
    "",
    0.05,
  );

  function draw() {
    const a = angle();
    const k = drag();

    vacuumArc(arc(a, 0).map((p) => new THREE.Vector3(p.x, p.y, 0)));
    draggedArc(arc(a, k).map((p) => new THREE.Vector3(p.x, p.y, 0)));

    const clean = rangeOf(a, 0);
    const dirty = rangeOf(a, k);
    landed.position.set(dirty, 0, 0);

    show(
      `range ${clean.toFixed(1)} m through vacuum, ${dirty.toFixed(1)} m through air \u00B7 ` +
        `${(((clean - dirty) / clean) * 100).toFixed(0)}% shorter`,
    );
    shape(
      k < 0.001
        ? `no drag: the peak sits halfway through the flight and halfway along it, and the arc is symmetric`
        : `the peak comes at ${(peakTimeFraction(a, k) * 100).toFixed(0)}% of the flight time ` +
            `but ${(peakDistanceFraction(a, k) * 100).toFixed(0)}% of the distance, so it drops almost straight down \u00B7 ` +
            `drag pulls this shot down to ${terminalSpeed(EARTH_GRAVITY, k).toFixed(1)} m/s if it falls long enough`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
