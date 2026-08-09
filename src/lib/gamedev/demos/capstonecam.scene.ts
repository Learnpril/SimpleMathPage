/** Three ways to point a camera at the same character: orbit, damped follow, and a scripted shot. */
import * as THREE from "three";
import { HEIGHT, RADIUS, lookTarget, orbitPosition } from "../controller.ts";
import { damp, rateFromHalfLife } from "../interpolation.ts";
import { LEVEL, SHOT, TICK, shotAt, simulate } from "./capstone-shared.ts";
import {
  makeCanvas,
  addSlider,
  addReadout,
  addButtonRow,
  addPolyline,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const BODY = 0x39d3c3;
const RIG = 0xf0883e;
const PATH = 0xd2a8ff;
const SOLID = 0x484f58;
const MODES = ["orbit", "damped follow", "scripted shot"] as const;
type Mode = (typeof MODES)[number];

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 320);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 200);

  for (const box of LEVEL) {
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          box.max.x - box.min.x,
          box.max.y - box.min.y,
          box.max.z - box.min.z,
        ),
      ),
      new THREE.LineBasicMaterial({ color: SOLID }),
    );
    edges.position.set(
      (box.min.x + box.max.x) / 2,
      (box.min.y + box.max.y) / 2,
      (box.min.z + box.max.z) / 2,
    );
    scene.add(edges);
  }

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(RADIUS, HEIGHT - 2 * RADIUS, 6, 14),
    new THREE.MeshBasicMaterial({ color: BODY, wireframe: true }),
  );
  scene.add(body);

  const rig = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 14, 10),
    new THREE.MeshBasicMaterial({ color: RIG }),
  );
  scene.add(rig);

  const sightLine = addPolyline(scene, RIG, {
    dashed: true,
    dashSize: 0.4,
    gapSize: 0.3,
  });
  const shotPath = addPolyline(scene, PATH);
  const waypoints = SHOT.map(() => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 8),
      new THREE.MeshBasicMaterial({ color: PATH }),
    );
    scene.add(m);
    return m;
  });
  SHOT.forEach((p, i) => waypoints[i].position.set(p.x, p.y, p.z));

  const ticks = simulate();
  let mode: Mode = "orbit";
  /* The damped camera has to remember where it was, because Section 4.1's damp is a step from the
     current position rather than a formula for it. Scrubbing backwards therefore replays from the
     start, which is the honest way to show a stateful camera on a scrub slider. */

  const show = addReadout(el);
  const note = addReadout(el);
  const mark = addButtonRow(
    el,
    MODES.map((m) => ({
      label: m,
      apply: () => {
        mode = m;
        draw();
      },
    })),
  );
  const when = addSlider(
    el,
    "scrub through the run",
    0,
    5.5,
    2.4,
    draw,
    " s",
    0.02,
  );
  const around = addSlider(el, "camera angle around", -180, 180, 35, draw);
  const halfLife = addSlider(
    el,
    "follow half-life",
    0.02,
    0.6,
    0.12,
    draw,
    " s",
    0.02,
  );

  function draw() {
    const t = when();
    const index = Math.min(Math.round(t / TICK), ticks.length - 1);
    const here = ticks[index].position;
    body.position.set(here.x, here.y + HEIGHT / 2, here.z);
    const target = lookTarget(here);

    let eye: THREE.Vector3;
    if (mode === "orbit") {
      const p = orbitPosition(target, around(), 22, 8);
      eye = new THREE.Vector3(p.x, p.y, p.z);
      note(
        "azimuth, elevation and distance, so each drag axis drives exactly one number \u00B7 Section 5.2",
      );
    } else if (mode === "damped follow") {
      // Replayed from the start, because a damped follow depends on where it has been.
      let held = orbitPosition(lookTarget(ticks[0].position), around(), 22, 8);
      /* `damp` wants a rate, not a half-life. Section 4.1 exposed the half-life to designers and
         kept the conversion in one place precisely so this substitution cannot be made by hand. */
      const rate = rateFromHalfLife(halfLife());
      for (let i = 1; i <= index; i += 1) {
        const wanted = orbitPosition(
          lookTarget(ticks[i].position),
          around(),
          22,
          8,
        );
        held = {
          x: damp(held.x, wanted.x, rate, TICK),
          y: damp(held.y, wanted.y, rate, TICK),
          z: damp(held.z, wanted.z, rate, TICK),
        };
      }
      eye = new THREE.Vector3(held.x, held.y, held.z);
      note(
        `the orbit position chased with a ${halfLife().toFixed(2)} s half-life, so the camera lags and settles \u00B7 Section 4.1`,
      );
    } else {
      const u = t / 5.5;
      const p = shotAt(u);
      eye = new THREE.Vector3(p.x, p.y, p.z);
      note(
        "a Catmull-Rom spline through six placed waypoints, ignoring the character entirely \u00B7 Section 4.4",
      );
    }

    rig.position.copy(eye);
    sightLine([eye, new THREE.Vector3(target.x, target.y, target.z)]);
    shotPath(
      mode === "scripted shot"
        ? Array.from({ length: 121 }, (_, i) => {
            const p = shotAt(i / 120);
            return new THREE.Vector3(p.x, p.y, p.z);
          })
        : [],
    );
    waypoints.forEach((w) => (w.visible = mode === "scripted shot"));
    mark(MODES.indexOf(mode));

    // The scene is watched from outside, so the camera being demonstrated stays visible.
    const a = (around() * Math.PI) / 180 + Math.PI * 0.65;
    camera.position.set(Math.sin(a) * 26, 15, Math.cos(a) * 26);
    camera.lookAt(-1, 1, 0);

    show(
      `the orange dot is the camera being placed, ${eye.distanceTo(new THREE.Vector3(target.x, target.y, target.z)).toFixed(1)} m from the character it is aimed at`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
