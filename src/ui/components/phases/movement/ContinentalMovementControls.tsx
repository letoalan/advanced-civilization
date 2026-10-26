import { areaById } from '../../../../data/index.js';
import type { MovementPlanner } from './movementTypes.js';

interface ContinentalMovementControlsProps {
  planner: MovementPlanner;
}

export function ContinentalMovementControls({ planner }: ContinentalMovementControlsProps) {
  const { origin, count, queued, available, setCount, removeQueued, undoLast } = planner;
  const cap = origin ? available(origin) : 0;
  const name = (a: string) => areaById.get(a)?.name ?? a;

  const landQueued = queued.filter((q) => !q.byShip);
  const landDests = planner.destinations.filter((d) => !d.byShip);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {!origin ? (
        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '4px 0' }}>
          Cliquez sur une province continentale sur la carte contenant vos pions pour initier une marche terrestre.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(16, 21, 28, 0.75)', border: '1px solid var(--civ-gold-border-subtle)', borderRadius: 8, padding: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 700, textTransform: 'uppercase' }}>
              Départ de {name(origin)} ({cap} pion{cap > 1 ? 's' : ''} dispo) :
            </span>
            <button className="glass-btn" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => planner.onBoardClick(origin)}>
              ✕ Annuler sélection
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button className="glass-btn" style={{ padding: '2px 8px' }} onClick={() => setCount(count - 1)} disabled={count <= 1}>−</button>
            <input type="range" min={1} max={Math.max(1, cap)} value={count} onChange={(e) => setCount(+e.target.value)} style={{ width: 110 }} />
            <button className="glass-btn" style={{ padding: '2px 8px' }} onClick={() => setCount(count + 1)} disabled={count >= cap}>+</button>
            <b style={{ color: 'var(--civ-gold-light)', fontSize: 12 }}>{count}</b>
            <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>/ {cap}</span>
            <button className="glass-btn" style={{ padding: '2px 8px', fontSize: 10 }} onClick={() => setCount(cap)}>Tous</button>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Destinations continentales adjacentes :
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {landDests.length === 0 && (
                <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic' }}>
                  Aucune province terrestre adjacente disponible.
                </span>
              )}
              {landDests.map((d) => (
                <button
                  key={d.to}
                  className="glass-btn"
                  onClick={() => planner.onBoardClick(d.to)}
                  style={{ padding: '3px 8px', fontSize: 11 }}
                >
                  ➔ {name(d.to)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Queued Land Marches */}
      {landQueued.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 700, textTransform: 'uppercase' }}>
              Marches terrestres planifiées ({landQueued.length}) :
            </span>
            <button className="glass-btn" style={{ padding: '2px 6px', fontSize: 10 }} onClick={undoLast}>↶ Défaire</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 4, maxHeight: 90, overflowY: 'auto' }} className="civ-custom-scrollbar">
            {queued.map((q, i) => {
              if (q.byShip) return null;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '3px 8px', background: 'rgba(20, 26, 36, 0.75)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)', fontSize: 11 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    🚶 {name(q.from)} ➔ {name(q.to)} (<b>{q.count}</b>)
                  </span>
                  <button className="glass-btn glass-btn--danger" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeQueued(i)}>✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
