/**
 * A small level, a scripted run through it, and switches for turning each piece off.
 *
 * The input is scripted rather than played. A character controller wants held keys, and a reader
 * has one pointer - Part 1's movement demo shipped an on-screen arrow pad for exactly that problem
 * and it could not be used. So the run is fixed and the reader scrubs time, which also means the
 * whole thing is inspectable frame by frame instead of being a video.
 *
 * Each switch disables one piece so its absence can be seen rather than described.
 */
import type { Vec3 } from "../matrices.ts";
import type { Aabb } from "../collision.ts";
import {
  GRAVITY,
  JUMP_SPEED,
  MAX_SLOPE,
  SPEED,
  TURN_RATE,
  capsuleFor,
  moveDirection,
  resolve,
  step,
  tryStepUp,
  uprightCapsuleContact,
  type Character,
  type Input,
} from "../controller.ts";
import { isWalkable } from "../response.ts";
import { basisFromYaw } from "../conventions.ts";
import { rotateToward, wrapRad } from "../angles.ts";
import { blend, stepsFor, alphaFrom } from "../integrators.ts";
import { catmullRomAt } from "../splines.ts";

const V = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** A floor, a wall to slide along, and a low ledge to walk up. Every box gets used by the run. */
export const LEVEL: readonly Aabb[] = [
  { min: V(-9, -1, -9), max: V(9, 0, 9) },
  { min: V(1.6, 0, -4), max: V(2.6, 2.6, 2) },
  { min: V(-5.5, 0, -2), max: V(-3.5, 0.35, 2) },
];
export const LEVEL_NAMES = ["floor", "wall", "ledge"] as const;

export const START: Character = {
  position: V(-1.5, 0, 5),
  velocity: V(0, 0, 0),
  yaw: Math.PI,
  grounded: true,
};

export const DURATION = 5.5;
export const TICK = 1 / 60;

/** Which piece to switch off. */
export type Switches = {
  slide: boolean;
  shortestTurn: boolean;
  normalize: boolean;
};
export const ALL_ON: Switches = {
  slide: true,
  shortestTurn: true,
  normalize: true,
};

/**
 * The scripted input at a given moment: walk into the wall, slide along it, then jump.
 *
 * Written against simulated time rather than tick index, which is what a real game does - and the
 * reason the same run at a very high tick rate ends a fraction of a millimeter apart, because the
 * jump lands on a slightly different instant.
 */
export function inputAt(t: number): Input {
  // Diagonally into the wall, then along it. Facing ends up at 143 degrees.
  if (t < 1.8) return { forward: 1, strafe: 0.75, jump: false };
  // Hard left, which is a facing of -90 degrees: a 233 degree turn written down, 127 travelled.
  if (t < 2.9) return { forward: 0, strafe: -1, jump: false };
  // One tick of jump, taken from the top of the ledge.
  if (t < 2.92) return { forward: 0, strafe: -1, jump: true };
  if (t < 4.3) return { forward: -0.7, strafe: -0.3, jump: false };
  return { forward: 1, strafe: 0.6, jump: false };
}

/**
 * One tick, with the switches applied.
 *
 * This mirrors `controller.step` rather than calling it, because each switch has to break one
 * specific line and a parameter for every possible mistake would make the real function worse.
 */
export function stepWith(
  character: Character,
  input: Input,
  cameraYaw: number,
  dt: number,
  switches: Switches,
): Character {
  /* With nothing switched off, hand straight over to the real thing. Mirroring a function is a
     liability - step climbing was added to `controller.step` and silently missing here until the
     scripted run stopped dead against a ledge - so the correct path must be the shipped code and
     not a copy of it. */
  if (switches.slide && switches.shortestTurn && switches.normalize) {
    return step(character, input, cameraYaw, LEVEL, dt);
  }
  /* With the switch on this is the shipped `moveDirection` and nothing else, so the correct path
     really runs the code the page displays. With it off, the same sum is taken without the divide:
     full forward plus full strafe is then 1.41 long and diagonal movement runs 41% fast, which is
     Section 1.2's bug. */
  const wanted = switches.normalize
    ? moveDirection(input, cameraYaw)
    : rawDirection(input, cameraYaw);

  let velocity: Vec3 = {
    x: wanted.x * SPEED,
    y: character.velocity.y,
    z: wanted.z * SPEED,
  };
  if (input.jump && character.grounded) velocity.y = JUMP_SPEED;
  velocity = { x: velocity.x, y: velocity.y - GRAVITY * dt, z: velocity.z };

  const moved = {
    x: character.position.x + velocity.x * dt,
    y: character.position.y + velocity.y * dt,
    z: character.position.z + velocity.z * dt,
  };

  // Step climbing stays on whichever switch is off, so it never confounds what is being shown.
  const stepped =
    character.grounded && switches.slide
      ? tryStepUp(character.position, moved, LEVEL)
      : null;

  // Without sliding, a contact stops the character dead instead of carrying it along the surface.
  const settled = switches.slide
    ? resolve(stepped ?? moved, velocity, LEVEL)
    : stopDead(moved, character.position, velocity);

  const facing =
    Math.hypot(wanted.x, wanted.z) < 1e-6
      ? null
      : Math.atan2(wanted.x, wanted.z);
  let yaw = character.yaw;
  if (facing !== null) {
    // Wrapped to match the real controller. Left unwrapped, the long-way version winds up past a
    // full turn and the difference stops being readable as a facing.
    yaw = switches.shortestTurn
      ? wrapRad(rotateToward(character.yaw, facing, TURN_RATE * dt))
      : wrapRad(theLongWay(character.yaw, facing, TURN_RATE * dt));
  }

  return {
    position: settled.position,
    velocity: settled.velocity,
    yaw,
    grounded: settled.grounded,
  };
}

