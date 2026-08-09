/** A jump described as a height and a duration, with the gravity that produces it. */
import * as THREE from "three";
import {
  FORWARD,
  FPS,
  analyticArc,
  derived,
  steppedApex,
  steppedArc,
} from "./jump-shared.ts";
import { makeCanvas, addSlider, addReadout, addPolyline } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const EXACT = 0x39d3c3;
const STEPPED = 0xf0883e;
const DIM = 0x484f58;

const mount: MountFn = (el) => {
  const {
    renderer,
    width,
    height: canvasHeight,
    background,
  } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  const aspect = width / canvasHeight;
  const halfHeight = 2.3;
  const camera = new THREE.OrthographicCamera(
    -halfHeight * aspect,
    halfHeight * aspect,
    halfHeight,
    -halfHeight,
    0.1,
    100,
  );
  camera.position.set(halfHeight * aspect - 0.6, 1.5, 10);

  const ground = addPolyline(scene, 0x8b949e);
  ground([new THREE.Vector3(-1, 0, 0), new THREE.Vector3(20, 0, 0)]);
  const target = addPolyline(scene, DIM, {
    dashed: true,
    dashSize: 0.14,
    gapSize: 0.12,
  });
  const exactArc = addPolyline(scene, EXACT);
  const steppedLine = addPolyline(scene, STEPPED);

  const apexDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 12, 9),
    new THREE.MeshBasicMaterial({ color: EXACT }),
  );
  scene.add(apexDot);

  const derivedOut = addReadout(el);
  const steppedOut = addReadout(el);
  const wantHeight = addSlider(el, "how high", 0.4, 3, 1.2, draw, " m", 0.1);
  const wantTime = addSlider(
    el,
    "how long to get there",
    0.15,
    0.9,
    0.4,
    draw,
    " s",
    0.05,
  );
  const fall = addSlider(el, "fall this much faster", 1, 3, 1, draw, "x", 0.1);

  function draw() {
    const h = wantHeight();
    const t = wantTime();
    const m = fall();
    const d = derived(h, t, m);

    target([new THREE.Vector3(-1, h, 0), new THREE.Vector3(20, h, 0)]);
    exactArc(analyticArc(h, t, m).map((p) => new THREE.Vector3(p.x, p.y, 0)));
    steppedLine(steppedArc(h, t, m).map((p) => new THREE.Vector3(p.x, p.y, 0)));
    apexDot.position.set(t * FORWARD, h, 0);

    const reached = steppedApex(h, t, m);
    const short = ((h - reached) / h) * 100;

    derivedOut(
      `gravity ${d.gravity.toFixed(1)} m/s\u00B2 up` +
        (m > 1.001 ? `, ${d.fallGravity.toFixed(1)} down` : "") +
        ` \u00B7 launch at ${d.launchSpeed.toFixed(2)} m/s \u00B7 in the air ${d.total.toFixed(2)} s`,
    );
    steppedOut(
      `stepped at ${FPS} fps it only reaches ${reached.toFixed(2)} m, ${short.toFixed(1)}% short of the ${h.toFixed(2)} m asked for`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
