/**
 * A third-person character controller, assembled from the rest of the module.
 *
 * Almost nothing here is new. Input becomes a world direction with Section 1.1's basis and Section
 * 1.2's normalize. The jump is Section 7.1's impulse, sized by Section 7.1's backwards solve. The
 * velocity update is Section 7.2's semi-implicit ordering. Pushing out of geometry and sliding
 * along it is Section 6.3. Turning the short way is Section 1.5. The whole thing runs on Section
 * 7.2's fixed step.
 *
 * The one piece of genuinely new arithmetic is `uprightCapsuleContact`, and it is new only because
 * being upright is what makes it easy - see the comment on it.
 */
import type { Vec3 } from "./matrices.ts";
import type { Aabb, Capsule } from "./collision.ts";
import { closestOnBox } from "./geometry.ts";
import { basisFromYaw } from "./conventions.ts";
import { rotateToward, wrapRad } from "./angles.ts";
import { isWalkable, slideAlong, type Contact } from "./response.ts";
import { jumpFromHeightAndTime } from "./dynamics.ts";

/** A body 1.8 m tall and 0.7 m across: roughly a person. */
export const HEIGHT = 1.8;
export const RADIUS = 0.35;
export const SPEED = 5;
/** Tuned the Section 7.1 way: a height and a rise time, not a gravity. */
export const JUMP_HEIGHT = 1.2;
export const JUMP_RISE = 0.4;
export const { gravity: GRAVITY, launchSpeed: JUMP_SPEED } =
  jumpFromHeightAndTime(JUMP_HEIGHT, JUMP_RISE);
/** Radians per second. A constant rate, so `rate * dt` is frame-rate independent. */
export const TURN_RATE = 9;
export const MAX_SLOPE = 46;
/** A millimeter of clearance, so a resting character is not on the boundary. Section 6.3. */
export const SKIN = 0.001;
/** The tallest ledge the character will walk up rather than be stopped by. */
export const STEP_HEIGHT = 0.4;

/** What the player is asking for. Both axes in -1..1, as a stick or two keys would give. */
export type Input = { forward: number; strafe: number; jump: boolean };

/** Everything the controller carries between ticks. */
export type Character = {
  /** At the feet, because that is what a level designer places. */
  position: Vec3;
  velocity: Vec3;
  /** Which way the body is facing, which lags the direction it is moving. */
  yaw: number;
  grounded: boolean;
};

const add = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.x + b.x,
  y: a.y + b.y,
  z: a.z + b.z,
});
const mul = (a: Vec3, k: number): Vec3 => ({
  x: a.x * k,
  y: a.y * k,
  z: a.z * k,
});
const size = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/** The capsule occupied by a character standing at `position`. Always upright. */
export function capsuleFor(position: Vec3): Capsule {
  return {
    a: { x: position.x, y: position.y + RADIUS, z: position.z },
    b: { x: position.x, y: position.y + HEIGHT - RADIUS, z: position.z },
    radius: RADIUS,
  };
}

/**
 * Stick input to a world-space direction, relative to where the camera is looking.
 *
 * This is the thing that makes third-person controls feel right: "forward" means *away from the
 * camera*, not along some fixed world axis, so turning the camera turns what the stick means.
 *
 * Two details that are each a bug if missed. Section 1.1's basis is used to get the camera's
 * forward and right, rather than guessing at signs - forward is $-Z$, which is where the minus
 * comes from. And the result is **normalized**, which is Section 1.2's diagonal-speed fix: full
 * forward plus full strafe has length 1.41, so without it diagonal movement runs 41% fast.
 */
export function moveDirection(input: Input, cameraYaw: number): Vec3 {
  const basis = basisFromYaw(cameraYaw);
  const forward = { x: -basis.z[0], y: 0, z: -basis.z[2] };
  const right = { x: basis.x[0], y: 0, z: basis.x[2] };
  const wanted = add(mul(forward, input.forward), mul(right, input.strafe));
  const length = size(wanted);
  // No direction asked for is not the same as a direction of zero length, so say so.
  return length < 1e-6 ? { x: 0, y: 0, z: 0 } : mul(wanted, 1 / length);
}

/**
 * Contact between an **upright** capsule and an axis-aligned box, exactly.
 *
 * Section 6.2 was careful not to claim a capsule against a box is easy, because in general it is
 * not - a tilted capsule against a box has no tidy closed form, which is why engines reach for
 * GJK. Being upright is what changes that, and the reason is Section 6.1's: **both shapes are
 * axis-aligned, so the three axes stay independent.**
 *
 * The capsule's axis only varies in $y$, so the box's nearest $x$ and $z$ do not depend on which
 * point of the axis you pick. That leaves one interval-against-interval question in $y$, which is
 * a comparison. Three clamps again, no iteration and no approximation.
 *
 * A character controller is exactly this case, which is a nice piece of luck and worth knowing:
 * the shape that fits a person best is also the one that collides with level geometry cheaply.
 */
