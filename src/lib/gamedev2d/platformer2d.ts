/**
 * A platformer character, assembled entirely out of the eighteen Sections before it.
 *
 * Nothing here is new mathematics. Every piece is imported from the Section that introduced it, and the file
 * is mostly about the **order things happen in** - which turns out to be where the bugs live once each
 * individual piece is correct.
 *
 * | Piece | From |
 * | :--- | :--- |
 * | input to a direction, without the diagonal bug | 1.3 |
 * | an AABB and its overlap test | 5.1 |
 * | resolving the overlap and killing the velocity into the surface | 5.4 |
 * | semi-implicit velocity, and a jump asked for by height and time | 6.1 |
 * | coyote time and jump buffering as clamped remaps | 4.2 |
 * | a camera that follows by exponential decay | 3.3 and 4.1 |
 * | the fixed timestep that makes all of it reproducible | 4.1 |
 */
import { aabbsOverlap, boxAround, type Aabb } from "./collide2d.ts";
import { clamp01, inverseLerp } from "./easing2d.ts";
import { normalize } from "./length2d.ts";
import { jumpFromHeightAndTime } from "./physics2d.ts";
import { smooth } from "./time2d.ts";
import { movedBy, scaled, type Point, type Vector } from "./vectors2d.ts";

// ---- The fixed timestep, from Section 4.1 -----------------------------------------------------

/** The step the simulation always takes, whatever the display is doing. */
export const FIXED_DT = 1 / 120;

/**
 * How many fixed steps a variable frame owes, and what is left over.
 *
 * The accumulator pattern: add the real frame time to a running total, spend it in whole fixed steps, and
 * carry the remainder. Section 4.1 made every formula frame-rate independent; this makes the whole
 * simulation **frame-rate identical**, which is stronger - the same inputs give bit-for-bit the same result
 * on any machine.
 *
 * **The cap is not optional.** Without `maxSteps`, one slow frame asks for many steps, those steps take
 * longer than a frame, which asks for more steps next time. That is the spiral of death, and it is a hang
 * rather than a slowdown. Capping drops simulated time on the floor, which is the right trade: the game
 * runs slow for a moment instead of stopping for good.
 */
export function stepsFor(
  accumulator: number,
  frameTime: number,
  fixedDt = FIXED_DT,
  maxSteps = 8,
): { steps: number; leftover: number; dropped: number } {
  const total = accumulator + frameTime;
  const wanted = Math.floor(total / fixedDt);
  const steps = Math.min(wanted, maxSteps);
  // Time the cap threw away, which is worth reporting rather than hiding.
  const dropped = (wanted - steps) * fixedDt;
  /* The dropped time is subtracted from the carry, not left in it. Reporting time as dropped and then
     carrying it anyway is the bug this function was written with: the backlog survives, so the next frame
     is capped too, and the game crawls at `maxSteps` per frame until it works the debt off. Throwing it
     away is what makes the recovery immediate and what makes `leftover < fixedDt` unconditionally true. */
  /* Clamped at zero because `steps * fixedDt + dropped` is not exactly `wanted * fixedDt` in floating point,
     so the subtraction can land a few parts in a quintillion below nothing. A negative carry would make the
     next frame ask for one step fewer, which is invisible in a game and not invisible in an assertion. */
  return {
    steps,
    leftover: Math.max(0, total - steps * fixedDt - dropped),
    dropped,
  };
}

/** How far through the current fixed step the display is, for interpolating the drawn position. */
export function renderAlpha(leftover: number, fixedDt = FIXED_DT): number {
  return clamp01(leftover / fixedDt);
}

// ---- Input, from Section 1.3 ------------------------------------------------------------------

export type Input = {
  /** -1, 0 or +1. */
  x: number;
  /** True on the frame the button went down. */
  jumpPressed: boolean;
  /** True while it is held. */
  jumpHeld: boolean;
};

