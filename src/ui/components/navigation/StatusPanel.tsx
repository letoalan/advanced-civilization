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
    <div className="civ-panel" style={{ width: '100%', boxSizing: 'border-box', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: civById.get(id)?.color, color: '#fff', padding: '3px 8px', borderRadius: 4, fontWeight: 800, fontSize: 13, letterSpacing: .5 }}>
        <span>{civById.get(id)?.name.toUpperCase()}</span>
        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
          AST {p.astSpace} · {epochs.find((e) => e.id === p.epoch)?.name}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, gap: 6, paddingTop: 2 }}>
        <div>
          <span className="civ-lbl" style={{ marginRight: 4 }}>RÉSERVE</span>
          <b title="Pions en stock">◾{p.stock}</b> <b title="Cités disponibles">🏛{p.citiesAvailable}</b> <b title="Navires disponibles">⛵{p.shipsAvailable}</b>
        </div>
        <div>
          <span className="civ-lbl" style={{ marginRight: 4 }}>PLATEAU</span>
          <b title="Pions sur plateau">◾{boardTokens}</b> <b title="Cités sur plateau">🏛{boardCities}</b>
        </div>
        <div>
          <span className="civ-lbl" style={{ marginRight: 4 }}>TRÉSOR</span>
          <b style={{ color: '#ffd23f' }}>💰{p.treasury}</b>
        </div>
      </div>
      {cals.length > 0 && (
        <div style={{ background: '#6e1d1d', border: '1px solid #c97', borderRadius: 4, padding: '3px 6px', marginTop: 2 }}>
          <div className="civ-lbl" style={{ color: '#ffd2d2', fontWeight: 800, fontSize: 10 }}>⚠ CALAMITÉS EN MAIN ({cals.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {cals.map((cid) => {
              const c = calamityById.get(cid);
              return (
                <span key={cid} style={{ fontSize: 10, background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 3, color: '#fff' }}>
                  {c?.name ?? cid}{c && !c.tradable ? ' (non éch.)' : ''}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