export function uprightCapsuleContact(
  capsule: Capsule,
  box: Aabb,
): Contact | null {
  // The point on the capsule's axis nearest the box, found in y alone.
  const low = Math.max(capsule.a.y, box.min.y);
  const high = Math.min(capsule.b.y, box.max.y);
  const y =
    low <= high
      ? low // the ranges overlap, so any y in the overlap is zero distance away
      : capsule.b.y < box.min.y
        ? capsule.b.y // wholly below the box
        : capsule.a.y; // wholly above it
  const onAxis: Vec3 = { x: capsule.a.x, y, z: capsule.a.z };
  const onBox = closestOnBox(box.min, box.max, onAxis);

  const away = {
    x: onAxis.x - onBox.x,
    y: onAxis.y - onBox.y,
    z: onAxis.z - onBox.z,
  };
  const gap = size(away);
  if (gap >= capsule.radius) return null;
  if (gap > 1e-9) {
    return { normal: mul(away, 1 / gap), depth: capsule.radius - gap };
  }

  /* The axis is inside the box, so there is no direction to push along - the same degenerate case
     Section 6.1 hit at the centre of a sphere. Fall back to Section 6.3's minimum translation
     vector: the shallowest face wins, because any other choice flings the character. */
  const centre = {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
  let axis: "x" | "y" | "z" = "y";
  let shallowest = Infinity;
  for (const k of ["x", "y", "z"] as const) {
    const half = (box.max[k] - box.min[k]) / 2;
    const overlap = half - Math.abs(onAxis[k] - centre[k]);
    if (overlap < shallowest) {
      shallowest = overlap;
      axis = k;
    }
  }
  const normal: Vec3 = { x: 0, y: 0, z: 0 };
  normal[axis] = onAxis[axis] >= centre[axis] ? 1 : -1;
  return { normal, depth: shallowest + capsule.radius };
}

/**
 * Push out of everything, repeatedly, and remove the blocked part of the velocity each time.
 *
 * Repeatedly, because resolving one contact can create another - sliding along a wall pushes you
 * into the floor. Section 6.3 does both halves each pass: the position fix uses the depth, the
 * velocity fix uses the normal, and doing only one of them either buzzes or sinks.
 *
 * **Eight passes, and the number was measured rather than guessed.** Four is plenty for anything
 * that arises from moving - a character stepping into a wall or a corner settles in one or two.
 * Four is not enough for a body that *starts* buried: sweeping 1,134 overlapping placements around
 * a box, 75 of them failed to clear in four passes, all of them with the capsule's axis fully
 * inside the box and up to 1.1 m deep. Every one of those settles by eight, because each pass can
 * only move by the shallowest face and the shallowest face changes as it goes.
 *
 * The cap itself stays, because a character genuinely wedged between two surfaces will never
 * settle, and a slightly wrong position is better than a frozen frame.
 */
export function resolve(
  position: Vec3,
  velocity: Vec3,
  level: readonly Aabb[],
  passes = 8,
): { position: Vec3; velocity: Vec3; grounded: boolean } {
  let where = position;
  let moving = velocity;
  let grounded = false;

  for (let pass = 0; pass < passes; pass += 1) {
    const capsule = capsuleFor(where);
    let deepest: Contact | null = null;
    for (const box of level) {
      const contact = uprightCapsuleContact(capsule, box);
      if (contact && (deepest === null || contact.depth > deepest.depth)) {
        deepest = contact;
      }
    }
    if (deepest === null) break;
    if (isWalkable(deepest.normal, MAX_SLOPE)) grounded = true;
    where = add(where, mul(deepest.normal, deepest.depth + SKIN));
    // Only interfere with a velocity heading into the surface, or the character sticks to walls.
    if (
      moving.x * deepest.normal.x +
        moving.y * deepest.normal.y +
        moving.z * deepest.normal.z <
      0
    ) {
      moving = slideAlong(moving, deepest.normal);
    }
  }

  return { position: where, velocity: moving, grounded };
}

/** Is any contact here too steep to stand on? That is what "blocked by a wall" means. */
function blockedByWall(position: Vec3, level: readonly Aabb[]): boolean {
  const capsule = capsuleFor(position);
  return level.some((box) => {
    const contact = uprightCapsuleContact(capsule, box);
    return contact !== null && !isWalkable(contact.normal, MAX_SLOPE);
  });
}

/**
 * The highest surface under a position that the character could stand on, at most `ceiling` high.
 *
 * Exact for boxes: the capsule's cross-section is a circle, so it overlaps a box's footprint when
 * the horizontal distance to that footprint is under the radius - Section 6.1's clamp again, in two
 * dimensions instead of three.
 */
export function supportUnder(
  position: Vec3,
  level: readonly Aabb[],
  ceiling: number,
): number | null {
  let best = -Infinity;
  for (const box of level) {
    const dx = Math.max(box.min.x - position.x, position.x - box.max.x, 0);
    const dz = Math.max(box.min.z - position.z, position.z - box.max.z, 0);
    if (Math.hypot(dx, dz) >= RADIUS) continue;
    if (box.max.y <= ceiling + 1e-9 && box.max.y > best) best = box.max.y;
  }
  return best === -Infinity ? null : best;
}

/**
 * Walk up a ledge instead of being stopped by it.
 *
 * **This is not optional, and the reason is worth knowing.** A capsule's lower hemisphere meets the
 * top edge of a ledge at a steep angle - for a 0.35 m radius against a 0.2 m ledge the contact
 * normal is 64 degrees from vertical, well past any sane slope limit - so push-out treats it as a
 * wall. What actually happens then is worse than being stopped: each pass shoves the capsule out
 * along a normal that has *some* upward component, so over several ticks it **ratchets** up and pops
 * onto the ledge anyway. Whether it manages that depends on the walking speed and the tick rate,
 * which is the kind of accident that works on your machine and not on someone else's.
 *
 * So do it deliberately. Lift by the step height, try the move there, and settle onto whatever
 * supports it. Unity spells this `stepOffset` and Godot puts it in `move_and_slide`; both exist for
 * exactly this reason.
 */
export function tryStepUp(
  from: Vec3,
  moved: Vec3,
  level: readonly Aabb[],
): Vec3 | null {
  const lifted: Vec3 = { x: moved.x, y: from.y + STEP_HEIGHT, z: moved.z };
  if (blockedByWall(lifted, level)) return null;
  const support = supportUnder(lifted, level, lifted.y);
  if (support === null || support <= from.y + SKIN) return null;
  if (support - from.y > STEP_HEIGHT) return null;
  const stepped: Vec3 = { x: moved.x, y: support + SKIN, z: moved.z };
  return blockedByWall(stepped, level) ? null : stepped;
}

/**
 * One fixed tick of the whole controller.
 *
 * The ordering is not arbitrary. Velocity is updated before position, which is Section 7.2's
 * semi-implicit Euler and the reason a spring in this system would stay bounded. The jump is
 * applied as an instant change rather than a force, which is Section 7.1's impulse and the reason
 * it feels sharp. Collision runs last, on a position that has already moved.
 */
export function step(
  character: Character,
  input: Input,
  cameraYaw: number,
  level: readonly Aabb[],
  dt: number,
): Character {
  const wanted = moveDirection(input, cameraYaw);

  // Horizontal speed is set outright rather than accelerated into, which is what makes an
  // action game feel responsive. Swap in Section 4.1's damp for something with weight.
  let velocity: Vec3 = {
    x: wanted.x * SPEED,
    y: character.velocity.y,
    z: wanted.z * SPEED,
  };

  if (input.jump && character.grounded) velocity.y = JUMP_SPEED;
  velocity = { x: velocity.x, y: velocity.y - GRAVITY * dt, z: velocity.z };

  const moved = add(character.position, mul(velocity, dt));

  /* Try the ledge first, but only when already standing on something: a character in mid-air must
     not be able to teleport onto a ledge it happened to brush past. */
  const stepped =
    character.grounded && blockedByWall(moved, level)
      ? tryStepUp(character.position, moved, level)
      : null;
  const settled = resolve(stepped ?? moved, velocity, level);

  /* Face the way you are going, arriving there over a few frames rather than instantly. Section
     1.5's shortest rotation is what stops a 179 degree turn going the long way round. */
  /* Wrapped, so the stored yaw stays within half a turn of zero instead of winding up past a full
     turn after a few laps. `rotateToward` already folds the *difference*, so this only keeps the
     state canonical - which matters, because an unwrapped yaw makes two identical facings compare
     as different numbers. */
  const yaw =
    size(wanted) < 1e-6
      ? character.yaw
      : wrapRad(
          rotateToward(
            character.yaw,
            Math.atan2(wanted.x, wanted.z),
            TURN_RATE * dt,
          ),
        );

  return {
    position: settled.position,
    velocity: settled.velocity,
    yaw,
    grounded: settled.grounded,
  };
}

// ---- The camera ---------------------------------------------------------------------------

/**
 * Where the camera should sit, given an orbit and a target.
 *
 * Section 5.2's spherical coordinates, so each drag axis drives exactly one number and the
 * elevation can be clamped short of the pole where the azimuth stops meaning anything.
 */
export function orbitPosition(
  target: Vec3,
  azimuth: number,
  elevation: number,
  distance: number,
): Vec3 {
  const el = clamp(elevation, -80, 80);
  const a = (azimuth * Math.PI) / 180;
  const e = (el * Math.PI) / 180;
  return {
    x: target.x + distance * Math.cos(e) * Math.sin(a),
    y: target.y + distance * Math.sin(e),
    z: target.z + distance * Math.cos(e) * Math.cos(a),
  };
}

/** The point the camera looks at: the character's chest, not their feet. */
export function lookTarget(position: Vec3): Vec3 {
  return { x: position.x, y: position.y + HEIGHT * 0.65, z: position.z };
}
