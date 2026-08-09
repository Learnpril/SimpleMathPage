/**
 * The view frustum as a solid you can walk around, with objects coloured by whether they survive.
 */
import * as THREE from "three";
import { frustumCorners, fovXFromFovY } from "../projection.ts";
import { ASPECT, OBJECTS, RADIUS, visibility } from "./frustum-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const EDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0], // near face
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4], // far face
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7], // the sides
];

const IN = 0x39d3c3;
const OUT = 0x484f58;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 330);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

  const frustumGeom = new THREE.BufferGeometry();
  frustumGeom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(EDGES.length * 6), 3),
  );
  scene.add(
    new THREE.LineSegments(
      frustumGeom,
      new THREE.LineBasicMaterial({ color: 0xd2a8ff }),
    ),
  );

  // The camera being visualised: a dot at its own origin and a stub along its -Z.
  scene.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 10),
      new THREE.MeshBasicMaterial({ color: 0xf0883e }),
    ),
  );
  const forward = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -2),
    ]),
    new THREE.LineBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(forward);

  const blobs = OBJECTS.map((p) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 12, 9),
      new THREE.MeshBasicMaterial({ color: OUT }),
    );
    m.position.set(p.x, p.y, p.z);
    scene.add(m);
    return m;
  });

  const show = addReadout(el);
  const fov = addSlider(el, "vertical field of view", 25, 110, 55, draw);
  const near = addSlider(el, "near plane", 0.5, 5, 1.5, draw, " m", 0.1);
  const far = addSlider(el, "far plane", 6, 22, 16, draw, " m", 0.5);
  const spin = addSlider(el, "walk around it", -180, 180, 35, draw);

  function draw() {
    const corners = frustumCorners(fov(), ASPECT, near(), far());
    const pts: THREE.Vector3[] = [];
    for (const [a, b] of EDGES) {
      pts.push(
        new THREE.Vector3(corners[a].x, corners[a].y, corners[a].z),
        new THREE.Vector3(corners[b].x, corners[b].y, corners[b].z),
      );
    }
    frustumGeom.setFromPoints(pts);

    const seen = visibility(fov(), near(), far());
    blobs.forEach((m, i) => {
      (m.material as THREE.MeshBasicMaterial).color.setHex(seen[i] ? IN : OUT);
    });

    // Orbit the viewing camera around the middle of the frustum.
    const a = (spin() * Math.PI) / 180;
    const r = 26;
    camera.position.set(Math.sin(a) * r, 11, Math.cos(a) * r - far() * 0.5);
    camera.lookAt(0, 0, -far() * 0.5);

    show(
      `vertical ${fov().toFixed(0)}\u00B0 means horizontal ` +
        `${fovXFromFovY(fov(), ASPECT).toFixed(0)}\u00B0 at 16:9  \u00B7  ` +
        `${seen.filter(Boolean).length} of ${OBJECTS.length} objects need drawing`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