/**
 * Input turned into a direction of length at most one.
 *
 * A platformer only moves on one axis, so the diagonal speed bug from Section 1.3 cannot bite here - but the
 * same function serves a top-down game where it very much can, and normalizing costs nothing when the input
 * is already axis-aligned. Returns the zero vector for no input rather than `null`, because "not moving" is
 * a perfectly good movement direction and the caller should not have to branch.
 */
export function moveDirection(input: Vector): Vector {
  const unit = normalize(input);
  return unit === null ? { x: 0, y: 0 } : unit;
}

// ---- Coyote time and jump buffering, from Section 4.2 -----------------------------------------

/**
 * Two forgiving windows, and both of them are `inverseLerp` with a clamp.
 *
 * **Coyote time** lets a jump work for a moment *after* walking off a ledge. **Jump buffering** lets a jump
 * pressed slightly *before* landing fire on touchdown. Together they cover the two ways a player can be a
 * few frames out, and they are the single cheapest thing that makes a platformer feel fair.
 *
 * Both are the same shape: how long ago did the thing happen, as a fraction of a window, clamped. Which is
 * Section 4.2's `inverseLerp` and `clamp01`, doing a job that does not look like interpolation at all.
 */
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;

/**
 * How much of the coyote window is left, from 1 at the instant of leaving to 0 when it has expired.
 *
 * **The zero-window branch is not defensive padding.** Section 4.2's `inverseLerp` returns `0` for an empty
 * range rather than dividing by zero, which is the right answer there and exactly the wrong one here: it
 * makes `1 - 0 = 1`, so a window of zero would report the coyote time as **permanently full**. Setting the
 * window to zero to switch the feature off would switch it on forever. Found by writing the off switch.
 */
export function coyoteRemaining(
  timeSinceGrounded: number,
  window = COYOTE_TIME,
): number {
  if (window <= 0) return timeSinceGrounded <= 0 ? 1 : 0;
  return clamp01(1 - inverseLerp(0, window, timeSinceGrounded));
}

/** And the same for a buffered press, with the same guard for the same reason. */
export function bufferRemaining(
  timeSincePressed: number,
  window = JUMP_BUFFER,
): number {
  if (window <= 0) return timeSincePressed <= 0 ? 1 : 0;
  return clamp01(1 - inverseLerp(0, window, timeSincePressed));
}

/**
 * May this character jump? Grounded, or recently enough grounded, and asking recently enough.
 *
 * Stated as one function because the two windows have to be considered together: a buffered press landing
 * inside the coyote window is exactly the case both features exist to catch, and testing them separately is
 * how that case gets missed.
 */
export function canJump(
  timeSinceGrounded: number,
  timeSincePressed: number,
  coyote = COYOTE_TIME,
  buffer = JUMP_BUFFER,
): boolean {
  return (
    coyoteRemaining(timeSinceGrounded, coyote) > 0 &&
    bufferRemaining(timeSincePressed, buffer) > 0
  );
}

// ---- Move and slide, from Sections 5.1 and 5.4 ------------------------------------------------

/** A tile map as a set of solid cells, which is all a platformer needs. */
export type Tiles = {
  /** Cell size in world units. */
  size: number;
  /** `solid[y][x]`, with y counting upward from the bottom. */
  solid: readonly (readonly boolean[])[];
};

/** The box a tile occupies. */
export function tileBox(tiles: Tiles, cx: number, cy: number): Aabb {
  return boxAround(
    { x: (cx + 0.5) * tiles.size, y: (cy + 0.5) * tiles.size },
    tiles.size,
    tiles.size,
  );
}

export function isSolid(tiles: Tiles, cx: number, cy: number): boolean {
  return tiles.solid[cy]?.[cx] === true;
}

