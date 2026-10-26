import { civById, astTrackFor, epochs } from '../../../data/index.js';
import type { PlayerState, PlayerId } from '../../../engine/types.js';

const EPOCH_NAMES_FR: Record<string, string> = {
  stone: 'Âge de Pierre',
  earlyBronze: 'Bronze Ancien',
  middleBronze: 'Bronze Moyen',
  lateBronze: 'Bronze Récent',
  earlyIron: 'Fer Ancien',
  lateIron: 'Fer Récent',
  'Stone Age': 'Âge de Pierre',
  'Early Bronze Age': 'Bronze Ancien',
  'Middle Bronze Age': 'Bronze Moyen',
  'Late Bronze Age': 'Bronze Récent',
  'Early Iron Age': 'Fer Ancien',
  'Late Iron Age': 'Fer Récent',
};

interface CivBadgeProps {
  player: PlayerState;
  focus: PlayerId;
  isActor: boolean;
}

export function CivBadge({ player, focus, isActor }: CivBadgeProps) {
  const civ = civById.get(focus);
  if (!civ) return null;

  const track = astTrackFor(focus);
  const currentEpoch = epochs.find((e) => e.id === player.epoch);
  const epochName = EPOCH_NAMES_FR[currentEpoch?.name ?? player.epoch] ?? (currentEpoch?.name ?? player.epoch);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      {/* Medallion */}
      <div
        title={`Civilisation : ${civ.name}${isActor ? ' (À vous de jouer)' : ''}`}
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
        {civ.name[0]}
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
            {civ.name}
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
              Tour actif
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
