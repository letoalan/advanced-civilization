import { areaById, civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import { PopIcon, CityIcon, ShipIcon, CloseIcon } from '../../theme/icons/index.js';

interface ZonePopoverProps {
  areaId: string | null;
  state: GameState;
  onClose: () => void;
}

export function ZonePopover({ areaId, state, onClose }: ZonePopoverProps) {
  if (!areaId) return null;
  const def = areaById.get(areaId);
  const areaState = state.areas[areaId];
  if (!def || !areaState) return null;

  const occupants = Object.entries(areaState.tokens).filter(([, count]) => count > 0);
  const ships = Object.entries(areaState.ships ?? {}).filter(([, count]) => count > 0);

  return (
    <aside
      className="glass-panel glass-panel--gold animate-pop"
      style={{
        position: 'absolute',
        top: 68,
        left: 16,
        zIndex: 40,
        width: 250,
        padding: '10px 14px',
        boxShadow: 'var(--civ-glass-shadow-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div>
          <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: '#ffd23f', fontFamily: 'var(--civ-font-display)' }}>
            {def.name}
          </h4>
          <span style={{ fontSize: 10, color: '#a89880', textTransform: 'capitalize' }}>
            {def.isWater ? 'Zone Maritime' : `Province (Max ${def.sustains} pop)`}
          </span>
        </div>
        <button onClick={onClose} className="glass-btn" style={{ padding: 3 }}>
          <CloseIcon size={13} />
        </button>
      </div>

      {/* Terrain badges */}
      <div style={{ display: 'flex', gap: 6, margin: '6px 0', flexWrap: 'wrap' }}>
        {def.isCitySite && (
          <span style={{ fontSize: 10, background: 'rgba(96,165,250,0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(96,165,250,0.3)' }}>
            🏛️ Site de cité
          </span>
        )}
        {def.isVolcanoSite && (
          <span style={{ fontSize: 10, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(239,68,68,0.3)' }}>
            🌋 Volcan
          </span>
        )}
        {def.isFloodplain && (
          <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#93c5fd', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(59,130,246,0.3)' }}>
            🌊 Inondable
          </span>
        )}
      </div>

      {/* Occupants / Tokens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        {areaState.city && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <CityIcon size={13} color={civById.get(areaState.city)?.color ?? '#fff'} />
            <span>Cité de <strong>{civById.get(areaState.city)?.name}</strong></span>
          </div>
        )}
        {occupants.map(([pId, count]) => (
          <div key={pId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <PopIcon size={13} color={civById.get(pId)?.color ?? '#fff'} />
            <span>{count} pop ({civById.get(pId)?.name})</span>
          </div>
        ))}
        {ships.map(([pId, count]) => (
          <div key={pId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <ShipIcon size={13} color={civById.get(pId)?.color ?? '#fff'} />
            <span>{count} navires ({civById.get(pId)?.name})</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
