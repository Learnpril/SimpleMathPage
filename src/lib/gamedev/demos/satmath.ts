/** Two turned boxes that overlap on all six face axes, and the axis that proves they do not touch. */
import { obbSeparationAlong } from "../collision.ts";
import { BOX_A, BOX_B, CROSS_AXES, FACE_AXES, worstGap } from "./sat-shared.ts";
import type { Demo } from "./runner.ts";

const demo: Demo = (log) => {
  const face = worstGap(FACE_AXES);
  const cross = worstGap(CROSS_AXES);

  log(
    "the six face axes: widest gap found",
    face.gap.toFixed(4),
    "negative, so every one of them overlaps",
  );
  log(
    "...on which axis",
    face.name,
    "the tightest of the six, and still not separating",
  );

  // Any one positive gap ends the test, and here it is on an edge-versus-edge direction.
  log(
    "the nine cross axes: widest gap found",
    cross.gap.toFixed(4),
    "positive, so the boxes are apart",
  );
  log(
    "...on which axis",
    cross.name,
    "one box's edge crossed with the other's",
  );

  log(
    "checking only the six face axes",
    "reports a collision",
    "which is wrong, and only for boxes at these angles",
  );
  log(
    "gap along box A's long axis",
    obbSeparationAlong(BOX_A, BOX_B, BOX_A.axes[0]).toFixed(4),
    "deeply overlapping, which is why the mistake looks reasonable",
  );
};

export default demo;
