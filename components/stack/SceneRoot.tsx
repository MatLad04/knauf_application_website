"use client";

import { createContext, useContext, useImperativeHandle, useRef } from "react";

import { Spring } from "@/lib/motion-loop";
import { PERSPECTIVE, type Camera } from "./geometry";

/**
 * The camera, and the only one there is.
 *
 * Both halves of the explorer are drawn inside this element and it is never
 * unmounted between them. That is the whole trick: there is no moment where one
 * scene is taken down and another put up, so there is no cut to feel. The
 * configurator is the same object as the applications, turned ninety degrees
 * and measured.
 *
 * The context hands the live camera out as a ref rather than as state. Anything
 * that needs to know where the eye is — the callouts, which have to project
 * their own anchors — reads it inside the same animation frame it was written
 * in, and no consumer ever re-renders because the camera moved.
 */

export type CameraRef = { current: Camera };

const SceneContext = createContext<CameraRef | null>(null);

export const useCamera = (): CameraRef => {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error("useCamera must be used inside <SceneRoot>");
  return ctx;
};

export type SceneHandle = {
  /** Writes the camera and returns where it actually ended up, parallax included. */
  apply(input: { camera: Camera; dt: number; still: boolean; fit: number }): Camera;
  /** Pointer parallax, in scene degrees. Damped, additive, and off when asked. */
  point(x: number | null, y: number | null): void;
};

/** How far the pointer can push the camera, in degrees. */
const PARALLAX_Y = 6;
const PARALLAX_X = 4;

export default function SceneRoot({
  handleRef,
  overlay,
  children,
}: {
  handleRef: React.RefObject<SceneHandle | null>;
  /**
   * The annotation plane. Inside the context but outside the perspective, which
   * is the whole point of it: it knows where the camera is and is not subject
   * to it, so a number stays upright at every angle.
   */
  overlay?: React.ReactNode;
  children: React.ReactNode;
}) {
  const scene = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera>({ rotY: -45, rotX: -18, roll: 0, scale: 1, z: 0 });
  const parallax = useRef({ y: new Spring(0), x: new Spring(0) });

  useImperativeHandle(
    handleRef,
    () => ({
      point(x, y) {
        parallax.current.y.target = x === null ? 0 : x * PARALLAX_Y;
        parallax.current.x.target = y === null ? 0 : y * PARALLAX_X;
      },
      apply({ camera: target, dt, still, fit }) {
        const py = still ? 0 : parallax.current.y.step(dt);
        const px = still ? 0 : parallax.current.x.step(dt);

        const live: Camera = {
          rotY: target.rotY + py,
          rotX: target.rotX + px,
          roll: target.roll,
          scale: target.scale * fit,
          z: target.z,
        };
        camera.current = live;

        const node = scene.current;
        if (node) {
          node.style.transform =
            `translateZ(${live.z.toFixed(2)}px) scale(${live.scale.toFixed(4)}) ` +
            `rotateX(${live.rotX.toFixed(3)}deg) rotateY(${live.rotY.toFixed(3)}deg) ` +
            `rotateZ(${live.roll.toFixed(3)}deg)`;
        }
        return live;
      },
    }),
    [],
  );

  return (
    <SceneContext.Provider value={camera}>
      <div className="stack-viewport" style={{ perspective: `${PERSPECTIVE}px` }}>
        <div ref={scene} className="stack-scene">
          {children}
        </div>
      </div>
      {overlay}
    </SceneContext.Provider>
  );
}
