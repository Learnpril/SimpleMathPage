/**
 * A Catmull-Rom path through movable waypoints, with the tangent it picks at each one.
 */
import * as THREE from "three";
import { catmullRomAt, catmullTangent, segmentCount } from "../splines.ts";
import type { Vec2 } from "../matrices.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HALF_W = 2.7;
const LIMIT = 2.5;

const POINT = 0xf0883e;
const TANGENT = 0xd2a8ff;
const CURVE = 0x39d3c3;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

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

  const points: Vec2[] = [
    { x: -2.3, y: -0.9 },
    { x: -1.7, y: 0.8 },
    { x: -1.2, y: -0.4 },
    { x: 1.4, y: 0.9 },
    { x: 2.3, y: -0.7 },
  ];

  const addLine = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.07, gapSize: 0.06 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (pts: Vec2[]) => {
      geom.setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      if (dashed) mesh.computeLineDistances();
    };
  };

  const curveLine = addLine(CURVE);
  const legs = addLine(0x3d444d, true);
  // One dashed segment per waypoint, showing the tangent Catmull-Rom chose there.
  const tangentLines = points.map(() => addLine(TANGENT));

  const dot = (color: number, r: number) => {
    const m = new THREE.Mesh(
      new THREE.CircleGeometry(r, 18),
      new THREE.MeshBasicMaterial({ color }),
    );
    scene.add(m);
    return m;
  };
  const waypointDots = points.map(() => dot(POINT, 0.07));
  const rider = dot(CURVE, 0.095);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.105, 0.135, 20),
    new THREE.MeshBasicMaterial({ color: POINT }),
  );
  scene.add(ring);

  let selected = 2;
  const show = addReadout(el);

  const setActive = addButtonRow(
    el,
    points.map((_, i) => ({
      label: `P${i}`,
      apply: () => {
        selected = i;
        xs.set(points[i].x);
        ys.set(points[i].y);
        draw();
      },
    })),
  );

  const xs = addSlider(
    el,
    "waypoint x",
    -LIMIT,
    LIMIT,
    points[2].x,
    moveSelected,
    "",
    0.1,
  );
  const ys = addSlider(
    el,
    "waypoint y",
    -LIMIT,
    LIMIT,
    points[2].y,
    moveSelected,
    "",
    0.1,
  );
  const tension = addSlider(el, "tension", 0, 1, 0.5, draw, "", 0.05);
  const t = addSlider(
    el,
    "t along the whole path",
    0,
    1,
    0.35,
    draw,
    "",
    0.005,
  );

  function moveSelected() {
    points[selected] = { x: xs(), y: ys() };
    draw();
  }

  const canvas = renderer.domElement;
  let dragging = false;

  const toWorld = (event: PointerEvent): Vec2 => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * 2 * HALF_W - HALF_W,
      y: -(((event.clientY - rect.top) / rect.height) * 2 * halfH - halfH),
    };
  };

  const onDown = (event: PointerEvent) => {
    const w = toWorld(event);
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.hypot(p.x - w.x, p.y - w.y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    if (bestDist > 0.55) return;
    selected = best;
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    onMove(event);
  };

  const onMove = (event: PointerEvent) => {
    if (!dragging) return;
    const w = toWorld(event);
    points[selected] = {
      x: Math.max(-LIMIT, Math.min(LIMIT, w.x)),
      y: Math.max(-LIMIT, Math.min(LIMIT, w.y)),
    };
    xs.set(points[selected].x);
    ys.set(points[selected].y);
    draw();
  };

  const onUp = () => {
    dragging = false;
  };

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  function draw() {
    const k = tension();

    const path: Vec2[] = [];
    for (let i = 0; i <= 220; i += 1)
      path.push(catmullRomAt(points, i / 220, k));
    curveLine(path);
    legs(points);

    points.forEach((p, i) => {
      waypointDots[i].position.set(p.x, p.y, 0);
      const m = catmullTangent(points, i, k);
      // Drawn at a third of its length, which is where the equivalent Bezier handle sits.
      tangentLines[i]([
        { x: p.x - m.x / 3, y: p.y - m.y / 3 },
        { x: p.x + m.x / 3, y: p.y + m.y / 3 },
      ]);
    });

    const here = catmullRomAt(points, t(), k);
    rider.position.set(here.x, here.y, 0);
    ring.position.set(points[selected].x, points[selected].y, 0);
    setActive(selected);

    const segs = segmentCount(points);
    show(
      `moving P${selected}  \u00B7  tension ${k.toFixed(2)}  \u00B7  ` +
        `the path meets every waypoint, at t = 0, ${(1 / segs).toFixed(2)}, ${(2 / segs).toFixed(2)}, ...`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("pointercancel", onUp);
    renderer.dispose();
  };
};

export default mount;
