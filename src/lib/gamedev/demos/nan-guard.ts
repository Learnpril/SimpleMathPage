/** Every comparison against NaN is false, including the guard meant to catch it. */
import { HEADING, type Demo } from "./runner.ts";

const demo: Demo = (log) => {
  const bad = 0 / 0; // what normalizing a zero-length vector gives you

  log("0 / 0", bad);
  log("bad > 0", bad > 0);
  log("bad < 0", bad < 0);
  log("bad === bad", bad === bad, "not even equal to itself");
  log("Number.isNaN(bad)", Number.isNaN(bad), "the only test that works");

  log("so these two guards disagree", HEADING);
  log("if (speed > 0) move()", bad > 0 ? "moves" : "stops");
  log("if (speed <= 0) return", bad <= 0 ? "stops" : "moves");
};

export default demo;
