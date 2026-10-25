import { areaById, civById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface StartControlsProps {
  state: GameState;
  legal: Action[];
  selectedArea: string | null;
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function StartControls({ state, legal, selectedArea, actor, onApply }: StartControlsProps) {
  const peek = useAreaPeek();
  const starts = legal.filter((a) => a.type === 'placeStart') as Extract<Action, { type: 'placeStart' }>[];
  const after = state.pendingStart!.order.slice(1);
  const placed = Object.entries(state.areas).flatMap(([aid, a]) =>
    Object.entries(a.tokens)
      .filter(([owner, k]) => owner !== actor && k > 0)
      .map(([owner]) => ({ owner, aid })),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        🏁 Choisissez votre <b>zone de départ</b> — votre premier pion y sera posé (§16.3).
        {after.length ? <> Ordre de tirage au sort ; restants après vous : {after.map((id) => civById.get(id)?.name ?? id).join(', ')}</> : ''}.
      </span>
      {placed.length > 0 && (
        <span className="civ-lbl">
          Déjà positionnés :{' '}
          {placed.map(({ owner, aid }, i) => (
            <span key={owner}>
              {i ? ', ' : ''}
              <b style={{ color: civById.get(owner)?.color }}>{civById.get(owner)?.name}</b> à {areaById.get(aid)?.name ?? aid}
            </span>
          ))}
        </span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {starts.map((a) => {
          const area = areaById.get(a.area);
          return (
            <button
              key={a.area}
              className={`civ-btn ${selectedArea === a.area ? 'on' : ''}`}
              {...peek(a.area)}
              onClick={() => onApply(a)}
              title={`Capacité limite ${area?.sustains ?? '?'}${area?.isCitySite ? ' · site de cité' : ''}`}
            >
              Partir de {area?.name ?? a.area} · max {area?.sustains ?? '?'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
