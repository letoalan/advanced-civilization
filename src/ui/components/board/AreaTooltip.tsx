import { anchors, BOARD_VIEWBOX } from '../../anchors.js';
import { areaById, civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import { BARB, PIRATE } from './BoardTokens.js';

interface AreaTooltipProps {
  areaId: string;
  state: GameState;
  zoomed: boolean;
}

/**
 * Hover detail card for an area displaying population limits, cities, occupants and terrain tags.
 */
export function AreaTooltip({ areaId, state, zoomed }: AreaTooltipProps) {
  const an = anchors[areaId];
  if (!an) return null;

  const meta = areaById.get(areaId);
  const a = state.areas[areaId];
  const owners = Object.entries(a?.tokens ?? {}).filter(([, n]) => n > 0);
  const ships = Object.entries(a?.ships ?? {}).filter(([, n]) => n > 0);
  const cityOwner = a?.city;
  const right = an.x > BOARD_VIEWBOX.w * 0.75;
  const flags = [meta?.isCitySite && 'city site', meta?.isFloodplain && 'floodplain', meta?.isVolcanoSite && 'volcano', meta?.isOpenSea && 'open sea']
    .filter(Boolean)
    .join(' · ');
  const nameOf = (o: string) => (o === BARB ? 'Barbarians' : o === PIRATE ? 'Pirates' : civById.get(o)?.name ?? o);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${(an.x / BOARD_VIEWBOX.w) * 100}%`,
        top: `${(an.y / BOARD_VIEWBOX.h) * 100}%`,
        transform: `translate(${right ? 'calc(-100% - 14px)' : '14px'}, -50%) scale(${zoomed ? 0.56 : 1})`,
        transformOrigin: right ? 'right center' : 'left center',
        zIndex: 20,
        pointerEvents: 'none',
        background: 'rgba(26,20,16,0.96)',
        color: '#fff',
        border: '2px solid #ffd23f',
        borderRadius: 6,
        padding: '6px 9px',
        fontSize: 13,
        lineHeight: 1.35,
        maxWidth: 230,
        boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ fontWeight: 800 }}>{meta?.name ?? areaId}</div>
      <div style={{ fontSize: 11, opacity: 0.85 }}>
        {meta?.isWater ? 'Sea' : `Population limit: ${meta?.sustains ?? '?'}`}
        {flags && ` · ${flags}`}
      </div>
      {cityOwner && <div style={{ marginTop: 2 }}>🏛 {nameOf(cityOwner)} city</div>}
      {owners.length > 0 && (
        <div style={{ marginTop: 2, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {owners.map(([o, n]) => (
            <span key={o}>
              <span
                style={{
                  display: 'inline-block',
                  width: 9,
                  height: 9,
                  background: o === BARB ? '#1a1a1a' : (civById.get(o)?.color ?? '#888'),
                  borderRadius: 2,
                  marginRight: 3,
                  verticalAlign: 'middle',
                }}
              />
              {nameOf(o)} {o === BARB ? `⚔ ${n}` : n}
            </span>
          ))}
        </div>
      )}
      {ships.length > 0 && <div style={{ marginTop: 2 }}>⛵ {ships.map(([o, n]) => `${nameOf(o)} ${n}`).join(', ')}</div>}
      {owners.length === 0 && !cityOwner && !meta?.isWater && <div style={{ fontSize: 11, opacity: 0.7 }}>empty</div>}
    </div>
  );
}
