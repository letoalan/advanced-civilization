export function AcropolisCityIcon({
  cx,
  cy,
  r,
  color,
  isPirate,
  isNaturalSite = true,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  isPirate?: boolean;
  isNaturalSite?: boolean;
}) {
  const w = r * 2.1;
  const h = r * 1.6;
  const ox = cx - w / 2;
  const oy = cy - h / 2;

  if (isPirate) {
    return (
      <g transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`} filter="url(#atlas-city-shadow)">
        <path
          d={`M 0 ${h} L 0 ${h * 0.3} L ${w * 0.2} ${h * 0.3} L ${w * 0.2} ${h * 0.42} L ${w * 0.4} ${h * 0.42} L ${w * 0.4} ${h * 0.2} L ${w * 0.6} ${h * 0.2} L ${w * 0.6} ${h * 0.42} L ${w * 0.8} ${h * 0.42} L ${w * 0.8} ${h * 0.3} L ${w} ${h * 0.3} L ${w} ${h} Z`}
          fill="#141417"
          stroke="#991b1b"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        <text x={w * 0.5} y={h * 0.82} textAnchor="middle" fontSize={w * 0.4} fill="#fca5a5" fontWeight="bold">
          ☠
        </text>
      </g>
    );
  }

  return (
    <g transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`} filter="url(#atlas-city-shadow)">
      {!isNaturalSite && (
        <g id="citadel-monumental-base">
          <path
            d={`M ${-w * 0.15} ${h * 1.08} L ${-w * 0.15} ${h * 0.72} L ${-w * 0.05} ${h * 0.72} L ${-w * 0.05} ${h * 0.8} L ${w * 1.05} ${h * 0.8} L ${w * 1.05} ${h * 0.72} L ${w * 1.15} ${h * 0.72} L ${w * 1.15} ${h * 1.08} Z`}
            fill="url(#atlas-citadel-base)"
            stroke="#231c12"
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <rect x={-w * 0.12} y={h * 0.65} width={w * 0.08} height={h * 0.1} fill="#5c4b35" stroke="#231c12" strokeWidth={0.6} />
          <rect x={w * 1.04} y={h * 0.65} width={w * 0.08} height={h * 0.1} fill="#5c4b35" stroke="#231c12" strokeWidth={0.6} />
        </g>
      )}
      <polygon
        points={`${w * 0.5},0 ${w * 0.98},${h * 0.38} ${w * 0.02},${h * 0.38}`}
        fill={color}
        stroke="#231c12"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <rect x={w * 0.06} y={h * 0.38} width={w * 0.88} height={h * 0.1} fill="#eadeca" stroke="#231c12" strokeWidth={0.8} />
      <rect x={w * 0.12} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.34} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.56} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.78} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill={color} stroke="#231c12" strokeWidth={1} rx={1} />
    </g>
  );
}
