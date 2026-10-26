import { commodityById } from '../../../../data/index.js';

interface WantsPickerProps {
  wants: string[];
  onToggleWant: (c: string) => void;
  commodityOrder: string[];
  cName: (c: string) => string;
}

export function WantsPicker({ wants, onToggleWant, commodityOrder, cName }: WantsPickerProps) {
  return (
    <div style={{ marginTop: 2 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 700, textTransform: 'uppercase' }}>
          Marchandises souhaitées (1–5) : {wants.map(cName).join(', ') || '—'}
        </span>
        <span style={{ fontSize: 10, color: wants.length >= 1 ? '#86efac' : '#f87171' }}>
          {wants.length}/5 sélectionnée{wants.length > 1 ? 's' : ''}
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {commodityOrder.map((c) => {
          const sel = wants.includes(c);
          const comm = commodityById.get(c);
          return (
            <button
              key={c}
              className={`glass-btn ${sel ? 'glass-btn--primary' : ''}`}
              style={{
                padding: '3px 7px',
                fontSize: 10,
                borderColor: sel ? 'var(--civ-gold-base)' : 'var(--civ-stone-hairline)',
                background: sel ? undefined : 'rgba(20, 26, 36, 0.65)',
              }}
              onClick={() => onToggleWant(c)}
            >
              {comm?.name} (P{comm?.stack})
            </button>
          );
        })}
      </div>
    </div>
  );
}
