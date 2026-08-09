/** A sphere fast enough to skip over a wall, and the swept test that catches it anyway. */
import * as THREE from "three";
import {
  GAP,
  RADIUS,
  WALL,
  discreteHit,
  framePositions,
  stepFor,
  sweptHit,
} from "./tunnel-shared.ts";
import { makeCanvas, addSlider, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const CAUGHT = 0x39d3c3;
const MISSED = 0xff7b72;
const DIM = 0x484f58;
const VIEW = 3.2;
const DOTS = 40;

const circle = (radius: number, segments = 30) =>
  Array.from({ length: segments + 1 }, (_, i) => {
    const a = (i / segments) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0);
  });

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 260);

  const scene = new THREE.Scene();
  scene.background = background;
  const aspect = width / height;
  const camera = new THREE.OrthographicCamera(
    -VIEW * aspect,
    VIEW * aspect,
    VIEW,
    -VIEW,
    0.1,
    100,
  );
  camera.position.z = 10;

  // The wall, and the wider window a frame position has to land inside to notice it.
  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(WALL.max.x - WALL.min.x, WALL.max.y - WALL.min.y),
    new THREE.MeshBasicMaterial({ color: 0x8b949e }),
  );
  scene.add(pane);
  const windowEdges = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-GAP / 2, -2.1, 0),
      new THREE.Vector3(-GAP / 2, 2.1, 0),
      new THREE.Vector3(GAP / 2, -2.1, 0),
      new THREE.Vector3(GAP / 2, 2.1, 0),
    ]),
    new THREE.LineDashedMaterial({ color: DIM, dashSize: 0.16, gapSize: 0.14 }),
  );
  windowEdges.computeLineDistances();
  scene.add(windowEdges);

  const path = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-VIEW * aspect, 0, 0),
      new THREE.Vector3(VIEW * aspect, 0, 0),
    ]),
    new THREE.LineBasicMaterial({ color: DIM }),
  );
  scene.add(path);

  const ring = (color: number) => {
    const geom = new THREE.BufferGeometry().setFromPoints(circle(RADIUS));
    const mesh = new THREE.Line(geom, new THREE.LineBasicMaterial({ color }));
    scene.add(mesh);
    return mesh;
  };
  const ghosts = Array.from({ length: DOTS }, () => ring(DIM));
  const marker = ring(CAUGHT);

  const show = addReadout(el);
  const speed = addSlider(el, "speed", 30, 300, 60, draw, " m/s", 15);
  const offset = addSlider(
    el,
    "where the frames land",
    0,
    0.95,
    0,
    draw,
    "",
    0.05,
  );
  const swept = addCheckbox(el, "sweep between frames instead", false, draw);

  function draw() {
    const positions = framePositions(speed(), offset());
    ghosts.forEach((g, i) => {
      g.visible = i < positions.length;
      if (g.visible) g.position.set(positions[i].x, 0, 0);
    });

    const found = swept()
      ? sweptHit(speed(), offset())
      : discreteHit(speed(), offset());
    marker.visible = found !== null;
    (marker.material as THREE.LineBasicMaterial).color.setHex(CAUGHT);
    if (found) marker.position.set(found.x, 0, 0);

    (pane.material as THREE.MeshBasicMaterial).color.setHex(
      found === null ? MISSED : 0x8b949e,
    );

    const step = stepFor(speed());
    const lead = `${step.toFixed(2)} m per frame, and the wall plus the radius is only ${GAP.toFixed(2)} m wide \u00B7 `;
    show(
      found === null
        ? `${lead}every frame lands clear of it, so nothing was ever detected`
        : swept()
          ? `${lead}the sweep on frame ${found.frame} crosses it, contact at x = ${found.x.toFixed(2)} m`
          : `${lead}frame ${found.frame} happens to land inside it, at x = ${found.x.toFixed(2)} m`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
