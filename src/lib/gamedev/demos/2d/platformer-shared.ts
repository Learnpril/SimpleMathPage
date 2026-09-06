/**
 * One level, one scripted run through it, and the mapping the two capstone scenes draw with.
 *
 * The run is **scripted rather than played**. Nothing here reads a key: the input is a function of the step
 * number, so the same 432 steps happen on every machine and every build, and the scenes are a scrubbable
 * recording rather than a game. That is what lets the build assert what the character does.
 */
import {
  ART_PIXELS_PER_UNIT,
  COYOTE_TIME,
  FIXED_DT,
  JUMP_BUFFER,
  TUNING,
  apparentOffset,
  bufferRemaining,
  boxOf,
  clampCamera as clampCameraTo,
  coyoteRemaining,
  derived,
  followCamera,
  moveAxis,
  moveCombined,
  stepCharacter,
  stepsFor,
  tileBox,
  type Character,
  type Input,
  type PixelSnap,
  type StepOptions,
  type StepState,
  type Tiles,
} from "../../../gamedev2d/platformer2d.ts";
import type { Aabb } from "../../../gamedev2d/collide2d.ts";
import type { Point } from "../../../gamedev2d/vectors2d.ts";

// ---- The level -------------------------------------------------------------------------------

export const TILE = 0.5;
export const COLS = 48;
export const ROWS = 16;

/**
 * Solid spans per row as inclusive column pairs, with **row 0 at the bottom**.
 *
 * Written as spans rather than as rows of characters because a row of 48 dots is impossible to
 * proof-read, and a level whose geometry is off by one column would quietly change every timing below.
 */
const SPANS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [[0, 47]], // bedrock, so nothing can fall out of the world
  [
    [0, 19],
    [24, 47],
  ], // the floor, with a trench from x 10 to x 12
  [
    [30, 33],
    [41, 42],
  ], // a step up to y 1.5, and the foot of a wall
  [[41, 42]],
  [[41, 42]],
  [[41, 42]],
  [[41, 42]], // the wall's top, 2.5 units above the floor and so out of jump range
];

function buildSolid(): boolean[][] {
  const rows: boolean[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => false),
  );
  SPANS.forEach((spans, cy) => {
    for (const [from, to] of spans) {
      for (let cx = from; cx <= to; cx += 1) rows[cy][cx] = true;
    }
  });
  return rows;
}

export const TILES: Tiles = { size: TILE, solid: buildSolid() };

/** Every solid cell, worked out once so a scene can draw the level without a nested loop. */
export const SOLID_CELLS: ReadonlyArray<{ cx: number; cy: number }> =
  TILES.solid
    .flatMap((row, cy) => row.map((solid, cx) => ({ cx, cy, solid })))
    .filter((c) => c.solid)
    .map(({ cx, cy }) => ({ cx, cy }));

/** The three things worth labelling, in world units, so the scene never hard-codes a coordinate. */
export const LANDMARKS = {
  /** The floor's top, and the ledge the trench begins at. */
  floorTop: 2 * TILE,
  trench: { from: 20 * TILE, to: 24 * TILE },
  step: { from: 30 * TILE, to: 34 * TILE, top: 3 * TILE },
  wall: { from: 41 * TILE, to: 43 * TILE, top: 7 * TILE },
} as const;

// ---- The view --------------------------------------------------------------------------------

/** Canvas pixels per world unit. The whole level is eight units tall, which is the canvas exactly. */
export const UNIT = 40;
export const VIEW = { width: 620, height: 320 } as const;

/** Half the visible width in world units, which is what the camera clamp is made of. */
export const HALF_VIEW = VIEW.width / 2 / UNIT;

/** The camera cannot show past either end of the level. */
export const CAMERA_LIMITS = {
  min: HALF_VIEW,
  max: COLS * TILE - HALF_VIEW,
} as const;

