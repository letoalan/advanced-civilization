import { areaById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface PillageControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function PillageControls({ state, legal, onApply }: PillageControlsProps) {
  const pl = state.pendingPillage![0]!;
  const peek = useAreaPeek();
  const counts = (legal.filter((a) => a.type === 'pillage') as Extract<Action, { type: 'pillage' }>[])
    .map((a) => a.count)
    .sort((a, b) => b - a);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        💰 <b>Pillage</b> — vous avez pris la cité de <b {...peek(pl.area)}>{areaById.get(pl.area)?.name ?? pl.area}</b>. Vous pouvez transférer <b>jusqu'à {pl.taken}</b> pion{pl.taken > 1 ? 's' : ''} de votre réserve vers votre trésor (§24.52) :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {counts.map((n) => (
          <button
            key={n}
            className={`civ-btn ${n === pl.taken ? 'on' : ''}`}
            onClick={() => onApply({ type: 'pillage', count: n })}
          >
            {n === 0 ? 'Ne rien piller' : `Piller ${n} pion${n > 1 ? 's' : ''}`}
          </button>
        ))}
      </div>
    </div>
  );
}
