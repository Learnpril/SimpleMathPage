/**
 * A wall at an angle, a velocity at an angle, and the split between them. Shared with the substep scene.
 *
 * Both scenes are about the same discrete step: this one asks what the velocity becomes on contact, and the
 * other asks whether contact was noticed at all. Keeping the wall and the timestep in one place is what lets
 * the second scene reuse the first's geometry rather than inventing its own.
 */
import {
  movingInto,
  normalPart,
  respond,
  slide,
  slideSpeedFraction,
  substepsNeeded,
  sweepHits,
  tangentPart,
  tunnellingChance,
  tunnellingSpeed,
  type Contact,
} from "../../../gamedev2d/response2d.ts";
import {
  aabbContains,
  boxAround,
  type Aabb,
} from "../../../gamedev2d/collide2d.ts";
import { directionFromAngle, toRadians } from "../../../gamedev2d/angles2d.ts";
import { length } from "../../../gamedev2d/length2d.ts";
import {
  movedBy,
  scaled,
  type Point,
  type Vector,
} from "../../../gamedev2d/vectors2d.ts";

/** Pixels per world unit. */
export const UNIT = 46;

/** The canvas both scenes draw into. */
export const VIEW = { width: 620, height: 330 } as const;

/** Where the contact happens, and where every arrow in the deflect scene starts. */
export const CONTACT: Point = { x: -0.5, y: -0.6 };

/** The controls' ranges. Degrees, so the readouts need no conversion. */
export const WALL_RANGE = { min: -80, max: 80 } as const;
export const VELOCITY_RANGE = { min: -170, max: 170 } as const;
export const RESTITUTION_RANGE = { min: 0, max: 1, step: 0.05 } as const;

/** How long the arrows are drawn, in world units per unit of speed. */
export const SPEED = 2.6;

/**
 * How far the wall is drawn either side of the contact.
 *
 * Long enough that **both ends leave the canvas at every angle**, which is the difference between a wall and
 * a stub. At $6.5$ a horizontal wall ended at $x = 586$ on a $620$-wide canvas, so the surface appeared to
 * simply stop a little short of the edge - and a build assertion that only checked "is it on the canvas"
 * would have been happy with that. The check now insists the ends are *off* it.
 */
export const WALL_DRAW_LENGTH = 9;

/** The wall's direction and its outward normal, from one angle. */
export function wallFrom(degrees: number): { along: Vector; normal: Vector } {
  const along = directionFromAngle(toRadians(degrees));
  // The left perpendicular, so the normal points up out of a roughly horizontal wall.
  return { along, normal: { x: -along.y, y: along.x } };
}

export type DeflectReport = {
  velocity: Vector;
  normal: Vector;
  along: Vector;
  normalComponent: Vector;
  tangentComponent: Vector;
  slid: Vector;
  bounced: Vector;
  responded: Vector;
  intoWall: boolean;
  /** The fraction of the incoming speed a slide keeps. */
  kept: number;
  /** The angle between the velocity and the wall, in degrees. */
  angleFromWall: number;
};

export function deflectReport(
  wallDegrees: number,
  velocityDegrees: number,
  restitution: number,
): DeflectReport {
  const { along, normal } = wallFrom(wallDegrees);
  const velocity = scaled(
    directionFromAngle(toRadians(velocityDegrees)),
    SPEED,
  );
  const angleFromWall = velocityDegrees - wallDegrees;
  return {
    velocity,
    normal,
    along,
    normalComponent: normalPart(velocity, normal),
    tangentComponent: tangentPart(velocity, normal),
    slid: slide(velocity, normal),
    bounced: respond(velocity, normal, 1),
    responded: respond(velocity, normal, restitution),
    intoWall: movingInto(velocity, normal),
    kept: slideSpeedFraction(toRadians(angleFromWall)),
    angleFromWall,
  };
}

/** Where an arrow drawn from the contact point ends. */
export function tipOf(v: Vector): Point {
  return movedBy(CONTACT, v);
}

// ---- The substep scene -----------------------------------------------------------------------

/** A thin wall standing upright in the middle of the scene. Thin on purpose. */
export const THIN_WALL: Aabb = boxAround({ x: 0.75, y: 0 }, 0.25, 5);

/** How thick it is, which is the number the tunnelling speed depends on. */
export const WALL_THICKNESS = THIN_WALL.max.x - THIN_WALL.min.x;

/** Where the mover starts, well to the left of the wall. */
export const MOVER_FROM: Point = { x: -5.2, y: 0 };

/** The frame time the scene simulates. A sixtieth of a second, which is the common case. */
export const FRAME = 1 / 60;

