import { useState } from 'react';
import { areaById, CALAMITY_DESC } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface CityChoiceControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function CityChoiceControls({ state, legal, onApply }: CityChoiceControlsProps) {
  const c = state.pendingCityChoice!;
  const peek = useAreaPeek();
  const cities = Object.keys(state.areas).filter((a) => state.areas[a]!.city === c.holder);
  const suggested = (legal.find((x) => x.type === 'chooseCities') as Extract<Action, { type: 'chooseCities' }> | undefined)?.areas ?? [];
  const [sel, setSel] = useState<string[]>(suggested);

  const toggle = (aid: string) =>
    setSel((s) => (s.includes(aid) ? s.filter((x) => x !== aid) : s.length < c.count ? [...s, aid] : s));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {CALAMITY_DESC[c.calamityId] && (
        <span className="civ-lbl" style={{ color: '#cfc7b4' }}>
          ⚠ {CALAMITY_DESC[c.calamityId]}
        </span>
      )}
      <span className="civ-lbl">
        Choisissez <b>{c.count}</b> de vos cité{c.count > 1 ? 's' : ''} à réduire en ruines :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {cities.map((aid) => (
          <button
            key={aid}
            className={`civ-btn ${sel.includes(aid) ? 'on' : ''}`}
            style={{ fontSize: 11 }}
            {...peek(aid)}
            onClick={() => toggle(aid)}
          >
            {sel.includes(aid) ? '✗ ' : ''}
            {areaById.get(aid)?.name ?? aid}
            {areaById.get(aid)?.isCitySite ? ' ⬚' : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: sel.length === c.count ? '#7caa6a' : '#caa05a' }}>
          {sel.length} / {c.count} choisies
        </span>
        <button
          className="civ-btn"
          disabled={sel.length !== c.count}
          onClick={() => onApply({ type: 'chooseCities', areas: sel })}
        >
          Confirmer la réduction
        </button>
      </div>
    </div>
  );
}
