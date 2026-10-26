import { civById } from '../../../data/index.js';
import type { BoardStyle } from './boardTheme.js';
import { TriremeIcon, AcropolisCityIcon, BarbarianMedallion, TerrainMedallion } from './BoardPieceIcons.js';
import { ClassicCityMarker, ClassicTokenMarker } from './BoardClassicTokens.js';

export { polyPoints, tokenPoints, cityPoints } from './BoardClassicTokens.js';

export const BARB = '__barbarian__';
export const PIRATE = '__pirate__';

export function CityMarker({
  cx,
  cy,
  r,
  owner,
  isNaturalSite = true,
  style = 'atlas',
}: {
  cx: number;
  cy: number;
  r: number;
  owner: string;
  isNaturalSite?: boolean;
  style?: BoardStyle;
}) {
  const isPirate = owner === PIRATE;
  const color = isPirate ? '#141417' : (civById.get(owner)?.color ?? '#555555');
  if (style === 'atlas') {
    return <AcropolisCityIcon cx={cx} cy={cy} r={r} color={color} isPirate={isPirate} isNaturalSite={isNaturalSite} />;
  }
  return <ClassicCityMarker cx={cx} cy={cy} r={r} color={color} isPirate={isPirate} />;
}

export function TokenMarker({
  cx,
  cy,
  r,
  owner,
  count,
  offsetIndex = 0,
  style = 'atlas',
}: {
  cx: number;
  cy: number;
  r: number;
  owner: string;
  count: number;
  offsetIndex?: number;
  style?: BoardStyle;
}) {
  const barb = owner === BARB;
  const x = cx + offsetIndex * 7;
  const baseColor = barb ? '#1a1a1a' : (civById.get(owner)?.color ?? '#888');

  if (style === 'atlas') {
    if (barb) {
      return <BarbarianMedallion cx={x} cy={cy} r={r} count={count} />;
    }
    const rad = r * 0.68;
    return (
      <g filter="url(#atlas-piece-shadow)">
        {/* Lacquered wooden / resin circular token with antique bevel */}
        <circle cx={x} cy={cy} r={rad} fill={baseColor} stroke="#21180f" strokeWidth={1.2} />
        <circle cx={x} cy={cy} r={rad} fill="url(#atlas-token-circular-bevel)" pointerEvents="none" />
        <text
          x={x}
          y={cy + rad * 0.38}
          textAnchor="middle"
          fontSize={rad * 1.3}
          fontWeight="900"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={1.4}
          paintOrder="stroke fill"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {count}
        </text>
      </g>
    );
  }

  return <ClassicTokenMarker x={x} cy={cy} r={r} color={baseColor} barb={barb} count={count} />;
}

export function ShipMarker({
  cx,
  cy,
  r,
  owner,
  offsetIndex = 0,
  style = 'atlas',
}: {
  cx: number;
  cy: number;
  r: number;
  owner: string;
  offsetIndex?: number;
  style?: BoardStyle;
}) {
  const color = civById.get(owner)?.color ?? '#888';
  const sx = cx - r * 0.3 + offsetIndex * 9;
  const sy = cy - r * 0.8;

  if (style === 'atlas') {
    return <TriremeIcon x={sx} y={sy} size={r * 1.6} color={color} />;
  }
  return (
    <text x={cx - r + offsetIndex * 7} y={cy - r - 2} fontSize={r * 0.9} fill={color}>
      ⛵
    </text>
  );
}

import { SvgCapacityBadge, CitySiteEmblem, VolcanoEmblem, FloodplainEmblem } from './BoardAreaEmblems.js';

export { SvgCapacityBadge, CitySiteEmblem, VolcanoEmblem, FloodplainEmblem };

export function CapacityBadge({
  cx,
  cy,
  r,
  limit,
  hasPieces = false,
  style = 'atlas',
}: {
  cx: number;
  cy: number;
  r: number;
  limit: number;
  hasPieces?: boolean;
  style?: BoardStyle;
}) {
  return <SvgCapacityBadge cx={cx} cy={cy} r={r} limit={limit} hasPieces={hasPieces} style={style} />;
}

export function TerrainGlyphs({
  cx,
  cy,
  r,
  glyphs,
  style = 'atlas',
}: {
  cx: number;
  cy: number;
  r: number;
  glyphs: ('volcano' | 'citySite' | 'floodplain')[];
  style?: BoardStyle;
}) {
  const spacing = 19;
  const startX = cx - ((glyphs.length - 1) * spacing) / 2;
  const gy = cy + r + 10;
  return (
    <g pointerEvents="none">
      {glyphs.map((t, idx) => {
        const gx = startX + idx * spacing;
        if (t === 'citySite') return <CitySiteEmblem key={t} cx={gx} cy={gy} style={style} />;
        if (t === 'volcano') return <VolcanoEmblem key={t} cx={gx} cy={gy} style={style} />;
        return <FloodplainEmblem key={t} cx={gx} cy={gy} style={style} />;
      })}
    </g>
  );
}