export function clampCamera(x: number): number {
  return clampCameraTo(x, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
}

/** World to canvas pixels, given where the camera is. The Y flip lives here and nowhere else. */
export function screenOf(p: Point, cameraX: number): { x: number; y: number } {
  return {
    x: VIEW.width / 2 + (p.x - cameraX) * UNIT,
    y: VIEW.height - p.y * UNIT,
  };
}

/** And back, exercised as a round trip by the checks. */
export function worldOf(sx: number, sy: number, cameraX: number): Point {
  return {
    x: (sx - VIEW.width / 2) / UNIT + cameraX,
    y: (VIEW.height - sy) / UNIT,
  };
}

/** A world box as a canvas rectangle, which is what both scenes actually want to draw. */
export function rectOf(
  box: Aabb,
  cameraX: number,
): { x: number; y: number; w: number; h: number } {
  const topLeft = screenOf({ x: box.min.x, y: box.max.y }, cameraX);
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: (box.max.x - box.min.x) * UNIT,
    h: (box.max.y - box.min.y) * UNIT,
  };
}

export function cellRect(
  cx: number,
  cy: number,
  cameraX: number,
): { x: number; y: number; w: number; h: number } {
  return rectOf(tileBox(TILES, cx, cy), cameraX);
}

/** One cell's world box, so a scene can draw the level without importing the library. */
export function tileBoxOf(cx: number, cy: number): Aabb {
  return tileBox(TILES, cx, cy);
}

// ---- The scripted run ------------------------------------------------------------------------

/** Where the character starts: on the floor, left of the trench, with no press pending. */
export const START: StepState = {
  character: {
    position: { x: 4.5, y: LANDMARKS.floorTop + 0.375 },
    velocity: { x: 0, y: 0 },
    half: { x: 0.1875, y: 0.375 },
    grounded: true,
  },
  timeSinceGrounded: 0,
  /* Deliberately far in the past. Starting this at zero means the very first step sees a press that never
     happened, and the character jumps before the reader has moved anything. */
  timeSincePressed: 10,
  cameraX: clampCamera(4.5),
  jumped: false,
};

/**
 * How long the run lasts. Measured, not chosen: it ends while the character is still moving.
 *
 * Anything past about 2.9 seconds leaves the character jammed against the far side of the step, which it
 * cannot climb back over without another jump - so the scrub bar's whole tail draws the same frame. At 2.9 the
 * worst run of identical frames anywhere on the slider is 13 notches, and at 3.4 it was 54.
 */
export const RUN_SECONDS = 2.9;
export const RUN_STEPS = Math.round(RUN_SECONDS / FIXED_DT);
export const TIME_RANGE = { min: 0, max: RUN_SECONDS, step: 0.01 } as const;

/**
 * Which way the stick is held, as `[from second, direction]`.
 *
 * The turn happens promptly after the wall, and the run ends while still moving. Both of those are about the
 * **slider** rather than the simulation: the first version held right until 2.95 s, so the character stood
 * pressed against the wall through 33 consecutive notches of the scrub bar with nothing on screen changing,
 * and it then released the stick and stood still for the last quarter second. A third of a second of dead
 * control is the same complaint as a dead control.
 */
const RUNS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [2.7, -1],
];

/**
 * When jump is pressed, and for how long it is held.
 *
 * Both of these are **deliberately mistimed**, which is the point. The first comes after the character has
 * already left the ledge and only works because of coyote time; the second comes before it has landed and
 * only works because of the buffer. Switch either window off in the scene and the corresponding jump does
 * not happen.
 */
const PRESSES: ReadonlyArray<{ at: number; hold: number }> = [
  { at: 0.99, hold: 0.35 },
  { at: 1.6, hold: 0.35 },
];

export function inputAtStep(stepIndex: number): Input {
  const t = stepIndex * FIXED_DT;
  let x = 0;
  for (const [from, direction] of RUNS) if (t >= from) x = direction;
  return {
    x,
    // Exactly one step owns each press, found by which step the press time falls inside.
    jumpPressed: PRESSES.some((p) => Math.floor(p.at / FIXED_DT) === stepIndex),
    jumpHeld: PRESSES.some((p) => t >= p.at && t < p.at + p.hold),
  };
}

