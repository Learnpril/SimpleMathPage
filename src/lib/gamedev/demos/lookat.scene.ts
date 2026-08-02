/**
 * A camera on a post that turns to look at a target. This is `lookAt`, built by hand.
 */
import * as THREE from "three";
import { buildBasis } from "../cross.ts";
import { targetAt } from "./lookat-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el);

  const scene = new THREE.Scene();
  scene.background = background;
  scene.add(new THREE.GridHelper(8, 8, 0x30363d, 0x21262d));

  const view = new THREE.PerspectiveCamera(44, width / height, 0.1, 100);
  view.position.set(5.2, 3.8, 6);
  view.lookAt(0, 0.4, 0);

  // World up, drawn faintly. It is the second input to the first cross product, and the
  // reason "right" comes out horizontal.
  scene.add(
    new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 3.6, 0),
      ]),
      new THREE.LineBasicMaterial({
        color: 0x7ee787,
        transparent: true,
        opacity: 0.25,
      }),
    ),
  );

  // The thing doing the looking. A cone tipped to point along its local -Z.
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.3, 1.3, 20),
    new THREE.MeshBasicMaterial({ color: 0x39d3c3 }),
  );
  body.rotation.x = -Math.PI / 2;
  body.position.z = -0.65;
  const camera = new THREE.Group();
  camera.add(body);
  scene.add(camera);

  const arrow = (colour: number) => {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1.7,
      colour,
      0.26,
      0.14,
    );
    scene.add(a);
    return a;
  };
  const rightArrow = arrow(0x58a6ff);
  const upArrow = arrow(0x7ee787);
  const fwdArrow = arrow(0xffffff);

  const target = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xf0883e }),
  );
  scene.add(target);

  const sight = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineDashedMaterial({
      color: 0xf0883e,
      dashSize: 0.2,
      gapSize: 0.16,
    }),
  );
  scene.add(sight);

  const show = addReadout(el);
  const bearing = addSlider(el, "Target bearing", -180, 180, 40, draw);
  const elevation = addSlider(el, "Target height", -90, 90, 20, draw);

  function draw() {
    const p = targetAt(bearing(), elevation());
    target.position.set(p[0], p[1], p[2]);
    sight.geometry.setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(...p),
    ]);
    sight.computeLineDistances();

    // Two cross products turn "look there" into a full orientation - or report that
    // there isn't one.
    const b = buildBasis(p);

    if (b === null) {
      // The target is straight up or straight down, so world up and forward are the same
      // line and there is no perpendicular to call "right".
      (body.material as THREE.MeshBasicMaterial).color.setHex(0x6e7681);
      for (const a of [rightArrow, upArrow, fwdArrow]) a.visible = false;
      show("no orientation exists here: every direction is equally 'right'");
      renderer.render(scene, view);
      return;
    }

    (body.material as THREE.MeshBasicMaterial).color.setHex(0x39d3c3);
    for (const a of [rightArrow, upArrow, fwdArrow]) a.visible = true;

    rightArrow.setDirection(new THREE.Vector3(...b.right));
    upArrow.setDirection(new THREE.Vector3(...b.up));
    fwdArrow.setDirection(new THREE.Vector3(...b.forward));

    // The three vectors become the columns of a rotation matrix. Local +Z is backward,
    // which is why forward is negated here.
    camera.quaternion.setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(
        new THREE.Vector3(...b.right),
        new THREE.Vector3(...b.up),
        new THREE.Vector3(...b.forward).negate(),
      ),
    );

    const n = (v: number) => (Math.abs(v) < 5e-3 ? "0.00" : v.toFixed(2));
    show(
      `forward (${b.forward.map(n).join(", ")})` +
        `    right stays level: its height is ${n(b.right[1])}`,
    );
    renderer.render(scene, view);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
