/**
 * Detection was half the job. This is the other half: **what to do once two things have overlapped.**
 *
 * Two problems, and they are genuinely separate. The **position** is wrong - the shapes are inside each
 * other and have to be pushed apart. And the **velocity** is wrong - it is still carrying the object into
 * the wall, so leaving it alone means overlapping again on the next frame.
 *
 * Both come down to splitting a vector into the part along the wall's normal and the part along the wall,
 * which is Section 1.4's projection doing the most useful work it will ever do. Keep the along-the-wall
 * part and you slide. Reverse the into-the-wall part and you bounce. One split, two behaviours.
 */
import { dot } from "./dot2d.ts";
import { length, normalize } from "./length2d.ts";
import {
  combine,
  displacement,
  movedBy,
  reversed,
  scaled,
  type Point,
  type Vector,
} from "./vectors2d.ts";

/**
 * A contact: which way to push, and how far. Exactly what Section 5.3's `smallestOverlap` produced.
 *
 * The normal is **expected to be unit length**, and every function here says so, because the cost of it
 * not being is not a slightly-wrong answer but a wildly wrong one - see `slide`.
 */
export type Contact = {
  /** Unit length, pointing out of the wall toward the moving object. */
  normal: Vector;
  /** How deep the overlap is, along that normal. Never negative for a real contact. */
  depth: number;
};

/**
 * The part of a vector pointing along the normal. Section 1.4's projection, unchanged.
 *
 * $$v_n = (v \cdot \hat{n})\,\hat{n}$$
 *
 * **This assumes $\hat{n}$ is unit length**, and the assumption is doing real work. The honest projection
 * divides by $|n|^2$; dropping that division is only correct when the length is 1, and when it is not the
 * correction is scaled by $|n|^2$ - so a normal of length 2 removes four times too much.
 */
export function normalPart(v: Vector, normal: Vector): Vector {
  return scaled(normal, dot(v, normal));
}

/** And the part along the wall: everything the normal part is not. */
export function tangentPart(v: Vector, normal: Vector): Vector {
  return displacement(normalPart(v, normal), v);
}

/**
 * Slide: **drop the into-the-wall part and keep the rest.**
 *
 * $$v' = v - (v \cdot \hat{n})\,\hat{n}$$
 *
 * One line, and it is the whole reason a character walks along a wall instead of stopping dead against it.
 * The name in Godot is `Vector2.slide`; in Unity it is `Vector3.ProjectOnPlane`, which describes the same
 * operation from the other direction.
 *
 * Note what it does to speed: the surviving speed is $|v|\cos\theta$ where $\theta$ is the angle between
 * the velocity and the wall. Hit a wall square on and $\theta = 0$, so **all** of the speed goes. That is
 * correct rather than unfortunate, and it is why a character pressed into a wall stops.
 */
export function slide(v: Vector, normal: Vector): Vector {
  return displacement(normalPart(v, normal), v);
}

/**
 * Bounce: **reverse the into-the-wall part instead of dropping it.**
 *
 * $$v' = v - 2(v \cdot \hat{n})\,\hat{n}$$
 *
 * The 2 is the only difference from a slide, and it is worth seeing why: subtracting the normal part once
 * removes it, and subtracting it twice sends it back the way it came.
 */
export function reflect(v: Vector, normal: Vector): Vector {
  return displacement(scaled(normalPart(v, normal), 2), v);
}

/**
 * Slide and bounce as one function, with `restitution` choosing between them.
 *
 * $$v' = v_t - e\,v_n$$
 *
 * At $e = 0$ this is a slide, at $e = 1$ a perfect bounce, and in between the bounce loses energy. Worth
 * having as one function rather than two, because a game almost always wants something between the two and
 * writing it as a blend makes that a parameter rather than a rewrite.
 */
export function respond(
  v: Vector,
  normal: Vector,
  restitution: number,
): Vector {
  return combine(
    tangentPart(v, normal),
    scaled(normalPart(v, normal), -restitution),
  );
}

/**
 * Is this velocity actually heading **into** the wall?
 *
 * $$v \cdot \hat{n} < 0$$
 *
 * The guard that has to be there, and the one most often left out. Apply a slide unconditionally and a
 * character already moving *away* from a wall has its outward velocity cancelled too - so it sticks to
 * the surface for as long as it stays in contact, which reads as glue rather than as a bug.
 */
export function movingInto(v: Vector, normal: Vector): boolean {
  return dot(v, normal) < 0;
}