export type Frame = {
  step: number;
  t: number;
  state: StepState;
  input: Input;
  /** The two windows as fractions, 1 down to 0, for the scene to draw as bars. */
  coyote: number;
  buffer: number;
  /** Stopped by something on this step while still asking to move. */
  blocked: boolean;
};

export type RunOptions = {
  perAxis?: boolean;
  coyote?: number;
  buffer?: number;
};

const cache = new Map<string, Frame[]>();

/**
 * The whole run, one entry per fixed step, cached so scrubbing a slider is not re-simulating.
 *
 * Deterministic by construction, so the cache can never be stale for a given set of switches.
 */
export function runScript(options: RunOptions = {}): Frame[] {
  const perAxis = options.perAxis ?? true;
  const coyote = options.coyote ?? COYOTE_TIME;
  const buffer = options.buffer ?? JUMP_BUFFER;
  const key = `${perAxis}|${coyote}|${buffer}`;
  const found = cache.get(key);
  if (found) return found;

  const step: StepOptions = { perAxis, coyote, buffer };
  const frames: Frame[] = [];
  let state = START;
  for (let i = 0; i < RUN_STEPS; i += 1) {
    const input = inputAtStep(i);
    const before = state.character.velocity.x;
    state = stepCharacter(state, input, TILES, step);
    frames.push({
      step: i,
      t: (i + 1) * FIXED_DT,
      state,
      input,
      coyote: coyoteRemaining(state.timeSinceGrounded, coyote),
      buffer: bufferRemaining(state.timeSincePressed, buffer),
      blocked:
        input.x !== 0 && state.character.velocity.x === 0 && before !== 0,
    });
  }
  cache.set(key, frames);
  return frames;
}

/** The frame a slider position lands on. Clamped, so the ends of the slider are the ends of the run. */
export function frameAt(seconds: number, options: RunOptions = {}): Frame {
  const frames = runScript(options);
  const index = Math.min(
    frames.length - 1,
    Math.max(0, Math.round(seconds / FIXED_DT) - 1),
  );
  return frames[index];
}

/**
 * What the run scene draws at one slider position, for the same reason `chargeSignature` exists.
 *
 * A dead control is invisible to every numeric assertion, so both scenes get their drawing compared across
 * their own slider instead.
 */
export function frameSignature(
  seconds: number,
  options: RunOptions = {},
): string {
  const frame = frameAt(seconds, options);
  const camera = clampCamera(frame.state.cameraX);
  const r = rectOf(boxOf(frame.state.character), camera);
  return [
    Math.round(r.x),
    Math.round(r.y),
    Math.round(camera * 100),
    frame.state.character.grounded ? "g" : "a",
    Math.round(frame.coyote * 100),
    Math.round(frame.buffer * 100),
  ].join(",");
}

/** The path the character took up to a given step, for drawing a trail behind it. */
export function trailTo(frame: Frame, options: RunOptions = {}): Point[] {
  return runScript(options)
    .slice(0, frame.step + 1)
    .map((f) => f.state.character.position);
}

/** Re-exported so a scene can switch a window off without importing the library directly. */
export const COYOTE_WINDOW = COYOTE_TIME;
export const JUMP_WINDOW = JUMP_BUFFER;

// ---- What the run proves ---------------------------------------------------------------------

/** Every step on which a jump actually fired, under a given set of switches. */
export function jumpSteps(options: RunOptions = {}): number[] {
  return runScript(options)
    .filter((f) => f.state.jumped)
    .map((f) => f.step);
}

/** Where the character ends up, which is the single number the switches change most visibly. */
export function endedAt(options: RunOptions = {}): Point {
  const frames = runScript(options);
  return frames[frames.length - 1].state.character.position;
}

