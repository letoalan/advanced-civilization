import { useState } from 'react';
import { CalamityIcon } from '../../theme/icons/index.js';
import { calamityById } from '../../../data/index.js';
import type { PlayerState } from '../../../engine/types.js';

interface CalamityAlertBadgeProps {
  player: PlayerState;
}

export function CalamityAlertBadge({ player }: CalamityAlertBadgeProps) {
  const [showPopup, setShowPopup] = useState(false);

  const cals = Object.entries(player.hand)
    .filter(([c, n]) => c.startsWith('calamity:') && n > 0)
    .map(([c]) => c.slice(9));

  if (cals.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowPopup((v) => !v)}
        className="glass-btn glass-btn--danger animate-shake"
        title="Calamités imminentes en main !"
        style={{ padding: '4px 9px', fontSize: 11 }}
      >
        <CalamityIcon size={14} color="#fff" />
        <span>{cals.length}</span>
      </button>

      {showPopup && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="glass-panel glass-panel--gold animate-pop"
          style={{
            position: 'absolute',
            top: '120%',
            right: 0,
            width: 260,
            padding: 12,
            zIndex: 100,
            background: 'rgba(28, 14, 14, 0.95)',
            borderColor: '#f87171',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>
              Calamités en main
            </span>
            <button
              onClick={() => setShowPopup(false)}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 13 }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cals.map((cId) => {
              const def = calamityById.get(cId);
              return (
                <div
                  key={cId}
                  style={{
                    background: 'rgba(50, 20, 20, 0.6)',
                    padding: '6px 8px',
                    borderRadius: 6,
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#fff' }}>{def?.name ?? cId}</div>
                  <div style={{ fontSize: 10, color: '#fca5a5' }}>
                    {def?.effect?.kind ? `Effet : ${def.effect.kind}` : 'Effet résolu en phase Calamités'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