/** Every solid tile a box could be touching. Only the cells it spans need testing. */
export function nearbyTiles(tiles: Tiles, box: Aabb): Aabb[] {
  const first = {
    x: Math.floor(box.min.x / tiles.size),
    y: Math.floor(box.min.y / tiles.size),
  };
  const last = {
    x: Math.floor(box.max.x / tiles.size),
    y: Math.floor(box.max.y / tiles.size),
  };
  const found: Aabb[] = [];
  for (let cy = first.y; cy <= last.y; cy += 1) {
    for (let cx = first.x; cx <= last.x; cx += 1) {
      if (isSolid(tiles, cx, cy)) found.push(tileBox(tiles, cx, cy));
    }
  }
  return found;
}

export type Character = {
  /** The centre of the character's box. */
  position: Point;
  velocity: Vector;
  /** Half the width and height of the box. */
  half: Point;
  grounded: boolean;
};

export function boxOf(c: Character): Aabb {
  return {
    min: { x: c.position.x - c.half.x, y: c.position.y - c.half.y },
    max: { x: c.position.x + c.half.x, y: c.position.y + c.half.y },
  };
}

/**
 * How much overlap counts as **touching rather than colliding**. Section 5.4's skin, moved onto the test.
 *
 * Section 5.4 pushed two shapes a definite distance apart so the next frame's test could not be decided by
 * the last bit of a float. This is the same idea from the other side: resolve exactly to the face, and treat
 * a contact thinner than this as no contact at all. Keeping the resolution exact is worth the swap, because
 * it leaves the character on round numbers a build can assert.
 *
 * **This is not optional, and here is the bug that proves it.** A character `0.9` units from centre to foot,
 * standing on a floor whose top is at `1.0`, has its centre at `1.9` - and `1.9 - 0.9` is
 * `0.9999999999999999`, not `1`. Its foot is one bit **below** the floor. So the next **horizontal** move
 * finds itself overlapping the floor tile it is standing on, resolves against it sideways, and snaps the
 * character back to the left edge of that tile. It walks backwards, drops off the level and falls out of the
 * world. Measured over 504 combinations of body size, speed and step size: that happened in 109 of them, and
 * every one had a body half-height whose sum with the floor height was not exactly representable.
 */
export const CONTACT_SKIN = 1e-6;

/** The overlap test every resolution below uses: a real overlap, not a shared edge. */
function overlapsBeyondSkin(box: Aabb, tile: Aabb): boolean {
  return aabbsOverlap(
    {
      min: { x: box.min.x + CONTACT_SKIN, y: box.min.y + CONTACT_SKIN },
      max: { x: box.max.x - CONTACT_SKIN, y: box.max.y - CONTACT_SKIN },
    },
    tile,
  );
}

/**
 * Move along **one axis**, then resolve on that axis alone. Called twice per step.
 *
 * This is the technique the whole capstone turns on, and it is not obvious. Moving diagonally and then asking
 * "which way do I push out" needs the minimum translation vector from Section 5.3, and against a grid of
 * tiles that answer is ambiguous at every corner - a character running along the floor gets pushed *upward*
 * by the tile ahead of it as easily as sideways, so it climbs walls or catches on seams between floor tiles.
 *
 * Splitting the move removes the ambiguity entirely. Move horizontally: any overlap must be resolved
 * horizontally, because vertically nothing changed. Then move vertically and resolve vertically. No minimum
 * translation vector, no corner cases, and the axis to push along is known before the test is run.
 *
 * The build measures the difference against the naive combined version rather than describing it.
 */
