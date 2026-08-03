/**
 * A cubic Bezier with movable control points, and de Casteljau's repeated lerps drawn live.
 */
import * as THREE from "three";
import { bezierAt, deCasteljauLevels, tangentFromLevels } from "../bezier.ts";
import type { Vec2 } from "../matrices.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const HALF_W = 2.6;
const LIMIT = 2.4;

const CONTROL = 0xf0883e;
const LEVEL1 = 0x58a6ff;
const LEVEL2 = 0xd2a8ff;
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
    { x: -2, y: -1 },
    { x: -1.2, y: 1.6 },
    { x: 1.1, y: -1.4 },
    { x: 2, y: 0.9 },
  ];

  const addLine = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.09, gapSize: 0.07 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (pts: Vec2[]) => {
      geom.setFromPoints(pts.map((p) => new THREE.Vector3(p.x, p.y, 0)));
      if (dashed) mesh.computeLineDistances();
    };
  };

  const addDots = (count: number, color: number, r: number) => {
    const dots: THREE.Mesh[] = [];
    for (let i = 0; i < count; i += 1) {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(r, 16),
        new THREE.MeshBasicMaterial({ color }),
      );
      scene.add(m);
      dots.push(m);
    }
    return (pts: Vec2[]) =>
      dots.forEach((d, i) => {
        d.visible = i < pts.length;
        if (i < pts.length) d.position.set(pts[i].x, pts[i].y, 0);
      });
  };

  const hull = addLine(0x545d68, true);
  const level1 = addLine(LEVEL1);
  const level2 = addLine(LEVEL2);
  const curveLine = addLine(CURVE);
  const tangentLine = addLine(LEVEL2);

  const controlDots = addDots(4, CONTROL, 0.075);
  const level1Dots = addDots(3, LEVEL1, 0.05);
  const level2Dots = addDots(2, LEVEL2, 0.05);
  const onCurve = addDots(1, CURVE, 0.09);
  const selectedRing = new THREE.Mesh(
    new THREE.RingGeometry(0.11, 0.14, 20),
    new THREE.MeshBasicMaterial({ color: CONTROL }),
  );
  scene.add(selectedRing);

  let selected = 1;
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
    "selected point x",
    -LIMIT,
    LIMIT,
    points[1].x,
    moveSelected,
    "",
    0.1,
  );
  const ys = addSlider(
    el,
    "selected point y",
    -LIMIT,
    LIMIT,
    points[1].y,
    moveSelected,
    "",
    0.1,
  );
  const t = addSlider(el, "t along the curve", 0, 1, 0.42, draw, "", 0.01);

  function moveSelected() {
    points[selected] = { x: xs(), y: ys() };
    draw();
  }

  // Pointer dragging, which is the direct way to feel what a control point does.
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
    if (bestDist > 0.6) return;
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
    const levels = deCasteljauLevels(points, t());

    hull(points);
    controlDots(points);
    level1([...levels[1]]);
    level1Dots(levels[1]);
    level2([...levels[2]]);
    level2Dots(levels[2]);

    const path: Vec2[] = [];
    for (let i = 0; i <= 120; i += 1) path.push(bezierAt(points, i / 120));
    curveLine(path);

    const here = levels[3][0];
    onCurve([here]);
    selectedRing.position.set(points[selected].x, points[selected].y, 0);

    // The purple segment above is already the tangent direction. Draw it from the curve too.
    const tan = tangentFromLevels(levels);
    const len = Math.hypot(tan.x, tan.y) || 1;
    tangentLine([
      here,
      { x: here.x + (tan.x / len) * 1.1, y: here.y + (tan.y / len) * 1.1 },
    ]);

    show(
      `t ${t().toFixed(2)}  \u00B7  moving P${selected}  \u00B7  ` +
        `the purple segment is the tangent, times ${points.length - 1}`,
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
