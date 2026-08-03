/**
 * The same box under all six orderings of scale, rotate and translate.
 */
import * as THREE from "three";
import {
  SEQUENCES,
  applyMat4,
  composeSequence,
  point,
  type Mat4,
  type Sequence,
  type TRS,
  type Vec4,
} from "../matrices.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addButtonRow,
  addBoxWire,
  type Place,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const LETTER = { scale: "S", rotate: "R", translate: "T" } as const;
const labelFor = (seq: Sequence) => seq.map((s) => LETTER[s]).join("\u2192");

const via =
  (m: Mat4): Place =>
  (c) => {
    const p = applyMat4(m, point(c[0], c[1], c[2]));
    return [p.x, p.y, p.z];
  };

/**
 * Whether the box still has right angles at its corners.
 *
 * Its edges are the matrix's first three columns, so they stay square exactly while those
 * columns stay perpendicular. Scaling unevenly *after* a rotation is what breaks it.
 */
function stillSquare(m: Mat4): boolean {
  const d = (a: Vec4, b: Vec4) => Math.abs(a.x * b.x + a.y * b.y + a.z * b.z);
  return d(m.i, m.j) < 1e-6 && d(m.j, m.k) < 1e-6 && d(m.i, m.k) < 1e-6;
}

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(1, 6.5, 9);
  camera.lookAt(0, 0, 0);

  // Dashed is always the standard ordering, so there is a reference to compare against.
  const ghost = addBoxWire(scene, 0x7d8590, { dashed: true });
  const box = addBoxWire(scene, 0x39d3c3);

  // Grey is the position you asked for. Orange is where the chosen order actually put it.
  const asked = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0x7d8590 }),
  );
  const landed = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 10),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(asked, landed);

  let chosen = 0;
  const show = addReadout(el);
  const setActive = addButtonRow(
    el,
    SEQUENCES.map((seq, i) => ({
      label: labelFor(seq),
      apply: () => {
        chosen = i;
        draw();
      },
    })),
  );

  const stretch = addSlider(
    el,
    "stretch along its own x",
    0.4,
    2.6,
    2.2,
    draw,
    "\u00D7",
    0.1,
  );
  const spin = addSlider(el, "rotate about y", 0, 360, 40, draw);
  const move = addSlider(el, "translate along x", -3, 3, 2, draw, "", 0.5);

  function draw() {
    const v: TRS = {
      scale: { x: stretch(), y: 1, z: 1 },
      degrees: spin(),
      translate: { x: move(), y: 0, z: 0 },
    };
    const seq = SEQUENCES[chosen];
    const m = composeSequence(v, seq);

    ghost(via(composeSequence(v, SEQUENCES[0])));
    box(via(m));

    const where = applyMat4(m, point(0, 0, 0));
    asked.position.set(v.translate.x, 0, 0);
    landed.position.set(where.x, where.y, where.z);
    setActive(chosen);

    show(
      `${labelFor(seq)}  ·  asked for x ${v.translate.x.toFixed(1)}, ` +
        `landed at (${where.x.toFixed(1)}, ${where.z.toFixed(1)})  ·  ` +
        `${stillSquare(m) ? "corners still square" : "corners sheared"}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
