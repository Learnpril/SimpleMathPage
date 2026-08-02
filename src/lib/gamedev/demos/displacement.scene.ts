/**
 * Two places, and the arrow you get by subtracting one from the other.
 */
import * as THREE from "three";
import { PLAYER, displacement } from "./displacement-shared.ts";
import { length } from "../vectors.ts";
import { makeCanvas, addSlider, addCheckbox, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(10, 10, 0x30363d, 0x21262d));

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(5, 6.5, 8);
  camera.lookAt(0, 0, 0);

  const marker = (colour: number, at: number[]) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 12),
      new THREE.MeshBasicMaterial({ color: colour }),
    );
    m.position.set(at[0], at[1], at[2]);
    scene.add(m);
    return m;
  };

  const player = marker(0x39d3c3, PLAYER);
  const enemy = marker(0xf0883e, [2, 0, -2]);

  // The displacement, drawn from the player. This is what point minus point gives you.
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    player.position,
    1,
    0xffffff,
    0.3,
    0.16,
  );
  scene.add(arrow);

  // The same vector drawn from the origin, to make the point that it has no location.
  const ghost = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0.02, 0),
    1,
    0xffffff,
    0.3,
    0.16,
  );
  (ghost.line.material as THREE.Material).transparent = true;
  (ghost.line.material as THREE.Material).opacity = 0.35;
  (ghost.cone.material as THREE.Material).transparent = true;
  (ghost.cone.material as THREE.Material).opacity = 0.35;
  scene.add(ghost);

  const show = addReadout(el);
  const ex = addSlider(el, "Enemy X", -4, 4, 2, draw, "");
  const ez = addSlider(el, "Enemy Z", -4, 4, -2, draw, "");
  const showGhost = addCheckbox(
    el,
    "draw the same vector from the origin",
    true,
    draw,
  );

  function draw() {
    const target = [ex(), 0, ez()];
    enemy.position.set(target[0], target[1], target[2]);

    // Point minus point. The whole lesson is this one line.
    const toEnemy = displacement(PLAYER, target);
    const dist = length(toEnemy);

    if (dist > 1e-6) {
      const dir = new THREE.Vector3(...toEnemy).normalize();
      arrow.setDirection(dir);
      arrow.setLength(dist, 0.3, 0.16);
      ghost.setDirection(dir);
      ghost.setLength(dist, 0.3, 0.16);
    }
    arrow.visible = dist > 1e-6;
    ghost.visible = showGhost() && dist > 1e-6;

    show(
      `enemy - player = (${toEnemy.map((n) => n.toFixed(0)).join(", ")})` +
        `    distance ${dist.toFixed(2)}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
