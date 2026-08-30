import { CONSTRUCTIONS } from "@/data/constructions";
import { clamp, easeInOut, mix } from "@/lib/motion-loop";
import { openSpread, projectedExtent, type Camera } from "./geometry";

/**
 * What the scroll does to the drawing: which construction is on the stage, how
 * far open it is, and the angle it is held at while you read it.
 *
 * The movement is the explosion, not the camera. A construction comes on part
 * open, draws the rest of the way apart once the scroll reaches it, holds there
 * long enough to be named and read, and draws back — not shut — as the next one
 * takes its place. The layers going apart is the thing being said, so nothing
 * else moves while it is being said.
 *
 * The scroll starts it and does not drive it. What this file returns is which
 * construction is on the stage and how far the reader is from it; how far open
 * it is at this instant is the stage's business, and runs on a clock. A drawing
 * that is only as far apart as you have scrolled is a drawing that is never
 * quite finished, and the names are the last thing to arrive.
 *
 * The camera therefore does not orbit. Each construction is held at the angle
 * that construction is actually drawn at — upright for a wall, raked for a
 * rafter, from above for a deck and a floor, square on for a partition — and
 * the change from one to the next is a few degrees, taken while both stacks are
 * shut. A drawing that is always turning is never a drawing.
 */

/** A construction, and the pose it is held at for the whole of its stop. */
export type Stop = {
  /** Index into `CONSTRUCTIONS`. */
  construction: number;
  camera: Camera;
};

/**
 * All five sit within about ten degrees of one three-quarter view.
 *
 * That is deliberate and it is the constraint the rest of the drawing is built
 * on. At this angle the near layer falls to the left and each following layer
 * steps right and up, so the open stack reads left to right in installation
 * order — the same order, the same direction and very nearly the same shape as
 * the flat section beside it on a narrow screen. Turn much further and the
 * sheets go edge-on; turn much less and they hide behind each other.
 */
const POSES: Stop[] = [
  // 01 External wall — upright, three-quarter: how a wall detail is drawn.
  { construction: 0, camera: { rotY: -36, rotX: -14, roll: 0, scale: 1, z: 0 } },
  // 02 Pitched roof — rolled to the pitch, and turned further round than the
  // rest of them. The roll flattens it: raked, a sheet's top edge runs almost
  // along the line of sight and the build-up reads as a stack of lines rather
  // than of solids. The extra turn is what puts the depth back.
  { construction: 1, camera: { rotY: -47, rotX: -26, roll: -16, scale: 0.97, z: 0 } },
  // 03 Flat roof — held at the pitched roof's angle, roll and all.
  //
  // Not because a warm deck is raked; it is not. Because the run reads better
  // for it. This is the third of five and the one between two square-on views,
  // and taken from above like the two on either side of it the three ran
  // together into one long stretch of the section where the camera does not
  // appear to have moved at all. Rolled, it is plainly its own drawing — and
  // the pairing is the honest one to make, since a flat roof and a pitched roof
  // are the same build-up in the same order, laid at two different angles.
  { construction: 2, camera: { rotY: -47, rotX: -26, roll: -16, scale: 0.97, z: 0 } },
  // 04 Floor & screed — held at the pitched roof's angle, roll and all.
  //
  // Square on, it was the flattest drawing of the five: seven sheets seen very
  // nearly face-first, so the thing the drawing exists to show — that they are
  // seven separate things at seven depths — was the one thing hardest to read
  // in it. Raked and rolled with the two roofs, the near edge of every sheet
  // comes into view and the build-up reads as a build-up.
  { construction: 3, camera: { rotY: -47, rotX: -26, roll: -16, scale: 0.97, z: 0 } },
  // 05 Internal partition — the same again, a shade less from above: it is
  // symmetrical about its studs and that is a thing you read from the face.
  { construction: 4, camera: { rotY: -38, rotX: -27, roll: 0, scale: 1, z: 0 } },
];

/**
 * How much larger than the widest construction a shorter one may be drawn.
 *
 * The five share a stage, and left at one scale the four-layer partition sits
 * in the middle of a frame sized for the seven-layer wall with half of it
 * empty. Left free instead, it fills the frame and its boards are drawn half as
 * big again as the wall's — and then a reader flicking between two of them is
 * comparing two different scales without being told.
 *
 * So a short build-up is allowed to grow, but only by a third. It fills most of
 * the frame, and a sheet is still recognisably a sheet from one construction to
 * the next.
 */
