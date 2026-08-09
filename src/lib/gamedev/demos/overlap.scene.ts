/** Four pairings of volumes, one moved by sliders, and the separation that decides each. */
import * as THREE from "three";
import {
  KINDS,
  MOVING_BOX_HALF,
  MOVING_CAPSULE_HALF,
  MOVING_CAPSULE_RADIUS,
  MOVING_SPHERE_RADIUS,
  STATIC_BOX,
  STATIC_CAPSULE,
  STATIC_SPHERE,
  testAt,
  type Kind,
} from "./overlap-shared.ts";
import { makeCanvas, addSlider, addReadout, addButtonRow } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const CLEAR = 0x39d3c3;
const TOUCHING = 0xff7b72;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 330);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);

  const wire = (geom: THREE.BufferGeometry) => {
    const mat = new THREE.MeshBasicMaterial({ color: CLEAR, wireframe: true });
    const mesh = new THREE.Mesh(geom, mat);
    scene.add(mesh);
    return { mesh, mat };
  };

  const capsuleAxis = new THREE.Vector3(
    STATIC_CAPSULE.b.x - STATIC_CAPSULE.a.x,
    STATIC_CAPSULE.b.y - STATIC_CAPSULE.a.y,
    STATIC_CAPSULE.b.z - STATIC_CAPSULE.a.z,
  );

  // Every shape is built once and shown or hidden, so switching pairings costs nothing.
  const staticShapes: Record<Kind, ReturnType<typeof wire>> = {
    spheres: wire(new THREE.SphereGeometry(STATIC_SPHERE.radius, 20, 14)),
    "sphere and box": wire(
      new THREE.BoxGeometry(
        STATIC_BOX.max.x - STATIC_BOX.min.x,
        STATIC_BOX.max.y - STATIC_BOX.min.y,
        STATIC_BOX.max.z - STATIC_BOX.min.z,
      ),
    ),
    boxes: wire(
      new THREE.BoxGeometry(
        STATIC_BOX.max.x - STATIC_BOX.min.x,
        STATIC_BOX.max.y - STATIC_BOX.min.y,
        STATIC_BOX.max.z - STATIC_BOX.min.z,
      ),
    ),
    capsules: wire(
      new THREE.CapsuleGeometry(
        STATIC_CAPSULE.radius,
        capsuleAxis.length(),
        8,
        16,
      ),
    ),
  };
  staticShapes.capsules.mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    capsuleAxis.clone().normalize(),
  );

  const movingShapes: Record<Kind, ReturnType<typeof wire>> = {
    spheres: wire(new THREE.SphereGeometry(MOVING_SPHERE_RADIUS, 18, 12)),
    "sphere and box": wire(
      new THREE.SphereGeometry(MOVING_SPHERE_RADIUS, 18, 12),
    ),
    boxes: wire(
      new THREE.BoxGeometry(
        MOVING_BOX_HALF * 2,
        MOVING_BOX_HALF * 2,
        MOVING_BOX_HALF * 2,
      ),
    ),
    capsules: wire(
      new THREE.CapsuleGeometry(
        MOVING_CAPSULE_RADIUS,
        MOVING_CAPSULE_HALF * 2,
        8,
        14,
      ),
    ),
  };

  let kind: Kind = "spheres";

  const show = addReadout(el);
  const mark = addButtonRow(
    el,
    KINDS.map((k) => ({
      label: k,
      apply: () => {
        kind = k;
        draw();
      },
    })),
  );
  const mx = addSlider(el, "move across", -5, 5, 2.6, draw, " m", 0.1);
  const my = addSlider(el, "move up", -5, 5, 0.7, draw, " m", 0.1);
  const mz = addSlider(el, "move towards you", -5, 5, 0, draw, " m", 0.1);
  const spin = addSlider(el, "walk around it", -180, 180, 30, draw);

  function draw() {
    const p = { x: mx(), y: my(), z: mz() };
    const { separation, detail } = testAt(kind, p);
    const colour = separation < 0 ? TOUCHING : CLEAR;

    for (const k of KINDS) {
      staticShapes[k].mesh.visible = k === kind;
      movingShapes[k].mesh.visible = k === kind;
      staticShapes[k].mat.color.setHex(colour);
      movingShapes[k].mat.color.setHex(colour);
    }
    movingShapes[kind].mesh.position.set(p.x, p.y, p.z);
    mark(KINDS.indexOf(kind));

    const a = (spin() * Math.PI) / 180;
    camera.position.set(Math.sin(a) * 13, 5.5, Math.cos(a) * 13);
    camera.lookAt(0.8, 0, 0);

    show(
      separation < 0
        ? `overlapping by ${(-separation).toFixed(2)} m \u00B7 ${detail}`
        : `clear by ${separation.toFixed(2)} m \u00B7 ${detail}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
