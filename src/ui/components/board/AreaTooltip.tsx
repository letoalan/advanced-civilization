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
  Cartel d'exposition archéologique pour une province au survol
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

  const flags = [
    meta?.isCitySite && 'Site de cité',
    meta?.isFloodplain && 'Plaine alluviale',
    meta?.isVolcanoSite && 'Volcan actif',
    meta?.isOpenSea && 'Haute mer',
  ].filter(Boolean).join(' · ');

  const nameOf = (o: string) => (o === BARB ? 'Barbares' : o === PIRATE ? 'Pirates' : civById.get(o)?.name ?? o);

  return (
    <div
      className="museum-cartel animate-pop"
      style={{
        position: 'absolute',
        left: `${(an.x / BOARD_VIEWBOX.w) * 100}%`,
        top: `${(an.y / BOARD_VIEWBOX.h) * 100}%`,
        transform: `translate(${right ? 'calc(-100% - 14px)' : '14px'}, -50%) scale(${zoomed ? 0.7 : 1})`,
        transformOrigin: right ? 'right center' : 'left center',
        zIndex: 40,
        pointerEvents: 'none',
        fontSize: 12,
        lineHeight: 1.4,
        minWidth: 160,
        maxWidth: 240,
      }}
    >
      <div className="museum-cartel__title">{meta?.name ?? areaId}</div>
      <div className="museum-cartel__meta" style={{ marginTop: 2 }}>
        {meta?.isWater ? 'Bassin maritime' : `Capacité : ${meta?.sustains ?? '?'} pop`}
        {flags && ` · ${flags}`}
      </div>

      {cityOwner && (
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#fef08a' }}>
          <span>🏛</span>
          <span>Cité de <strong>{nameOf(cityOwner)}</strong></span>
        </div>
      )}

      {owners.length > 0 && (
        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 11 }}>
          {owners.map(([o, n]) => (
            <span key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  background: o === BARB ? '#e11d48' : (civById.get(o)?.color ?? '#ffd23f'),
                  borderRadius: '50%',
                }}
              />
              <span>{nameOf(o)} {o === BARB ? `⚔ ${n}` : `(${n})`}</span>
            </span>
          ))}
        </div>
      )}

      {ships.length > 0 && (
        <div style={{ marginTop: 3, fontSize: 11, color: '#93c5fd' }}>
          ⛵ {ships.map(([o, n]) => `${nameOf(o)} (${n} trirèmes)`).join(', ')}
        </div>
      )}

      {owners.length === 0 && !cityOwner && !meta?.isWater && (
        <div style={{ fontSize: 10, color: 'var(--civ-stone-muted)', fontStyle: 'italic', marginTop: 2 }}>
          Terres libres
        </div>
      )}
    </div>
  );
}
