interface DonutSegment {
  key: string;
  value: number;
  color: string;
}

/**
 * 差异分布环形图。用固定尺寸 SVG 绘制，避免 SSR 与客户端渲染出现结构差异。
 */
export function DiffDonutChart({
  segments,
  total,
  label,
  size = 104,
  thickness = 19,
}: {
  segments: DonutSegment[];
  total: number;
  label: string;
  size?: number;
  thickness?: number;
}) {
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  const gap = segments.length > 1 ? 3 : 0;

  let consumed = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#EDF3F5"
          strokeWidth={thickness}
        />
        <g transform={`rotate(-90 ${center} ${center})`}>
          {sum > 0 &&
            segments.map((segment) => {
              const length = (segment.value / sum) * circumference;
              const dash = Math.max(0.5, length - gap);
              const dashOffset = -consumed;
              consumed += length;
              return (
                <circle
                  key={segment.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
        </g>
      </svg>
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center font-bold tabular-nums text-kb-heading"
        style={{ fontSize: Math.round(size * 0.185) }}
      >
        {total}
      </span>
    </div>
  );
}