/** The lowest point the character reached, so "fell in the trench" is a measurement not a guess. */
export function lowestPoint(options: RunOptions = {}): number {
  return Math.min(
    ...runScript(options).map((f) => f.state.character.position.y),
  );
}

/**
 * Where per-axis and combined resolution part company over the same input.
 *
 * Reported rather than described, because "the naive version has bugs" is worth nothing without a number.
 */
export function divergence(): {
  firstStep: number | null;
  worstGap: number;
  endGap: number;
} {
  const good = runScript({ perAxis: true });
  const bad = runScript({ perAxis: false });
  let firstStep: number | null = null;
  let worstGap = 0;
  for (let i = 0; i < good.length; i += 1) {
    const a = good[i].state.character.position;
    const b = bad[i].state.character.position;
    const gap = Math.hypot(a.x - b.x, a.y - b.y);
    if (gap > 1e-9 && firstStep === null) firstStep = i;
    worstGap = Math.max(worstGap, gap);
  }
  const a = good[good.length - 1].state.character.position;
  const b = bad[bad.length - 1].state.character.position;
  return { firstStep, worstGap, endGap: Math.hypot(a.x - b.x, a.y - b.y) };
}

// ---- The camera, and the pixel it shivers by -------------------------------------------------

/** The art scale a pixel-art game would draw at: a 16 pixel tile, so 32 pixels to the world unit. */
export const PIXELS_PER_UNIT = ART_PIXELS_PER_UNIT;

export type Snap = PixelSnap;
export const SNAPS: readonly Snap[] = [
  "neither",
  "camera only",
  "both",
  "the offset",
];

/**
 * How badly the character shivers against the background, under each snapping choice.
 *
 * Measured over a stretch where the character is running steadily in one direction, so its apparent offset
 * from the camera **should** only ever grow. A **reversal** is a step where it shrinks instead: the
 * character sliding backwards a fraction of a pixel while walking forwards, which is exactly what the eye
 * reads as jitter.
 */
export const JITTER_FPS = 60;
export const JITTER_SAMPLES = 240;

/**
 * The speeds the jitter scene offers, and the mechanism its slider is really moving.
 *
 * At `ART_PIXELS_PER_UNIT` pixels to the unit and 60 frames a second, a speed of $v$ advances
 * $v \times 32/60$ pixels per frame. **Whenever that advance is a whole number of pixels, every snapping
 * choice is clean** - which happens at $v = 1.875n$. The wobble is not really about the camera at all; it is
 * about a fractional advance being rounded, and the slider walks in and out of the fractions.
 *
 * The step is 0.125 so those whole-pixel speeds land exactly on slider notches rather than near them.
 */
export const JITTER_SPEED_RANGE = { min: 1, max: 12, step: 0.125 } as const;

/** How far the character moves in one displayed frame, in art pixels. */
export function perFramePixels(speed: number): number {
  return (speed * PIXELS_PER_UNIT) / JITTER_FPS;
}

/** Is that a whole number of pixels? The condition under which nothing shimmers. */
export function advancesWholePixels(speed: number): boolean {
  const advance = perFramePixels(speed);
  return Math.abs(advance - Math.round(advance)) < 1e-9;
}

/** The apparent offset frame by frame, once the camera has settled into its constant lag. */
export function jitterTrace(
  snap: Snap,
  speed: number,
  frames: number,
): number[] {
  const dt = 1 / JITTER_FPS;
  let characterX = 0;
  let cameraX = 0;
  // Warm up until the exponential lag has converged well below a thousandth of a pixel.
  for (let i = 0; i < JITTER_FPS * 3; i += 1) {
    characterX += speed * dt;
    cameraX = followCamera(cameraX, characterX, dt);
  }
  const values: number[] = [];
  for (let i = 0; i < frames; i += 1) {
    characterX += speed * dt;
    cameraX = followCamera(cameraX, characterX, dt);
    values.push(apparentOffset(characterX, cameraX, PIXELS_PER_UNIT, snap));
  }
  return values;
}

