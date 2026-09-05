/**
 * The easings the gallery shows, and the geometry that lays them out.
 *
 * Six rather than a catalogue. A page listing thirty curves teaches that there are thirty curves; six
 * chosen ones teach what the choice is for. Each row pairs the curve with a track, because the curve
 * alone is a shape and the track is the thing a reader has actually seen in a game.
 */
import {
  easeInOutQuad,
  easeInQuad,
  easeOutBack,
  easeOutBounce,
  easeOutElastic,
  easeOutQuad,
  linear,
  smoothstep,
  type Easing,
} from "../../../gamedev2d/easing2d.ts";

export type Entry = {
  name: string;
  easing: Easing;
  /**
   * What it communicates, which is the only reason to prefer one over another.
   *
   * Drawn inside the picture, in a column of fixed width, so it has to stay short - `CAPTION_LIMIT`
   * below is asserted at build time. The longer version of each belongs in the Section's prose.
   */
  reads: string;
  /** Whether it leaves the 0 to 1 range, which decides where it is safe to use. */
  overshoots: boolean;
};

export const GALLERY: readonly Entry[] = [
  {
    name: "linear",
    easing: linear,
    reads: "mechanical, hard stop",
    overshoots: false,
  },
  {
    name: "easeInQuad",
    easing: easeInQuad,
    reads: "heavy, getting going",
    overshoots: false,
  },
  {
    name: "easeOutQuad",
    easing: easeOutQuad,
    reads: "arriving with weight",
    overshoots: false,
  },
  {
    name: "easeInOutQuad",
    easing: easeInOutQuad,
    reads: "two parabolas, joined",
    overshoots: false,
  },
  {
    name: "smoothstep",
    easing: (t) => smoothstep(0, 1, t),
    reads: "one curve, no kink",
    overshoots: false,
  },
  {
    name: "easeOutBack",
    easing: easeOutBack,
    reads: "eager, goes past",
    overshoots: true,
  },
];

/** Two more the page discusses but the gallery does not need a row for. */
export const EXTRAS: readonly Entry[] = [
  {
    name: "easeOutElastic",
    easing: easeOutElastic,
    reads: "springy, and it lingers",
    overshoots: true,
  },
  {
    name: "easeOutBounce",
    easing: easeOutBounce,
    reads: "dropped, and it settles",
    overshoots: false,
  },
];

/** Every easing the checks should sweep: the gallery and the two extras. */
export const ALL: readonly Entry[] = [...GALLERY, ...EXTRAS];

/** How many characters of caption the name column has room for. Asserted, not hoped for. */
export const CAPTION_LIMIT = 23;

/** Where the ghost dots go, so the spacing shows the speed profile rather than describing it. */
export const GHOSTS = 11;

/** The eleven **equally spaced instants** the ghosts mark. Equal in time is the whole point. */
export function ghostTimes(): number[] {
  return Array.from({ length: GHOSTS }, (_, i) => i / (GHOSTS - 1));
}

/**
 * The highest and lowest an easing reaches over the unit interval, found by dense sampling.
 *
 * Sampled rather than solved: several of these are piecewise or trigonometric, and the point is to
 * report what the function actually does, not what its closed form suggests. Used to assert which
 * curves leave the range, so `overshoots` above cannot quietly become a lie.
 */
export function extremes(
  easing: Easing,
  samples = 4000,
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= samples; i += 1) {
    const value = easing(i / samples);
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
}

/** Is the curve non-decreasing across the interval? True for every easing here except the springy ones. */
export function isMonotone(easing: Easing, samples = 2000): boolean {
  let previous = easing(0);
  for (let i = 1; i <= samples; i += 1) {
    const value = easing(i / samples);
    if (value < previous - 1e-12) return false;
    previous = value;
  }
  return true;
}

/**
 * The curve's slope at a point, approximated by a central difference.
 *
 * Crude, and sufficient: the questions asked of it are whether the slope is near zero or near one, and
 * how large its peak is. Those answers are not close together.
 */
export function slopeAt(easing: Easing, t: number, h = 1e-5): number {
  const hi = Math.min(1, t + h);
  const lo = Math.max(0, t - h);
  return (easing(hi) - easing(lo)) / (hi - lo);
}

/**
 * The curve's **curvature**, which is what actually separates the S-shapes from each other.
 *
 * Zero end slope is shared by `easeInOutQuad`, `easeInOutCubic`, `smoothstep` and `smootherstep`
 * alike, so it distinguishes nothing. The second derivative does: at the ends it is $4$ for the
 * piecewise quadratic and $6$ for smoothstep, and it goes to zero for smootherstep. In the middle the
 * piecewise ones jump discontinuously from positive to negative and the single polynomials pass
 * through zero. This is measured because the first version of this Section claimed the wrong thing.
 */
export function curvatureAt(easing: Easing, t: number, h = 1e-4): number {
  return (easing(t + h) - 2 * easing(t) + easing(t - h)) / (h * h);
}

/** The fastest the curve ever moves, as a multiple of the average. What a gentler start costs. */
export function peakSlope(easing: Easing, samples = 20000): number {
  let peak = 0;
  for (let i = 1; i < samples; i += 1) {
    peak = Math.max(peak, slopeAt(easing, i / samples, 1e-6));
  }
  return peak;
}

// ---- Layout ---------------------------------------------------------------------------------
//
// Kept here rather than in the scene so the build can assert nothing lands off the canvas. The
// pivot scene shipped with a shape that left the frame in 12.7% of its slider settings, which a
// build with no GPU could still have caught, because the numbers deciding it were arithmetic.

export const LAYOUT = {
  width: 620,
  height: 372,
  /** Top of the first row. Above it goes the one heading the picture needs. */
  top: 26,
  rowHeight: 54,
  /** Name and caption. */
  nameX: 12,
  /** The little plot of the curve itself. */
  curve: { left: 150, width: 68, height: 42 },
  /** The track the sprite runs along. */
  track: { left: 250, right: 604 },
  /** Radius of the moving dot, which has to fit inside the track's right-hand margin. */
  dotRadius: 5,
} as const;

/** The vertical centre of a row. */
export function rowCentre(index: number): number {
  return LAYOUT.top + LAYOUT.rowHeight * index + LAYOUT.rowHeight / 2;
}

/**
 * Pixels per unit of eased value, derived from the **measured** peak of the gallery.
 *
 * One scale for every row, because rows that were scaled individually would make the overshooting
 * curve look like it travelled the same distance as the others. And derived rather than chosen, so
 * adding a curve that overshoots harder cannot push a dot off the edge - the picture shrinks instead.
 */
export function trackSpan(): number {
  const peak = GALLERY.reduce(
    (worst, entry) => Math.max(worst, extremes(entry.easing).max),
    1,
  );
  const usable = LAYOUT.track.right - LAYOUT.track.left - LAYOUT.dotRadius - 1;
  return usable / peak;
}

/** Where an eased value sits along the track. `1` is the target, and a value past it is past it. */
export function trackX(value: number): number {
  return LAYOUT.track.left + value * trackSpan();
}

/**
 * The furthest right anything gets drawn, edge of the dot included. For the check to compare.
 *
 * Over `GALLERY` and not `ALL`, because only those six have rows. The two extras are discussed in
 * prose and swept by the checks, and one of them reaches $1.37$ - scaling the picture for a curve it
 * never draws would shrink every row for nothing.
 */
export function drawnRight(): number {
  const peak = GALLERY.reduce(
    (worst, entry) => Math.max(worst, extremes(entry.easing).max),
    1,
  );
  return trackX(peak) + LAYOUT.dotRadius;
}
