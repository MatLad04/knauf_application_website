"use client";

import { useEffect, useMemo, useRef } from "react";

import { CONSTRUCTIONS } from "@/data/constructions";
import { clamp, wantsStill } from "@/lib/motion-loop";
import Callouts, { type CalloutHandle } from "./Callouts";
import LayerStack, { type StackHandle } from "./LayerStack";
import PatternSprite from "./patterns";
import SceneRoot, { type SceneHandle } from "./SceneRoot";
import {
  FRAME,
  HANDOVER_OPEN,
  LAST,
  OPEN_HOLD,
  PRE_ROLL,
  STOPS,
  computeFrame,
  jumpFrame,
  shutCeiling,
  type Frame,
} from "./timeline";

/**
 * The stage the five constructions are drawn on, and the one object on it.
 *
 * This is what replaced the photograph. A photograph of a wall shows you a
 * wall; it cannot show you that the wall is seven things in a fixed order, and
 * the list that used to sit beside it could only ever say the order and never
 * the thickness. A labelled stack says both at once — and because it is one
 * object rather than five pictures, going from one construction to the next is
 * something you watch happen rather than something that has happened.
 *
 * Everything is drawn once, on mount, and never re-rendered. The scroll
 * position is read in one animation frame per painted frame and turned into
 * transforms written straight onto nodes; no React render sits between reading
 * the scroll and painting the result, which is the only way a drawing this size
 * keeps up with a fast scroll. Which layer is being pointed at is a ref for the
 * same reason — a hover moves an opacity, and an opacity is not worth a render.
 *
 * The same loop also places and weights the words beside it. The five texts are
 * laid one on top of another at the line the banner ends on, and the only thing
 * that happens between one construction and the next is that one is replaced by
 * the other: no travel, and nothing to follow with your eye except the drawing,
 * which is where the movement belongs.
 *
 * They are placed here rather than stuck by the stylesheet because sticking is
 * itself a movement — a stuck block lets go partway down its own box and rides
 * up out of the way as the next one takes the line. This holds all five on that
 * line and changes only which of them you can see.
 */

/**
 * How much room the drawing leaves round itself inside its cell.
 *
 * A drawing that exactly fills its box touches the edge of the screen at the
 * widest layer and reads as cropped rather than as drawn. This is the margin a
 * sheet has.
 *
 * Thinner than it was. The margin is drawn twice — once here and once as
 * `GUTTER`, which is the room the labels take out of the width before the
 * drawing is fitted to what is left — so a generous figure here is a second
 * margin inside a margin, and the drawing paid for both.
 */
const BREATH = 1.02;

/**
 * The box the scene is drawn to fill, in scene pixels.
 *
 * The frame the five constructions were sized to, plus its margin. Two numbers
 * rather than one, because the stage is not square: the banner takes the top of
 * the screen and what is left is a wide, shallow strip, and fitting to the
 * smaller of its two sides threw the whole of the width away.
 */
const BOX = { w: FRAME.w * BREATH, h: FRAME.h * BREATH };

/**
 * The room a column of labels needs, per side.
 *
 * Taken out of the width before the drawing is fitted to it, because a label
 * that overlaps the layer it is naming is worse than a smaller drawing.
 */
const GUTTER = 162;

/** The gap between the underside of the banner and everything pinned under it. */
const PIN_GAP = 24;

/**
 * The least depth the drawing is worth drawing at, in rems — the same floor the
 * stylesheet puts on the stage column. The pin line is bounded by it: a line
 * taken from the banner alone can be most of a short window, and what is left
 * under it is then not a drawing but a strip.
 */
const MIN_STAGE = 24;

/**
 * Where a point on the page falls in the run, in blocks.
 *
 * Integer at the top of a block, so stop `i` is reached exactly when block `i`
 * pins — which is what keeps the drawing and the words it belongs to on one
 * cadence. Blocks are not assumed to be the same height: a long description
 * grows its own, and interpolating between the marks costs nothing.
 */