const FILL_CAP = 1.3;

const BOXES = POSES.map((stop) =>
  projectedExtent(CONSTRUCTIONS[stop.construction]!.layers, stop.camera),
);

/** The box every construction is drawn inside, in scene pixels. */
export const FRAME = BOXES.reduce(
  (most, box) => ({ w: Math.max(most.w, box.w), h: Math.max(most.h, box.h) }),
  { w: 0, h: 0 },
);

/**
 * The poses, with each construction brought up to the size of the frame.
 *
 * Done here rather than in the stage because it is a property of the drawing
 * and not of the screen: whatever cell the stage ends up with, the five fill it
 * to the same degree, so the scroll never changes the size of the object it is
 * looking at except where a pose deliberately does.
 */
export const STOPS: Stop[] = POSES.map((stop, i) => {
  const box = BOXES[i]!;
  const fill = Math.min(FRAME.w / box.w, FRAME.h / box.h, FILL_CAP);
  return { ...stop, camera: { ...stop.camera, scale: stop.camera.scale * fill } };
});

export const LAST = STOPS.length - 1;

/** How deep each construction stands, open, in the order the run visits them. */
const SPREADS = STOPS.map((stop) => openSpread(CONSTRUCTIONS[stop.construction]!.layers));

/**
 * How much of a band the handover takes.
 *
 * A quarter of it. Enough that the one leaving has time to draw itself back
 * together and go, the stage is empty for a beat, and the next one rises into a
 * clear frame — three movements, where a shorter window would have had only one
 * and would read as a cut.
 *
 * A quarter and not the half it was, because the half was being spent on a
 * problem that no longer exists. The changeover used to be the moment both
 * build-ups were on the stage together, and it needed that much room to be
 * legible as that; it is a fade out, a beat and a fade in now, and none of the
 * three is improved by being held. What the shorter window buys back is
 * stillness at the stops, which is where the reader actually is: a construction
 * is held open and named for the first half of its block before anything begins
 * to move, and the next one is there and settled with a quarter of a block still
 * to run.
 *
 * It is the handover this shortens and nothing else. How fast a build-up comes
 * apart is a clock in the stage — `OPEN_SECONDS` — and is not measured in blocks
 * at all, so the explosion runs at the tempo it always did.
 */
const MOVE_IN = 0.46;
const MOVE_OUT = 0.72;

/**
 * How far the scene falls back through the swap.
 *
 * A little, not a lot. Pulling the object away and bringing it back says that
 * one thing left and another arrived, which is the opposite of what the morph is
 * for; this is only enough to keep the changeover from happening on a completely
 * flat plane.
 */
const DOLLY = 55;

/**
 * When the construction leaving is gone, and when the next one arrives, as
 * fractions of the handover.
 *
 * They do not cross. Both stacks were drawn through each other for the whole of
 * the swap, stretched to one envelope so that their sheets would land on each
 * other and a seven-layer wall becoming a six-layer roof would read as layers
 * running together. It does not read as that. Two hatched build-ups at half
 * opacity are two hatched build-ups at half opacity: every edge in the drawing
 * has a second edge beside it that belongs to a wall you are no longer looking
 * at, and the frame in the middle of the changeover — the one the whole idea was
 * for — is the one frame where you cannot tell what either construction is.
 *
 * So the stage is cleared instead. The one leaving is gone before the one
 * arriving begins, an empty beat separates them, and nothing is ever drawn over
 * anything else.
 *
 * The words beside the drawing are on the very same two windows — not on windows
 * tuned to match, on these. See `presence` below.
 *
 * Nearly half of the handover each, and the beat between them is thin. It used
 * to be wider at both ends, and what that bought was a longer pause and two
 * shorter, sharper fades, which is the wrong way round: the pause is dead time
 * and the fades are the thing being watched. There only has to be a moment where
 * the stage is empty, not a wait.
 */
const FADE_OUT_BY = 0.46;
const FADE_IN_FROM = 0.54;

