import { useState } from 'react';
import { civById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';

interface AllocationControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function AllocationControls({ state, legal, onApply }: AllocationControlsProps) {
  const a = state.pendingAllocation!;
  const rivals = Object.keys(a.caps);
  const maxTotal = Math.min(
    a.pool,
    rivals.reduce((t, v) => t + a.caps[v]!, 0),
  );
  const suggested = (legal.find((x) => x.type === 'allocateLoss') as Extract<Action, { type: 'allocateLoss' }> | undefined)?.allocation ?? {};
  const [alloc, setAlloc] = useState<Record<string, number>>(suggested);
  const total = rivals.reduce((t, v) => t + (alloc[v] ?? 0), 0);
  const unit = a.kind === 'cities' ? 'cités' : 'points de population';

  const set = (v: string, d: number) =>
    setAlloc((s) => {
      const cur = s[v] ?? 0;
      const next = Math.max(0, Math.min(a.caps[v]!, cur + d));
      const others = total - cur;
      if (others + next > maxTotal) return s;
      return { ...s, [v]: next };
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl" style={{ color: '#e6b85a' }}>
        §29.64 — en tant que victime principale, vous répartissez les pertes secondaires :
      </span>
      <span className="civ-lbl">
        Infligez <b>{maxTotal} {unit}</b> de pertes aux rivaux (max {a.kind === 'cities' ? '' : `${a.pool === 20 ? 8 : 10} `}par nation) :
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {rivals.map((v) => (
          <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 90, color: civById.get(v)?.color, fontWeight: 700 }}>{civById.get(v)?.name}</span>
            <button className="civ-btn" style={{ padding: '0 8px' }} onClick={() => set(v, -1)}>−</button>
            <b style={{ width: 24, textAlign: 'center' }}>{alloc[v] ?? 0}</b>
            <button className="civ-btn" style={{ padding: '0 8px' }} onClick={() => set(v, +1)}>+</button>
            <span className="civ-lbl" style={{ color: '#9a8d6a' }}>/ {a.caps[v]} max</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: total === maxTotal ? '#7caa6a' : '#caa05a' }}>
          Réparti : {total} / {maxTotal}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="civ-btn" onClick={() => setAlloc(suggested)}>Cibler le meneur</button>
          <button className="civ-btn" disabled={total !== maxTotal} onClick={() => onApply({ type: 'allocateLoss', allocation: alloc })}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
