/** The whole controller running a scripted route, with each piece switchable off. */
import * as THREE from "three";
import {
  HEIGHT,
  RADIUS,
  capsuleFor,
  uprightCapsuleContact,
} from "../controller.ts";
import {
  ALL_ON,
  DURATION,
  LEVEL,
  TICK,
  drawnAt,
  inputAt,
  simulate,
  type Switches,
} from "./capstone-shared.ts";
import {
  makeCanvas,
  addSlider,
  addCheckbox,
  addReadout,
  addPolyline,
} from "./ui.ts";
import type { MountFn } from "./runner.ts";

const BODY = 0x39d3c3;
const BROKEN = 0xff7b72;
const TRAIL = 0xd2a8ff;
const SOLID = 0x484f58;
const FACING = 0xf0883e;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 330);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 200);

  // The level, drawn once: it never moves.
  for (const box of LEVEL) {
    const size = {
      x: box.max.x - box.min.x,
      y: box.max.y - box.min.y,
      z: box.max.z - box.min.z,
    };
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x, size.y, size.z)),
      new THREE.LineBasicMaterial({ color: SOLID }),
    );
    edges.position.set(
      (box.min.x + box.max.x) / 2,
      (box.min.y + box.max.y) / 2,
      (box.min.z + box.max.z) / 2,
    );
    scene.add(edges);
  }

  const bodyMaterial = new THREE.MeshBasicMaterial({
    color: BODY,
    wireframe: true,
  });
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(RADIUS, HEIGHT - 2 * RADIUS, 6, 14),
    bodyMaterial,
  );
  scene.add(body);

  const trail = addPolyline(scene, TRAIL);
  const facing = addPolyline(scene, FACING);

  const state = addReadout(el);
  const pieces = addReadout(el);
  const when = addSlider(
    el,
    "scrub through the run",
    0,
    DURATION,
    1.2,
    draw,
    " s",
    0.02,
  );
  const spin = addSlider(el, "walk around it", -180, 180, 35, draw);
  const slide = addCheckbox(
    el,
    "slide along walls instead of stopping dead",
    true,
    rerun,
  );
  const shortest = addCheckbox(el, "turn the short way round", true, rerun);
  const normalize = addCheckbox(
    el,
    "normalize the input direction",
    true,
    rerun,
  );
  const smooth = addCheckbox(el, "draw between ticks, not on them", true, draw);

  let switches: Switches = ALL_ON;
  let ticks = simulate(switches);

  function rerun() {
    switches = {
      slide: slide(),
      shortestTurn: shortest(),
      normalize: normalize(),
    };
    ticks = simulate(switches);
    draw();
  }

  function draw() {
    const t = when();
    const shown = drawnAt(ticks, t, smooth());
    const index = Math.min(Math.round(t / TICK), ticks.length - 1);
    const live = ticks[index];

    body.position.set(
      shown.position.x,
      shown.position.y + HEIGHT / 2,
      shown.position.z,
    );
    const allOn = slide() && shortest() && normalize();
    bodyMaterial.color.setHex(allOn ? BODY : BROKEN);

    // Where the body is pointing, which lags where it is going.
    const nose = {
      x: shown.position.x + Math.sin(shown.yaw) * 1.4,
      z: shown.position.z + Math.cos(shown.yaw) * 1.4,
    };
    facing([
      new THREE.Vector3(
        shown.position.x,
        shown.position.y + 0.9,
        shown.position.z,
      ),
      new THREE.Vector3(nose.x, shown.position.y + 0.9, nose.z),
    ]);

    trail(
      ticks
        .slice(0, index + 1)
        .map(
          (c) =>
            new THREE.Vector3(c.position.x, c.position.y + 0.05, c.position.z),
        ),
    );

    const a = (spin() * Math.PI) / 180;
    camera.position.set(Math.sin(a) * 19, 11, Math.cos(a) * 19);
    camera.lookAt(-1, 0, 0);

    const input = inputAt(index * TICK);
    const speed = Math.hypot(live.velocity.x, live.velocity.z);
    const touching = LEVEL.filter(
      (box) =>
        uprightCapsuleContact(
          { ...capsuleFor(live.position), radius: RADIUS + 0.02 },
          box,
        ) !== null,
    ).length;
    state(
      `${speed.toFixed(2)} m/s \u00B7 facing ${((shown.yaw * 180) / Math.PI).toFixed(0)}\u00B0 \u00B7 ` +
        `${live.grounded ? "on the ground" : "in the air"} \u00B7 touching ${touching} surface${touching === 1 ? "" : "s"} \u00B7 ` +
        `stick (${input.forward}, ${input.strafe})${input.jump ? " + jump" : ""}`,
    );

    const off: string[] = [];
    if (!slide()) off.push("no sliding: it stops dead at the wall");
    if (!shortest()) off.push("no shortest turn: it spins the long way round");
    if (!normalize()) off.push("no normalize: diagonals run 25% fast");
    if (!smooth())
      off.push("no interpolation: it only moves on tick boundaries");
    pieces(off.length === 0 ? "every piece switched on" : off.join(" \u00B7 "));

    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
