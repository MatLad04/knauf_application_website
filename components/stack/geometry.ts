import type { Layer } from "@/data/constructions";

/**
 * Where everything is, in one file, because three components have to agree
 * about it exactly: the slabs draw it, the callouts point at it, and neither
 * may drift from the other by a pixel while the stack is opening.
 *
 * Two states, and the scroll is the journey between them.
 *
 * Shut, the layers are packed against each other and the construction is the
 * section this site has always drawn — one solid, banded, hatched, read left to
 * right in installation order. Open, the same layers are pulled apart along the
 * same axis until each one is a sheet with air around it and a name beside it.
 * Nothing is added between the two; it is one drawing, further apart.
 */

/** The face of a slab, before the scene is scaled. */
export const FOOTPRINT = 400;

/**
 * The gap between two slabs once the stack is fully open.
 *
 * Set from the angle it is seen at rather than from taste. At a three-quarter
 * view a gap of `g` opens a band of `g · sin θ` between one sheet's edge and the
 * next — about 0.6 g here — and a band narrower than the widest hatch tile
 * reads as a moiré rather than as a material. Ninety-six gives every layer a
 * legible strip of its own hatch, which is what makes the open stack read as
 * the flat section it came from.
 */
export const SLAB_GAP = 96;

/**
 * How far the rest of a build-up stands back for the layer being pointed at.
 *
 * Everything in front of it moves toward the eye and everything behind it moves
 * away, so the named layer ends up with clear air on both sides of it while
 * staying exactly where it was. Pushing the layer itself out instead would be
 * the more obvious drawing and the worse one: the leader would have to chase it,
 * and the thing you were trying to look at would be the one thing moving.
 *
 * Sized against the gap it adds to rather than against the sheet: a little over
 * half of `SLAB_GAP` opens the space unmistakably without making a seven-layer
 * wall wider than the sheet it is drawn on.
 */
export const FOCUS_PART = 56;

/**
 * How far the scene is from the eye. Matches `perspective` on `SceneRoot`.
 *
 * Far enough back to be nearly axonometric, because a construction detail is
 * drawn in parallel projection. At this distance a slab at the near end of the
 * stack is about a tenth larger than one at the far end — enough for the stack
 * to have depth, not enough for the sheets to stop being parallel.
 */
export const PERSPECTIVE = 3200;

/**
 * A layer's drawn depth, in pixels.
 *
 * Square-rooted rather than linear, then clamped. Linear at true scale puts a
 * 200 mm block at 600 px and a 1 mm membrane at three, which is one slab you
 * cannot see past and one you cannot see; the square root keeps the order — a
 * deeper layer is always drawn deeper — while bringing the two ends of the
 * range close enough together to stack.
 */
export const slabDepth = (mm: number): number =>
  Math.min(64, Math.max(9, 64 * Math.sqrt(Math.max(mm, 0) / 200)));

export type Placed = {
  layer: Layer;
  i: number;
  /** The drawn depth of the slab, in pixels. */
  t: number;
  /** Centre along Z with the stack shut: the layers packed against each other. */
  zShut: number;
  /** Centre along Z with the stack open: the same order, `SLAB_GAP` apart. */
  zOpen: number;
};

/**
 * How deep a build-up stands when it is fully open, in pixels.
 *
 * The envelope the layers fill, and the one number the changeover needs: two
 * constructions of different depths cannot morph into each other while each is
 * drawn at its own, so through the swap both are stretched to a shared one.
 */
export const openSpread = (layers: readonly Layer[]): number =>
  layers.reduce((sum, layer) => sum + slabDepth(layer.thicknessMm), 0) +
  SLAB_GAP * Math.max(layers.length - 1, 0);

/**
 * Lay a construction out along Z, twice: shut and open.
 *
 * The first layer installed sits nearest the eye, so reading the stack from the
 * front is reading the build-up in the order it goes together — and at the
 * three-quarter view every camera here uses, the near layer falls on the left
 * of the drawing, which is where every other section on this site puts the
 * substrate.
 */
