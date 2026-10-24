import { civById } from '../../../data/index.js';
import type { PlayerId } from '../../../engine/types.js';
import type { LocalSeat } from '../../../local/types.js';

interface PlayerHandoffModalProps {
  actor: PlayerId;
  seat?: LocalSeat;
  onReveal: () => void;
  onSwitchToOpenTable?: () => void;
}

/**
 * Rideau de confidentialité entre joueurs humains en mode hotseat (§27.4/§28).
 * Masque les informations privées (main de cartes, calamités secrètes) avant la passation.
 */
export function PlayerHandoffModal({
  actor,
  seat,
  onReveal,
  onSwitchToOpenTable,
}: PlayerHandoffModalProps) {
  const civ = civById.get(actor);
  const civName = civ?.name ?? actor;
  const civColor = civ?.color ?? '#ffd23f';
  const playerName = seat?.displayName ? `${seat.displayName} (${civName})` : civName;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 8, 6, 0.94)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        color: '#f0e6d2',
        padding: 24,
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          background: '#1d1712',
          border: `2px solid ${civColor}`,
          borderRadius: 12,
          padding: 28,
          maxWidth: 460,
          width: '90vw',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: civColor }} />
          <span style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 2, color: civColor, fontWeight: 800 }}>
            Changement de Joueur
          </span>
        </div>

        <h2 style={{ margin: 0, color: '#f8edd4', fontSize: 24, fontWeight: 900 }}>
          Au tour de {playerName}
        </h2>

        <p style={{ margin: 0, fontSize: 13, color: '#baa', lineHeight: 1.5 }}>
          Les cartes en main et décisions du joueur précédent ont été masquées pour préserver le secret de la partie.
        </p>

        <button
          className="civ-btn"
          style={{
            fontSize: 16,
            padding: '12px 28px',
            fontWeight: 800,
            background: civColor,
            color: '#1a1005',
            borderColor: '#7a5020',
            marginTop: 6,
          }}
          onClick={onReveal}
        >
          👁️ Afficher mon tour
        </button>

        {onSwitchToOpenTable && (
          <button
            onClick={onSwitchToOpenTable}
            style={{
              background: 'none',
              border: 'none',
              color: '#887766',
              fontSize: 11,
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            Passer en mode « Table ouverte » (désactiver les masquages)
          </button>
        )}
      </div>
    </div>
  );
}