function at(y: number, marks: number[]): number {
  if (marks.length < 2) return 0;
  // Above the first block, in the approach to it. Negative, and measured
  // against the first block's own height, so the external wall gets the same
  // run-up to its explosion that the other four get.
  if (y <= marks[0]!) {
    const span = Math.max(marks[1]! - marks[0]!, 1);
    return Math.max((y - marks[0]!) / span, -PRE_ROLL);
  }
  const last = marks.length - 1;
  if (y >= marks[last]!) return last;
  let i = 0;
  while (i < last && y >= marks[i + 1]!) i += 1;
  const span = Math.max(marks[i + 1]! - marks[i]!, 1);
  return i + (y - marks[i]!) / span;
}

/**
 * When a construction's words leave, and when the next one's arrive.
 *
 * Not here, and not in blocks of scroll. Every version of this that lived in
 * this file was a curve — how far the reader is from a stop, turned into an
 * opacity — and every one of them was laid over a paragraph that was also
 * *moving*, because a block of words stuck by the browser climbs half a screen
 * to reach its line. Two things at once, both of them tied to the scroll, and
 * the scroll arrives in notches: the climb steps, so the fade steps with it.
 *
 * The words do not move any more. They are pinned at the line, all five in the
 * same place, and the only thing this decides is which one is being read. The
 * appearing and the disappearing are a CSS transition on a class — one clock,
 * its own speed, and nothing about it is a function of where the page is. See
 * `.constructions-copy-inner` in the stylesheet.
 */

/**
 * How quickly the drawing follows the scroll, in seconds.
 *
 * The scroll position is not a smooth signal. A wheel arrives in notches, a
 * trackpad in bursts, and a snap lands in one step — and the drawing was reading
 * it raw, so every camera move inherited the texture of the input rather than
 * having a shape of its own. This is a short lag between the two: long enough
 * that a notch becomes a movement, short enough that the drawing is never
 * anywhere the reader has not already been.
 *
 * It is the settle at the end of a magnet pull as much as the smoothing of a
 * notch. The pull puts the page on the stop; this is the drawing arriving a
 * beat after it, which is what stops the landing reading as a snap.
 *
 * And it is what the words fade on now as well as the drawing, which is most of
 * what this figure is for: a fade window is around a hundred pixels of scroll,
 * which is one notch of a wheel, and nothing that changes over one notch is a
 * fade unless something puts a shape on it.
 */
const FOLLOW = 0.18;

/**
 * How the run holds a reader without holding them: a magnet, not a gate.
 *
 * This used to take the page. A wheel gesture inside the run did not scroll at
 * all — it asked for the next construction and the stage drove the page there
 * over a second, one construction per flick, whichever way and however hard it
 * was thrown. It made the cadence exact and it made the section a toll gate:
 * five gestures and five seconds to get past something a reader may only have
 * wanted to glance at, with no way to say so. A drawing is not owed the reader's
 * scroll.
 *
 * So nothing is intercepted any more. The page scrolls at the speed the reader
 * scrolls it, and a flick goes straight through the five the way a flick goes
 * through anything else — the constructions morph past on the way, which is the
 * whole of what a fast reader gets and is enough.
 *
 * What is left is a pull, and it only ever acts on a page that has stopped
 * moving. Come to rest anywhere inside the run and the nearest construction
 * draws the page onto its own line, from where the explosion finishes on its own
 * clock and the names come up. Take the time and the drawing rewards it; do not,
 * and you will never meet it, because it does not exist while you are moving.
 *
 * The distinction the whole thing turns on is *at rest*, not *slow*. Pulling at
 * a reader who is still scrolling, however gently, is the old gate again in a
 * softer form. `REST_SPEED` and `REST_MS` are what "stopped" means: slower than
 * a drift, for longer than a stutter between two notches.
 */

