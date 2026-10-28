import { civById } from '../../../data/index.js';
import type { PlayerId } from '../../../engine/types.js';
import type { LocalSeat } from '../../../local/types.js';
import { useTranslation, translateCiv } from '../../i18n/index.js';

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
  const { t } = useTranslation();
  const civ = civById.get(actor);
  const civName = translateCiv(actor, t);
  const civColor = civ?.color ?? '#ffd23f';
  const playerName = seat?.displayName ? `${seat.displayName} (${civName})` : civName;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 9, 13, 0.94)',
        backdropFilter: 'var(--civ-blur-lg)',
        WebkitBackdropFilter: 'var(--civ-blur-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        color: 'var(--civ-marble)',
        padding: 24,
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        className="glass-panel animate-pop"
        style={{
          background: 'rgba(16, 21, 28, 0.96)',
          border: `1.5px solid ${civColor}`,
          borderRadius: 14,
          padding: 32,
          maxWidth: 480,
          width: '90vw',
          boxShadow: 'var(--civ-glass-shadow-lg), 0 0 30px rgba(0,0,0,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: civColor, boxShadow: `0 0 8px ${civColor}` }} />
          <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, color: civColor, fontWeight: 800 }}>
            {t.handoff.title}
          </span>
        </div>

        <h2 style={{ margin: 0, color: 'var(--civ-gold-light)', fontFamily: 'var(--civ-font-display)', fontSize: 24, fontWeight: 800, letterSpacing: 0.8 }}>
          {t.handoff.turnOf(playerName)}
        </h2>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--civ-stone-muted)', lineHeight: 1.55 }}>
          {t.handoff.desc}
        </p>

        <button
          className="glass-btn glass-btn--primary"
          style={{
            fontSize: 14,
            padding: '12px 28px',
            marginTop: 6,
          }}
          onClick={onReveal}
        >
          {t.handoff.revealButton}
        </button>

        {onSwitchToOpenTable && (
          <button
            onClick={onSwitchToOpenTable}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--civ-stone-muted)',
              fontSize: 11,
              textDecoration: 'underline',
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            {t.handoff.switchToOpenTable}
          </button>
        )}
      </div>
    </div>
  );
}
