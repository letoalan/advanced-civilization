import { useTranslation } from '../../i18n/index.js';

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
  const { t } = useTranslation();

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
            {t.setup.privacyTitle}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'handoff' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('handoff')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            {t.setup.privacyHandoff}
          </button>
          <button
            type="button"
            className={`civ-btn ${privacyMode === 'open-table' ? 'on' : ''}`}
            onClick={() => onPrivacyChange('open-table')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            {t.setup.privacyOpenTable}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
          {privacyMode === 'handoff'
            ? t.setup.privacyHandoffDesc
            : t.setup.privacyOpenTableDesc}
        </div>
      </div>

      {/* Option Cadence IA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t.setup.aiPaceTitle}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'readable' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('readable')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            {t.setup.aiPaceReadable}
          </button>
          <button
            type="button"
            className={`civ-btn ${aiPace === 'instant' ? 'on' : ''}`}
            onClick={() => onAiPaceChange('instant')}
            style={{ flex: 1, padding: '7px 10px', fontSize: 11 }}
          >
            {t.setup.aiPaceInstant}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
          {aiPace === 'readable'
            ? t.setup.aiPaceReadableDesc
            : t.setup.aiPaceInstantDesc}
        </div>
      </div>
    </div>
  );
}
