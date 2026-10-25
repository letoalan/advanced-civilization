import { civById, calamityById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';

/**
 * Affiche la file des calamités à résoudre ce tour après la phase de commerce (§29.3/.6).
 */
export function UpcomingCalamities({ state }: { state: GameState }) {
  const q = state.calamityQueue ?? [];
  if (!q.length) return null;

  return (
    <div className="civ-msg" style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(120,42,42,0.35)' }}>
      ⚠ À résoudre ce tour :{' '}
      {q.map((c, i) => (
        <span key={i}>
          {i ? ' · ' : ''}
          <b>{calamityById.get(c.calamity)?.name ?? c.calamity}</b> →{' '}
          <span style={{ color: civById.get(c.holder)?.color }}>
            {civById.get(c.holder)?.name ?? c.holder}
          </span>
        </span>
      ))}{' '}
      <span className="civ-lbl">(toutes les calamités sont révélées en fin de commerce, §29.3)</span>
    </div>
  );
}
