export function polyPoints(cx: number, cy: number, r: number, sides: number, rot = 0): string {
  let pts = '';
  for (let k = 0; k < sides; k++) {
    const ang = (Math.PI / 180) * ((360 / sides) * k - 90 + rot);
    pts += `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)} `;
  }
  return pts.trim();
}

export const tokenPoints = (cx: number, cy: number, r: number) => polyPoints(cx, cy, r * 1.32, 4, 45);
export const cityPoints = (cx: number, cy: number, r: number) => polyPoints(cx, cy, r * 1.3, 8, 22.5);

export function ClassicCityMarker({ cx, cy, r, color, isPirate }: { cx: number; cy: number; r: number; color: string; isPirate: boolean }) {
  return (
    <g>
      <polygon points={cityPoints(cx, cy, r)} fill={color} stroke="#000" strokeWidth={2} strokeLinejoin="round" />
      {isPirate && (
        <text x={cx} y={cy + r * 0.45} textAnchor="middle" fontSize={r * 1.3} fill="#fff">
          ☠
        </text>
      )}
    </g>
  );
}

export function ClassicTokenMarker({
  x,
  cy,
  r,
  color,
  barb,
  count,
}: {
  x: number;
  cy: number;
  r: number;
  color: string;
  barb: boolean;
  count: number;
}) {
  return (
    <g>
      <polygon points={tokenPoints(x, cy, r)} fill={color} stroke={barb ? '#c33' : '#000'} strokeWidth={2} strokeLinejoin="round" opacity={0.95} />
      <text x={x} y={cy + r * 0.4} textAnchor="middle" fontSize={r * 1.1} fontWeight="bold" fill={barb ? '#f55' : '#fff'}>
        {count}
      </text>
    </g>
  );
}
