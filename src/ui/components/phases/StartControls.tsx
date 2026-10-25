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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#ffd23f' }}>
          Zones de départ disponibles ({starts.length}) :
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {starts.map((a) => {
            const area = areaById.get(a.area);
            const isSel = selectedArea === a.area;
            return (
              <button
                key={a.area}
                className={`civ-btn ${isSel ? 'on' : ''}`}
                style={{ padding: '8px 10px', fontSize: 12, textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                {...peek(a.area)}
                onClick={() => onApply(a)}
                title={`Capacité limite ${area?.sustains ?? '?'}${area?.isCitySite ? ' · site de cité' : ''}`}
              >
                <span>🏁 <b>{area?.name ?? a.area}</b></span>
                <span style={{ fontSize: 10, opacity: 0.85 }}>
                  Capacité {area?.sustains ?? '?'}{area?.isCitySite ? ' · 🏛 Cité' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
