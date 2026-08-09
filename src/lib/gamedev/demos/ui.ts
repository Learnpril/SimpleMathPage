/**
 * The drawing helpers a Three.js scene needs: a WebGL canvas, a polyline, a wireframe box.
 *
 * The labelled controls used to live here too. They moved to `controls.ts`, which imports nothing,
 * because this file imports Three at module scope and Rollup keeps that alive for any chunk that
 * touches the module - so a 2D scene asking here for a slider was pulling 505 KB of Three.js with
 * it. Everything in `controls.ts` is re-exported below, so existing scenes import from here exactly
 * as before.
 */
import * as THREE from "three";
export * from "./controls.ts";

const DARK_BG = 0x0d1117;
const LIGHT_BG = 0xf8f9fa;
export function makeCanvas(el: HTMLElement, height = 300) {
  const width = Math.min(el.clientWidth || 620, 620);
  const isDark = document.documentElement.dataset.theme !== "light";
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.appendChild(renderer.domElement);
  return {
    renderer,
    width,
    height,
    isDark,
    background: new THREE.Color(isDark ? DARK_BG : LIGHT_BG),
  };
}

/**
 * A labelled slider with a live numeric readout.
 *
 * Returns a getter for its value, with a `.set()` attached so a preset button can move it.
 * Setting does not fire the input event, so the caller redraws once after setting them all
 * rather than once per slider.
 */

export function addPolyline(
  scene: THREE.Scene,
  color: number,
  opts: { dashed?: boolean; dashSize?: number; gapSize?: number } = {},
): (points: THREE.Vector3[]) => void {
  const geom = new THREE.BufferGeometry();
  const mesh = new THREE.Line(
    geom,
    opts.dashed
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: opts.dashSize ?? 0.2,
          gapSize: opts.gapSize ?? 0.16,
        })
      : new THREE.LineBasicMaterial({ color }),
  );
  scene.add(mesh);

  let capacity = 0;
  return (points: THREE.Vector3[]) => {
    mesh.visible = points.length > 1;
    if (!mesh.visible) return;
    if (points.length !== capacity) {
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points.length * 3, 3),
      );
      capacity = points.length;
    }
    const position = geom.getAttribute("position") as THREE.BufferAttribute;
    points.forEach((p, i) => position.setXYZ(i, p.x, p.y, p.z));
    position.needsUpdate = true;
    geom.setDrawRange(0, points.length);
    geom.computeBoundingSphere();
    if (opts.dashed) mesh.computeLineDistances();
  };
}

/**
 * Stacked intervals on one shared axis, drawn flat under the scene.
 *
 * For comparing ranges of a parameter this beats drawing them into the 3D scene, and the
 * slab demo is why the helper exists: bars laid along the ray in 3D were foreshortened by
 * whatever angle the camera happened to be at, and any part of an interval before zero
 * appeared behind the ray's start, so three intervals that share an axis looked like three
 * unrelated line segments. Flat and stacked, an overlap is impossible to misread.
 *
 * Each row's label carries its own name and numbers, so the picture is a bonus rather than
 * the only way to read it.
 */


/** The eight corners of a unit cube centred on the origin. */
const BOX_CORNERS: ReadonlyArray<readonly [number, number, number]> = [
  [-0.5, -0.5, -0.5],
  [0.5, -0.5, -0.5],
  [0.5, -0.5, 0.5],
  [-0.5, -0.5, 0.5],
  [-0.5, 0.5, -0.5],
  [0.5, 0.5, -0.5],
  [0.5, 0.5, 0.5],
  [-0.5, 0.5, 0.5],
];

/** Its twelve edges, as pairs of corner indices. */
const BOX_EDGES: ReadonlyArray<readonly [number, number]> = [
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

/** Where a corner of the box ends up once a transform has been applied to it. */
export type Place = (
  corner: readonly [number, number, number],
) => [number, number, number];

/**
 * A wireframe box in a scene, redrawn by handing it a function that places its corners.
 *
 * Keeping the corner list here rather than in each scene means a scene file reads as the
 * transform it is demonstrating instead of twenty lines of cube vertices.
 */
export function addBoxWire(
  scene: THREE.Scene,
  color: number,
  opts: { dashed?: boolean } = {},
): (place: Place) => void {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(BOX_EDGES.length * 6), 3),
  );
  const mesh = new THREE.LineSegments(
    geom,
    opts.dashed
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: 0.12,
          gapSize: 0.1,
        })
      : new THREE.LineBasicMaterial({ color }),
  );
  scene.add(mesh);

  return (place: Place) => {
    const pts: THREE.Vector3[] = [];
    for (const [a, b] of BOX_EDGES) {
      pts.push(
        new THREE.Vector3(...place(BOX_CORNERS[a])),
        new THREE.Vector3(...place(BOX_CORNERS[b])),
      );
    }
    geom.setFromPoints(pts);
    if (opts.dashed) mesh.computeLineDistances();
  };
}
