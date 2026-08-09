/** Four primitives, and the nearest point on each to a point you move. */
import * as THREE from "three";
import { signedDistanceToBox } from "../geometry.ts";
import {
  BOX_MAX,
  BOX_MIN,
  GROUND,
  SEG_A,
  SEG_B,
  SPHERE_C,
  SPHERE_R,
  nearestPoints,
} from "./closest-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const NEAREST = 0x39d3c3;
const DIM = 0x484f58;
const QUERY = 0xf0883e;

const v = (p: { x: number; y: number; z: number }) =>
  new THREE.Vector3(p.x, p.y, p.z);

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 340);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 200);

  // One material per primitive, in the order `nearestPoints` reports them, so a single
  // index picks out the winner everywhere below.
  const segMat = new THREE.MeshBasicMaterial({ color: DIM });
  const boxMat = new THREE.LineBasicMaterial({ color: DIM });
  const sphereMat = new THREE.MeshBasicMaterial({
    color: DIM,
    wireframe: true,
  });
  const groundMat = new THREE.LineBasicMaterial({ color: DIM });
  const MATS = [segMat, boxMat, sphereMat, groundMat];

  const segDir = v(SEG_B).sub(v(SEG_A));
  const segment = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, segDir.length(), 10),
    segMat,
  );
  segment.position.copy(v(SEG_A)).add(v(SEG_B)).multiplyScalar(0.5);
  segment.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    segDir.clone().normalize(),
  );
  scene.add(segment);

  const size = v(BOX_MAX).sub(v(BOX_MIN));
  const box = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)),
    boxMat,
  );
  box.position.copy(v(BOX_MIN)).add(v(BOX_MAX)).multiplyScalar(0.5);
  scene.add(box);

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(SPHERE_R, 20, 14),
    sphereMat,
  );
  sphere.position.copy(v(SPHERE_C));
  scene.add(sphere);

  // The plane is infinite, so it is drawn as a grid at its own height: -d for a +Y normal.
  const grid = new THREE.GridHelper(24, 24);
  grid.material = groundMat;
  grid.position.y = -GROUND.d;
  scene.add(grid);

  const links = MATS.map(() => {
    const geom = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({ color: DIM });
    scene.add(new THREE.Line(geom, mat));
    const dotMat = new THREE.MeshBasicMaterial({ color: DIM });
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 9), dotMat);
    scene.add(dot);
    return { geom, mat, dot, dotMat };
  });

  const queryDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.19, 16, 11),
    new THREE.MeshBasicMaterial({ color: QUERY }),
  );
  scene.add(queryDot);

  const show = addReadout(el);
  const px = addSlider(el, "point across", -8, 8, 2.2, draw, " m", 0.1);
  const py = addSlider(el, "point up", -4, 6, 2.6, draw, " m", 0.1);
  const pz = addSlider(el, "point towards you", -8, 8, 2.2, draw, " m", 0.1);
  const spin = addSlider(el, "walk around it", -180, 180, 35, draw);

  function draw() {
    const p = { x: px(), y: py(), z: pz() };
    queryDot.position.set(p.x, p.y, p.z);

    const all = nearestPoints(p);
    let best = 0;
    all.forEach((n, i) => {
      if (n.distance < all[best].distance) best = i;
    });

    all.forEach((n, i) => {
      const colour = i === best ? NEAREST : DIM;
      MATS[i].color.setHex(colour);
      links[i].mat.color.setHex(colour);
      links[i].dotMat.color.setHex(colour);
      links[i].dot.position.set(n.point.x, n.point.y, n.point.z);
      links[i].geom.setFromPoints([
        new THREE.Vector3(p.x, p.y, p.z),
        new THREE.Vector3(n.point.x, n.point.y, n.point.z),
      ]);
    });

    const a = (spin() * Math.PI) / 180;
    camera.position.set(Math.sin(a) * 20, 9, Math.cos(a) * 20);
    camera.lookAt(0, 0, 0);

    const inBox = signedDistanceToBox(BOX_MIN, BOX_MAX, p);
    show(
      inBox < 0
        ? `inside the box, ${inBox.toFixed(2)} m in, so the nearest point is the point itself`
        : `nearest: the ${all[best].name}, ${all[best].distance.toFixed(2)} m away`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
