import { areaById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface SupportControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function SupportControls({ state, legal, onApply }: SupportControlsProps) {
  const sup = state.pendingSupport!;
  const peek = useAreaPeek();
  const suggested = (legal.find((a) => a.type === 'chooseCities') as Extract<Action, { type: 'chooseCities' }> | undefined)?.areas[0];
  const cities = Object.values(state.areas).filter((a) => a.city === sup.holder).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        {sup.mode === 'slaverevolt' ? '⛓ Révolte d’esclaves' : '🏛 Soutien des cités'} — vous ne pouvez soutenir l'ensemble de vos cités ({cities}). Choisissez une cité à réduire{sup.candidates.length < cities ? ' parmi les cités récemment construites (§26.32)' : ''} :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {sup.candidates.map((aid) => (
          <button
            key={aid}
            className={`civ-btn ${suggested === aid ? 'on' : ''}`}
            style={{ fontSize: 11 }}
            {...peek(aid)}
            onClick={() => onApply({ type: 'chooseCities', areas: [aid] })}
          >
            {areaById.get(aid)?.name ?? aid}
            {areaById.get(aid)?.isCitySite ? ' (site)' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
