import { civById } from '../../../data/index.js';

export const BARB = '__barbarian__';
export const PIRATE = '__pirate__';

export function polyPoints(cx: number, cy: number, r: number, sides: number, rot = 0): string {
  let pts = '';
  for (let k = 0; k < sides; k++) {
    const ang = (Math.PI / 180) * ((360 / sides) * k - 90 + rot);
    pts += `${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)} `;
  }
  return pts.trim();
}

/** Population token: square, like the wooden cubes in the physical game (§17.1). */
export const tokenPoints = (cx: number, cy: number, r: number) => polyPoints(cx, cy, r * 1.32, 4, 45);

/** City: flat-topped octagon (walled footprint). */
export const cityPoints = (cx: number, cy: number, r: number) => polyPoints(cx, cy, r * 1.3, 8, 22.5);

export function CityMarker({ cx, cy, r, owner }: { cx: number; cy: number; r: number; owner: string }) {
  const isPirate = owner === PIRATE;
  const color = isPirate ? '#111' : (civById.get(owner)?.color ?? '#444');
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

export function TokenMarker({
  cx,
  cy,
  r,
  owner,
  count,
  offsetIndex = 0,
}: {
  cx: number;
  cy: number;
  r: number;
  owner: string;
  count: number;
  offsetIndex?: number;
}) {
  const barb = owner === BARB;
  const x = cx + offsetIndex * 6;
  return (
    <g>
      <polygon
        points={tokenPoints(x, cy, r)}
        fill={barb ? '#1a1a1a' : (civById.get(owner)?.color ?? '#888')}
        stroke={barb ? '#c33' : '#000'}
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={0.95}
      />
      <text x={x} y={cy + r * 0.4} textAnchor="middle" fontSize={r * 1.1} fontWeight="bold" fill={barb ? '#f55' : '#fff'}>
        {count}
      </text>
    </g>
  );
}

export function ShipMarker({ cx, cy, r, owner, offsetIndex = 0 }: { cx: number; cy: number; r: number; owner: string; offsetIndex?: number }) {
  const color = civById.get(owner)?.color ?? '#888';
  return (
    <text x={cx - r + offsetIndex * 7} y={cy - r - 2} fontSize={r * 0.9} fill={color}>
      ⛵
    </text>
  );
}

export function CapacityBadge({ cx, cy, r, limit }: { cx: number; cy: number; r: number; limit: number }) {
  return (
    <g pointerEvents="none">
      <rect x={cx + r - 2} y={cy - r - 9} width={17} height={11} rx={5} fill="#0d3a4a" stroke="#cfe8ff" strokeWidth={0.5} opacity={0.85} />
      <text x={cx + r + 6.5} y={cy - r - 0.5} textAnchor="middle" fontSize={8} fontWeight="bold" fill="#cfe8ff">
        ≤{limit}
      </text>
    </g>
  );
}

export function TerrainGlyphs({ cx, cy, r, glyphs }: { cx: number; cy: number; r: number; glyphs: string }) {
  return (
    <text x={cx} y={cy + r + 11} textAnchor="middle" fontSize={r * 1.15} pointerEvents="none">
      {glyphs}
    </text>
  );
}
