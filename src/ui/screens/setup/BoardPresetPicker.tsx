import type { BoardPreset } from '../../../engine/boards.js';
import { useTranslation } from '../../i18n/index.js';
import { getPresetInfo } from './setupTranslations.js';

interface BoardPresetPickerProps {
  presets: BoardPreset[];
  activePresetId: string;
  onSelect: (presetId: string) => void;
}

export function BoardPresetPicker({ presets, activePresetId, onSelect }: BoardPresetPickerProps) {
  const { t, language } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {t.setup.mapTheatre}
        </span>
        <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
          {t.setup.mapTheatreDesc}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {presets.map((b) => {
          const isSelected = activePresetId === b.id;
          const info = getPresetInfo(b.id, language) ?? { label: b.label, desc: b.rule };
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              style={{
                textAlign: 'left',
                background: isSelected ? 'rgba(28, 36, 48, 0.95)' : 'rgba(16, 21, 28, 0.75)',
                border: isSelected ? '1.5px solid var(--civ-gold-base)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                boxShadow: isSelected ? '0 0 16px rgba(212, 175, 55, 0.25)' : 'var(--civ-glass-shadow)',
                transition: 'all .16s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: isSelected ? 'var(--civ-gold-light)' : 'var(--civ-marble)' }}>
                  {info.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: isSelected ? 'var(--civ-gold-base)' : 'rgba(30, 38, 50, 0.8)',
                    color: isSelected ? '#000' : 'var(--civ-marble)',
                  }}
                >
                  {t.setup.tokensCount(b.tokensPerPlayer)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: isSelected ? 'var(--civ-marble)' : 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
                {info.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