/** How many frames the scene plots. Enough to show the pattern repeat. */
export const JITTER_FRAMES = 25;

/** A fingerprint of the drawn traces, so the build can prove the slider is not dead. */
export function jitterSignature(speed: number): string {
  return SNAPS.map((snap) =>
    jitterTrace(snap, speed, JITTER_FRAMES)
      .map((v) => Math.round(v * 20))
      .join(","),
  ).join("|");
}

/** Every notch on the jitter slider. */
export function jitterSpeeds(): number[] {
  const values: number[] = [];
  for (
    let v = JITTER_SPEED_RANGE.min;
    v <= JITTER_SPEED_RANGE.max + 1e-9;
    v += JITTER_SPEED_RANGE.step
  ) {
    values.push(Number(v.toFixed(4)));
  }
  return values;
}

/**
 * Measured in **steady state**, which is the only place the question means anything.
 *
 * A camera catching up to a character it has fallen behind legitimately closes the gap, so the apparent
 * offset legitimately shrinks - and an earlier version of this function counted exactly that as jitter and
 * reported the correct choice as the worst one. So the character is run at a constant speed and the camera
 * is warmed up until it has settled into its constant lag before a single sample is taken. From there the
 * offset **should** hold still, and anything that moves is the snapping.
 */
export function jitterFor(
  snap: Snap,
  speed = TUNING.runSpeed,
): {
  wobble: number;
  reversals: number;
  wholePixels: boolean;
} {
  const offsets = jitterTrace(snap, speed, JITTER_SAMPLES);

  let reversals = 0;
  for (let i = 1; i < offsets.length; i += 1) {
    if (offsets[i] < offsets[i - 1] - 1e-9) reversals += 1;
  }
  return {
    // How far the character slides around on screen while its true offset is constant.
    wobble: Math.max(...offsets) - Math.min(...offsets),
    reversals,
    // Whether the character ever lands between two pixels, which is what resamples a sprite.
    wholePixels: offsets.every((o) => Math.abs(o - Math.round(o)) < 1e-9),
  };
}

// ---- The accumulator, for the values demo ----------------------------------------------------

/** A run of wildly uneven frame times, to show the accumulator spending them in whole fixed steps. */
export const FRAME_TIMES: readonly number[] = [
  0.0166, 0.0166, 0.05, 0.0083, 0.0166, 0.5, 0.0166,
];

export function accumulate(frameTimes: readonly number[] = FRAME_TIMES) {
  let leftover = 0;
  let steps = 0;
  let dropped = 0;
  let worstLeftover = 0;
  for (const frameTime of frameTimes) {
    const result = stepsFor(leftover, frameTime);
    leftover = result.leftover;
    steps += result.steps;
    dropped += result.dropped;
    worstLeftover = Math.max(worstLeftover, leftover);
  }
  return { steps, leftover, dropped, worstLeftover };
}

// ---- Charging at the step, which is the whole case for resolving one axis at a time -----------

/**
 * A character running right along the floor into the step, at a chosen speed, resolved both ways.
 *
 * This replaced a scene built on landing exactly on the step's corner. That case does separate the two
 * resolutions, but only over one or two positions out of eighty - a knife edge, and nothing a reader could
 * see. Running at the step separates them over half the slider, which is the difference between a figure
 * that teaches and a figure that happens to be true.
 */
export const CHARGE_SPEED_RANGE = { min: 4, max: 90, step: 1 } as const;
export const CHARGE_SECONDS = 1.2;
export const CHARGE_FROM = 13;

export const CHARGE_VIEW = { width: 620, height: 300 } as const;
export const CHARGE_UNIT = 48;
const CHARGE_CENTRE = { x: 18.5, y: 2.5 } as const;