/** The speed slider's range, in world units per second. Spans the tunnelling threshold comfortably. */
export const MOVER_SPEED = { min: 2, max: 60, step: 0.5 } as const;

/** How many substeps the scene may be asked for. */
export const SUBSTEP_RANGE = { min: 1, max: 16 } as const;

/**
 * Where within a frame the mover happens to start, as a fraction of one step.
 *
 * A control rather than a constant, and it is the most instructive one in the scene: above the escape speed
 * whether the wall is noticed at all depends on this alignment, so sliding it makes the collision blink in
 * and out with nothing else changing. My first attempt at this scene fixed the phase at zero and reported
 * "detected" at every speed I tried, which is precisely the bug's real-world behaviour.
 */
export const PHASE_RANGE = { min: 0, max: 1, step: 0.02 } as const;

/** Is a point inside the thin wall? The predicate the sweep is handed. */
export function insideWall(p: Point): boolean {
  return aabbContains(THIN_WALL, p);
}

export type SubstepReport = {
  /** Where the mover would be after each whole frame, for drawing. */
  frames: Point[];
  /** The substep positions inside the frame that decides it. */
  substepsAt: Point[];
  /** The last whole-frame position before the wall, which is where that frame begins. */
  before: Point;
  /** The first substep position that landed inside the wall, or null for a miss. */
  hit: Point | null;
  /** How far one whole frame carries it. */
  perFrame: number;
  /** The speed at which one whole frame can step clean over the wall. */
  threshold: number;
  /** How many substeps would be enough at this speed. */
  needed: number;
  /** What fraction of possible alignments tunnel at this speed, in closed form. */
  chance: number;
  tunnelled: boolean;
};

/** Where the mover starts, offset by a fraction of one step so the alignment can be swept. */
export function startFor(speed: number, phase: number): Point {
  return { x: MOVER_FROM.x + phase * speed * FRAME, y: MOVER_FROM.y };
}

export function substepReport(
  speed: number,
  substeps: number,
  phase = 0,
): SubstepReport {
  const velocity: Vector = { x: speed, y: 0 };
  const from = startFor(speed, phase);
  const frames: Point[] = [from];
  let at = from;
  for (let i = 0; i < 400 && at.x < 5.6; i += 1) {
    at = movedBy(at, scaled(velocity, FRAME));
    frames.push(at);
  }
  /* One frame's worth of stepping, from the last whole-frame position still short of the wall. That is the
     frame in which the tunnelling either happens or does not; sweeping from anywhere else would hide it. */
  const before = frames.filter((p) => p.x < THIN_WALL.min.x).pop() ?? from;
  const swept = sweepHits(before, velocity, FRAME, substeps, insideWall);
  return {
    frames,
    substepsAt: Array.from({ length: substeps }, (_, i) =>
      movedBy(before, scaled(velocity, (FRAME / substeps) * (i + 1))),
    ),
    before,
    hit: swept.hit,
    perFrame: speed * FRAME,
    threshold: tunnellingSpeed(WALL_THICKNESS, FRAME),
    needed: substepsNeeded(speed, FRAME, WALL_THICKNESS),
    chance: tunnellingChance(speed, FRAME, WALL_THICKNESS),
    tunnelled: swept.hit === null,
  };
}

/**
 * The measured fraction of alignments that tunnel, for comparing against the closed form.
 *
 * Sampled over phase rather than derived, so the two are independent computations and agreement means both
 * are right - the same discipline the arcs in Section 5.2 got.
 */
export function measuredTunnelChance(
  speed: number,
  substeps = 1,
  samples = 400,
): number {
  let missed = 0;
  for (let i = 0; i < samples; i += 1) {
    if (substepReport(speed, substeps, i / samples).tunnelled) missed += 1;
  }
  return missed / samples;
}

/** A contact for the values demo, so the push-out numbers come from somewhere real. */
export function contactFrom(wallDegrees: number, depth: number): Contact {
  return { normal: wallFrom(wallDegrees).normal, depth };
}

/** The incoming speed, for readouts that want it without recomputing. */
export function incomingSpeed(): number {
  return length(scaled({ x: 1, y: 0 }, SPEED));
}

/** World to canvas pixels, centred. The Y flip lives here and nowhere else. */
export function screenOf(p: Point): { x: number; y: number } {
  return { x: VIEW.width / 2 + p.x * UNIT, y: VIEW.height / 2 - p.y * UNIT };
}

/** And back, which the checks exercise as a round trip. */
export function worldOf(sx: number, sy: number): Point {
  return { x: (sx - VIEW.width / 2) / UNIT, y: (VIEW.height / 2 - sy) / UNIT };
}
