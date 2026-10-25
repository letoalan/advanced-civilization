import { boardPresets, type BoardPreset } from '../../../engine/boards.js';

export function effectiveBoardPreset(numPlayers: number, presetId: string | null): BoardPreset {
  const presets = boardPresets(numPlayers);
  return presets.find((b) => b.id === presetId) ?? presets[0]!;
}

interface BoardPickerProps {
  numPlayers: number;
  presetId: string | null;
  onPick: (id: string) => void;
}

export function BoardPicker({ numPlayers, presetId, onPick }: BoardPickerProps) {
  const presets = boardPresets(numPlayers);
  const sel = effectiveBoardPreset(numPlayers, presetId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
      <div style={{ fontSize: 13, color: '#ffd23f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Plateau — {numPlayers} joueur{numPlayers > 1 ? 's' : ''}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', maxWidth: 700 }}>
        {presets.map((b) => (
          <button
            key={b.id}
            className={`civ-btn ${sel.id === b.id ? 'on' : ''}`}
            onClick={() => onPick(b.id)}
            title={b.rule === 'house' ? 'Toutes les nations et cartes (variante maison)' : `Règles ${b.rule} : ${b.tokensPerPlayer} pions par joueur`}
            style={{ fontWeight: sel.id === b.id ? 700 : 400, opacity: sel.id === b.id ? 1 : 0.7 }}
          >
            {sel.id === b.id ? '● ' : ''}
            {b.label} <span style={{ color: '#aaa' }}>· {b.tokensPerPlayer} pions{b.rule !== 'house' ? ` · ${b.rule}` : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
