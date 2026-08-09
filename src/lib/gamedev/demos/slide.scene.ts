/** A velocity meeting a surface, split into the part it blocks and the part that slides. */
import * as THREE from "three";
import { MAX_SLOPE, analyse, surfaceDirection } from "./slide-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const SLIDING = 0x39d3c3;
const BLOCKED = 0xff7b72;
const INCOMING = 0xf0883e;
const DIM = 0x484f58;
const VIEW = 6;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

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

  const lineOf = (color: number, dashed = false) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(
      geom,
      dashed
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.18 })
        : new THREE.LineBasicMaterial({ color }),
    );
    scene.add(mesh);
    return (pts: THREE.Vector3[]) => {
      mesh.visible = pts.length > 1;
      if (!mesh.visible) return;
      geom.setFromPoints(pts);
      if (dashed) mesh.computeLineDistances();
    };
  };

  /* Arrows are two lines: the shaft and a pair of head strokes. Kept here rather than using
     ArrowHelper so an arrow of length zero can simply disappear. */
  const arrowOf = (color: number) => {
    const shaft = lineOf(color);
    const head = lineOf(color);
    return (from: THREE.Vector3, to: THREE.Vector3) => {
      const along = to.clone().sub(from);
      const length = along.length();
      if (length < 0.06) {
        shaft([]);
        head([]);
        return;
      }
      along.normalize();
      const side = new THREE.Vector3(-along.y, along.x, 0);
      const back = to
        .clone()
        .sub(along.clone().multiplyScalar(Math.min(0.34, length * 0.4)));
      shaft([from, to]);
      head([
        back.clone().add(side.clone().multiplyScalar(0.15)),
        to,
        back.clone().sub(side.clone().multiplyScalar(0.15)),
      ]);
    };
  };

  const surfaceLine = lineOf(0x8b949e);
  const solidHatch = Array.from({ length: 13 }, () => lineOf(DIM));
  const normalArrow = arrowOf(DIM);
  const incoming = arrowOf(INCOMING);
  const blockedArrow = arrowOf(BLOCKED);
  const slidingArrow = arrowOf(SLIDING);
  const ghost = lineOf(DIM, true);

  const show = addReadout(el);
  const tilt = addSlider(el, "surface angle", 0, 90, 55, draw);
  const aim = addSlider(el, "aim of the velocity", -180, 180, -10, draw);

  function draw() {
    const a = analyse(tilt(), aim());
    const dir = surfaceDirection(tilt());
    const along = new THREE.Vector3(dir.x, dir.y, 0);
    const normal = new THREE.Vector3(a.normal.x, a.normal.y, 0);

    // The surface runs through the origin, with the solid side hatched behind it.
    surfaceLine([
      along.clone().multiplyScalar(-VIEW * 1.6),
      along.clone().multiplyScalar(VIEW * 1.6),
    ]);
    solidHatch.forEach((set, i) => {
      const at = along.clone().multiplyScalar(-6 + i);
      set([at, at.clone().sub(normal.clone().multiplyScalar(0.7))]);
    });

    normalArrow(new THREE.Vector3(), normal.clone().multiplyScalar(2));

    // The velocity is drawn arriving at the contact point, so the split is visible there.
    const v = new THREE.Vector3(a.velocity.x, a.velocity.y, 0);
    const contact = new THREE.Vector3();
    incoming(contact.clone().sub(v), contact);

    const blocked = new THREE.Vector3(a.normalPart.x, a.normalPart.y, 0);
    const tangent = new THREE.Vector3(a.tangentPart.x, a.tangentPart.y, 0);
    const from = contact.clone().sub(v);

    // Both parts start where the velocity did, so v = blocked + sliding reads as a triangle.
    blockedArrow(from, from.clone().add(blocked));
    slidingArrow(from, from.clone().add(tangent));
    ghost([from.clone().add(tangent), contact, from.clone().add(blocked)]);

    show(
      `slope ${a.slope.toFixed(0)}\u00B0 \u00B7 ` +
        (a.heldUp
          ? `${a.blocked.toFixed(2)} m/s blocked, ${a.sliding.toFixed(2)} m/s slides along \u00B7 `
          : `nothing blocked, the velocity already points away from the surface \u00B7 `) +
        (a.walkable
          ? `walkable, under the ${MAX_SLOPE}\u00B0 limit`
          : `too steep to stand on, over the ${MAX_SLOPE}\u00B0 limit`),
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