/** The response, applied only when it should be. This is the function a game actually calls. */
export function resolveVelocity(
  v: Vector,
  normal: Vector,
  restitution = 0,
): Vector {
  return movingInto(v, normal) ? respond(v, normal, restitution) : v;
}

/**
 * How much speed a slide keeps, as a fraction, given the angle between velocity and wall.
 *
 * $$\frac{|v'|}{|v|} = \cos\theta$$
 *
 * Here so the page can tabulate it rather than assert it. It is also the number that explains why running
 * at a wall at a shallow angle feels fast and at a steep angle feels like stopping.
 */
export function slideSpeedFraction(radiansFromWall: number): number {
  return Math.abs(Math.cos(radiansFromWall));
}

// ---- Fixing the position ----------------------------------------------------------------------

/**
 * The overlap removed exactly: push out along the normal by the depth.
 *
 * $$p' = p + d\,\hat{n}$$
 *
 * Which is correct and, on its own, **not enough**. Pushing out to exactly zero overlap leaves the two
 * shapes touching, and whether "touching" counts as a collision then depends on the last bit of a float.
 * So the next frame may detect the same contact, push again by nothing, and detect it again - a character
 * that shivers against every wall it leans on.
 */
export function pushOutExactly(p: Point, contact: Contact): Point {
  return movedBy(p, scaled(contact.normal, contact.depth));
}

/**
 * The overlap removed **plus a sliver**, which is what stops the shivering.
 *
 * The extra is variously called skin, slop, or a contact offset. It is not a fudge: it puts the shapes a
 * definite, known distance apart, so the next frame's test has an unambiguous answer instead of a
 * coin-flip on the last bit. Small enough to be invisible, large enough to beat floating-point noise -
 * a thousandth of a world unit is generous for a character a unit tall.
 */
export const SKIN = 1e-3;

export function pushOut(p: Point, contact: Contact, skin = SKIN): Point {
  return movedBy(p, scaled(contact.normal, contact.depth + skin));
}

/** Every contact's push applied once. Positions only, so the order cannot matter. */
export function pushOutAll(
  p: Point,
  contacts: readonly Contact[],
  skin = SKIN,
): Point {
  return contacts.reduce(
    (at, contact) => (contact.depth > 0 ? pushOut(at, contact, skin) : at),
    p,
  );
}

/**
 * A velocity settled against **several** walls at once, which is what a corner is.
 *
 * One pass is not always enough, and the reason is worth seeing: sliding along wall A can leave a velocity
 * that is heading into wall B, and fixing B can put it back into A. So the loop repeats until nothing is
 * being driven into any wall, or until the budget runs out.
 *
 * Real solvers do exactly this and cap the passes, because a sharp enough wedge can take many. The cap is a
 * budget rather than a correctness fix, and `settled` says honestly whether it was enough - the build
 * measures how many passes different corners actually need rather than assuming one.
 */
export function settleVelocity(
  v: Vector,
  normals: readonly Vector[],
  restitution = 0,
  maxPasses = 8,
  tolerance = 1e-9,
): {
  velocity: Vector;
  passes: number;
  settled: boolean;
  /** How much velocity is still heading into the worst wall. Zero when genuinely settled. */
  residual: number;
} {
  const worstInward = (w: Vector) =>
    normals.reduce((worst, n) => Math.max(worst, -dot(w, n)), 0);
  let velocity = v;
  for (let pass = 1; pass <= maxPasses; pass += 1) {
    if (worstInward(velocity) <= tolerance) {
      return {
        velocity,
        passes: pass - 1,
        settled: true,
        residual: worstInward(velocity),
      };
    }
    for (const n of normals) {
      velocity = resolveVelocity(velocity, n, restitution);
    }
  }
  return {
    velocity,
    passes: maxPasses,
    settled: worstInward(velocity) <= tolerance,
    residual: worstInward(velocity),
  };
}

/**
 * How fast the residual shrinks per pass, which is what "converges" actually means here.
 *
 * $$\text{rate} = \cos^2\phi$$
 *
 * Repeatedly projecting onto two half-spaces is alternating projection, and where the correct answer is
 * "you cannot move at all" it approaches that answer **geometrically rather than exactly**. The residual
 * falls by $\cos^2\phi$ per pass, where $\phi$ is the angle between the two normals.
 *
 * **Squared, and it took measuring to get that right** - the first version of this function returned
 * $|\cos\phi|$, and the measured ratios were its square every time: normals $120°$ apart have
 * $|\cos| = 0.5$ and shed exactly a **quarter** of the residual per pass, not a half. One pass performs
 * both projections, which is where the second factor comes from.
 *
 * Two consequences worth having. Normals **$90°$ or less apart settle exactly, in a single pass** - the
 * feasible cone is at least a right angle wide and the two projections never fight. Beyond that they do:
 * at $150°$ the residual only falls by three quarters per pass, and at $170°$ by $0.97$, which is a crawl.
 * A right-angled corner - the case games actually hit - has $\cos^2 90° = 0$ and is exact immediately.
 */
