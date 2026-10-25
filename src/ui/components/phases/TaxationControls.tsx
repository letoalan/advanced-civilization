import type { Action, GameState, PlayerId } from '../../../engine/types.js';

interface TaxationControlsProps {
  state: GameState;
  legal: Action[];
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function TaxationControls({ state, legal, actor, onApply }: TaxationControlsProps) {
  const rates = legal.filter((a) => a.type === 'setTaxRate') as Extract<Action, { type: 'setTaxRate' }>[];
  const cities = Object.values(state.areas).filter((a) => a.city === actor).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="civ-lbl">
        <b>Monnayage</b> — déterminez votre taux d'imposition (§32.421). Vous percevez <b>cités × taux</b> ({cities} cité{cities > 1 ? 's' : ''}) pions depuis votre réserve vers le trésor :
      </span>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {rates.map((r) => (
          <button className="civ-btn" key={r.rate} onClick={() => onApply(r)}>
            Taux {r.rate} → percevoir {cities * r.rate}
          </button>
        ))}
      </div>
    </div>
  );
}