/**
 * How near its own stop a construction has to be to come apart.
 *
 * The scroll says whether a construction is open, and nothing more than that.
 * How far open it is at any moment is a matter of time rather than of position —
 * the stage runs the explosion on its own clock — because tied to the scroll, a
 * reader who stopped halfway into a block was left looking at a build-up half
 * taken apart with no names on it, and the only way to find out what a layer was
 * called was to keep scrolling. Cross this line and the drawing finishes opening
 * whether you scroll on or not.
 *
 * Set to the width of the full-weight window, so a construction begins to open
 * the moment it becomes the one on the stage, and begins to shut as the handover
 * to the next one starts. It widened when the handover narrowed, which is the
 * same fact said twice: the block gave the swap less and gave the stop more.
 */
export const OPEN_HOLD = MOVE_IN;

/** Eased at both ends, so the stack starts and stops rather than ramps. */
const smoothstep = (from: number, to: number, v: number) => {
  const t = clamp((v - from) / (to - from));
  return t * t * (3 - 2 * t);
};

/**
 * How far open a construction stands while it is not the one being read.
 *
 * Not shut. A build-up that closes to a solid, hands over, and opens again from
 * nothing says that the two constructions have nothing to do with each other,
 * and it makes every arrival start from the same featureless block. Held
 * part-open instead, a construction is already plainly a stack of layers the
 * moment it comes on, and what the explosion then does is finish something the
 * reader can already see the shape of.
 *
 * Two fifths, because the layers have to be plainly separate as it goes and as
 * it arrives — a quarter reads as a solid with cracks in it — while leaving the
 * larger share of the travel to the explosion itself, which is what the reader
 * is meant to watch.
 */
export const HANDOVER_OPEN = 0.4;

/**
 * The most a stack may still be open at a point in the handover.
 *
 * A backstop, and normally slack: by the time the swap begins the stack has
 * already drawn back on its own. It bites only on a flick — a scroll fast enough
 * to cross a whole band in less time than that takes — and what it guarantees is
 * that a construction is never caught fully open on its way off the stage, which
 * would make it leave larger than it arrived.
 */
export const shutCeiling = (distance: number): number =>
  HANDOVER_OPEN + (1 - HANDOVER_OPEN) * (1 - smoothstep(MOVE_IN, MOVE_OUT, Math.abs(distance)));

/**
 * How far before the first block the run starts.
 *
 * Without it the external wall is already open the moment the stage appears,
 * and the one construction in five that never opens is the one that has to
 * teach the reader that they open at all. This buys it a third of a block of
 * approach, which is the whole of its explosion.
 */
export const PRE_ROLL = 0.4;

export type Live = {
  /**
   * Which stack, and how much of it.
   *
   * At most one is ever above zero. Two entries can be present through a
   * handover — the frame still has to say which stops the run is between — but
   * their weights do not overlap, so the stage never holds two constructions.
   */
  stop: number;
  weight: number;
  /** How far this stop is from the reader, in blocks. Signed. */
  distance: number;
  /**
   * What its own depth has to be multiplied by to fill the shared envelope.
   *
   * One at rest, and away from one only through a handover. It was what held
   * both build-ups in the same volume while they were drawn over each other;
   * now that they are not, what is left of it is a settle — a construction
   * arrives a few per cent shallower or deeper than it stands and relaxes into
   * its own depth as the reader reaches it.
   */
  stretch: number;
  /** Rising into place (+1) or leaving through the top (−1). */
  direction: 1 | -1;
};

export type Frame = {
  /** Continuous position along the run, −PRE_ROLL … LAST. */
  pos: number;
  camera: Camera;
  live: Live[];
  /** Which construction the copy column and the sheet list should be showing. */
  reading: number;
};

/**
 * How much of a construction is on the stage, from how far the reader is past
 * its own block. Signed: positive behind them, negative ahead.
 *
 * This is the whole of the changeover as one function, and it exists because the
 * words beside the drawing were on their own pair of windows. They were set by
 * hand to sit either side of the drawing's, and every time the handover moved
 * they had to be set again — which is exactly the kind of agreement that is kept
 * by nobody. The drawing arrived a fifth of a block before the paragraph naming
 * it, which is long enough to read as a fault rather than as a sequence.
 *
 * So there are no copy windows any more. The stage weighs its stacks with this
 * and writes the opacity of the block of words with it too, off the same
 * argument, so the two cannot arrive at different moments — there is nothing
 * left to keep in step.
 */
export function presence(d: number): number {
  // Its stop is behind the reader: this is the one leaving. Ahead of them, and
  // it is the one arriving, whose handover is measured from the block before it.
  const t = clamp(((d >= 0 ? d : 1 + d) - MOVE_IN) / (MOVE_OUT - MOVE_IN));
  return d >= 0 ? 1 - smoothstep(0, FADE_OUT_BY, t) : smoothstep(FADE_IN_FROM, 1, t);
}

