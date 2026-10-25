import { civById, calamityById, epochs } from '../../../data/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

interface StatusPanelProps {
  state: GameState;
  id: PlayerId;
}

export function StatusPanel({ state, id }: StatusPanelProps) {
  const p = state.players[id];
  if (!p) return null;

  let boardTokens = 0;
  let boardCities = 0;
  for (const a of Object.values(state.areas)) {
    boardTokens += a.tokens[id] ?? 0;
    if (a.city === id) boardCities += 1;
  }

  const Row = ({ label, vals }: { label: string; vals: [string, number][] }) => (
    <div>
      <div className="civ-lbl">{label}</div>
      <div style={{ display: 'flex', gap: 10, fontWeight: 800 }}>
        {vals.map(([t, n]) => (
          <span key={t}>
            {t}
            {n}
          </span>
        ))}
      </div>
    </div>
  );

  const cals = Object.entries(p.hand)
    .filter(([c, n]) => c.startsWith('calamity:') && n > 0)
    .map(([c]) => c.slice(9));

  return (
    <div className="civ-panel" style={{ width: 150, padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ background: civById.get(id)?.color, color: '#fff', textAlign: 'center', fontWeight: 800, padding: 2, borderRadius: 3 }}>
        {civById.get(id)?.name.toUpperCase()}
      </div>
      <Row label="EN RÉSERVE" vals={[['◾', p.stock], ['🏛', p.citiesAvailable], ['⛵', p.shipsAvailable]]} />
      <Row label="SUR PLATEAU" vals={[['◾', boardTokens], ['🏛', boardCities]]} />
      <Row label="TRÉSOR" vals={[['💰', p.treasury]]} />
      <div className="civ-lbl">
        Case AST {p.astSpace} · {epochs.find((e) => e.id === p.epoch)?.name}
      </div>
      {cals.length > 0 && (
        <div style={{ background: '#7a2a2a', border: '1px solid #c97', borderRadius: 3, padding: 4 }}>
          <div className="civ-lbl" style={{ color: '#ffd2d2', fontWeight: 800 }}>⚠ CALAMITÉS EN MAIN</div>
          {cals.map((cid) => {
            const c = calamityById.get(cid);
            return (
              <div key={cid} style={{ fontSize: 11, color: '#fff' }}>
                {c?.name ?? cid}
                {c && !c.tradable ? ' · non échangeable' : ' · échangeable'}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
