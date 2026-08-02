/** The angle between a vector and itself is zero, unless you forget to clamp. */
import { dot, angleBetween } from "../dot.ts";
import { normalize } from "../vectors.ts";
import { HEADING, type Demo } from "./runner.ts";

const demo: Demo = (log) => {
  const u = normalize([1, 1, 1])!;
  const d = dot(u, u); // exactly 1 in mathematics

  log("a unit vector dotted with itself", d.toPrecision(18), "should be 1");
  log("is it above 1?", d > 1);
  log("Math.acos of it", Math.acos(d), "arccosine of anything above 1");

  log("with the clamp", HEADING);
  log("Math.min(1, Math.max(-1, d))", Math.min(1, Math.max(-1, d)));
  log("angleBetween(u, u)", angleBetween(u, u), "zero, as it should be");
  log(
    "angleBetween([1,0,0], [0,1,0])",
    (angleBetween([1, 0, 0], [0, 1, 0]) * 180) / Math.PI,
    "degrees, so the clamp costs nothing when unneeded",
  );
};

export default demo;