/**
 * Where the block of words is weighed, and why it is not weighed here.
 *
 * It used to be, on a curve of its own laid over the drawing's. Both are wrong
 * for it in the same way. A curve in this file is a function of how far the
 * reader is from a stop, and the words are not that: they are laid out, and
 * where they sit on the screen at a given scroll position is the browser's
 * answer to a sticky rather than ours. Faded against blocks, the opacity and
 * the travel were two clocks that agreed at the stops and nowhere in between —
 * which is exactly where an arrival is watched. The paragraph became visible
 * while it was still low on the screen, and then had to make the rest of its
 * journey at nearly full strength: one arrival, seen as two.
 *
 * So the stage fades them off their own position on the screen instead. They
 * come up as they come up, and having come up they are there. See
 * `ConstructionStage`, which computes that position as arithmetic rather than
 * reading it back, and so pays no layout for it.
 */

/**
 * The frame for a handover between any two stops, at any point through it.
 *
 * The run's own frame is the special case where the two are neighbours and the
 * point through it is where the reader is standing. A jump is the general one:
 * the sheet list can ask for the fifth construction from the first, and what
 * has to happen then is one build-up drawing itself shut and one drawing itself
 * apart — not three of them doing both on the way past.
 *
 * Which is why this takes the pair as arguments rather than deriving it from a
 * position. Everything about the changeover is the same either way — the same
 * windows, the same easing, the same fall back through the swap — because it is
 * the same changeover; the only thing a jump changes is which two constructions
 * are on either side of it.
 */
function frameBetween(from: number, to: number, f: number, pos: number): Frame {
  const a = STOPS[from]!;
  const b = STOPS[to]!;

  const t = clamp((f - MOVE_IN) / (MOVE_OUT - MOVE_IN));
  const blend = easeInOut(t);
  // Zero at both ends of the swap, one in the middle of it.
  const flight = Math.sin(clamp(blend) * Math.PI);

  const camera: Camera = {
    rotY: mix(a.camera.rotY, b.camera.rotY, blend),
    rotX: mix(a.camera.rotX, b.camera.rotX, blend),
    roll: mix(a.camera.roll, b.camera.roll, blend),
    scale: mix(a.camera.scale, b.camera.scale, blend),
    z: mix(a.camera.z, b.camera.z, blend) - DOLLY * flight,
  };

  // The volume a construction is drawn inside through the swap: the two depths,
  // blended, so it starts and ends as each one's own.
  const envelope = mix(SPREADS[from]!, SPREADS[to]!, blend);

  // The same two windows the words are on, and by the same call.
  const leaving = presence(f);
  const arriving = presence(f - 1);

  const live: Live[] = [];
  if (leaving > 0.001)
    live.push({
      stop: from,
      weight: leaving,
      distance: f,
      stretch: envelope / SPREADS[from]!,
      direction: -1,
    });
  if (arriving > 0.001)
    live.push({
      stop: to,
      weight: arriving,
      distance: f - 1,
      stretch: envelope / SPREADS[to]!,
      direction: 1,
    });

  return {
    pos,
    camera,
    live,
    // The copy has changed over by the time the object has, not after it.
    reading: STOPS[blend < 0.5 ? from : to]!.construction,
  };
}

/** The frame at a position along the run. Pure: reads nothing, writes nothing. */
export function computeFrame(pos: number): Frame {
  const p = clamp(pos, -PRE_ROLL, LAST);
  const i = Math.min(Math.max(Math.floor(p), 0), LAST - 1);
  return frameBetween(i, i + 1, p - i, p);
}

/**
 * The frame partway through a jump, from one named construction to another.
 *
 * `t` runs nought to one over the whole of it and is a clock, not a position:
 * the page is smooth-scrolling underneath and may be crossing three blocks to
 * get there, and reading the run off that scroll is exactly what made a jump
 * open and shut every construction it passed. The handover is played instead,
 * on the run's own window, so the two constructions the reader named are the
 * only two that ever move.
 */
export function jumpFrame(from: number, to: number, t: number): Frame {
  const p = clamp(t);
  return frameBetween(from, to, MOVE_IN + p * (MOVE_OUT - MOVE_IN), from + (to - from) * p);
}
