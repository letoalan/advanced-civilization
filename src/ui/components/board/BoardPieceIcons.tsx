import type { SVGProps } from 'react';

/** Ancient Mediterranean Trireme / Galley SVG icon */
export function TriremeIcon({
  x,
  y,
  size = 18,
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
      {/* War Galley Hull with bronze ram (rostrum) and high curved stern */}
      <path
        d={`M 1 ${h * 0.75} Q ${w * 0.45} ${h * 0.88} ${w * 0.95} ${h * 0.62} Q ${w * 0.98} ${h * 0.35} ${w * 0.9} ${h * 0.32} Q ${w * 0.88} ${h * 0.58} ${w * 0.78} ${h * 0.62} L ${w * 0.15} ${h * 0.62} L 0 ${h * 0.68} Z`}
        fill={color}
        stroke={stroke}
        strokeWidth={1}
        strokeLinejoin="round"
      />
      {/* Mast and ancient square rigging sail */}
      <line x1={w * 0.48} y1={h * 0.15} x2={w * 0.48} y2={h * 0.65} stroke={stroke} strokeWidth={1.2} />
      <path
        d={`M ${w * 0.28} ${h * 0.22} Q ${w * 0.48} ${h * 0.18} ${w * 0.68} ${h * 0.22} L ${w * 0.64} ${h * 0.5} Q ${w * 0.48} ${h * 0.55} ${w * 0.32} ${h * 0.5} Z`}
        fill="#f4eedb"
        stroke={stroke}
        strokeWidth={0.8}
        opacity={0.92}
      />
      {/* Oars bank */}
      <line x1={w * 0.25} y1={h * 0.75} x2={w * 0.2} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.4} y1={h * 0.75} x2={w * 0.35} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.55} y1={h * 0.75} x2={w * 0.5} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
      <line x1={w * 0.7} y1={h * 0.75} x2={w * 0.65} y2={h * 0.98} stroke={stroke} strokeWidth={0.9} />
    </g>
  );
}

/** Classical Acropolis / Fortress Citadel icon for constructed cities */
export function AcropolisCityIcon({
  cx,
  cy,
  r,
  color,
  isPirate,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  isPirate?: boolean;
}) {
  const w = r * 2.1;
  const h = r * 1.6;
  const ox = cx - w / 2;
  const oy = cy - h / 2;

  if (isPirate) {
    return (
      <g transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`} filter="url(#atlas-city-shadow)">
        {/* Dark menacing citadel fortress with battlement merlons */}
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
      {/* Classical Temple / Acropolis with pediment, colonnade & stylobate */}
      {/* Triangular pediment roof */}
      <polygon
        points={`${w * 0.5},0 ${w * 0.98},${h * 0.38} ${w * 0.02},${h * 0.38}`}
        fill={color}
        stroke="#231c12"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* Architrave bar */}
      <rect x={w * 0.06} y={h * 0.38} width={w * 0.88} height={h * 0.1} fill="#eadeca" stroke="#231c12" strokeWidth={0.8} />
      {/* Columns */}
      <rect x={w * 0.12} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.34} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.56} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      <rect x={w * 0.78} y={h * 0.48} width={w * 0.12} height={h * 0.38} fill="#f7f3e8" stroke="#231c12" strokeWidth={0.7} />
      {/* Stepped stylobate base */}
      <rect x={0} y={h * 0.86} width={w} height={h * 0.14} fill={color} stroke="#231c12" strokeWidth={1} rx={1} />
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
