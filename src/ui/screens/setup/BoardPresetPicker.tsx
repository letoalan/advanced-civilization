import type { BoardPreset } from '../../../engine/boards.js';
import { PRESET_INFO_FR } from './setupTranslations.js';

interface BoardPresetPickerProps {
  presets: BoardPreset[];
  activePresetId: string;
  onSelect: (presetId: string) => void;
}

export function BoardPresetPicker({ presets, activePresetId, onSelect }: BoardPresetPickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: '#ffd23f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Plateau de jeu & Règles (§16) :
        </span>
        <span style={{ fontSize: 11, color: '#a89882' }}>
          Découpage officiel Avalon Hill selon l'effectif
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
        {presets.map((b) => {
          const isSelected = activePresetId === b.id;
          const info = PRESET_INFO_FR[b.id] ?? { label: b.label, desc: b.rule };
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelect(b.id)}
              style={{
                textAlign: 'left',
                background: isSelected
                  ? 'linear-gradient(180deg, #422d16 0%, #291a0c 100%)'
                  : 'linear-gradient(180deg, #231b14 0%, #17110c 100%)',
                border: isSelected ? '1.5px solid #ffd23f' : '1px solid #4a341e',
                borderRadius: 6,
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                boxShadow: isSelected ? '0 0 10px rgba(255, 210, 63, 0.25)' : 'none',
                transition: 'all .15s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 13, color: isSelected ? '#ffd23f' : '#f0e6d2' }}>
                  {info.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: isSelected ? '#ffd23f' : '#382b1c',
                    color: isSelected ? '#000' : '#d2c4b0',
                  }}
                >
                  {b.tokensPerPlayer} pions
                </span>
              </div>
              <div style={{ fontSize: 11, color: isSelected ? '#e0d0b8' : '#8e8070', lineHeight: 1.3 }}>
                {info.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