export function moveAxis(
  c: Character,
  tiles: Tiles,
  axis: "x" | "y",
  distance: number,
): Character {
  if (distance === 0) return c;
  const moved: Character = {
    ...c,
    position: movedBy(
      c.position,
      axis === "x" ? { x: distance, y: 0 } : { x: 0, y: distance },
    ),
  };
  const start = boxOf(c);
  const end = boxOf(moved);
  const forward = distance > 0;

  /* The region the box **passes through**, not just the one it lands in.
   
     This is the correctness of the whole function, and it took two wrong versions to get here. Testing only
     the destination box has two separate failure modes, both measured:
   
     - The first version snapped to each overlapping tile in turn, so with several tiles overlapping at once
       the answer was decided by `nearbyTiles`' iteration order. A character taller than one tile was snapped
       to the top of the **highest** tile beside it, which teleported it up a wall.
     - Taking the nearest face over the destination box fixed that and still left the character **inside** a
       tile it had stepped over: a move of 0.875 units onto a 0.5 unit grid lands past the first column, so
       the nearest face found belongs to the *second* one, and the box is placed straddling the first. It
       then oscillates, climbs, or leaves the level. Over 784 configurations that happened 154 times.
   
     Sweeping removes both, and it removes tunnelling with them: a move of any length is stopped by the first
     solid face in its path, because that face is inside the swept region however long the step was. This is
     Section 5.2's first-blocker over Section 5.4's swept motion, on one axis where both are exact. */
  const swept: Aabb =
    axis === "x"
      ? {
          min: { x: Math.min(start.min.x, end.min.x), y: start.min.y },
          max: { x: Math.max(start.max.x, end.max.x), y: start.max.y },
        }
      : {
          min: { x: start.min.x, y: Math.min(start.min.y, end.min.y) },
          max: { x: start.max.x, y: Math.max(start.max.y, end.max.y) },
        };

  /** The nearest face ahead of where the box started, over every tile the sweep touches. */
  let limit = forward ? Infinity : -Infinity;
  let blocked = false;
  for (const tile of nearbyTiles(tiles, swept)) {
    // `nearbyTiles` returns whole cells, so a box merely touching the edge of one is not yet overlapping it.
    if (!overlapsBeyondSkin(swept, tile)) continue;
    const face =
      axis === "x"
        ? forward
          ? tile.min.x
          : tile.max.x
        : forward
          ? tile.min.y
          : tile.max.y;
    /* Faces the box has already passed are not blockers. Without this, a character resting *on* a surface
       would be "blocked" by it when moving sideways and snapped back to its edge. */
    const leadingEdge = axis === "x" ? start.max.x : start.max.y;
    const trailingEdge = axis === "x" ? start.min.x : start.min.y;
    if (
      forward
        ? face < leadingEdge - CONTACT_SKIN
        : face > trailingEdge + CONTACT_SKIN
    )
      continue;
    blocked = true;
    limit = forward ? Math.min(limit, face) : Math.max(limit, face);
  }
  if (!blocked) return moved;

  const back = forward ? -1 : 1;
  if (axis === "x") {
    return {
      ...moved,
      position: { x: limit + back * c.half.x, y: moved.position.y },
      velocity: { x: 0, y: moved.velocity.y },
    };
  }
  return {
    ...moved,
    position: { x: moved.position.x, y: limit + back * c.half.y },
    velocity: { x: moved.velocity.x, y: 0 },
    // Landing on something is what "grounded" means, and only a downward stop counts.
    grounded: !forward ? true : c.grounded,
  };
}

/**
 * The naive alternative, kept so the build can price it: move both axes, then resolve.
 *
 * Resolves along whichever axis the overlap is shallower, which is Section 5.3's minimum translation vector
 * applied to a box. Reasonable-looking, and it produces the classic platformer bugs.
 */
export function moveCombined(
  c: Character,
  tiles: Tiles,
  delta: Vector,
): Character {
  const moved: Character = { ...c, position: movedBy(c.position, delta) };
  let position = moved.position;
  let velocity = moved.velocity;
  let grounded = c.grounded;
  for (const tile of nearbyTiles(tiles, boxOf(moved))) {
    const current = boxOf({ ...moved, position });
    // The same contact skin as the per-axis version, so the comparison is about the axis choice and nothing else.
    if (!overlapsBeyondSkin(current, tile)) continue;
    const overlapX =
      Math.min(current.max.x, tile.max.x) - Math.max(current.min.x, tile.min.x);
    const overlapY =
      Math.min(current.max.y, tile.max.y) - Math.max(current.min.y, tile.min.y);
    if (overlapX < overlapY) {
      position = {
        x:
          current.min.x < tile.min.x
            ? position.x - overlapX
            : position.x + overlapX,
        y: position.y,
      };
      velocity = { x: 0, y: velocity.y };
    } else {
      const pushedUp = current.min.y < tile.min.y;
      position = {
        x: position.x,
        y: pushedUp ? position.y - overlapY : position.y + overlapY,
      };
      if (!pushedUp) grounded = true;
      velocity = { x: velocity.x, y: 0 };
    }
  }
  return { ...moved, position, velocity, grounded };
}

