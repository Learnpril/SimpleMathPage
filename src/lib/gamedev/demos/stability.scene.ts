/** A spring drawn as position against velocity, where added energy shows up as a spiral. */
import * as THREE from "three";
import {
  METHODS,
  amplitudeRatio,
  phasePath,
  type Method,
} from "./stability-shared.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addPolyline,
  addKey,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const COLOUR: Record<Method, number> = {
  explicit: 0xff7b72,
  "semi-implicit": 0x39d3c3,
  Verlet: 0x7ee787,
};
const TRUTH = 0x8b949e;
const VIEW = 2.6;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 290);

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

  // The exact orbit: a unit circle, because energy is conserved and velocity is scaled to match.
  const circle = addPolyline(scene, TRUTH, {
    dashed: true,
    dashSize: 0.1,
    gapSize: 0.09,
  });
  circle(
    Array.from({ length: 97 }, (_, i) => {
      const a = (i / 96) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
    }),
  );
  const axes = addPolyline(scene, 0x30363d);
  axes([
    new THREE.Vector3(-VIEW * aspect, 0, 0),
    new THREE.Vector3(VIEW * aspect, 0, 0),
  ]);

  const lines = METHODS.map((m) => addPolyline(scene, COLOUR[m]));

  const show = addReadout(el);
  const key = addKey(el, [TRUTH, ...METHODS.map((m) => COLOUR[m])]);
  const rate = addSlider(
    el,
    "physics ticks per second",
    20,
    120,
    60,
    draw,
    " Hz",
    5,
  );
  const cycles = addSlider(el, "oscillations to run", 1, 12, 4, draw, "", 1);

  function draw() {
    const fps = rate();
    const n = cycles();

    METHODS.forEach((m, i) => {
      lines[i](
        phasePath(m, fps, n)
          .filter((p) => Math.abs(p.x) < 40 && Math.abs(p.y) < 40)
          .map((p) => new THREE.Vector3(p.x, p.y, 0)),
      );
    });

    key([
      "exact: a closed circle",
      ...METHODS.map((m) => `${m} x${amplitudeRatio(m, fps, n).toFixed(2)}`),
    ]);
    show(
      `across is position, up is velocity \u00B7 after ${n} oscillation${n === 1 ? "" : "s"} at ${fps} Hz, ` +
        `explicit Euler has grown to ${amplitudeRatio("explicit", fps, n).toFixed(2)}x its starting swing ` +
        `while semi-implicit is still at ${amplitudeRatio("semi-implicit", fps, n).toFixed(2)}x`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