/** Under this, in pixels per second, the page counts as having stopped. */
const REST_SPEED = 30;
/**
 * And it has to have stopped for this long, so a pause mid-flick is not one.
 *
 * Two frames and a little. It was more than twice this, and what the extra
 * bought was a fifth of a second in which the page had stopped, the words had
 * stopped with it part-way up the screen, and nothing had begun to move yet.
 * That gap is most of what read as the text restarting — it is long enough for
 * the eye to settle on a paragraph in the wrong place and notice it is there.
 * All this figure has to do is tell a stop from the pause between two notches
 * of a wheel, and it does not need a fifth of a second to do it.
 */
const REST_MS = 60;

/**
 * The settle: a critically damped spring, not a timed move.
 *
 * A duration with an ease on it was the other half of what made the arrival
 * read as two movements. However fast the reader had been going, the curve
 * began from a standstill — so the end of their scroll was a full stop, and the
 * pull that followed a beat later was plainly a second, separate thing that
 * happened to the page rather than the end of the first.
 *
 * A spring has neither a duration nor a start. It is handed the speed the
 * reader was still carrying and simply continues it, so the tail of the scroll
 * and the whole of the settle are one movement with one velocity running
 * through it. Critically damped, so it lands rather than bouncing; and fast at
 * first and slow at the end, which is the shape anything coming to rest has.
 *
 * The stiffness is the only figure, and it sets the settle rather than the
 * distance: near or far, the page arrives in about the same three quarters of a
 * second, moving as fast as it has to at the start to do so. That is right for
 * this in a way a duration never was — a fifteen-pixel correction and half a
 * block are the same gesture at two sizes, not two different ones.
 */
const SETTLE_W = 12;
/**
 * Near enough, and slow enough, that there is nothing left to write.
 *
 * A pixel and a half, not a tenth of one. A spring approaches its rest rather
 * than reaching it, so the figure here is not accuracy, it is where the motion
 * ends: held to a tenth of a pixel the last four pixels took as long as the
 * first hundred and forty, and a paragraph creeping the last of the way is the
 * same fault as one that halts part-way, told slowly.
 */
const SETTLE_PX = 1.5;
const SETTLE_V = 90;
/** And a ceiling, so a settle that is being fought can never run on forever. */
const SETTLE_MAX_MS = 1400;

/** Near enough to a stop, in blocks, that pulling would only be fussing. */
const AT_STOP = 0.015;

/**
 * How far above the first block the magnet reaches.
 *
 * A quarter of a block, and no more. The approach to the run is also the foot
 * of the banner, and a reader stopped there may be reading it; the pull belongs
 * to the run proper, plus the last of the run-up where the first construction
 * is already opening and the page is plainly on its way in.
 */
const REACH_UP = 0.25;

/**
 * How long the magnet stands off after a reader has scrolled out of a pull.
 *
 * Scrolling during a pull is the one unambiguous "not this" the reader can say,
 * so it is answered: the pull stops where it is, and nothing pulls again until
 * they have settled somewhere and this has passed. Long enough not to be a
 * fight, short enough that the section has not given up on them.
 */
const COOLDOWN_MS = 900;

/** How far the page may be from where we put it before we conclude it is theirs. */
const HIJACK_PX = 3;

/**
 * How long a construction takes to come apart, and to close again, in seconds.
 *
 * The explosion is on a clock rather than on the scroll, so these are what the
 * reader actually experiences: reach a construction and it opens over a beat and
 * a bit, whether you keep scrolling or stop dead. Slow enough to be watched —
 * the point of it is that you can see which layer went where — and short enough
 * that the names are on the sheet before anyone would think to scroll on.
 *
 * Shutting is the quicker of the two. Nothing is being read while it happens; it
 * is only getting out of the way of the next construction, and a build-up that
 * takes as long to put away as it took to open reads as hesitation.
 */
const OPEN_SECONDS = 1.15;
const SHUT_SECONDS = 0.75;

/**
 * How long a jump takes, in milliseconds.
 *
 * A jump is a changeover played on a clock rather than read off the scroll, so
 * this is the whole of it: one build-up shuts and goes, the stage is clear for
 * a beat, and the one that was asked for arrives and comes apart. Long enough
 * that all three are seen — that is the point of playing it at all rather than
 * cutting — and close enough to the browser's own smooth scroll that the page
 * and the drawing arrive together.
 */
