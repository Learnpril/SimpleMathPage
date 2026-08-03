/**
 * A squashed sphere with its normals drawn twice: through the object's matrix, and correctly.
 */
import * as THREE from "three";
import { scale4 } from "../matrices.ts";
import {
  profileSamples,
  transformSample,
  degreesOff,
  type Sample,
} from "./normals-shared.ts";
import { makeCanvas, addSlider, addReadout } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const SAMPLES: Sample[] = profileSamples(16);
const ARROW = 0.55;

/** A set of line segments we can rewrite each frame. */
function addArrows(scene: THREE.Scene, color: number) {
  const geom = new THREE.BufferGeometry();
  geom.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(SAMPLES.length * 6), 3),
  );
  scene.add(
    new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color })),
  );
  return (pts: THREE.Vector3[]) => geom.setFromPoints(pts);
}

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;

  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(1.6, 1.2, 5.4);
  camera.lookAt(0, 0, 0);

  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 14),
    new THREE.MeshBasicMaterial({
      color: 0x30363d,
      wireframe: true,
    }),
  );
  scene.add(shell);

  const naiveArrows = addArrows(scene, 0xf0883e);
  const goodArrows = addArrows(scene, 0x39d3c3);

  const show = addReadout(el);
  const squash = addSlider(el, "squash along y", 0.15, 1, 0.35, draw, "", 0.05);

  function draw() {
    const m = scale4(1, squash(), 1);
    shell.scale.set(1, squash(), 1);

    const naive: THREE.Vector3[] = [];
    const good: THREE.Vector3[] = [];
    let worstNaive = 0;
    let worstGood = 0;

    for (const s of SAMPLES) {
      const t = transformSample(m, s);
      const from = new THREE.Vector3(t.at.x, t.at.y, t.at.z);
      naive.push(
        from,
        from
          .clone()
          .add(
            new THREE.Vector3(t.naive.x, t.naive.y, t.naive.z).multiplyScalar(
              ARROW,
            ),
          ),
      );
      if (t.correct) {
        good.push(
          from,
          from
            .clone()
            .add(
              new THREE.Vector3(
                t.correct.x,
                t.correct.y,
                t.correct.z,
              ).multiplyScalar(ARROW),
            ),
        );
        worstGood = Math.max(worstGood, degreesOff(t.correct, t.tangents));
      }
      worstNaive = Math.max(worstNaive, degreesOff(t.naive, t.tangents));
    }

    naiveArrows(naive);
    goodArrows(good);

    show(
      `orange is off the surface by up to ${worstNaive.toFixed(1)}\u00B0  ·  ` +
        `teal by ${worstGood.toFixed(1)}\u00B0`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
