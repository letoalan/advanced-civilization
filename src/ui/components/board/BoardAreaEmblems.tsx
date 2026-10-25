import type { BoardStyle } from './boardTheme.js';

interface AreaMarkerProps {
  cx: number;
  cy: number;
  style?: BoardStyle;
}

/** Crisp classical Greek/Roman temple medallion for unbuilt natural city sites (§24.1) */
export function CitySiteEmblem({ cx, cy, hasPieces = false, style = 'atlas' }: AreaMarkerProps & { hasPieces?: boolean }) {
  const isAtlas = style === 'atlas';
  const ox = cx + (hasPieces ? -14 : 0);
  const oy = cy + (hasPieces ? 11 : 0);

  return (
    <g
      transform={`translate(${ox.toFixed(1)}, ${oy.toFixed(1)})`}
      pointerEvents="none"
      filter={isAtlas ? 'url(#atlas-piece-shadow)' : undefined}
    >
      <title>Site de cité naturel (fondation à 6 pions au lieu de 12)</title>
      {/* Medallion disk */}
      <circle cx={0} cy={0} r={10} fill={isAtlas ? '#2b2116' : '#0d2b38'} stroke={isAtlas ? '#d4af37' : '#38bdf8'} strokeWidth={1.3} />
      {/* Triangular pediment roof */}
      <polygon points="0,-6.5 -6.5,-1.8 6.5,-1.8" fill="#fdfbf7" stroke="#2b2116" strokeWidth={0.8} strokeLinejoin="round" />
      {/* Architrave */}
      <rect x={-5.8} y={-1.8} width={11.6} height={1.2} fill="#e5dcc5" stroke="#2b2116" strokeWidth={0.6} />
      {/* Four fluted columns */}
      <rect x={-5.2} y={-0.6} width={1.6} height={5.2} fill="#fdfbf7" stroke="#2b2116" strokeWidth={0.5} />
      <rect x={-2.1} y={-0.6} width={1.6} height={5.2} fill="#fdfbf7" stroke="#2b2116" strokeWidth={0.5} />
      <rect x={0.5} y={-0.6} width={1.6} height={5.2} fill="#fdfbf7" stroke="#2b2116" strokeWidth={0.5} />
      <rect x={3.6} y={-0.6} width={1.6} height={5.2} fill="#fdfbf7" stroke="#2b2116" strokeWidth={0.5} />
      {/* Stylobate base step */}
      <rect x={-6.8} y={4.6} width={13.6} height={1.8} rx={0.5} fill={isAtlas ? '#caa765' : '#38bdf8'} stroke="#2b2116" strokeWidth={0.7} />
    </g>
  );
}

/** Active volcano hazard SVG medallion */
export function VolcanoEmblem({ cx, cy, style = 'atlas' }: AreaMarkerProps) {
  const isAtlas = style === 'atlas';
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`} pointerEvents="none" filter={isAtlas ? 'url(#atlas-piece-shadow)' : undefined}>
      <title>Volcan actif (danger d'éruption lors des calamités)</title>
      <circle cx={0} cy={0} r={8.5} fill="#261b17" stroke="#ef4444" strokeWidth={1.2} />
      <polygon points="0,-4.5 -5.8,4.5 5.8,4.5" fill="#7f1d1d" stroke="#450a0a" strokeWidth={0.7} strokeLinejoin="round" />
      <polygon points="0,-3.5 -2.2,-0.5 2.2,-0.5" fill="#f59e0b" stroke="#fef08a" strokeWidth={0.5} />
      <circle cx={0} cy={-5.2} r={1.3} fill="#f97316" />
    </g>
  );
}

/** Floodplain river currents SVG medallion */
export function FloodplainEmblem({ cx, cy, style = 'atlas' }: AreaMarkerProps) {
  const isAtlas = style === 'atlas';
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)})`} pointerEvents="none" filter={isAtlas ? 'url(#atlas-piece-shadow)' : undefined}>
      <title>Plaine inondable (risque d'inondation majeure)</title>
      <circle cx={0} cy={0} r={8.5} fill="#11222f" stroke="#38bdf8" strokeWidth={1.2} />
      <path d="M -5 -1 Q -2.5 -3.5 0 -1 T 5 -1 M -5 2.2 Q -2.5 -0.3 0 2.2 T 5 2.2" fill="none" stroke="#60a5fa" strokeWidth={1.4} strokeLinecap="round" />
    </g>
  );
}

/** High-contrast population capacity limit badge (≤1, ≤2, ≤3, ≤4) */
export function SvgCapacityBadge({
  cx,
  cy,
  r,
  limit,
  hasPieces = false,
  style = 'atlas',
}: AreaMarkerProps & { r: number; limit: number; hasPieces?: boolean }) {
  const bx = cx + (hasPieces ? r * 0.72 : r * 0.35);
  const by = cy - (hasPieces ? r * 0.95 : r * 0.65);
  const w = 24;
  const h = 15;
  const isAtlas = style === 'atlas';

  return (
    <g transform={`translate(${bx.toFixed(1)}, ${by.toFixed(1)})`} pointerEvents="none" filter={isAtlas ? 'url(#atlas-piece-shadow)' : undefined}>
      <title>{`Capacité de subsistance : ${limit} pion${limit > 1 ? 's' : ''}`}</title>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={h / 2}
        fill={isAtlas ? '#1c1611' : '#0d2b38'}
        stroke={isAtlas ? '#d4af37' : '#38bdf8'}
        strokeWidth={1.3}
      />
      <text
        x={0}
        y={3.8}
        textAnchor="middle"
        fontSize={10.5}
        fontWeight="900"
        fill="#ffffff"
        stroke={isAtlas ? '#1a1208' : '#05131a'}
        strokeWidth={1.2}
        paintOrder="stroke fill"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        ≤{limit}
      </text>
    </g>
  );
}
