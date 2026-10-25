import type { Action, GameState, PlayerId } from '../../../engine/types.js';

interface NinthStackControlsProps {
  state: GameState;
  legal: Action[];
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function NinthStackControls({ state, legal, actor, onApply }: NinthStackControlsProps) {
  const buys = legal.filter((a) => a.type === 'buyTradeCard') as Extract<Action, { type: 'buyTradeCard' }>[];
  const p = state.players[actor]!;
  const left = state.trade.stacks[9]?.length ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        💰 Vous venez de collecter vos cartes. Vous pouvez <b>acheter dans la 9e pile (Or/Ivoire)</b> à raison de 18 trésors par carte (§27.51). Trésor disponible : <b>{p.treasury}</b> · cartes restantes en pile : <b>{left}</b>.
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {buys.map((b) => (
          <button key={b.count} className="civ-btn" onClick={() => onApply(b)}>
            Acheter {b.count} carte{b.count > 1 ? 's' : ''} ({18 * b.count})
          </button>
        ))}
        <button className="civ-btn" onClick={() => onApply({ type: 'pass' })}>
          Ne pas acheter (passer)
        </button>
      </div>
    </div>
  );
}
