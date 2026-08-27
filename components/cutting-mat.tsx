/**
 * The ground of the loading screen: a self-healing cutting mat, which is the
 * one piece of equipment that is on every drawing-office and workshop bench in
 * this trade. Ruled grid, inch and centimetre ticks along two edges, the 30/45/
 * 60 degree guides and their arcs.
 *
 * It is masked on the diagonal — full strength at the top-left corner, gone by
 * the bottom-right — so the corner where the figure sits is clean paper.
 */
export default function CuttingMat({ className = "" }: { className?: string }) {
  const cells = Array.from({ length: 21 }, (_, i) => i);

  return (
    <svg
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <pattern id="mat-fine" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.3" />
        </pattern>
        <pattern id="mat-coarse" width="100" height="100" patternUnits="userSpaceOnUse">
          <path
            d="M100 0H0V100"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            opacity="0.6"
          />
        </pattern>

        {/* Strongest where the drawing starts, gone where the figure is. */}
        <linearGradient id="mat-fade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.78" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="mat-mask">
          <rect width="1200" height="700" fill="url(#mat-fade)" />
        </mask>
      </defs>

      <g mask="url(#mat-mask)" color="currentColor">
        <rect width="1200" height="700" fill="url(#mat-fine)" />
        <rect width="1200" height="700" fill="url(#mat-coarse)" />

        {/* Ruler ticks along the top and the left, numbered every 100. */}
        <g stroke="currentColor" strokeWidth="1.2" opacity="0.85">
          {cells.map((i) => (
            <path key={`t${i}`} d={`M${i * 60} 0v${i % 5 === 0 ? 18 : 10}`} />
          ))}
          {cells.map((i) => (
            <path key={`l${i}`} d={`M0 ${i * 60}h${i % 5 === 0 ? 18 : 10}`} />
          ))}
        </g>

        <g
          fill="currentColor"
          fontFamily="var(--font-mono)"
          fontSize="13"
          letterSpacing="1"
          opacity="0.9"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <text key={`tn${n}`} x={n * 100 + 8} y="34">
              {n}
            </text>
          ))}
          {[1, 2, 3, 4, 5].map((n) => (
            <text key={`ln${n}`} x="10" y={n * 100 + 6}>
              {n}
            </text>
          ))}
        </g>

        {/* The angle guides, struck from the corner the way they are on a mat. */}
        <g stroke="currentColor" strokeWidth="1.4" fill="none" opacity="0.9">
          <path d="M60 640L700 0" />
          <path d="M60 640L860 240" strokeDasharray="10 8" />
          <path d="M60 640L1020 440" />
          <path d="M60 640A220 220 0 0 1 280 420" />
          <path d="M60 640A330 330 0 0 1 390 310" opacity="0.6" />
        </g>

        <g
          fill="currentColor"
          fontFamily="var(--font-mono)"
          fontSize="14"
          letterSpacing="1.5"
          opacity="0.9"
        >
          <text x="196" y="470" transform="rotate(-45 196 470)">
            45°
          </text>
          <text x="300" y="380" transform="rotate(-26 300 380)">
            30°
          </text>
        </g>
      </g>
    </svg>
  );
}
