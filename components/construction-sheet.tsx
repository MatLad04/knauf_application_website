"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowsClockwise } from "@phosphor-icons/react/dist/ssr";
import type { Application } from "@/lib/catalogue";
import { applicationImage } from "@/lib/media";
import ConstructionFigure from "./construction-figure";
import { Reveal } from "./motion";

type App = Application & { productCount: number };

/**
 * One construction to a sheet: the build-up as a list on one side, the
 * photograph on the other, and the section on the back of the photograph.
 *
 * The list and the section are the same layers said twice, so pointing at one
 * says it in the other, in both directions: hovering a line turns the card over
 * and holds that layer in the drawing, and hovering a band or a number in the
 * drawing lights the line it belongs to. It is the cheapest way to answer the
 * question the list always raises — *which* of these is the 2 mm one — and it
 * needs no second page to answer it on.
 *
 * Client-side because that link is a hover, and a hover is state. Everything it
 * renders is the same markup the server rendered before; only the two data
 * attributes are new.
 */
export default function ConstructionSheet({
  application,
  flip,
}: {
  application: App;
  /** Every second sheet puts the photograph on the other side. */
  flip: boolean;
}) {
  const [hot, setHot] = useState<number | null>(null);
  const image = applicationImage(application.imageKey);

  return (
    <div
      id={`app-${application.slug}`}
      className="construction-sheet scroll-mt-[calc(var(--header-h)+1rem)]"
    >
      <Reveal>
        {/* Two equal halves: the words take one and the photograph the other,
              and the sides alternate by ordering the items rather than by
              resizing the tracks. */}
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className={flip ? "lg:order-2 lg:pl-8" : undefined}>
            <div className="flex items-baseline gap-5">
              <span className="mono text-sm text-muted">
                {String(application.indexNo).padStart(2, "0")}
              </span>
              <h3 className="display text-[clamp(1.75rem,4vw,3rem)]">{application.name}</h3>
            </div>

            <p className="mt-5 max-w-[52ch] text-lg text-muted">{application.summary}</p>

            {/* The build-up in installation order. This is the thing a
                  catalogue cannot tell you and the reason to start here. */}
            <ol className="mt-9 max-w-[34rem]" onMouseLeave={() => setHot(null)}>
              {application.buildUp.map((layer, n) => (
                <li
                  key={`${n}-${layer}`}
                  data-hot={hot === n + 1 ? "true" : undefined}
                  onMouseEnter={() => setHot(n + 1)}
                  onFocus={() => setHot(n + 1)}
                  style={{ "--i": n } as React.CSSProperties}
                  className="layer-row flex items-center gap-5 border-b rule py-3 first:border-t"
                >
                  <span className="mono w-6 shrink-0 text-xs text-muted">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="layer-rule"
                    style={{ "--depth": `${18 + ((n * 37) % 62)}%` } as React.CSSProperties}
                  />
                  <span className="text-sm sm:text-base">{layer}</span>
                </li>
              ))}
            </ol>

            <Link
              href={`/products?application=${application.slug}`}
              className="btn btn-primary mt-9"
            >
              All {application.productCount} approved products
              <ArrowRight size={16} weight="bold" aria-hidden="true" />
            </Link>
          </div>

          {/* The photograph turns over. What was a second page is a second
                face: the section through the construction, on the back of the
                thing it describes. It turns on hover, on focus, and when the
                list beside it is being read. */}
          <div
            tabIndex={0}
            role="group"
            aria-label={`${application.name} — turn for the detail`}
            data-turned={hot !== null ? "true" : undefined}
            className={`turn ${flip ? "lg:order-1" : ""}`}
          >
            <div className="turn-inner">
              <div className="media turn-face aspect-[4/3]">
                {/* Fetched with the page rather than on approach. The sheets
                    reveal themselves as you scroll, and a photograph that
                    arrives after the words it belongs to turns a reveal into a
                    pop; these are 26–105 KB each, so there is nothing to save
                    by holding them back. */}
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  loading="eager"
                  sizes="(max-width: 1024px) 100vw, 46rem"
                  className="texture object-cover"
                />
                <span className="turn-hint">
                  <ArrowsClockwise size={13} weight="bold" aria-hidden="true" />
                  Hover for the detail
                </span>
              </div>

              <div className="turn-face turn-back">
                <p className="label">{application.name}</p>
                <p className="mt-3 text-sm text-muted">{application.description}</p>

                <div className="turn-figure">
                  <ConstructionFigure
                    application={application.slug}
                    active={hot}
                    onHover={setHot}
                  />
                </div>

                <p className="mono text-xs text-muted">
                  {application.productCount} products approved · {application.buildUp.length} layers
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
