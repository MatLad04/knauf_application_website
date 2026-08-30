import { clamp } from "@/lib/motion-loop";

/**
 * How the run takes the page, and — more to the point — how it gives it back.
 *
 * This section is five drawings of the same object, and the reading of it is
 * discrete: you are looking at one construction or at another, never at 40 % of
 * the way between two. Mapped onto raw scroll position that is a lie the whole
 * time — the drawing sits half taken apart wherever the reader's hand happened
 * to stop, and the changeover runs at whatever speed they happened to be moving
 * at, which is never the speed it was designed at.
 *
 * So the run holds the page still for as long as there are constructions left,
 * and a gesture asks for the next one rather than dragging the drawing partway
 * toward it. One flick, one construction, at the pace the changeover was drawn
 * for, every time.
 *
 * Everything below is in service of that not feeling like a trap:
 *
 * - It is never entered abruptly. Above and below the lock there is a band the
 *   page still scrolls through, with the scroll damped further the nearer it
 *   gets — so the reader arrives at the lock decelerating rather than hitting
 *   it. A section that stops the page dead reads as a bug; one you coast into
 *   reads as something heavy.
 *
 * - It is released at both ends. Past the last construction a downward gesture
 *   is not consumed at all, and before the first an upward one is not either,
 *   so the section can always be left the way it was entered.
 *
 * - Nothing else is touched. The scrollbar, find-in-page, anchor links and the
 *   browser's own restoration all move the page normally; this reads wheel,
 *   touch and the paging keys, and only while the page is actually at the lock.
 */

/**
 * How wide the run's approach is, in pixels of page.
 *
 * Exported because it is also the distance at which the stage stops considering
 * the reader to be anywhere near the run — which is what decides whether
 * arriving at it puts them on the first construction or on the last.
 */
export const APPROACH = 300;

/**
 * What the scroll is multiplied by at the lock line itself.
 *
 * Not nought. A band that damps to a standstill is a wall placed a little
 * further up the page, and the reader feels themselves stop against it. At a
 * seventh the page is still plainly moving where it hands over, and the last
 * pixels are covered by the arrival below rather than by the reader.
 */
const FLOOR = 0.14;

/** And the curve between the two. Above one, so the slowing is felt early. */
const DAMP_CURVE = 1.5;

/** How near the lock counts as being on it. */
const ARRIVE = 7;

/**
 * How much gesture makes a step.
 *
 * Deliberately small — the brief is that even a small swipe changes the
 * construction, and a threshold sized for a confident flick makes a gentle one
 * do nothing at all, which reads as the page having frozen. Sixteen pixels is
 * under one notch of a wheel and about a centimetre of trackpad.
 */
const THRESHOLD = 16;

/**
 * How long after the last event a gesture counts as over.
 *
 * The one number that decides whether a flick is one construction or four. A
 * trackpad fling is a single gesture that arrives as sixty events over most of
 * a second, so counting events or distance gives four; waiting for the stream
 * to go quiet gives one. A tenth of a second is longer than the gap between two
 * events inside a fling and shorter than the gap between two deliberate ones.
 */
const REARM_MS = 120;

/**
 * The two things that let a *continuous* scroll keep moving through the run.
 *
 * Waiting for silence alone would strand the reader who scrolls steadily
 * without ever letting go: their gesture never ends, so they get one
 * construction and then nothing. So a step is also released once enough page
 * has been asked for since the last one — a long way, roughly three notches, so
 * that a fling's tail does not reach it but a sustained scroll does — and no
 * sooner than a changeover can reasonably be watched.
 */
const CONTINUE = 300;
const MIN_GAP_MS = 380;

/** How much of a touch drag counts as a wheel pixel. */
const TOUCH_GAIN = 1.35;

export type StepScrollHost = {
  /** Where the page has to be for the run to be pinned. */
  lockY: () => number;
  /** Whether the lock applies at all — false on narrow, and when asked for less motion. */
  active: () => boolean;
  /** Which construction is showing. */
  index: () => number;
  /** The highest index there is. */
  last: number;
  /** Ask for the next or the previous one. Answers whether it was taken. */
  step: (delta: 1 | -1) => boolean;
};

export class StepScroll {
  private readonly host: StepScrollHost;

  /** Gesture so far, in pixels, since the last step or the last commit. */
  private accum = 0;
  /** And since the last step, unsigned, which is what releases a steady scroll. */
  private since = 0;
  /** True while waiting for the gesture that stepped to finish. */
  private blocked = false;
  private lastInput = 0;
  private lastStep = -1e9;
  private touchY: number | null = null;

