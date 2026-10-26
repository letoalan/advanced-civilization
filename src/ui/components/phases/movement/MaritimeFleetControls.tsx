import { areaById } from '../../../../data/index.js';
import type { MovementPlanner } from './movementTypes.js';

interface MaritimeFleetControlsProps {
  planner: MovementPlanner;
}

export function MaritimeFleetControls({ planner }: MaritimeFleetControlsProps) {
  const { playerShips, voyage, voyageInfo: vInfo, queuedVoyages, queued, removeQueuedVoyage, removeQueued } = planner;
  const name = (a: string) => areaById.get(a)?.name ?? a;

  const totalShips = playerShips.reduce((s, sh) => s + sh.count, 0);
  const availableShips = playerShips.reduce((s, sh) => s + sh.available, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Fleet Overview Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 26, 40, 0.85)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(92, 204, 255, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>⛵</span>
          <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 700, color: '#bfe4ff', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Flotte Navale Impériale
          </span>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
            ({availableShips}/{totalShips} navire{totalShips > 1 ? 's' : ''} disponible{totalShips > 1 ? 's' : ''})
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#90cdf4' }}>
          Capacité : 5 pions max par cale · Portée 4–5 zones
        </span>
      </div>

      {/* Ships Stations / Launch Buttons */}
      {!voyage && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {playerShips.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '6px 0' }}>
              Vous ne disposez d'aucun navire en mer ou à quai. Construisez des navires en Phase VII (Construction Navale).
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {playerShips.map((sh) => {
                const isWater = !!areaById.get(sh.area)?.isWater;
                return (
                  <button
                    key={sh.area}
                    className="glass-btn"
                    disabled={sh.available <= 0}
                    onClick={() => planner.startVoyageAt(sh.area)}
                    style={{
                      padding: '4px 10px',
                      fontSize: 11,
                      borderColor: sh.available > 0 ? '#5cf' : undefined,
                      color: sh.available > 0 ? '#e0f2fe' : 'var(--civ-stone-muted)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    title={sh.available > 0 ? `Lancer une expédition maritime depuis ${name(sh.area)}` : 'Ce navire a déjà une mission'}
                  >
                    <span>{isWater ? '🌊' : '⚓'}</span>
                    <b>{name(sh.area)}</b>
                    <span style={{ fontSize: 9, opacity: 0.8 }}>({sh.available} dispo)</span>
                    <span style={{ color: '#38bdf8', fontSize: 10 }}>➔ Naviguer</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Active Voyage Planner */}
      {voyage && vInfo && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: 'rgba(12, 20, 32, 0.95)', border: '1.5px solid #38bdf8', borderRadius: 8, padding: 10, boxShadow: '0 0 16px rgba(56, 189, 248, 0.15)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 6 }}>
            <span style={{ fontWeight: 800, color: '#bae6fd', fontSize: 12, textTransform: 'uppercase' }}>
              ⚓ Expédition en cours depuis {name(voyage[0]!.area)}
            </span>
            <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
              <span>Portée : <b style={{ color: vInfo.used < vInfo.range ? '#86efac' : '#fca5a5' }}>{vInfo.used}</b>/{vInfo.range} {vInfo.range === 5 ? '(Tissage)' : ''}</span>
              <span>Cale : <b style={{ color: '#38bdf8' }}>{vInfo.cargo}</b>/5</span>
            </div>
          </div>

          {/* Visual Cargo Hold Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16, 26, 40, 0.7)', padding: '4px 8px', borderRadius: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)', textTransform: 'uppercase' }}>Cale navale :</span>
            {Array.from({ length: 5 }).map((_, idx) => (
              <span key={idx} style={{ padding: '1px 5px', borderRadius: 3, fontSize: 10, fontWeight: 700, background: idx < vInfo.cargo ? '#0284c7' : 'rgba(255,255,255,0.08)', color: idx < vInfo.cargo ? '#fff' : 'rgba(255,255,255,0.2)' }}>
                {idx < vInfo.cargo ? '👤' : '▫'}
              </span>
            ))}
          </div>

          {/* Itinerary Stops */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 110, overflowY: 'auto' }} className="civ-custom-scrollbar">
            {voyage.map((st, i) => {
              const meta = areaById.get(st.area);
              const water = !!meta?.isWater;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, padding: '2px 6px', background: 'rgba(20, 30, 46, 0.6)', borderRadius: 4 }}>
                  <span style={{ width: 14, color: '#38bdf8', fontWeight: 700 }}>{i === 0 ? '⚓' : i}</span>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name(st.area)} {water ? '🌊' : '🏰'}
                  </span>
                  {!water && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)' }}>Emb. :</span>
                      <button className="glass-btn" style={{ padding: '0 4px', minWidth: 16 }} onClick={() => planner.setStopLoad(i, (st.load ?? 0) - 1)} disabled={!st.load}>−</button>
                      <b style={{ color: '#86efac' }}>{st.load ?? 0}</b>
                      <button className="glass-btn" style={{ padding: '0 4px', minWidth: 16 }} onClick={() => planner.setStopLoad(i, (st.load ?? 0) + 1)}>+</button>
                      {i > 0 && (
                        <>
                          <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', marginLeft: 4 }}>Déb. :</span>
                          <button className="glass-btn" style={{ padding: '0 4px', minWidth: 16 }} onClick={() => planner.setStopUnload(i, (st.unload ?? 0) - 1)} disabled={!st.unload}>−</button>
                          <b style={{ color: '#fca5a5' }}>{st.unload ?? 0}</b>
                          <button className="glass-btn" style={{ padding: '0 4px', minWidth: 16 }} onClick={() => planner.setStopUnload(i, (st.unload ?? 0) + 1)}>+</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {vInfo.cargo > 0 && (
            <span style={{ fontSize: 11, color: '#fca5a5', fontWeight: 600 }}>
              ⚠ {vInfo.cargo} pion{vInfo.cargo > 1 ? 's' : ''} à bord — débarquement requis sur la terre ferme avant la fin (§23.56).
            </span>
          )}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="glass-btn glass-btn--primary" onClick={planner.finishVoyage} disabled={!vInfo.canFinish} style={{ padding: '4px 12px', fontSize: 11 }} title={vInfo.canFinish ? undefined : 'Au moins 1 escale, cale vide et fin hors haute mer (§23.55/.56)'}>
              ✓ Valider cet itinéraire
            </button>
            <button className="glass-btn" onClick={planner.undoStop} disabled={voyage.length < 2} style={{ padding: '4px 8px', fontSize: 11 }}>↶ Annuler escale</button>
            <button className="glass-btn glass-btn--danger" onClick={planner.cancelVoyage} style={{ padding: '4px 8px', fontSize: 11 }}>Abandonner</button>
          </div>
        </div>
      )}

      {/* Queued Expeditions List */}
      {(queuedVoyages.length > 0 || queued.some((q) => q.byShip)) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
            Expéditions maritimes programmées ({queuedVoyages.length + queued.filter((q) => q.byShip).length}) :
          </span>
          {queuedVoyages.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '3px 8px', background: 'rgba(16, 26, 42, 0.75)', borderRadius: 4, border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: 11 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ⛵ {v.map((st) => `${name(st.area)}${st.load ? ` +${st.load}` : ''}${st.unload ? ` −${st.unload}` : ''}`).join(' ➔ ')}
              </span>
              <button className="glass-btn glass-btn--danger" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeQueuedVoyage(i)}>✕</button>
            </div>
          ))}
          {queued.filter((q) => q.byShip).map((q, i) => (
            <div key={`s-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '3px 8px', background: 'rgba(16, 26, 42, 0.75)', borderRadius: 4, border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: 11 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ⛵ {name(q.from)} ➔ {name(q.to)} ({q.count} pion{q.count > 1 ? 's' : ''})
              </span>
              <button className="glass-btn glass-btn--danger" style={{ padding: '1px 5px', fontSize: 9 }} onClick={() => removeQueued(planner.queued.indexOf(q))}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
