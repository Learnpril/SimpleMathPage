/**
 * A cursor on the near plane, the ray it becomes, and whatever that ray hits.
 */
import * as THREE from "three";
import { extentAt, frustumCorners, rayThroughNdc } from "../projection.ts";
import { ASPECT, FAR, FOV, NEAR, TARGETS, pick } from "./pick-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HIT = 0x39d3c3;
const MISS = 0x484f58;
const RAY = 0xf0883e;
const SCREEN = 0xd2a8ff;

const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 330);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);

  const lineOf = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.LineSegments(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.22 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (pts: THREE.Vector3[]) => {
      geom.setFromPoints(pts);
      if (dashed) mesh.computeLineDistances();
    };
  };

  const frustumLines = lineOf(MISS, true);
  const screenRect = lineOf(SCREEN);
  const rayLine = lineOf(RAY);

  // The camera doing the picking, drawn as a dot at its own origin.
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 14, 10),
      new THREE.MeshBasicMaterial({ color: RAY }),
    ),
  );

  const cursorDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 9),
    new THREE.MeshBasicMaterial({ color: SCREEN }),
  );
  scene.add(cursorDot);

  const hitDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  scene.add(hitDot);

  const blobs = TARGETS.map((t) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(t.radius, 18, 12),
      new THREE.MeshBasicMaterial({ color: MISS, wireframe: true }),
    );
    m.position.set(t.centre.x, t.centre.y, t.centre.z);
    scene.add(m);
    return m;
  });

  const show = addReadout(el);
  const cx = addSlider(
    el,
    "cursor across the screen",
    -1,
    1,
    0.12,
    draw,
    "",
    0.01,
  );
  const cy = addSlider(el, "cursor up the screen", -1, 1, 0.34, draw, "", 0.01);
  const spin = addSlider(el, "walk around it", -180, 180, 40, draw);

  function draw() {
    const ndc = { x: cx(), y: cy() };

    const corners = frustumCorners(FOV, ASPECT, NEAR, FAR);
    const fpts: THREE.Vector3[] = [];
    for (const [a, b] of EDGES) {
      fpts.push(
        new THREE.Vector3(corners[a].x, corners[a].y, corners[a].z),
        new THREE.Vector3(corners[b].x, corners[b].y, corners[b].z),
      );
    }
    frustumLines(fpts);

    // The near plane, drawn as the screen the cursor lives on.
    const { halfHeight: h, halfWidth: w } = extentAt(FOV, ASPECT, NEAR);
    const rect = [
      new THREE.Vector3(-w, -h, -NEAR),
      new THREE.Vector3(w, -h, -NEAR),
      new THREE.Vector3(w, h, -NEAR),
      new THREE.Vector3(-w, h, -NEAR),
    ];
    screenRect([
      rect[0],
      rect[1],
      rect[1],
      rect[2],
      rect[2],
      rect[3],
      rect[3],
      rect[0],
    ]);
    cursorDot.position.set(ndc.x * w, ndc.y * h, -NEAR);

    const ray = rayThroughNdc(FOV, ASPECT, ndc);
    const found = pick(ndc);
    const reach = found ? found.distance : FAR;
    rayLine([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(
        ray.direction.x * reach,
        ray.direction.y * reach,
        ray.direction.z * reach,
      ),
    ]);

    blobs.forEach((m, i) => {
      (m.material as THREE.MeshBasicMaterial).color.setHex(
        found?.index === i ? HIT : MISS,
      );
    });

    hitDot.visible = found !== null;
    if (found) {
      hitDot.position.set(
        ray.direction.x * found.distance,
        ray.direction.y * found.distance,
        ray.direction.z * found.distance,
      );
    }

    const a = (spin() * Math.PI) / 180;
    const r = 30;
    camera.position.set(Math.sin(a) * r, 12, Math.cos(a) * r - 9);
    camera.lookAt(0, 0, -11);

    show(
      found
        ? `hit target ${found.index + 1} at ${found.distance.toFixed(1)} m along the ray`
        : `the ray misses everything`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