  constructor(host: StepScrollHost) {
    this.host = host;
  }

  attach(): () => void {
    const wheel = (event: WheelEvent) => {
      // A pinch is a zoom, not a scroll, and the browser owns it.
      if (event.ctrlKey) return;
      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= window.innerHeight;
      if (delta !== 0) this.handle(delta, event);
    };

    const down = (event: TouchEvent) => {
      this.touchY = event.touches[0]?.clientY ?? null;
    };
    const move = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || this.touchY === null) return;
      const delta = (this.touchY - y) * TOUCH_GAIN;
      this.touchY = y;
      if (delta !== 0) this.handle(delta, event);
    };
    const up = () => {
      this.touchY = null;
      // A finger lifting is the clearest end-of-gesture there is; there is no
      // reason to wait out the silence after it.
      this.blocked = false;
      this.accum = 0;
      this.since = 0;
    };

    const key = (event: KeyboardEvent) => {
      if (!this.engaged()) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const forward =
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        (event.key === " " && !event.shiftKey);
      const back =
        event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey);
      if (!forward && !back) return;

      // At either end the key is the page's, so the section can be left with
      // the keyboard exactly as it can with the wheel.
      const index = this.host.index();
      if (forward && index >= this.host.last) return;
      if (back && index <= 0) return;

      event.preventDefault();
      this.host.step(forward ? 1 : -1);
      this.lastStep = performance.now();
    };

    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", up, { passive: true });
    window.addEventListener("touchcancel", up, { passive: true });
    window.addEventListener("keydown", key);

    return () => {
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", down);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
      window.removeEventListener("touchcancel", up);
      window.removeEventListener("keydown", key);
    };
  }

  /** Called once a frame: this is where a gesture is noticed to have ended. */
  tick(now: number): void {
    if (this.blocked && now - this.lastInput > REARM_MS) {
      this.blocked = false;
      this.accum = 0;
      this.since = 0;
    }
  }

  /** True when the page is sitting on the lock and the run owns the gesture. */
  private engaged(): boolean {
    return this.host.active() && Math.abs(window.scrollY - this.host.lockY()) <= ARRIVE;
  }

  private handle(delta: number, event: Event): void {
    if (!this.host.active()) return;

    const y = window.scrollY;
    const lock = this.host.lockY();
    const gap = lock - y;
    const forward = delta > 0;

    // In the approach, above or below. The page still moves; it moves less the
    // nearer it is, and the last few pixels are covered by landing rather than
    // by the reader.
    if (Math.abs(gap) > ARRIVE) {
      const toward = gap > 0 ? forward : !forward;
      if (!toward) return;
      const distance = Math.abs(gap);
      if (distance > APPROACH) return;

      event.preventDefault();
      const damp = FLOOR + (1 - FLOOR) * Math.pow(clamp(distance / APPROACH), DAMP_CURVE);
      const next = y + delta * damp;
      const landed = gap > 0 ? next >= lock - ARRIVE : next <= lock + ARRIVE;
      window.scrollTo(0, landed ? lock : next);

      // Landing is not the same as having asked for anything: whatever is left
      // of the gesture that brought the reader here is theirs to spend on the
      // first construction, not on stepping straight past it.
      if (landed) {
        this.accum = 0;
        this.since = 0;
        this.blocked = true;
        this.lastInput = performance.now();
      }
      return;
    }

    // On the lock. Either the run has somewhere left to go in this direction,
    // or the page does.
    const index = this.host.index();
    if (forward && index >= this.host.last) return;
    if (!forward && index <= 0) return;

    event.preventDefault();
    if (y !== lock) window.scrollTo(0, lock);
    this.feed(delta);
  }

  private feed(delta: number): void {
    const now = performance.now();
    this.lastInput = now;

    if (this.blocked) {
      // A gesture that is still going is allowed through only once it has asked
      // for a long way and a changeover has had time to be seen.
      this.since += Math.abs(delta);
      if (this.since < CONTINUE || now - this.lastStep < MIN_GAP_MS) return;
      this.blocked = false;
      this.accum = 0;
      this.since = 0;
    }

    this.accum += delta;
    if (Math.abs(this.accum) < THRESHOLD) return;

    const direction = this.accum > 0 ? 1 : -1;
    this.accum = 0;
    if (this.host.step(direction)) {
      this.blocked = true;
      this.since = 0;
      this.lastStep = now;
    }
  }
}
