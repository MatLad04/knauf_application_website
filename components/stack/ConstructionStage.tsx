"use client";

import { useEffect, useMemo, useRef } from "react";

import { CONSTRUCTIONS } from "@/data/constructions";
import { clamp, easeInOut, wantsStill } from "@/lib/motion-loop";
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
  presenceOfWords,
  shutCeiling,
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
 * Nowhere here any more. They used to be four constants of their own, set by
 * hand to sit either side of the drawing's changeover, and the two drifted apart
 * every time the handover was retimed: the drawing was arriving a fifth of a
 * block before the paragraph naming it, which reads as a fault rather than as a
 * sequence.
 *
 * The words are read off `presenceOfWords` in the timeline now — the drawing's
 * own curve, on the same argument that decides how much of each stack is on the
 * stage, with one allowance made in it for the fact that a paragraph is laid out
 * and a drawing is not. The object and its name begin together because they
 * begin on the same number; the name finishes arriving when it reaches the line
 * it is going to, because until it does, it is still moving.
 *
 * They are read off the followed position, not the true one — which is the
 * second half of the same fix. A fade window is a tenth of a block wide and a
 * block is a screenful, so it is about a hundred pixels of scroll: read straight
 * off the wheel, one notch took a paragraph from fully there to fully gone, and
 * a paragraph that changes state inside a single notch does not fade, it blinks.
 * On the followed position the same notch arrives as a movement.
 *
 * The old reasoning for reading the true position was that where a block of
 * words *is* on the page is the browser's answer and not ours. That is still
 * true and no longer relevant: it applied when this wrote transforms, and all it
 * writes now is an opacity, which is not laid out and cannot disagree with
 * anything.
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
/** And it has to have stopped for this long, so a pause mid-flick is not one. */
const REST_MS = 140;

/**
 * The pull: proportional to how far it has to go, between these two.
 *
 * A fixed duration is wrong at both ends of the range it has to cover — a
 * fifteen-pixel correction taken over half a second is a drift, and half a
 * block taken over the same is a lurch. The floor is there because even the
 * smallest pull has to be visibly a movement rather than a jump.
 */
const PULL_MIN_MS = 320;
const PULL_MAX_MS = 900;
const PULL_MS_PER_PX = 0.8;

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
    /** The header the page hangs under, in pixels. */
    let headerPx = 0;
    /** The drawing's own position along the run, a short step behind the scroll. */
    let follow = 0;
    let following = false;
    /** Where the page was last frame, which is the only speedometer there is. */
    let lastY = window.scrollY;
    /** How long it has been still, in milliseconds. Capped: it only has to pass. */
    let rest = 0;
    /** The pull, if one is running, and where it is taking the page. */
    let pulling = false;
    let pullFrom = 0;
    let pullTo = 0;
    let pullAt = 0;
    let pullMs = PULL_MIN_MS;
    /** The last position we wrote, read back, so we can tell ours from theirs. */
    let wroteY = 0;
    /** Nothing pulls before this. Set when a reader scrolls out of a pull. */
    let coolUntil = 0;

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
      pinned = (banner ? banner.offsetHeight : 0) + headerPx + PIN_GAP;
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
        for (const block of copy) {
          block.style.opacity = "";
          block.style.visibility = "";
        }
        return;
      }
      if (stage.style.visibility === "hidden") stage.style.visibility = "";

      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;

      // The magnet. Nothing above this line is ever prevented, and nothing
      // below it happens while the page is moving.
      if (!still && marks.length >= 2) {
        const y = window.scrollY;
        // The only speedometer there is: where it was a frame ago.
        const speed = Math.abs(y - lastY) / dt;
        lastY = y;

        if (pulling) {
          // Somewhere we did not put it. That is a scroll, whatever fired it —
          // a device this has no listener for, a momentum tail, an anchor.
          if (Math.abs(y - wroteY) > HIJACK_PX) {
            release(now);
          } else {
            const t = Math.min((now - pullAt) / pullMs, 1);
            window.scrollTo(0, Math.round(pullFrom + (pullTo - pullFrom) * easeInOut(t)));
            // Read back rather than assumed: the page may be at its own end, or
            // rounding to a device pixel, and next frame has to compare against
            // where it really is or it will mistake us for the reader.
            wroteY = window.scrollY;
            lastY = wroteY;
            if (t >= 1) pulling = false;
          }
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
              const far = Math.abs(to - y);
              pullFrom = y;
              pullTo = to;
              pullAt = now;
              pullMs = clamp(220 + far * PULL_MS_PER_PX, PULL_MIN_MS, PULL_MAX_MS);
              wroteY = y;
              pulling = true;
              rest = 0;
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
      const raw = at(window.scrollY + pinned, marks);

      // The drawing follows the scroll rather than being it.
      //
      // One exponential step per frame, framerate-independent, and snapped once
      // it is within a thousandth of a block so it settles rather than creeping.
      // The words are not put through this — they are stuck by the browser and
      // their opacity has to agree with where they actually are — but everything
      // the drawing does is a movement, and a movement wants a shape.
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
      const state = computeFrame(pos);

      const fit = Math.max(Math.min((size.w - 2 * GUTTER) / BOX.w, size.h / BOX.h), 0.2);
      scene.current?.apply({ camera: state.camera, dt, still, fit });

      // The words: nothing but an opacity, on the drawing's own curve — with the
      // one allowance the drawing does not need, for the fact that these travel.
      for (let i = 0; i < copy.length; i += 1) {
        const block = copy[i]!;
        const alpha = presenceOfWords(pos - i);
        if (alpha <= 0.001) {
          if (block.style.visibility !== "hidden") block.style.visibility = "hidden";
          continue;
        }
        if (block.style.visibility === "hidden") block.style.visibility = "";
        block.style.opacity = alpha.toFixed(3);
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

    return () => {
      cancelAnimationFrame(frame);
      watch.disconnect();
      window.removeEventListener("resize", measure);
      for (const kind of inputs) window.removeEventListener(kind, interrupt);
      for (const block of copy) {
        block.style.opacity = "";
        block.style.visibility = "";
      }
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
