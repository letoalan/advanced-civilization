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
        gap: 12,
        background: '#1a140e',
        border: '1px solid #4a341e',
        borderRadius: 8,
        padding: '12px 14px',
      }}
    >
      {/* Option Confidentialité */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#ffd23f', textTransform: 'uppercase' }}>
            🔒 Confidentialité des mains :
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'handoff' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('handoff')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
          >
            Passage secret
          </button>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'open-table' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('open-table')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
          >
            Table ouverte
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#8e8070', lineHeight: 1.35 }}>
          {privacyMode === 'handoff'
            ? 'Écran noir de transition entre les joueurs humains pour masquer les cartes et calamités.'
            : 'Toutes les mains sont visibles en continu. Idéal en solo multi-sièges ou apprentissage.'}
        </div>
      </div>

      {/* Option Cadence IA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#ffd23f', textTransform: 'uppercase' }}>
            ⚡ Cadence de jeu de l'IA :
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'readable' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('readable')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
          >
            Lisible (temporisé)
          </button>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'instant' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('instant')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
          >
            Instantané
          </button>
        </div>
        <div style={{ fontSize: 11, color: '#8e8070', lineHeight: 1.35 }}>
          {aiPace === 'readable'
            ? 'Temporisation de 1 à 2 secondes pour observer les mouvements et décisions de l’IA.'
            : 'Exécution immédiate des calculs et phases de l’IA sans pause.'}
        </div>
      </div>
    </div>
  );
}
