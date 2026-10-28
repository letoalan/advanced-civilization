import { useState } from 'react';
import { civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import { useTranslation } from '../../i18n/index.js';

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
  const { t } = useTranslation();
  const all = state.log ?? [];
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();
  const lines = q
    ? all.filter((l) => `${logMsg(l)} ${typeof l === 'string' ? '' : `${l.side ?? ''} ${l.kind} ${l.phase ?? ''}`}`.toLowerCase().includes(q))
    : all;

  return (
    <div style={{ color: 'var(--civ-marble)' }}>
      <h2 style={{ marginTop: 0, fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, color: 'var(--civ-gold-light)', fontSize: 17, textTransform: 'uppercase' }}>
        {t.views.log.title}
      </h2>
      <div className="civ-lbl" style={{ color: 'var(--civ-stone-muted)', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>{t.views.log.desc(lines.length, all.length)}</span>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t.views.log.placeholder}
          style={{ background: 'rgba(20, 26, 36, 0.85)', color: 'var(--civ-marble)', border: '1px solid var(--civ-gold-border-subtle)', borderRadius: 6, padding: '4px 10px', fontSize: 11, width: 240 }}
        />
      </div>
      <div style={{ background: 'rgba(12, 16, 22, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 14, fontSize: 12, lineHeight: 1.7, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', maxWidth: 980 }}>
        {lines.length === 0 && <span className="civ-lbl">{q ? t.views.log.noResult : t.views.log.noEvent}</span>}
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
