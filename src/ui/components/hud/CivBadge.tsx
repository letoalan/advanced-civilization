import { civById, astTrackFor, epochs } from '../../../data/index.js';
import type { PlayerState, PlayerId } from '../../../engine/types.js';
import { useTranslation } from '../../i18n/index.js';

interface CivBadgeProps {
  player: PlayerState;
  focus: PlayerId;
  isActor: boolean;
}

export function CivBadge({ player, focus, isActor }: CivBadgeProps) {
  const { trCiv, trEpoch, t } = useTranslation();
  const civ = civById.get(focus);
  if (!civ) return null;

  const track = astTrackFor(focus);
  const currentEpoch = epochs.find((e) => e.id === player.epoch);
  const epochName = trEpoch(currentEpoch?.name ?? player.epoch);
  const civName = trCiv(focus);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {/* Medallion */}
      <div
        title={`${civName}${isActor ? ` (${t.common.yourTurn})` : ''}`}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: civ.color,
          border: isActor ? '2px solid #ffd23f' : '1.5px solid rgba(255,210,63,0.5)',
          boxShadow: isActor ? '0 0 10px rgba(255,210,63,0.6)' : '0 2px 6px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: 15,
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          flexShrink: 0,
        }}
        className={isActor ? 'animate-pulse' : undefined}
      >
        {civName[0]}
      </div>

      {/* Name and AST progression */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: "var(--civ-font-display)",
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: 0.8,
              color: '#fff',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {civName}
          </span>
          {isActor && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#1a1006',
                background: '#ffd23f',
                padding: '1px 5px',
                borderRadius: 9999,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              {t.common.activeTurn}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#d8c7a6' }}>
          <span>{epochName}</span>
          <span style={{ opacity: 0.4 }}>•</span>
          <span style={{ color: '#ffd23f', fontWeight: 600 }}>
            AST {player.astSpace}/{track.spaces}
          </span>
        </div>
      </div>
    </div>
  );
}
