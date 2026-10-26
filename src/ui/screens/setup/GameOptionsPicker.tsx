interface GameOptionsPickerProps {
  privacyMode: 'handoff' | 'open-table';
  aiPace: 'instant' | 'readable';
  onPrivacyChange: (mode: 'handoff' | 'open-table') => void;
  onAiPaceChange: (pace: 'instant' | 'readable') => void;
}

export function GameOptionsPicker({
  privacyMode,
  aiPace,
  onPrivacyChange,
  onAiPaceChange,
}: GameOptionsPickerProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 16,
        background: 'rgba(16, 21, 28, 0.85)',
        backdropFilter: 'var(--civ-blur-sm)',
        border: '1px solid rgba(212, 175, 55, 0.22)',
        borderRadius: 8,
        padding: '14px 16px',
        boxShadow: 'var(--civ-glass-shadow)',
      }}
    >
      {/* Option Confidentialité */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            🔒 Confidentialité des mains :
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'handoff' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('handoff')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            Passage secret
          </button>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'open-table' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('open-table')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            Table ouverte
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
          {privacyMode === 'handoff'
            ? 'Écran noir de transition entre les joueurs humains pour masquer les cartes et calamités.'
            : 'Toutes les mains sont visibles en continu. Idéal en solo multi-sièges ou apprentissage.'}
        </div>
      </div>

      {/* Option Cadence IA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            ⚡ Cadence de jeu de l'IA :
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'readable' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('readable')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            Lisible (temporisé)
          </button>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'instant' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('instant')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            Instantané
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
          {aiPace === 'readable'
            ? 'Temporisation de 1 à 2 secondes pour observer les mouvements et décisions de l’IA.'
            : 'Exécution immédiate des calculs et phases de l’IA sans pause.'}
        </div>
      </div>
    </div>
  );
}