export function chargeScreenOf(p: Point): { x: number; y: number } {
  return {
    x: CHARGE_VIEW.width / 2 + (p.x - CHARGE_CENTRE.x) * CHARGE_UNIT,
    y: CHARGE_VIEW.height / 2 - (p.y - CHARGE_CENTRE.y) * CHARGE_UNIT,
  };
}

export function chargeWorldOf(sx: number, sy: number): Point {
  return {
    x: (sx - CHARGE_VIEW.width / 2) / CHARGE_UNIT + CHARGE_CENTRE.x,
    y: CHARGE_CENTRE.y - (sy - CHARGE_VIEW.height / 2) / CHARGE_UNIT,
  };
}

export function chargeRectOf(box: Aabb): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const topLeft = chargeScreenOf({ x: box.min.x, y: box.max.y });
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: (box.max.x - box.min.x) * CHARGE_UNIT,
    h: (box.max.y - box.min.y) * CHARGE_UNIT,
  };
}

export type Charge = {
  points: Point[];
  end: Character;
  /** Stopped at the step's face, which is the only correct outcome. */
  stoppedAtFace: boolean;
  /** Ended up above the floor it started on, so it got over the step somehow. */
  climbed: boolean;
  /** Left the level altogether. */
  escaped: boolean;
};

/** How far right the character can legitimately get: flush against the step's face. */
export const CHARGE_FACE = LANDMARKS.step.from - 0.1875;

export function chargeAtStep(speed: number, perAxis: boolean): Charge {
  const { gravity } = derived(TUNING);
  let c: Character = {
    position: { x: CHARGE_FROM, y: LANDMARKS.floorTop + 0.375 },
    velocity: { x: speed, y: 0 },
    half: { x: 0.1875, y: 0.375 },
    grounded: true,
  };
  const points: Point[] = [c.position];
  let climbed = false;
  const steps = Math.round(CHARGE_SECONDS / FIXED_DT);
  for (let i = 0; i < steps; i += 1) {
    c = {
      ...c,
      velocity: { x: speed, y: c.velocity.y + gravity * FIXED_DT },
      grounded: false,
    };
    if (perAxis) {
      c = moveAxis(c, TILES, "x", c.velocity.x * FIXED_DT);
      c = moveAxis(c, TILES, "y", c.velocity.y * FIXED_DT);
    } else {
      c = moveCombined(c, TILES, {
        x: c.velocity.x * FIXED_DT,
        y: c.velocity.y * FIXED_DT,
      });
    }
    points.push(c.position);
    if (boxOf(c).min.y > LANDMARKS.floorTop + 1e-9) climbed = true;
    if (c.grounded) c = { ...c, velocity: { x: speed, y: 0 } };
  }
  return {
    points,
    end: c,
    stoppedAtFace: Math.abs(c.position.x - CHARGE_FACE) < 1e-9,
    climbed,
    escaped: c.position.x > COLS * TILE || boxOf(c).min.y < 0,
  };
}

/**
 * How many fixed steps a drawn time tick spans. **Two, which is one frame at 60 fps.**
 *
 * The charge scene needs these because the *outcome* of the charge is identical at every speed below the
 * naive version's failure point - that is the claim being made. So the path alone is pixel-identical from 4
 * to 44 units per second, and a reader moving the slider sees a completely dead picture. Marking equal
 * intervals of **time** along the path puts the speed back into the drawing.
 *
 * The interval was measured rather than chosen. At one tick per twentieth of a second the picture is still
 * identical across eight consecutive speeds, because above about 37 units per second the character arrives
 * inside a single tick and every tick after that piles up at the face. One tick per displayed frame gives 87
 * distinct pictures for the slider's 87 positions, and it is the more meaningful unit anyway: the gap between
 * two ticks is how far the character moves in one frame the player would see.
 */
export const CHARGE_TICK_STEPS = 2;
export const CHARGE_TICK_SECONDS = CHARGE_TICK_STEPS * FIXED_DT;

