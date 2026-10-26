import type { SVGProps } from 'react';

/** Ancient Mediterranean Trireme / Galley SVG icon */
export function TriremeIcon({
  x,
  y,
  size = 19,
  color = '#c9a45c',
  stroke = '#1b140b',
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  stroke?: string;
}) {
  const w = size;
  const h = size * 0.72;
  const ox = x - w / 2;
  const oy = y - h / 2;

  return (
    <g transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`} filter="url(#atlas-piece-shadow)">
      {/* War Galley Hull: patinated wood with bronze ram (rostrum) and high curved stern */}
      <path
        d={`M 1 ${h * 0.76} Q ${w * 0.45} ${h * 0.9} ${w * 0.95} ${h * 0.62} Q ${w * 0.98} ${h * 0.32} ${w * 0.9} ${h * 0.3} Q ${w * 0.88} ${h * 0.58} ${w * 0.78} ${h * 0.62} L ${w * 0.15} ${h * 0.62} L 0 ${h * 0.7} Z`}
        fill="#5a3d24"
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Bronze ram / rostrum tip */}
      <polygon points={`0,${h * 0.7} ${w * 0.12},${h * 0.64} ${w * 0.1},${h * 0.78}`} fill="#d4af37" stroke={stroke} strokeWidth={0.6} />

      {/* Bow pennant / pavillon de proue */}
      <path d={`M 2 ${h * 0.66} L -3 ${h * 0.56} L 2 ${h * 0.6} Z`} fill={color} stroke={stroke} strokeWidth={0.5} />

      {/* Mast */}
      <line x1={w * 0.48} y1={h * 0.12} x2={w * 0.48} y2={h * 0.66} stroke={stroke} strokeWidth={1.3} />

      {/* Square rigging ancient sail with heraldic faction color */}
      <path
        d={`M ${w * 0.26} ${h * 0.18} Q ${w * 0.48} ${h * 0.14} ${w * 0.7} ${h * 0.18} L ${w * 0.66} ${h * 0.52} Q ${w * 0.48} ${h * 0.58} ${w * 0.3} ${h * 0.52} Z`}
        fill={color}
        stroke={stroke}
        strokeWidth={0.8}
        opacity={0.96}
      />
      {/* Sail cross-trim */}
      <line x1={w * 0.3} y1={h * 0.34} x2={w * 0.66} y2={h * 0.34} stroke="#ffffff" strokeWidth={0.7} opacity={0.6} />

      {/* Oars bank */}
      <line x1={w * 0.25} y1={h * 0.78} x2={w * 0.2} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.4} y1={h * 0.78} x2={w * 0.35} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.55} y1={h * 0.78} x2={w * 0.5} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.7} y1={h * 0.78} x2={w * 0.65} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
    </g>
  );
}

export { AcropolisCityIcon } from './AcropolisCityIcon.js';

/** Barbarian forged iron medallion with crossed gladius swords */
export function BarbarianMedallion({
  cx,
  cy,
  r,
  count,
}: {
  cx: number;
  cy: number;
  r: number;
  count: number;
}) {
  const rad = r * 0.68;
  return (
    <g filter="url(#atlas-piece-shadow)">
      {/* Forged iron medallion disc with studded rim */}
      <circle cx={cx} cy={cy} r={rad} fill="#202328" stroke="#681c1c" strokeWidth={1.6} />
      {/* Crossed Gladius swords behind the count */}
      <line x1={cx - rad * 0.65} y1={cy - rad * 0.65} x2={cx + rad * 0.65} y2={cy + rad * 0.65} stroke="#c53030" strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
      <line x1={cx + rad * 0.65} y1={cy - rad * 0.65} x2={cx - rad * 0.65} y2={cy + rad * 0.65} stroke="#c53030" strokeWidth={1.6} strokeLinecap="round" opacity={0.75} />
      {/* Circular chamfer/bevel */}
      <circle cx={cx} cy={cy} r={rad} fill="url(#atlas-token-circular-bevel)" pointerEvents="none" />
      {/* Barbarian population number */}
      <text
        x={cx}
        y={cy + rad * 0.38}
        textAnchor="middle"
        fontSize={rad * 1.3}
        fontWeight="900"
        fill="#fecaca"
        stroke="#450a0a"
        strokeWidth={1.4}
        paintOrder="stroke fill"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {count}
      </text>
    </g>
  );
}

/** Engraved medal terrain glyphs replacing unicode emojis */
export function TerrainMedallion({
  cx,
  cy,
  type,
}: {
  cx: number;
  cy: number;
  type: 'volcano' | 'citySite' | 'floodplain';
}) {
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`} filter="url(#atlas-piece-shadow)" pointerEvents="none">
      <circle cx={0} cy={0} r={7.5} fill="#2a2217" stroke="#caa765" strokeWidth={1} />
      {type === 'volcano' && (
        <path d="M -4.5 4 L 0 -4 L 4.5 4 Z" fill="#e05438" stroke="#fff" strokeWidth={0.6} />
      )}
      {type === 'citySite' && (
        <path d="M -4 4 L -4 1 L 0 -3.5 L 4 1 L 4 4 Z" fill="#e8dfcc" stroke="#3d2f1d" strokeWidth={0.7} />
      )}
      {type === 'floodplain' && (
        <path d="M -4.5 1 Q -2.2 -1 0 1 T 4.5 1 M -4.5 3 Q -2.2 1 0 3 T 4.5 3" fill="none" stroke="#60a5fa" strokeWidth={1.1} strokeLinecap="round" />
      )}
    </g>
  );
}