const JUMP_MS = 900;

export default function ConstructionStage({
  runId,
  bannerId,
}: {
  runId: string;
  bannerId: string;
}) {
  const hot = useRef<number | null>(null);
  /**
   * How far open each construction is, one per stop. Integrated in the loop.
   *
   * Zero to begin with and part open ever after. The first construction is the
   * one that has to teach the reader that these come apart at all, so it is the
   * only one that is ever seen shut; by the time the second arrives the idea has
   * been made and what matters is that the run does not stop between them.
   */
  const opening = useRef<number[]>(STOPS.map(() => 0));
  const viewport = useRef<HTMLDivElement>(null);
  const scene = useRef<SceneHandle>(null);

  // Stable across the life of the stage, so `useImperativeHandle` inside each
  // stack attaches exactly once.
  const stacks = useMemo(() => STOPS.map(() => ({ current: null as StackHandle | null })), []);
  const callouts = useMemo(() => STOPS.map(() => ({ current: null as CalloutHandle | null })), []);

  useEffect(() => {
    const run = document.getElementById(runId);
    const banner = document.getElementById(bannerId);
    const stage = viewport.current;
    if (!run || !stage) return;

    const blocks = Array.from(run.querySelectorAll<HTMLElement>(".constructions-block"));
    const copy = blocks
      .map((block) => block.querySelector<HTMLElement>(".constructions-copy-inner"))
      .filter((node): node is HTMLElement => node !== null);
    const still = wantsStill();
    let frame = 0;
    let last = 0;
    let size = { w: 0, h: 0 };
    let pinned = 0;
    /** Where the top of each block sits in the document. */
    let marks: number[] = [];
    /**
     * The run's own extent, and the height of the tallest of the five texts.
     *
     * Between them, the only question the words ask of the scroll: whether the
     * section is on the screen at all. Inside it one construction is up; either
     * side of it, none is.
     */
    let runTop = 0;
    let runBottom = 0;
    let deckH = 0;
    /** Which construction's words are up, so the class is only ever touched on a change. */
    let shown = -1;
    /** The header the page hangs under, in pixels. */
    let headerPx = 0;
    /** The drawing's own position along the run, a short step behind the scroll. */
    let follow = 0;
    let following = false;
    /** Where the page was last frame, which is the only speedometer there is. */
    let lastY = window.scrollY;
    /** How long it has been still, in milliseconds. Capped: it only has to pass. */
    let rest = 0;
    /** The settle, if one is running: where it is going, where it has got to,
     *  and how fast it is going there. */
    let pulling = false;
    let pullTo = 0;
    let pullPos = 0;
    let pullVel = 0;
    let pullAt = 0;
    /** The last position we wrote, read back, so we can tell ours from theirs. */
    let wroteY = 0;
    /** Nothing pulls before this. Set when a reader scrolls out of a pull. */
    let coolUntil = 0;
    /**
     * A jump, if one is playing: which construction it is leaving, which one it
     * was asked for, and when it started.
     *
     * While it runs the scroll is ignored entirely. The page is smooth-scrolling
     * underneath and may be crossing three blocks to get where it is going, and
     * following it is exactly what made the sheet list open and shut every
     * construction between here and there.
     */
    let jumping = false;
    let jumpFrom = 0;
    let jumpTo = 0;
    let jumpAt = 0;
    /** Which construction is on the stage, so a jump knows where it is leaving from. */
    let atStop = 0;

    /**
     * Where the run is on the page, and how big the stage is.
     *
     * Read here and nowhere else. Inside the loop each of these would be a
     * synchronous layout read every frame; measured on resize they are three,
     * and the loop does arithmetic only.
     */
    const measure = () => {
      // The line everything in this section hangs from: the underside of the
      // banner once it has stuck. Published first, because the height of the
      // cell the drawing sits in is written off it — and so is the point the
      // words beside it pin at.
      const root = getComputedStyle(document.documentElement);
      const headerH = parseFloat(root.getPropertyValue("--header-h") || "0");
      const rem = parseFloat(root.fontSize) || 16;
      headerPx = headerH * rem;

      // The banner is only part of the line while it is stuck. On a short
      // window the stylesheet hands it back to the flow — it scrolls away, so
      // there is nothing above the run to hang from but the bar — and asking it
      // for its `position` is how this reads that decision rather than
      // repeating the breakpoint that made it.
      const stuck = banner ? getComputedStyle(banner).position === "sticky" : false;
      const under = (stuck && banner ? banner.offsetHeight : 0) + headerPx + PIN_GAP;

      // And the line never drops so low that the drawing under it has no room:
      // whatever is above it, the stage keeps the depth the stylesheet floors it
      // at, or the line comes up until it does.
      const floor = headerPx + PIN_GAP;
      pinned = Math.max(floor, Math.min(under, window.innerHeight - MIN_STAGE * rem - PIN_GAP));
      run.style.setProperty("--pin-top", `${Math.round(pinned)}px`);

      // Measured after the line is published, because that is what sized it.
      const box = stage.getBoundingClientRect();
      size = { w: box.width, h: box.height };

      // Where each block of words starts.
      //
      // The run is walked in blocks, not in a fraction of its own height, and
      // that is not a detail: a block of words pins when its own top reaches
      // the line, so measuring the walk any other way puts the drawing on one
      // cadence and the words on another, and by the fifth construction they
      // are half a screen apart. One stop is one block, by construction.
      marks = blocks.map((block) => block.getBoundingClientRect().top + window.scrollY);

      // The column the words are shown in. They are out of the flow, so the
      // box they would have had has to be handed back to them — and handed back
      // here, once, rather than found again every frame.
      const column = run.querySelector<HTMLElement>(".constructions-copy");
      if (column) {
        const col = column.getBoundingClientRect();
        run.style.setProperty("--copy-x", `${Math.round(col.left)}px`);
        run.style.setProperty("--copy-w", `${Math.round(col.width)}px`);
      }

      // Read after the column is published, because the width is what wraps the
      // paragraphs and the wrapping is what sets the height.
      const runBox = run.getBoundingClientRect();
      runTop = runBox.top + window.scrollY;
      runBottom = runTop + runBox.height;
      deckH = copy.reduce((tall, inner) => Math.max(tall, inner.offsetHeight), 0);

      // The labels are static text and their widths are cached on them; a
      // resize can rewrap them, so the cache goes when the size does.
      for (const label of stage.querySelectorAll<HTMLElement>(".stack-callout")) {
        delete label.dataset.w;
      }
    };

    /** Where the page has to be for a stop to be at the pinned line. */
    const yOf = (index: number) => marks[Math.max(Math.min(index, marks.length - 1), 0)]! - pinned;

    /**
     * The reader has taken the page back. Stop, and stand off for a beat.
     *
     * Scrolling out of a pull is the one unambiguous answer to it there is, and
     * it is answered by stopping where the pull had got to rather than by
     * springing back: they now own that position, mid-changeover or not.
     */
    const release = (now: number) => {
      pulling = false;
      rest = 0;
      coolUntil = now + COOLDOWN_MS;
    };

    /**
     * Any input that is a scroll, or is about to be one.
     *
     * Only meaningful mid-pull — outside one, coming to rest is the whole
     * signal and these events are simply how the reader got there. Passive,
     * every one of them: nothing here prevents anything any more.
     */
    const interrupt = (event: Event) => {
      // A wheel that moves nothing is not a scroll. Browsers emit them at the
      // end of a trackpad gesture, and taken at face value they cancel the pull
      // the moment the gesture that earned it finishes.
      if (event.type === "wheel" && Math.abs((event as WheelEvent).deltaY) < 1) return;
      // Scrolling out of a jump ends it: the reader has taken the run back, and
      // wherever they are is now the truth about which construction is on.
      if (event.type === "wheel" || event.type === "touchmove") jumping = false;
      if (pulling) release(performance.now());
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      // Narrow: the cell is not laid out at all, because a labelled solid needs
      // room on both sides of itself for the names and there is none. The
      // constructions are drawn flat beside their own words instead, and this
      // does nothing until the viewport is wide enough to hold it.
      if (size.w <= 0 || size.h <= 0) {
        if (stage.style.visibility !== "hidden") stage.style.visibility = "hidden";
        // Narrow: the words are ordinary page content again, one after
        // another, and none of them is the one being read.
        if (shown >= 0) {
          copy[shown]?.classList.remove("is-reading");
          shown = -1;
        }
        return;
      }
      if (stage.style.visibility === "hidden") stage.style.visibility = "";

      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      // The magnet. Nothing above this line is ever prevented, and nothing
      // below it happens while the page is moving.
      if (!still && !jumping && marks.length >= 2) {
        const y = window.scrollY;
        // The only speedometer there is: where it was a frame ago. Signed, now,
        // because the settle is handed this rather than starting from nothing.
        const vel = (y - lastY) / dt;
        const speed = Math.abs(vel);
        lastY = y;

        /**
         * One step of the spring, written straight onto the page.
         *
         * Integrated on a position of its own rather than on the page's: the
         * page rounds to a whole pixel, and rounded, the last of the travel
         * would stall rather than arrive.
         */
        const settle = () => {
          const gap = pullTo - pullPos;
          pullVel += (SETTLE_W * SETTLE_W * gap - 2 * SETTLE_W * pullVel) * dt;
          pullPos += pullVel * dt;
          if (
            (Math.abs(gap) < SETTLE_PX && Math.abs(pullVel) < SETTLE_V) ||
            now - pullAt > SETTLE_MAX_MS
          ) {
            pullPos = pullTo;
            pulling = false;
          }
          window.scrollTo(0, Math.round(pullPos));
          // Read back rather than assumed: the page may be at its own end, or
          // rounding to a device pixel, and next frame has to compare against
          // where it really is or it will mistake us for the reader.
          wroteY = window.scrollY;
          lastY = wroteY;
        };

        if (pulling) {
          // Somewhere we did not put it. That is a scroll, whatever fired it —
          // a device this has no listener for, a momentum tail, an anchor.
          if (Math.abs(y - wroteY) > HIJACK_PX) release(now);
          else settle();
        } else if (now >= coolUntil) {
          // Capped, because it only ever has to clear the threshold — left to
          // grow it would overflow on a page nobody is looking at.
          rest = speed <= REST_SPEED ? Math.min(rest + dt * 1000, REST_MS) : 0;

          if (rest >= REST_MS) {
            const here = at(y + pinned, marks);
            const want = Math.round(here);
            // Inside the run, and not already on a stop. Past the last
            // construction `at` pins to LAST and the two agree, so the section
            // lets go of the page by itself at the end rather than by a test.
            if (here > -REACH_UP && Math.abs(here - want) > AT_STOP) {
              const to = yOf(want);
              pullTo = to;
              pullPos = y;
              // Handed the speed the reader still had, while they still had it
              // and while it was going the right way. That is the whole of what
              // makes this one movement instead of two: the settle does not
              // start, it carries on.
              pullVel =
                Math.sign(to - y) === Math.sign(vel) ? clamp(vel, -REST_SPEED, REST_SPEED) : 0;
              pullAt = now;
              wroteY = y;
              pulling = true;
              rest = 0;
              // Begun on the frame it is decided rather than on the one after
              // it. A frame in which the reader has stopped, the page has
              // stopped and nothing has started is a frame of exactly the halt
              // this whole arrangement exists to take out.
              settle();
            }
          }
        } else {
          // Standing off, but still watching: a reader who is moving again has
          // not settled, so the clock starts from wherever they stop.
          if (speed > REST_SPEED) rest = 0;
        }
      }

      // How far the run has got, in stops: which block is at the pinned line,
      // and how far past it.
      const scrolled = window.scrollY;
      const raw = at(scrolled + pinned, marks);

      let state: Frame;

      if (jumping) {
        // Played, not followed. The page is going wherever it is going; this is
        // the one changeover the reader asked for, on its own clock.
        const t = (now - jumpAt) / JUMP_MS;
        if (t >= 1) {
          jumping = false;
          follow = jumpTo;
          state = computeFrame(jumpTo);
        } else {
          state = jumpFrame(jumpFrom, jumpTo, t);
        }
      } else {
        // The drawing follows the scroll rather than being it.
        //
        // One exponential step per frame, framerate-independent, and snapped
        // once it is within a thousandth of a block so it settles rather than
        // creeping. Everything the drawing does is a movement, and a movement
        // wants a shape.
        if (!following) {
          follow = raw;
          following = true;
        } else {
          follow += (raw - follow) * (1 - Math.exp(-dt / FOLLOW));
          if (Math.abs(raw - follow) < 0.001) follow = raw;
        }

        // Asked for less motion: the drawing still answers the scroll, but it
        // arrives at each stop already open rather than coming apart on the way.
        const pos = still ? Math.round(Math.max(0, Math.min(raw, LAST))) : follow;
        state = computeFrame(pos);
      }

      // Where a jump would be leaving from, if one were asked for now.
      atStop = state.reading;

      const fit = Math.max(Math.min((size.w - 2 * GUTTER) / BOX.w, size.h / BOX.h), 0.2);
      scene.current?.apply({ camera: state.camera, dt, still, fit });

      // The words: which construction is being read, and nothing else.
      //
      // The same answer the drawing is using, so the paragraph and the object
      // it names can never be one construction apart. And only while the run is
      // actually pinned — the words are fixed to the viewport now, so above and
      // below the section there is no one to show.
      const line = scrolled + pinned;
      const reading = line >= runTop && line <= runBottom - deckH ? state.reading : -1;
      if (reading !== shown) {
        if (shown >= 0) copy[shown]?.classList.remove("is-reading");
        if (reading >= 0) {
          // The wait before words appear is owed to the words leaving, and on
          // the way into the run there are none: the first construction should
          // come up with its drawing rather than a beat behind it.
          run.style.setProperty("--words-in-delay", shown >= 0 ? "200ms" : "0ms");
          copy[reading]?.classList.add("is-reading");
        }
        shown = reading;
      }

      const active = hot.current ?? -1;
      for (let i = 0; i <= LAST; i += 1) {
        const on = state.live.find((entry) => entry.stop === i);
        // A hover belongs to the construction being read, never to the one
        // leaving the stage behind it.
        const activeLayer = on && on.weight > 0.5 ? active : -1;

        // How far open this construction is, on its own clock.
        //
        // The scroll only says which way it is going: inside its own stop it
        // wants to be all the way open, outside it wants to be back at the
        // handover, and it travels between the two at a fixed rate whatever the
        // reader does. That is the whole
        // difference between this and reading the explosion straight off the
        // scroll — stop halfway into a block and the drawing carries on and
        // finishes, instead of standing half apart waiting to be scrolled the
        // rest of the way.
        //
        // A fixed rate rather than a spring, because a spring arrives fast and
        // then creeps, and the last tenth of this is the part that matters: the
        // sheets settling and the names coming up. The easing is per layer, in
        // the stack, where each one eases in and out of its own travel.
        const openings = opening.current;
        if (!on) {
          // Off stage, and waiting part open: whatever it was doing when it left
          // is not where it should come back from, and a construction that has
          // never been seen should still arrive already coming apart.
          openings[i] = HANDOVER_OPEN;
        } else if (still) {
          openings[i] = Math.abs(on.distance) <= OPEN_HOLD ? 1 : HANDOVER_OPEN;
        } else {
          const want = Math.abs(on.distance) <= OPEN_HOLD ? 1 : HANDOVER_OPEN;
          const step = dt / (want > openings[i]! ? OPEN_SECONDS : SHUT_SECONDS);
          openings[i] =
            want > openings[i]!
              ? Math.min(openings[i]! + step, want)
              : Math.max(openings[i]! - step, want);
          // Held under the handover backstop, and held there rather than only
          // reported so, so that scrolling back into a construction resumes the
          // explosion from where it was actually left.
          openings[i] = Math.min(openings[i]!, shutCeiling(on.distance));
        }

        const stack =
          stacks[i]!.current?.apply({
            weight: on?.weight ?? 0,
            open: openings[i]!,
            stretch: on?.stretch ?? 1,
            direction: on?.direction ?? 1,
            activeLayer,
            dt,
            still,
          }) ?? null;

        callouts[i]!.current?.apply({ state: stack, size, activeLayer, dt, still });
      }
    };

    // Said before anything is measured, because it is what takes the words out
    // of the flow, and the column has to be measured with them already out of it.
    run.classList.add("constructions-live");

    measure();
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", measure);

    // The stage is not only resized by the window.
    //
    // Its height is written off the banner's, and the banner reflows on its
    // own: a webfont arrives and the heading takes one line fewer, or the
    // reader has asked for less motion and a block above it is laid out
    // differently. Measured once at mount, the drawing is then fitted to a cell
    // it is no longer in — and it is fitted to the larger of the two, so what
    // is wrong is always that the last layer is off the bottom of the screen.
    const watch = new ResizeObserver(measure);
    watch.observe(stage);
    if (banner) watch.observe(banner);

    // Passive, all of them. They do not decide what the scroll does — they only
    // say that the reader is doing it, which is enough to call off a pull the
    // frame it starts rather than a frame later off the position.
    const inputs = ["wheel", "touchstart", "touchmove", "keydown", "pointerdown"] as const;
    for (const kind of inputs) window.addEventListener(kind, interrupt, { passive: true });

    /**
     * The sheet list asked for a construction by name.
     *
     * Answered as one changeover between the two named, however far apart they
     * are in the run: the one on the stage draws itself shut and goes, and the
     * one asked for arrives and comes apart. The words change over with it,
     * because they are read off the same frame.
     */
    const jump = (event: Event) => {
      if (still) return;
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (!id) return;
      const to = blocks.findIndex((block) => block.id === id);
      if (to < 0 || to === atStop) return;
      jumpFrom = atStop;
      jumpTo = to;
      jumpAt = performance.now();
      jumping = true;
      // A jump is the reader placing the page themselves; the magnet has
      // nothing to correct and should not be waiting to.
      pulling = false;
    };
    window.addEventListener("kernbau:anchor", jump);

    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      window.removeEventListener("resize", measure);
      for (const kind of inputs) window.removeEventListener(kind, interrupt);
      window.removeEventListener("kernbau:anchor", jump);
      run.classList.remove("constructions-live");
      run.style.removeProperty("--words-in-delay");
      run.style.removeProperty("--copy-x");
      run.style.removeProperty("--copy-w");
      for (const block of copy) block.classList.remove("is-reading");
    };
  }, [runId, bannerId, stacks, callouts]);

  const setHot = (layer: number | null) => {
    hot.current = layer;
  };

  return (
    <div
      ref={viewport}
      className="stack-stage"
      onPointerMove={(event) => {
        // Parallax, in scene degrees, from where the pointer is on the stage.
        const box = event.currentTarget.getBoundingClientRect();
        scene.current?.point(
          ((event.clientX - box.left) / box.width) * 2 - 1,
          ((event.clientY - box.top) / box.height) * 2 - 1,
        );
      }}
      onPointerLeave={() => {
        scene.current?.point(null, null);
        setHot(null);
      }}
    >
      <PatternSprite />

      <SceneRoot
        handleRef={scene}
        overlay={STOPS.map((stop, i) => (
          <Callouts
            key={`callouts-${i}`}
            construction={CONSTRUCTIONS[stop.construction]!}
            handleRef={callouts[i]!}
            onHover={setHot}
          />
        ))}
      >
        {STOPS.map((stop, i) => (
          <LayerStack
            key={`stack-${i}`}
            construction={CONSTRUCTIONS[stop.construction]!}
            scope={`s${i}`}
            handleRef={stacks[i]!}
            onHover={setHot}
          />
        ))}
      </SceneRoot>
    </div>
  );
}