/** Which speeds on the slider each resolution survives, so the scene can shade the band. */
export function chargeSpeeds(): number[] {
  const values: number[] = [];
  for (
    let s = CHARGE_SPEED_RANGE.min;
    s <= CHARGE_SPEED_RANGE.max + 1e-9;
    s += CHARGE_SPEED_RANGE.step
  ) {
    values.push(s);
  }
  return values;
}

/**
 * A cheap fingerprint of everything the charge scene draws at one slider position.
 *
 * Exists because of a bug no other assertion could have caught: the figure was **pixel-identical at every
 * speed from 4 to 44**, since both resolutions stop in the same place and only the arrival time differs. Every
 * numeric assertion passed, the check was green, the build was green - and moving the slider did nothing at
 * all. Comparing the drawn geometry between slider positions is the only way to test that a control does
 * something, so it is worth the few lines.
 */
export function chargeSignature(speed: number): string {
  const parts: string[] = [];
  for (const perAxis of [true, false]) {
    const charge = chargeAtStep(speed, perAxis);
    charge.points.forEach((p, i) => {
      if (i % CHARGE_TICK_STEPS !== 0) return;
      const q = chargeScreenOf(p);
      parts.push(`${Math.round(q.x)},${Math.round(q.y)}`);
    });
    const r = chargeRectOf(boxOf(charge.end));
    parts.push(`box ${Math.round(r.x)},${Math.round(r.y)}`);
  }
  return parts.join(" ");
}

export function chargeSummary(): {
  perAxisFailures: number;
  combinedFailures: number;
  firstCombinedFailure: number | null;
  total: number;
  /** The speed above which one step is longer than the wall is thick. */
  tunnelSpeed: number;
} {
  const speeds = chargeSpeeds();
  let perAxisFailures = 0;
  let combinedFailures = 0;
  let firstCombinedFailure: number | null = null;
  for (const speed of speeds) {
    if (!chargeAtStep(speed, true).stoppedAtFace) perAxisFailures += 1;
    if (!chargeAtStep(speed, false).stoppedAtFace) {
      combinedFailures += 1;
      if (firstCombinedFailure === null) firstCombinedFailure = speed;
    }
  }
  return {
    perAxisFailures,
    combinedFailures,
    firstCombinedFailure,
    total: speeds.length,
    tunnelSpeed: (LANDMARKS.wall.to - LANDMARKS.wall.from) / FIXED_DT,
  };
}

/**
 * The old corner drop, kept because the values demo still prices it.
 *
 * A character falling onto the top-left corner of the step, moving right at a chosen speed.
 */
/**
 * How far left of the step's face the character starts, which is what the drop scene's slider moves.
 *
 * The gap is the interesting axis rather than the speed: it is the difference between clearing the corner
 * of a ledge and clipping it, and a player who starts their run a hair further back is the everyday way
 * of arriving in that band.
 */
export const DROP_GAP_RANGE = { min: 0.02, max: 0.8, step: 0.01 } as const;

/** How far above the step's top it starts, and how fast it is running. Fixed, so the slider means one thing. */
export const DROP_HEIGHT = 0.05;
export const DROP_SPEED = TUNING.runSpeed;
export const DROP_SECONDS = 0.9;
export const DROP_STEPS = Math.round(DROP_SECONDS / FIXED_DT);

export function dropStart(gap: number, speed = DROP_SPEED): Character {
  return {
    position: {
      x: LANDMARKS.step.from - gap - 0.1875,
      y: LANDMARKS.step.top + DROP_HEIGHT + 0.375,
    },
    velocity: { x: speed, y: 0 },
    half: { x: 0.1875, y: 0.375 },
    grounded: false,
  };
}

export type Drop = {
  points: Point[];
  /** Where it first came to rest, which is either the step's top or the floor beside it. */
  landedY: number;
  landedX: number;
  landedOnStep: boolean;
};

