/**
 * A guard's field of view, seen from above, with the dot product driving it.
 */
import * as THREE from "three";
import { targetAt, coneTest } from "./cone-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const R = 4.2;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;

  // Orthographic and looking straight down: a flat question deserves a flat view.
  const halfH = 5;
  const halfW = halfH * (width / height);
  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH,
    -halfH,
    0.1,
    50,
  );
  camera.position.set(0, 10, 0);
  camera.up.set(0, 0, -1); // so the guard's forward, world -Z, points up the screen
  camera.lookAt(0, 0, 0);

  const flat = (mesh: THREE.Mesh, y: number) => {
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    scene.add(mesh);
    return mesh;
  };

  const wedge = flat(
    new THREE.Mesh(
      new THREE.CircleGeometry(R, 96, 0, Math.PI),
      new THREE.MeshBasicMaterial({
        color: 0x58a6ff,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
      }),
    ),
    0,
  );

  // The line where the dot product changes sign, 90 degrees from forward.
  const perp = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-R, 0.01, 0),
      new THREE.Vector3(R, 0.01, 0),
    ]),
    new THREE.LineDashedMaterial({
      color: 0x7d8590,
      dashSize: 0.22,
      gapSize: 0.18,
    }),
  );
  perp.computeLineDistances();
  scene.add(perp);

  flat(
    new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 24),
      new THREE.MeshBasicMaterial({ color: 0x9198a1 }),
    ),
    0.02,
  );
  scene.add(
    new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, -1),
      new THREE.Vector3(0, 0.02, 0),
      1.5,
      0xffffff,
      0.3,
      0.16,
    ),
  );

  const dotMat = new THREE.MeshBasicMaterial({ color: 0xff7b72 });
  const target = flat(
    new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), dotMat),
    0.03,
  );
  const sightMat = new THREE.LineBasicMaterial({ color: 0xff7b72 });
  const sight = new THREE.Line(new THREE.BufferGeometry(), sightMat);
  scene.add(sight);

  const show = addReadout(el);
  const bearing = addSlider(el, "Target bearing", -180, 180, 28, draw);
  const fov = addSlider(el, "Field of view", 20, 340, 90, draw);

  function draw() {
    // Rebuild the wedge so it spans the current field of view, centred on forward.
    const half = (fov() * 0.5 * Math.PI) / 180;
    wedge.geometry.dispose();
    wedge.geometry = new THREE.CircleGeometry(
      R,
      96,
      Math.PI / 2 - half,
      half * 2,
    );

    const p = targetAt(bearing());
    target.position.set(p[0], 0.03, p[2]);
    sight.geometry.setFromPoints([
      new THREE.Vector3(0, 0.01, 0),
      new THREE.Vector3(p[0], 0.01, p[2]),
    ]);

    // One comparison decides everything you can see.
    const { d, threshold, inside } = coneTest(bearing(), fov());
    const colour = inside ? 0x7ee787 : 0xff7b72;
    dotMat.color.setHex(colour);
    sightMat.color.setHex(colour);

    show(
      `dot ${d.toFixed(2)} vs threshold ${threshold.toFixed(2)}  \u2192  ` +
        (inside ? "seen" : "not seen"),
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