// ---- The camera, from Sections 3.3 and 4.1 ----------------------------------------------------

/** How quickly the camera closes half the gap to the character. Section 4.1's half-life. */
export const CAMERA_HALF_LIFE = 0.14;

/** One step of a following camera. Exponential decay, so the frame rate cannot change the feel. */
export function followCamera(
  cameraX: number,
  targetX: number,
  dt: number,
  halfLife = CAMERA_HALF_LIFE,
): number {
  return smooth(cameraX, targetX, halfLife, dt);
}

/**
 * The camera held inside the level, so it never shows past either end.
 *
 * Clamping the camera and not the character is the correct pairing: the character may stand anywhere,
 * including in a corner the camera cannot centre on. Section 5.1's clamp again, on one axis, and this is
 * the fourth job that one function has done in this Module.
 */
export function clampCamera(x: number, min: number, max: number): number {
  return max < min ? (min + max) / 2 : Math.min(Math.max(x, min), max);
}

/** The art scale a pixel-art game draws at: a sixteen pixel tile on a half-unit grid. */
export const ART_PIXELS_PER_UNIT = 32;

/**
 * The jitter trap: **snapping the camera to whole pixels while the character moves smoothly.**
 *
 * Pixel-snapping a camera is standard practice for pixel art, and done alone it is fine. Done while the
 * character's own position is *not* snapped, the character's offset from the camera jumps by up to a whole
 * pixel each frame - so the character shivers against a rock-steady background. The fix is to snap **both**
 * or neither, and the build measures the difference.
 */
export function snapToPixel(worldX: number, pixelsPerUnit: number): number {
  return Math.round(worldX * pixelsPerUnit) / pixelsPerUnit;
}

/**
 * The four things you can round, and only one of them holds still.
 *
 * `"the offset"` is the answer, and it is the one nobody reaches for: round the character's **distance from
 * the camera**, rather than rounding the two world positions and subtracting. Rounding both separately looks
 * like it should work and does not - two independently rounded numbers whose difference is constant have a
 * difference that alternates between the two integers either side of it, so the character still slides a
 * whole pixel back and forth. Measured at the run speed: `"camera only"` wobbles by 0.8 px, `"both"` by a
 * full pixel, and `"the offset"` by nothing at all.
 */
export type PixelSnap = "neither" | "camera only" | "both" | "the offset";

export function apparentOffset(
  characterX: number,
  cameraX: number,
  pixelsPerUnit: number,
  snap: PixelSnap,
): number {
  if (snap === "neither") return (characterX - cameraX) * pixelsPerUnit;
  if (snap === "the offset")
    return Math.round((characterX - cameraX) * pixelsPerUnit);
  const camera = snapToPixel(cameraX, pixelsPerUnit);
  const character =
    snap === "both" ? snapToPixel(characterX, pixelsPerUnit) : characterX;
  return (character - camera) * pixelsPerUnit;
}

// ---- The step, with everything in its place ---------------------------------------------------

export type Tuning = {
  runSpeed: number;
  jumpHeight: number;
  timeToApex: number;
  /** What fraction of the upward velocity survives releasing the button. Section 6.1. */
  cutJump: number;
  maxFallSpeed: number;
};

export const TUNING: Tuning = {
  runSpeed: 6,
  jumpHeight: 2.4,
  timeToApex: 0.34,
  cutJump: 0.45,
  maxFallSpeed: 18,
};