/**
 * Fall onto the corner and **stop at the moment of landing**.
 *
 * Stopping there is the whole measurement. The first version ran a fixed 1.2 seconds and read the final
 * position, which reported "landed on the floor" for every speed - because a character that lands on the
 * step keeps running and walks off its far end a few tenths of a second later. The two resolutions were
 * disagreeing exactly as claimed and the metric could not see it.
 */
export function dropPath(
  gap: number,
  perAxis: boolean,
  speed = DROP_SPEED,
): Drop {
  const { gravity } = derived(TUNING);
  let c: Character = dropStart(gap, speed);
  const points: Point[] = [c.position];
  for (let i = 0; i < DROP_STEPS; i += 1) {
    // Semi-implicit, as everywhere else: velocity first, then the move. Section 6.1.
    c = {
      ...c,
      velocity: { x: speed, y: c.velocity.y + gravity * FIXED_DT },
      grounded: false,
    };
    if (perAxis) {
      c = moveAxis(c, TILES, "x", c.velocity.x * FIXED_DT);
      c = moveAxis(c, TILES, "y", c.velocity.y * FIXED_DT);
    } else {
      c = moveCombined(c, TILES, {
        x: c.velocity.x * FIXED_DT,
        y: c.velocity.y * FIXED_DT,
      });
    }
    points.push(c.position);
    if (c.grounded) break;
  }
  const box = boxOf(c);
  return {
    points,
    landedY: box.min.y,
    landedX: c.position.x,
    landedOnStep: Math.abs(box.min.y - LANDMARKS.step.top) < 1e-9,
  };
}

/** The zoomed view the drop scene uses, centred on the corner the argument is about. */
export const DROP_VIEW = { width: 620, height: 300 } as const;
export const DROP_UNIT = 96;
const DROP_CENTRE = { x: LANDMARKS.step.from - 0.25, y: 1.9 } as const;

export function dropScreenOf(p: Point): { x: number; y: number } {
  return {
    x: DROP_VIEW.width / 2 + (p.x - DROP_CENTRE.x) * DROP_UNIT,
    y: DROP_VIEW.height / 2 - (p.y - DROP_CENTRE.y) * DROP_UNIT,
  };
}

export function dropWorldOf(sx: number, sy: number): Point {
  return {
    x: (sx - DROP_VIEW.width / 2) / DROP_UNIT + DROP_CENTRE.x,
    y: DROP_CENTRE.y - (sy - DROP_VIEW.height / 2) / DROP_UNIT,
  };
}

export function dropRectOf(box: Aabb): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const topLeft = dropScreenOf({ x: box.min.x, y: box.max.y });
  return {
    x: topLeft.x,
    y: topLeft.y,
    w: (box.max.x - box.min.x) * DROP_UNIT,
    h: (box.max.y - box.min.y) * DROP_UNIT,
  };
}

/** Every gap the slider offers, so a scene can shade the band where the two resolutions disagree. */
export function gapValues(): number[] {
  const values: number[] = [];
  for (
    let g = DROP_GAP_RANGE.min;
    g <= DROP_GAP_RANGE.max + 1e-9;
    g += DROP_GAP_RANGE.step
  ) {
    values.push(Number(g.toFixed(4)));
  }
  return values;
}

/** The starting gaps at which the two resolutions disagree, swept over the slider's own range. */
export function disagreementBand(speed = DROP_SPEED): {
  from: number | null;
  to: number | null;
  count: number;
  total: number;
} {
  let from: number | null = null;
  let to: number | null = null;
  let count = 0;
  const gaps = gapValues();
  for (const gap of gaps) {
    if (
      dropPath(gap, true, speed).landedOnStep !==
      dropPath(gap, false, speed).landedOnStep
    ) {
      if (from === null) from = gap;
      to = gap;
      count += 1;
    }
  }
  return { from, to, count, total: gaps.length };
}

/** The jump the tuning implies, quoted by both scenes so neither restates a constant. */
export function jumpNumbers() {
  return derived(TUNING);
}
