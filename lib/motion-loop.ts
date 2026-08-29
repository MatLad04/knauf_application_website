/**
 * The two things a scroll-driven drawing needs and the animation library does
 * not give it: a spring that can be integrated inside the scroll frame, and one
 * shared animation frame to integrate it in.
 *
 * Scroll gives a position, not a motion. Every value read off it is put through
 * the same spring before it reaches a transform, so a fling settles instead of
 * snapping and a reversal reverses rather than jumping. It is integrated here
 * rather than by a library because the value has to be written to the DOM in
 * the frame it was read — there is no React render in between to hang a motion
 * value off.
 */

export const clamp = (v: number, lo = 0, hi = 1): number => (v < lo ? lo : v > hi ? hi : v);

/** Eased at both ends, which is what a camera move wants. */
export const easeInOut = (t: number): number => {
  const p = clamp(t);
  return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
};

export const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

const STIFFNESS = 120;
const DAMPING = 26;
const MASS = 0.6;

export class Spring {
  value: number;
  target: number;
  private velocity = 0;
  /**
   * How close counts as arrived. The spring is over-damped, so it approaches
   * without ever quite reaching — invisible on a rotation, and not invisible at
   * all on a board depth, where 159.6 mm rounds to 159 and the figure under the
   * drawing quotes a wall a millimetre shallower than the one being drawn.
   */
  private readonly epsilon: number;

  constructor(initial = 0, epsilon = 0.002) {
    this.value = initial;
    this.target = initial;
    this.epsilon = epsilon;
  }

  /** Jump both ends, for a first paint or a resize. */
  set(value: number) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  /** One step. `dt` in seconds, clamped so a backgrounded tab cannot explode it. */
  step(dt: number): number {
    const h = dt > 0.05 ? 0.05 : dt;
    const force = -STIFFNESS * (this.value - this.target);
    const damp = -DAMPING * this.velocity;
    this.velocity += ((force + damp) / MASS) * h;
    this.value += this.velocity * h;

    if (
      Math.abs(this.target - this.value) < this.epsilon &&
      Math.abs(this.velocity) < this.epsilon * 20
    ) {
      this.value = this.target;
      this.velocity = 0;
    }
    return this.value;
  }
}

/** True when the visitor has asked for less motion. Re-read, never cached. */
export const wantsStill = (): boolean =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** The names the drawing code uses for the two of them. */
export const lerp = mix;
export const smooth = easeInOut;