export function place(layers: readonly Layer[]): Placed[] {
  const depths = layers.map((l) => slabDepth(l.thicknessMm));
  const solid = depths.reduce((a, b) => a + b, 0);
  const spread = solid + SLAB_GAP * (layers.length - 1);

  let shutCursor = solid / 2;
  let openCursor = spread / 2;

  return layers.map((layer, i) => {
    const depth = depths[i]!;
    const zShut = shutCursor - depth / 2;
    const zOpen = openCursor - depth / 2;
    shutCursor -= depth;
    openCursor -= depth + SLAB_GAP;

    return { layer, i, t: depth, zShut, zOpen };
  });
}

/**
 * How much of the glass the open stack covers at a given pose.
 *
 * Projected rather than estimated. The drawing is a stack of squares seen at an
 * angle, and its outline on screen is not any simple function of its depth: the
 * roll turns the sheets in their own plane, the tilt shears the whole thing
 * down the sheet and the perspective divide makes the near end larger than the
 * far. Trigonometry got this wrong by about a tenth, which is the difference
 * between a drawing that fits its cell and one whose last layer is cut off by
 * the bottom of the screen.
 *
 * So every corner of every slab is put through the same matrix the browser is,
 * once, at module load, and the answer is what the stage divides its cell by.
 */
export function projectedExtent(
  layers: readonly Layer[],
  camera: Camera,
): { w: number; h: number } {
  const half = FOOTPRINT / 2;
  let hw = 0;
  let hh = 0;
  for (const item of place(layers)) {
    // Every position a slab can be in: open, and open with the rest of the
    // build-up standing back from a layer in front of or behind it.
    for (const z of [
      item.zOpen + item.t / 2 + FOCUS_PART,
      item.zOpen + item.t / 2,
      item.zOpen - item.t / 2,
      item.zOpen - item.t / 2 - FOCUS_PART,
    ]) {
      for (const x of [-half, half]) {
        for (const y of [-half, half]) {
          const p = project({ x, y, z }, camera);
          hw = Math.max(hw, Math.abs(p.x));
          hh = Math.max(hh, Math.abs(p.y));
        }
      }
    }
  }
  return { w: hw * 2, h: hh * 2 };
}

/* --- Projection -----------------------------------------------------------
 *
 * The callouts are not in the 3D scene. They are flat over it, which is the
 * only way a number stays upright and unskewed — a counter rotation inside a
 * perspective transform still shears.
 *
 * So the point each one is pointing at is projected by hand, with the same
 * matrix the browser is applying to the geometry. It costs a few dozen
 * multiplications a frame and it reads nothing from the layout, where asking
 * the DOM where an element ended up would cost a synchronous reflow per callout
 * per frame.
 */

export type Point = { x: number; y: number; z: number };

const RAD = Math.PI / 180;

/** CSS `rotateY`: (0,0,1) → (sin θ, 0, cos θ). */
export function rotateY(p: Point, deg: number): Point {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

/** CSS `rotateX`: (0,0,1) → (0, −sin θ, cos θ). Screen y points down. */
export function rotateX(p: Point, deg: number): Point {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

/** CSS `rotateZ`: a roll in the plane of the glass. Screen y points down. */
export function rotateZ(p: Point, deg: number): Point {
  const c = Math.cos(deg * RAD);
  const s = Math.sin(deg * RAD);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
}

/**
 * Where the eye is.
 *
 * `roll` is the one a draughtsman does rather than a camera: the same build-up
 * is a wall when it is drawn upright and a rafter when it is drawn raked, and
 * rolling the scene is how a construction is set at the pitch it is actually
 * built at without re-laying its layers out.
 */
export type Camera = { rotY: number; rotX: number; roll: number; scale: number; z: number };

/**
 * A point in scene space to a point on the glass, in pixels from the centre of
 * the stage. Mirrors
 * `translateZ(z) scale(s) rotateX(rx) rotateY(ry) rotateZ(roll)` exactly — if
 * that string changes in `SceneRoot`, this changes with it.
 */
export function project(p: Point, camera: Camera): { x: number; y: number; z: number } {
  let q = rotateZ(p, camera.roll);
  q = rotateY(q, camera.rotY);
  q = rotateX(q, camera.rotX);
  q = { x: q.x * camera.scale, y: q.y * camera.scale, z: q.z * camera.scale + camera.z };
  const denominator = PERSPECTIVE - q.z;
  // Behind the eye: park it rather than letting it wrap round to the far side.
  const k = denominator > 1 ? PERSPECTIVE / denominator : 0;
  return { x: q.x * k, y: q.y * k, z: q.z };
}
