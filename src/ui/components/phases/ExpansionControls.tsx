import { areaById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface ExpansionControlsProps {
  state: GameState;
  legal: Action[];
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function ExpansionControls({ state, legal, actor, onApply }: ExpansionControlsProps) {
  const peek = useAreaPeek();
  const places = legal.filter((a) => a.type === 'placeTokens') as Extract<Action, { type: 'placeTokens' }>[];
  const rem = state.expansion?.remaining[actor] ?? 0;
  const reset = legal.find((a) => a.type === 'resetPlacement');
  const pass = legal.find((a) => a.type === 'pass');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rem > 0 ? (
        <span className="civ-lbl">
          Réserve insuffisante pour une croissance complète — choisissez <b>où</b> placer vos <b>{rem}</b> dernier{rem > 1 ? 's' : ''} pion{rem > 1 ? 's' : ''} (§20.2) : <b>cliquez sur une zone du plateau</b> ou un bouton ci-dessous.
        </span>
      ) : (
        <span className="civ-lbl">Tous vos pions ont été déployés. Cliquez sur <b>Terminer l'expansion</b> pour confirmer.</span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {places.map((b, i) => {
          const aid = Object.keys(b.placements)[0]!;
          return (
            <button className="civ-btn" key={i} {...peek(aid)} onClick={() => onApply(b)}>
              +1 {areaById.get(aid)?.name}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {reset && (
          <button className="civ-btn" title="Reprendre tous les pions placés ce tour" onClick={() => onApply(reset)}>
            ↺ Réinitialiser le placement
          </button>
        )}
        {pass && (
          <button className="civ-btn" onClick={() => onApply(pass)}>
            Terminer l'expansion
          </button>
        )}
      </div>
    </div>
  );
}
