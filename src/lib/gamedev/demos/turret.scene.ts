/**
 * A turret that turns to follow your pointer, with the fix on a switch.
 */
import * as THREE from "three";
import { wrapRad, yawToFace } from "./turret-shared.ts";
import { makeCanvas, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const TURN_RATE = 2.5; // radians per second

const mount: MountFn = (el, { reduced }) => {
  const { renderer, width, height, background, isDark } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;

  // Looking straight down, so the scene reads as a plan view.
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 9, 0.01);
  camera.lookAt(0, 0, 0);

  // A cone points along +Y by default, so tip it forward onto -Z.
  const barrel = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 2.2, 20),
    new THREE.MeshBasicMaterial({ color: 0x39d3c3 }),
  );
  barrel.rotation.x = -Math.PI / 2;
  barrel.position.z = -1.1;

  const base = new THREE.Mesh(
    new THREE.CircleGeometry(0.55, 24),
    new THREE.MeshBasicMaterial({ color: isDark ? 0x30363d : 0xd0d7de }),
  );
  base.rotation.x = -Math.PI / 2;

  const turret = new THREE.Group();
  turret.add(barrel, base);

  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(turret, marker);

  const target = new THREE.Vector3(3, 0, 0);
  marker.position.copy(target);

  renderer.domElement.addEventListener("pointermove", (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    target.set(
      (((e.clientX - r.left) / r.width) * 2 - 1) * 7,
      0,
      (((e.clientY - r.top) / r.height) * 2 - 1) * 3.6,
    );
    marker.position.copy(target);
    if (reduced) tick(1 / 60);
  });

  const show = addReadout(el);
  const useWrap = addCheckbox(
    el,
    "wrap the angle difference (the fix)",
    true,
    () => {},
  );

  const deg = (r: number) => `${((r * 180) / Math.PI).toFixed(0)}\u00B0`;

  // This is the whole lesson, and it runs once per frame.
  function step(dt: number) {
    // Where should it face? Forward is local -Z, so both components are negated.
    const desired = yawToFace(target.x, target.z);

    // How far is that from where it is now, and which way is shorter?
    const raw = desired - turret.rotation.y;
    const delta = useWrap() ? wrapRad(raw) : raw;

    // Turn by at most this much, so it looks mechanical instead of instant.
    const limit = TURN_RATE * dt;
    turret.rotation.y += Math.min(limit, Math.max(-limit, delta));

    show(`turning by ${deg(delta)}${useWrap() ? "" : "  \u2190 the long way"}`);
  }

  let animId = 0;
  let last = performance.now();

  function tick(dt: number) {
    step(dt);
    renderer.render(scene, camera);
  }

  function frame() {
    animId = requestAnimationFrame(frame);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tick(dt);
  }

  // One static frame for readers who asked for reduced motion; pointer moves still
  // advance it, so the figure stays usable.
  if (reduced) tick(0);
  else frame();

  return () => {
    if (animId) cancelAnimationFrame(animId);
    renderer.dispose();
  };
};

export default mount;
