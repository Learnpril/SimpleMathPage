/**
 * The screen as a rectangle of pixels, with markers placed where world objects project to.
 */
import * as THREE from "three";
import { SCREEN_H, SCREEN_W, markers } from "./marker-shared.ts";
import { makeCanvas, addSlider, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const GOOD = 0x39d3c3;
const BAD = 0xff7b72;
const FRAME = 0x6e7681;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  // World units here are screen pixels, so the maths and the picture share a coordinate system.
  const halfH = SCREEN_H * 0.72;
  const halfW = (halfH * width) / height;
  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.OrthographicCamera(
    -halfW,
    halfW,
    halfH,
    -halfH,
    0.1,
    10,
  );
  camera.position.z = 5;

  // Pixel space to scene space: origin at the top left, y counting down.
  const toScene = (x: number, y: number) =>
    new THREE.Vector3(x - SCREEN_W / 2, SCREEN_H / 2 - y, 0);

  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        toScene(0, 0),
        toScene(SCREEN_W, 0),
        toScene(SCREEN_W, SCREEN_H),
        toScene(0, SCREEN_H),
        toScene(0, 0),
      ]),
      new THREE.LineBasicMaterial({ color: FRAME }),
    ),
  );

  /** A little health bar, so a marker looks like the thing it stands for. */
  function makeMarker() {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.LineSegments(
      geom,
      new THREE.LineBasicMaterial({ color: GOOD }),
    );
    scene.add(mesh);
    return (x: number, y: number, color: number, visible: boolean) => {
      mesh.visible = visible;
      (mesh.material as THREE.LineBasicMaterial).color.setHex(color);
      if (!visible) return;
      const w = 26;
      const h = 7;
      const corners = [
        toScene(x - w, y - h),
        toScene(x + w, y - h),
        toScene(x + w, y + h),
        toScene(x - w, y + h),
      ];
      geom.setFromPoints([
        corners[0],
        corners[1],
        corners[1],
        corners[2],
        corners[2],
        corners[3],
        corners[3],
        corners[0],
        // A stalk down to the object's own position.
        toScene(x, y + h),
        toScene(x, y + h + 12),
      ]);
    };
  }

  const marks = markers(0).map(() => makeMarker());

  const show = addReadout(el);
  const yaw = addSlider(el, "turn the camera", -180, 180, 25, draw);
  const careless = addCheckbox(
    el,
    "skip the behind-the-camera check",
    false,
    draw,
  );

  function draw() {
    const list = markers(yaw());
    let drawn = 0;
    let wrong = 0;

    list.forEach((m, i) => {
      const inBounds =
        m.x >= 0 && m.x <= SCREEN_W && m.y >= 0 && m.y <= SCREEN_H;
      const shown = careless() ? inBounds : m.onScreen;
      // A marker drawn for something behind the camera is the bug, so colour it as one.
      const isWrong = shown && !m.inFront;
      if (shown) drawn += 1;
      if (isWrong) wrong += 1;
      marks[i](m.x, m.y, isWrong ? BAD : GOOD, shown);
    });

    show(
      `${drawn} marker${drawn === 1 ? "" : "s"} drawn` +
        (wrong > 0
          ? `  \u00B7  ${wrong} of them is behind the camera`
          : "  \u00B7  none behind the camera"),
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