export function convergenceRate(a: Vector, b: Vector): number {
  return dot(a, b) * dot(a, b);
}

// ---- Tunnelling ------------------------------------------------------------------------------

/**
 * The speed at which an object starts passing straight through a wall of a given thickness.
 *
 * $$v_{\text{escape}} = \frac{\text{thickness}}{\Delta t}$$
 *
 * Because a discrete step moves the object $v\,\Delta t$ in one go, and if that is longer than the wall is
 * thick it can begin one side and end the other with **no frame in between where the two overlap**. The
 * test never fires. Nothing is wrong with the collision code; it was simply never asked.
 *
 * This is a hard number rather than a rule of thumb, and it is unpleasantly small: a wall a tenth of a
 * unit thick at 60 fps is defeated by 6 units per second.
 */
export function tunnellingSpeed(thickness: number, dt: number): number {
  return thickness / dt;
}

/** How far an object travels in one step. The quantity that has to stay under the wall's thickness. */
export function stepDistance(speed: number, dt: number): number {
  return speed * dt;
}

/**
 * How **often** a given speed tunnels, which is the part that makes this bug so unpleasant.
 *
 * $$P = \max\!\left(0,\ 1 - \frac{\text{thickness}}{v\,\Delta t}\right) = \max\!\left(0,\ 1 - \frac{v_{\text{escape}}}{v}\right)$$
 *
 * Above the escape speed, tunnelling is **possible but not certain** - it depends where the frame
 * boundaries happen to fall relative to the wall. Samples spaced $v\,\Delta t$ apart miss an interval of
 * width $w$ for a fraction $1 - w/(v\,\Delta t)$ of the possible offsets.
 *
 * So at twice the escape speed it happens half the time, and at four times, three quarters of the time.
 * A bug that fires on some frames and not others, depending on sub-pixel timing, is far harder to track
 * down than one that always fires - and finding that my first attempt at measuring this reported "detected"
 * at every speed I happened to try is exactly how that plays out in practice.
 */
export function tunnellingChance(
  speed: number,
  dt: number,
  thickness: number,
): number {
  const step = stepDistance(speed, dt);
  return step <= thickness ? 0 : 1 - thickness / step;
}

/**
 * How many substeps keep each one shorter than the thinnest wall in the level.
 *
 * The cheap fix, and the honest one: split the frame into pieces small enough that the object cannot skip
 * anything. Costs more collision tests per frame, in exchange for not needing swept shapes.
 *
 * Note the parameter it depends on is the **thinnest** wall, not the average - the level's flimsiest piece
 * of geometry sets the budget for the whole simulation.
 */
export function substepsNeeded(
  speed: number,
  dt: number,
  thinnest: number,
): number {
  return Math.max(1, Math.ceil(stepDistance(speed, dt) / thinnest));
}

/**
 * Walk a step in pieces, reporting whether any piece landed inside the wall.
 *
 * Used by the build to show that one step misses and several do not. The `inside` predicate keeps the
 * geometry out of here, so this stays about the stepping rather than about the shape.
 */
export function sweepHits(
  from: Point,
  velocity: Vector,
  dt: number,
  substeps: number,
  inside: (p: Point) => boolean,
): { hit: Point | null; tested: number } {
  const piece = dt / substeps;
  for (let i = 1; i <= substeps; i += 1) {
    const at = movedBy(from, scaled(velocity, piece * i));
    if (inside(at)) return { hit: at, tested: i };
  }
  return { hit: null, tested: substeps };
}

/**
 * The wrong fix, kept so the build can price it: just cap the speed.
 *
 * It does prevent tunnelling, and it also silently changes the game - a projectile that was meant to be
 * fast is now not. Worth knowing as a deliberate design choice and not as a bug fix.
 */
export function cappedSpeed(v: Vector, dt: number, thinnest: number): Vector {
  const maximum = thinnest / dt;
  const speed = length(v);
  if (speed <= maximum) return v;
  const unit = normalize(v);
  return unit === null ? { x: 0, y: 0 } : scaled(unit, maximum);
}

/** The reverse of a velocity, for drawing where something came from. */
export function incoming(v: Vector): Vector {
  return reversed(v);
}
