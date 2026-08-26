const MAX_MM = 300;

/**
 * A drawn scale rule under each chip, proportional to real thickness. Products
 * in a family share a texture, so this is what separates a 60 mm slab from the
 * same slab at 160 mm — and it makes thickness comparable across the whole grid
 * without reading a single number.
 *
 * Decorative: the value is always printed beside it.
 */
export default function ThicknessBar({ thicknessMm }: { thicknessMm: number }) {
  const width = Math.min(thicknessMm, MAX_MM);

  return (
    <svg
      viewBox={`0 0 ${MAX_MM} 14`}
      preserveAspectRatio="none"
      className="w-full h-3.5"
      aria-hidden="true"
      focusable="false"
    >
      <g vectorEffect="non-scaling-stroke">
        <line
          x1="0"
          y1="11"
          x2={MAX_MM}
          y2="11"
          className="stroke-rule"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {Array.from({ length: MAX_MM / 50 + 1 }, (_, i) => i * 50).map((tick) => (
          <line
            key={tick}
            x1={tick}
            y1="7"
            x2={tick}
            y2="11"
            className="stroke-rule"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <line
          x1="0"
          y1="11"
          x2={width}
          y2="11"
          className="stroke-ink"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={width}
          y1="2"
          x2={width}
          y2="11"
          className="stroke-ink"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}
