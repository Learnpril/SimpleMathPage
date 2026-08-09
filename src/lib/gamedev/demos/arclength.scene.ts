/**
 * Two dots on one path: one stepping t evenly, one stepping distance evenly. They separate.
 */
import * as THREE from "three";
import { distanceAtT } from "../splines.ts";
import type { Vec2 } from "../matrices.ts";
import {
  TABLE,
  WAYPOINTS,
  byDistance,
  byParameter,
  pathAt,
} from "./spline-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HALF_W = 2.7;
const TICKS = 24;
const BY_T = 0xf0883e;
const BY_S = 0x39d3c3;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const halfH = (HALF_W * height) / width;
  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.OrthographicCamera(
    -HALF_W,
    HALF_W,
    halfH,
    -halfH,
    0.1,
    10,
  );
  camera.position.z = 5;

  const pathPts: Vec2[] = [];
  for (let i = 0; i <= 300; i += 1) pathPts.push(pathAt(i / 300));
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        pathPts.map((p) => new THREE.Vector3(p.x, p.y, 0)),
      ),
      new THREE.LineBasicMaterial({ color: 0x3d444d }),
    ),
  );

  // The waypoints, faint, for context.
  for (const p of WAYPOINTS) {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 12),
      new THREE.MeshBasicMaterial({ color: 0x545d68 }),
    );
    m.position.set(p.x, p.y, 0);
    scene.add(m);
  }

  /* Ticks at even steps of each walk's own input. Where they bunch up, that walk is slow; where
     they spread out, it is fast. The whole lesson is in the spacing. */
  const addTicks = (
    walk: (u: number) => Vec2,
    color: number,
    radius: number,
  ) => {
    for (let i = 0; i <= TICKS; i += 1) {
      const p = walk(i / TICKS);
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 10),
        new THREE.MeshBasicMaterial({ color }),
      );
      m.position.set(p.x, p.y, 0);
      scene.add(m);
    }
  };
  addTicks(byParameter, BY_T, 0.035);
  addTicks(byDistance, BY_S, 0.035);

  const rider = (color: number) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(0.1, 18),
      new THREE.MeshBasicMaterial({ color }),
    );
    scene.add(m);
    return m;
  };
  const tDot = rider(BY_T);
  const sDot = rider(BY_S);
  const link = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x7d8590 }),
  );
  scene.add(link);

  const show = addReadout(el);
  const u = addSlider(
    el,
    "fraction of the way through",
    0,
    1,
    0.35,
    draw,
    "",
    0.005,
  );

  function draw() {
    const a = byParameter(u());
    const b = byDistance(u());
    tDot.position.set(a.x, a.y, 0);
    sDot.position.set(b.x, b.y, 0);
    link.geometry.setFromPoints([
      new THREE.Vector3(a.x, a.y, 0),
      new THREE.Vector3(b.x, b.y, 0),
    ]);

    // How far each dot has genuinely travelled, as a share of the whole path.
    const alongT = distanceAtT(TABLE, u()) / TABLE.total;
    show(
      `orange stepped t evenly and is ${(alongT * 100).toFixed(0)}% along  \u00B7  ` +
        `teal stepped distance evenly and is ${(u() * 100).toFixed(0)}% along`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