/** The same direction sum with the normalize left out, which is Section 1.2's diagonal-speed bug. */
function rawDirection(input: Input, cameraYaw: number): Vec3 {
  const basis = basisFromYaw(cameraYaw);
  return {
    x: -basis.z[0] * input.forward + basis.x[0] * input.strafe,
    y: 0,
    z: -basis.z[2] * input.forward + basis.x[2] * input.strafe,
  };
}

/**
 * The broken response: refuse the whole move instead of removing only the blocked part.
 *
 * Note it has to ask specifically about **walls**, not about contacts. Standing on the floor is a
 * contact on every single tick, so refusing to move whenever anything is touched freezes the
 * character where it stands - which is a broken demo rather than the bug being demonstrated. Only a
 * surface too steep to stand on counts as blocking.
 */
function stopDead(
  moved: Vec3,
  previous: Vec3,
  velocity: Vec3,
): { position: Vec3; velocity: Vec3; grounded: boolean } {
  const hitAWall = LEVEL.some((box) => {
    const contact = uprightCapsuleContact(capsuleFor(moved), box);
    return contact !== null && !isWalkable(contact.normal, MAX_SLOPE);
  });
  if (!hitAWall) return resolve(moved, velocity, LEVEL);

  // Keep the vertical part of the move and throw the horizontal part away entirely.
  const settled = resolve(
    { x: previous.x, y: moved.y, z: previous.z },
    velocity,
    LEVEL,
  );
  return {
    position: settled.position,
    velocity: { x: 0, y: settled.velocity.y, z: 0 },
    grounded: settled.grounded,
  };
}

/** Turning without wrapping the difference, so a turn past 180 degrees goes the long way round. */
function theLongWay(current: number, target: number, maxStep: number): number {
  const difference = target - current;
  if (Math.abs(difference) <= maxStep) return target;
  return current + Math.sign(difference) * maxStep;
}

/** Every tick of the run, so the scene can scrub through it and the check can sweep it. */
export function simulate(
  switches: Switches = ALL_ON,
  dt = TICK,
  duration = DURATION,
): Character[] {
  const out: Character[] = [START];
  let c = START;
  const ticks = Math.round(duration / dt);
  for (let i = 0; i < ticks; i += 1) {
    c = stepWith(c, inputAt(i * dt), CAMERA_YAW, dt, switches);
    out.push(c);
  }
  return out;
}

/** The camera stays put for the character scene, so the input mapping is readable. */
export const CAMERA_YAW = 0;

/**
 * The character as it should be **drawn** at an arbitrary moment, blended between ticks.
 *
 * Section 7.2's render interpolation. `interpolate` false draws the most recent tick instead, which
 * is what produces stutter when the display rate is not a multiple of the tick rate.
 */
export function drawnAt(
  ticks: Character[],
  time: number,
  interpolate: boolean,
  dt = TICK,
): { position: Vec3; yaw: number } {
  const exact = time / dt;
  const index = Math.min(Math.floor(exact), ticks.length - 1);
  const next = Math.min(index + 1, ticks.length - 1);
  if (!interpolate)
    return { position: ticks[index].position, yaw: ticks[index].yaw };
  const alpha = alphaFrom((exact - index) * dt, dt);
  const from = ticks[index];
  const to = ticks[next];
  return {
    position: {
      x: blend(
        { position: from.position.x, velocity: 0 },
        { position: to.position.x, velocity: 0 },
        alpha,
      ).position,
      y: blend(
        { position: from.position.y, velocity: 0 },
        { position: to.position.y, velocity: 0 },
        alpha,
      ).position,
      z: blend(
        { position: from.position.z, velocity: 0 },
        { position: to.position.z, velocity: 0 },
        alpha,
      ).position,
    },
    // Rotation is wrapped before blending, or a turn through the seam jumps backwards.
    yaw: from.yaw + wrapRad(to.yaw - from.yaw) * alpha,
  };
}

/** How many physics ticks a display frame gets, for the readout. Section 7.2. */
export function ticksForFrame(displayHz: number): number {
  return stepsFor(0, 1 / displayHz, TICK).steps;
}

// ---- The scripted camera shot -------------------------------------------------------------

/** Waypoints for a cinematic sweep, run as a Catmull-Rom spline. Section 4.4. */
export const SHOT: readonly Vec3[] = [
  V(-8, 3, 8),
  V(-2, 2.2, 7),
  V(4, 2.6, 4),
  V(6, 4, -2),
  V(1, 5, -7),
  V(-6, 3.4, -5),
];

/**
 * Where the scripted camera is, as a fraction along the shot.
 *
 * Section 4.4's spline module is two dimensional, because the figures on that page were. Rather
 * than write a second copy, it is called twice: once on the $(x, y)$ pairs and once on the
 * $(z, y)$ pairs. That works because Catmull-Rom is **componentwise** - every component is blended
 * with the same weights - so the $y$ that comes back from both calls is identical and the third
 * dimension really is free.
 */
export function shotAt(u: number): Vec3 {
  const t = Math.min(Math.max(u, 0), 1);
  const xy = catmullRomAt(
    SHOT.map((p) => ({ x: p.x, y: p.y })),
    t,
  );
  const zy = catmullRomAt(
    SHOT.map((p) => ({ x: p.z, y: p.y })),
    t,
  );
  return { x: xy.x, y: xy.y, z: zy.x };
}
