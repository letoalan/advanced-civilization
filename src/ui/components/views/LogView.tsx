import { useState } from 'react';
import { civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';

export function logMsg(l: GameState['log'][number] | string): string {
  return typeof l === 'string' ? l : l.msg ?? l.kind;
}

const PHASE_SHORT: Record<string, string> = {
  taxation: 'tax', populationExpansion: 'grow', census: 'census', shipConstruction: 'ships',
  movement: 'move', conflict: 'conflict', cityConstruction: 'cities', removeSurplus: 'surplus',
  tradeAcquisition: 'cards', trade: 'trade', calamity: 'calamity', acquireAdvances: 'advances',
  astAdjustment: 'ast',
};

export function LogView({ state }: { state: GameState }) {
  const all = state.log ?? [];
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();
  const lines = q
    ? all.filter((l) => `${logMsg(l)} ${typeof l === 'string' ? '' : `${l.side ?? ''} ${l.kind} ${l.phase ?? ''}`}`.toLowerCase().includes(q))
    : all;

  return (
    <div style={{ padding: 16, color: '#eee' }}>
      <h2 style={{ marginTop: 0 }}>Journal des Événements (Log)</h2>
      <div className="civ-lbl" style={{ color: '#b9ad8e', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>Historique complet des décisions ({q ? `${lines.length} sur ${all.length}` : all.length} entrées).</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="filtrer (civ, zone, phase, §règle…)"
          style={{ background: 'rgba(0,0,0,0.35)', color: '#eee', border: '1px solid #5a5646', borderRadius: 4, padding: '2px 8px', fontSize: 12, width: 220 }}
        />
      </div>
      <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 4, padding: 10, fontSize: 12, lineHeight: 1.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', maxWidth: 980 }}>
        {lines.length === 0 && <span className="civ-lbl">{q ? '(aucun résultat)' : '(aucun événement)'}</span>}
        {[...lines].reverse().map((l, i) => {
          const e = typeof l === 'string' ? null : l;
          const side = e?.side ?? null;
          return (
            <div key={e?.seq ?? `legacy-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ color: '#6f6a5a', minWidth: 42, textAlign: 'right', userSelect: 'none' }}>#{e ? e.seq + 1 : '·'}</span>
              <span style={{ color: '#8a8570', minWidth: 74, userSelect: 'none', fontSize: 10 }}>
                {e ? `t${e.turn}·${PHASE_SHORT[e.phase ?? ''] ?? e.phase ?? ''}` : ''}
              </span>
              {side && <span style={{ color: civById.get(side)?.color ?? '#999', minWidth: 8, userSelect: 'none' }}>●</span>}
              <span style={{ whiteSpace: 'pre-wrap', flex: 1 }}>{logMsg(l)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
