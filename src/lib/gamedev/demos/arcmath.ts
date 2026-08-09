/** How uneven a uniform-t walk really is, and what the lookup table costs to build. */
import { buildArcTable } from "../splines.ts";
import {
  TABLE,
  byDistance,
  byParameter,
  hopSpread,
  pathAt,
} from "./spline-shared.ts";
import type { Demo } from "./runner.ts";

const demo: Demo = (log) => {
  const byT = hopSpread(byParameter, 200);
  const byS = hopSpread(byDistance, 200);

  log("path length, from a 256-sample table", TABLE.total.toFixed(4));
  log(
    "stepping t evenly: longest hop over shortest",
    `${byT.ratio.toFixed(2)}x`,
    "so the speed varies by nearly eight times",
  );
  log(
    "stepping distance evenly: the same ratio",
    `${byS.ratio.toFixed(2)}x`,
    "the small residual is chord versus arc, not the method",
  );
  log(
    "table with 32 samples",
    buildArcTable(pathAt, 32).total.toFixed(4),
    "chords cut corners, so a coarse table underestimates",
  );
  log(
    "table with 1024 samples",
    buildArcTable(pathAt, 1024).total.toFixed(4),
    "converging upward on the true length",
  );
};

export default demo;
