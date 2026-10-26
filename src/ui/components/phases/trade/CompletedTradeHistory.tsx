import { civById } from '../../../../data/index.js';
import { bundleFace } from '../../../../engine/helpers.js';
import type { CompletedTrade, PlayerId } from '../../../../engine/types.js';
import { VisualBundleFace } from './VisualBundleFace.js';

interface CompletedTradeHistoryProps {
  completed: CompletedTrade[];
  actor: PlayerId;
  chips: (m: Record<string, number>) => string;
}

export function CompletedTradeHistory({ completed, actor, chips }: CompletedTradeHistoryProps) {
  const relevant = completed.filter((d) => d.a === actor || d.b === actor);
  if (relevant.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {relevant.map((d, i) => {
        const youAreA = d.a === actor;
        const gave = youAreA ? d.aGave : d.bGave;
        const got = youAreA ? d.bGave : d.aGave;
        const partner = youAreA ? d.b : d.a;
        const face = bundleFace(got);
        const said: Record<string, number> = { ...face.guaranteed };
        for (const [c, k] of Object.entries(face.claimed)) said[c] = (said[c] ?? 0) + k;
        const bluff: Record<string, number> = {};
        for (const [c, k] of Object.entries(got.actual)) {
          if (k > (said[c] ?? 0)) bluff[c] = k - (said[c] ?? 0);
        }
        return (
          <div
            key={i}
            style={{
              padding: '8px 12px',
              fontSize: 11,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'rgba(16, 21, 28, 0.9)',
              border: '1px solid var(--civ-gold-border-subtle)',
              borderRadius: 8,
              boxShadow: 'var(--civ-glass-shadow)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
              <div>
                <span style={{ color: '#86efac', fontWeight: 700 }}>✓ Accord scellé avec </span>
                <b style={{ color: civById.get(partner)?.color ?? 'var(--civ-gold-light)' }}>{civById.get(partner)?.name}</b> :
              </div>
              {Object.keys(bluff).length > 0 && (
                <span style={{ color: '#f87171', fontSize: 10, fontStyle: 'italic' }}>
                  ({civById.get(partner)?.name} a bluffé : {chips(bluff)})
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Cédé :</span>
                <VisualBundleFace b={gave} actual={gave.actual} />
              </div>
              <span style={{ fontSize: 18, color: 'var(--civ-gold-base)' }}>⇄</span>
              <div>
                <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Reçu :</span>
                <VisualBundleFace b={got} actual={got.actual} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
