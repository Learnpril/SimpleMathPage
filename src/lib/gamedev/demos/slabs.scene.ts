/** A ray against a box, with the three slab stretches stacked on one axis underneath. */
import * as THREE from "three";
import { AXES, BOX, RAY_ORIGIN, resultFor } from "./slabs-shared.ts";
import { makeCanvas, addSlider, addReadout, addTimeline } from "./ui.ts";
import type { MountFn } from "./runner.ts";

const AXIS_COLOUR = { x: 0x58a6ff, y: 0x7ee787, z: 0xd2a8ff } as const;
const FACES = {
  x: "left and right",
  y: "top and bottom",
  z: "front and back",
} as const;
const INSIDE = 0x39d3c3;
const RAY = 0xf0883e;
const DIM = 0x484f58;
const REACH = 13;
const FROM = -6;
const TO = 14;

const mount: MountFn = (el) => {
  const { renderer, width, height, background } = makeCanvas(el, 300);

  const scene = new THREE.Scene();
  scene.background = background;
  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 200);

  scene.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          BOX.max.x - BOX.min.x,
          BOX.max.y - BOX.min.y,
          BOX.max.z - BOX.min.z,
        ),
      ),
      new THREE.LineBasicMaterial({ color: DIM }),
    ),
  );

  const lineOf = (color: number) => {
    const geom = new THREE.BufferGeometry();
    const mesh = new THREE.Line(geom, new THREE.LineBasicMaterial({ color }));
    scene.add(mesh);
    // Hide with visibility. An empty point list poisons the buffer or leaves stale vertices.
    return (pts: THREE.Vector3[]) => {
      mesh.visible = pts.length > 1;
      if (mesh.visible) geom.setFromPoints(pts);
    };
  };

  const rayLine = lineOf(RAY);
  const insideLine = lineOf(INSIDE);

  const dotAt = (color: number, radius: number) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 14, 10),
      new THREE.MeshBasicMaterial({ color }),
    );
    scene.add(m);
    return m;
  };
  const start = dotAt(RAY, 0.2);
  start.position.set(RAY_ORIGIN.x, RAY_ORIGIN.y, RAY_ORIGIN.z);
  const ends = [dotAt(INSIDE, 0.17), dotAt(INSIDE, 0.17)];

  const show = addReadout(el);
  const bars = addTimeline(
    el,
    "distance along the ray, in meters",
    [...AXES.map((a) => AXIS_COLOUR[a]), INSIDE],
    FROM,
    TO,
  );
  const yaw = addSlider(el, "aim sideways", -25, 25, -5, draw, "\u00B0", 0.5);
  const pitch = addSlider(el, "aim up", -25, 25, 4, draw, "\u00B0", 0.5);
  const spin = addSlider(el, "walk around it", -180, 180, 24, draw);

  function draw() {
    const { direction, hit, slabs, blame } = resultFor(yaw(), pitch());
    const at = (t: number) =>
      new THREE.Vector3(
        RAY_ORIGIN.x + direction.x * t,
        RAY_ORIGIN.y + direction.y * t,
        RAY_ORIGIN.z + direction.z * t,
      );

    rayLine([at(0), at(REACH)]);

    if (hit) {
      insideLine([at(Math.max(hit.enter, 0)), at(hit.exit)]);
      ends[0].visible = true;
      ends[1].visible = true;
      ends[0].position.copy(at(Math.max(hit.enter, 0)));
      ends[1].position.copy(at(hit.exit));
    } else {
      insideLine([]);
      ends.forEach((d) => (d.visible = false));
    }

    bars([
      ...slabs.map((s) => {
        const name = `${s.axis}, ${FACES[s.axis]}`;
        if (s.interval === null) return { text: `${name}: none`, span: null };
        if (!Number.isFinite(s.interval.enter)) {
          return { text: `${name}: all of it`, span: { from: FROM, to: TO } };
        }
        return {
          text: `${name}: ${s.interval.enter.toFixed(1)} to ${s.interval.exit.toFixed(1)}`,
          span: { from: s.interval.enter, to: s.interval.exit },
        };
      }),
      hit
        ? {
            text: `all three: ${hit.enter.toFixed(1)} to ${hit.exit.toFixed(1)}`,
            span: { from: hit.enter, to: hit.exit },
          }
        : { text: "all three: no overlap", span: null },
    ]);

    const a = (spin() * Math.PI) / 180;
    camera.position.set(Math.sin(a) * 14, 5, Math.cos(a) * 14);
    camera.lookAt(-1, -0.6, 0);

    show(
      hit
        ? `the three stretches overlap from ${hit.enter.toFixed(2)} m to ${hit.exit.toFixed(2)} m, and that overlap is the part inside the box`
        : `miss: ${blame}`,
    );
    renderer.render(scene, camera);
  }

  draw();

  return () => renderer.dispose();
};

export default mount;
