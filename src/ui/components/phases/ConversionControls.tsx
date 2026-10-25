import { areaById, civById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';

interface ConversionControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function ConversionControls({ state, legal, onApply }: ConversionControlsProps) {
  const converts = legal.filter((a) => a.type === 'convertArea') as Extract<Action, { type: 'convertArea' }>[];

  const desc = (aid: string) => {
    const a = state.areas[aid];
    const nm = areaById.get(aid)?.name ?? aid;
    const victim = a?.city && a.city in state.players ? a.city : Object.keys(a?.tokens ?? {}).find((o) => o in state.players);
    const cityHere = a?.city && a.city in state.players;
    const toks = victim ? a?.tokens[victim] ?? 0 : 0;
    return `${nm} — ${cityHere ? 'cité' : ''}${cityHere && toks ? ' + ' : ''}${toks ? `${toks} pion${toks > 1 ? 's' : ''}` : ''} de ${civById.get(victim ?? '')?.name ?? victim}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        <b>Monothéisme</b> (§32.94) — convertissez <i>une</i> zone ennemie adjacente, en remplaçant ses pièces par les vôtres (depuis votre réserve) :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {converts.map((c) => (
          <button key={c.area} className="civ-btn" style={{ fontSize: 11 }} onClick={() => onApply(c)}>
            ✝ Convertir {desc(c.area)}
          </button>
        ))}
      </div>
      <button className="civ-btn" onClick={() => onApply({ type: 'pass' })}>
        Ne pas convertir (passer)
      </button>
    </div>
  );
}