/** The gravity and launch speed the tuning above implies. Section 6.1, solved backwards. */
export function derived(tuning: Tuning = TUNING) {
  return jumpFromHeightAndTime(tuning.jumpHeight, tuning.timeToApex);
}

export type StepState = {
  character: Character;
  /** Seconds since the character was last standing on something. */
  timeSinceGrounded: number;
  /** Seconds since jump was last pressed. */
  timeSincePressed: number;
  cameraX: number;
  /** Whether the step that produced this state fired a jump. An output, for the scenes to mark. */
  jumped: boolean;
};

/** What the step is allowed to vary, so the scenes can switch one piece off at a time. */
export type StepOptions = {
  dt?: number;
  tuning?: Tuning;
  /** False to resolve both axes at once, which is the version with the bugs. */
  perAxis?: boolean;
  /** Zero for no coyote time, which is how the scene shows what it buys. */
  coyote?: number;
  buffer?: number;
};

/**
 * One fixed step: **input, then velocity, then move, then camera.**
 *
 * The order is the content of this function. Velocity is integrated before the move, because the move needs
 * to know where it is going. The move happens one axis at a time. The camera follows *after* the character
 * has settled, so it never chases a position that is about to be corrected - chasing an unresolved position
 * is a jitter source that looks exactly like a camera problem and is not one.
 */
export function stepCharacter(
  state: StepState,
  input: Input,
  tiles: Tiles,
  options: StepOptions = {},
): StepState {
  const {
    dt = FIXED_DT,
    tuning = TUNING,
    perAxis = true,
    coyote = COYOTE_TIME,
    buffer = JUMP_BUFFER,
  } = options;
  const { launch, gravity } = derived(tuning);
  let c = { ...state.character };

  // Timers first, so "how long since" means "at the start of this step".
  const timeSincePressed = input.jumpPressed ? 0 : state.timeSincePressed + dt;
  const timeSinceGrounded = c.grounded ? 0 : state.timeSinceGrounded + dt;

  // Horizontal velocity is set rather than accelerated, which is what makes a platformer feel responsive.
  const direction = moveDirection({ x: input.x, y: 0 });
  c.velocity = { x: direction.x * tuning.runSpeed, y: c.velocity.y };

  // The jump, if the two windows allow it. Section 4.2's clamps deciding a Section 6.1 launch.
  const jumped = canJump(timeSinceGrounded, timeSincePressed, coyote, buffer);
  if (jumped) c.velocity = { x: c.velocity.x, y: launch };

  // Releasing the button cuts the rise short. Section 6.1, and the guard matters.
  if (!input.jumpHeld && c.velocity.y > 0 && !jumped) {
    c.velocity = { x: c.velocity.x, y: c.velocity.y * tuning.cutJump };
  }

  // Gravity, semi-implicit: velocity first. Section 6.1.
  c.velocity = {
    x: c.velocity.x,
    y: Math.max(c.velocity.y + gravity * dt, -tuning.maxFallSpeed),
  };

  // The move. Grounded is re-established by the move itself, so it is cleared first.
  c = { ...c, grounded: false };
  if (perAxis) {
    c = moveAxis(c, tiles, "x", c.velocity.x * dt);
    c = moveAxis(c, tiles, "y", c.velocity.y * dt);
  } else {
    c = moveCombined(c, tiles, scaled(c.velocity, dt));
  }

  /* Both timers are pushed past their windows on a jump, which is what stops one press becoming two jumps.
     Clearing only the press would leave the coyote window open for another frame; clearing only the coyote
     timer would leave the press live for the next landing. It takes both. */
  return {
    character: c,
    timeSinceGrounded: jumped ? coyote + 1 : timeSinceGrounded,
    timeSincePressed: jumped ? buffer + 1 : timeSincePressed,
    cameraX: followCamera(state.cameraX, c.position.x, dt),
    jumped,
  };
}
