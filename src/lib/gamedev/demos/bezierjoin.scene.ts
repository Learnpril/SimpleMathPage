/**
 * Two cubics joined three ways, with a dot sweeping across the seam.
 */
import * as THREE from "three";
import { bezierAt } from "../bezier.ts";
import type { Vec2 } from "../matrices.ts";
import {
  FIRST,
  JOINS,
  chainAt,
  seamSpeeds,
  secondFor,
  type Join,
} from "./join-shared.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HALF_W = 2.7;
const FIRST_COLOR = 0x39d3c3;
const SECOND_COLOR = 0xf0883e;

const LABELS: Record<Join, string> = {
  broken: "Corner",
  g1: "Looks smooth",
  c1: "Actually smooth",
};

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

  const addLine = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.08, gapSize: 0.06 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (pts: Vec2[]) => {
      geom.setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      if (dashed) mesh.computeLineDistances();
    };
  };

  const dot = (color: number, r: number) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 18),
      new THREE.MeshBasicMaterial({ color }),
    );
    scene.add(m);
    return m;
  };

  const firstLine = addLine(FIRST_COLOR);
  const secondLine = addLine(SECOND_COLOR);
  const handle = addLine(0x545d68, true);
  const seam = dot(0xd2a8ff, 0.07);
  const rider = dot(0x58a6ff, 0.1);

  // The first curve never changes, so draw it once.
  const firstPts: Vec2[] = [];
  for (let i = 0; i <= 100; i += 1) firstPts.push(bezierAt(FIRST, i / 100));
  firstLine(firstPts);
  seam.position.set(FIRST[3].x, FIRST[3].y, 0);

  let join: Join = "broken";
  const show = addReadout(el);
  const setActive = addButtonRow(
    el,
    JOINS.map((j, i) => ({
      label: LABELS[j],
      apply: () => {
        join = j;
        setActive(i);
        draw();
      },
    })),
  );
  const t = addSlider(
    el,
    "travel along both curves",
    0,
    1,
    0.5,
    draw,
    "",
    0.005,
  );

  function draw() {
    const second = secondFor(join);
    const pts: Vec2[] = [];
    for (let i = 0; i <= 100; i += 1) pts.push(bezierAt(second, i / 100));
    secondLine(pts);

    // The one control point that differs between the three cases.
    handle([FIRST[2], FIRST[3], second[1]]);

    const here = chainAt(join, t());
    rider.position.set(here.x, here.y, 0);
    setActive(JOINS.indexOf(join));

    const s = seamSpeeds(join);
    show(
      `${LABELS[join]}  \u00B7  speed into the seam ${s.leaving.toFixed(2)}, ` +
        `out of it ${s.entering.toFixed(2)}` +
        (Math.abs(s.entering - s.leaving) < 1e-9
          ? "  \u00B7  no jump"
          : "  \u00B7  jumps"),
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
