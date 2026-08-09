/** One ray, one floor, and the distance to the hit as the ray flattens out. */
import * as THREE from "three";
import { RAY_ORIGIN, hitAtPitch, rayAtPitch } from "./rayplane-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HIT = 0x39d3c3;
const RAY = 0xf0883e;
const DIM = 0x484f58;
const REACH = 26;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 340);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 300);

  const grid = new THREE.GridHelper(60, 30);
  grid.material = new THREE.LineBasicMaterial({ color: DIM });
  scene.add(grid);

  // The plane's normal, drawn once, because it is half of the denominator in the readout.
  scene.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      2.4,
      HIT,
    ),
  );

  const lineOf = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.5, gapSize: 0.4 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    /* Hide by visibility, never by handing over an empty list. An empty list on the first
       call allocates a zero-length buffer that can never be filled again, and on a later
       call it leaves the previous vertices in place and still drawn. */
    return (pts: THREE.Vector3[]) => {
      mesh.visible = pts.length > 1;
      if (!mesh.visible) return;
      geom.setFromPoints(pts);
      if (dashed) mesh.computeLineDistances();
    };
  };

  const solid = lineOf(RAY);
  const onwards = lineOf(RAY, true);
  const backwards = lineOf(DIM, true);

  const start = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 10),
    new THREE.MeshBasicMaterial({ color: RAY }),
  );
  start.position.set(RAY_ORIGIN.x, RAY_ORIGIN.y, RAY_ORIGIN.z);
  scene.add(start);

  const hitMat = new THREE.MeshBasicMaterial({ color: HIT });
  const hitDot = new THREE.Mesh(new THREE.SphereGeometry(0.26, 14, 10), hitMat);
  scene.add(hitDot);

  const show = addReadout(el);
  const pitch = addSlider(
    el,
    "pitch of the ray",
    -60,
    60,
    -30,
    draw,
    "\u00B0",
    0.5,
  );
  const spin = addSlider(el, "walk around it", -180, 180, 28, draw);

  function draw() {
    const { denominator, t } = hitAtPitch(pitch());
    const ray = rayAtPitch(pitch());
    const at = (d: number) =>
      new THREE.Vector3(
        ray.origin.x + ray.direction.x * d,
        ray.origin.y + ray.direction.y * d,
        ray.origin.z + ray.direction.z * d,
      );
    const from = at(0);
    const den = denominator.toFixed(3);

    // Solid as far as the hit, dashed when there is nothing ahead to stop at, and dashed
    // backwards when the only solution is behind the start - a miss, for a ray.
    const hits = t !== null && t > 0;
    solid(hits ? [from, at(Math.min(t, REACH))] : []);
    onwards(hits ? [] : [from, at(REACH)]);
    backwards(t !== null && t < 0 ? [from, at(t)] : []);

    hitDot.visible = t !== null && (t < 0 || t <= REACH);
    if (hitDot.visible && t !== null) {
      hitDot.position.copy(at(t));
      hitMat.color.setHex(t < 0 ? DIM : HIT);
    }

    const a = (spin() * Math.PI) / 180;
    camera.position.set(Math.sin(a) * 34, 15, Math.cos(a) * 34);
    camera.lookAt(0, 0, -6);

    show(
      t === null
        ? `n \u00B7 D = ${den}, so the ray runs parallel and never meets the floor`
        : t < 0
          ? `n \u00B7 D = ${den}, t = ${t.toFixed(2)} m, negative, so the floor is behind the ray`
          : t > REACH
            ? `n \u00B7 D = ${den}, t = ${t.toFixed(1)} m, past the far edge of the grid`
            : `n \u00B7 D = ${den}, t = ${t.toFixed(2)} m`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
