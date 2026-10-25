import { useState, useEffect } from 'react';
import { areaById } from '../../../../data/index.js';
import type { MovementPlanner } from './movementTypes.js';

interface MovementControlsProps {
  planner: MovementPlanner;
}

export function MovementControls({ planner }: MovementControlsProps) {
  const { origin, count, queued, available, setCount, removeQueued, undoLast, commit, pass, surplusWarnings } = planner;
  const cap = origin ? available(origin) : 0;
  const name = (a: string) => areaById.get(a)?.name ?? a;
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setConfirming(false);
  }, [queued]);

  const finish = () => {
    if (surplusWarnings.length && !confirming) {
      setConfirming(true);
      return;
    }
    if (queued.length || planner.queuedVoyages.length) commit();
    else pass();
  };

  const voyage = planner.voyage;
  const vInfo = planner.voyageInfo;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {voyage && vInfo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="civ-lbl">
            ⛵ <b>Voyage maritime</b> depuis <b>{name(voyage[0]!.area)}</b> — cliquez sur les zones en surbrillance pour ajouter des étapes.
            {' '}Zones parcourues : <b>{vInfo.used}</b>/{vInfo.range}{vInfo.range === 5 ? ' (Tissage)' : ''} · à bord : <b>{vInfo.cargo}</b>/5
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
            {voyage.map((st, i) => {
              const meta = areaById.get(st.area);
              const water = !!meta?.isWater;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 14, textAlign: 'right', color: '#8a8570' }}>{i === 0 ? '⚓' : i}</span>
                  <span style={{ minWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name(st.area)}
                    {water ? ' 〜' : ''}
                  </span>
                  {!water && (
                    <>
                      <span className="civ-lbl">embarquer</span>
                      <button className="civ-btn" style={{ padding: '0 5px' }} onClick={() => planner.setStopLoad(i, (st.load ?? 0) - 1)} disabled={!st.load}>−</button>
                      <b>{st.load ?? 0}</b>
                      <button className="civ-btn" style={{ padding: '0 5px' }} onClick={() => planner.setStopLoad(i, (st.load ?? 0) + 1)}>+</button>
                      {i > 0 && (
                        <>
                          <span className="civ-lbl" style={{ marginLeft: 6 }}>débarquer</span>
                          <button className="civ-btn" style={{ padding: '0 5px' }} onClick={() => planner.setStopUnload(i, (st.unload ?? 0) - 1)} disabled={!st.unload}>−</button>
                          <b>{st.unload ?? 0}</b>
                          <button className="civ-btn" style={{ padding: '0 5px' }} onClick={() => planner.setStopUnload(i, (st.unload ?? 0) + 1)}>+</button>
                        </>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {vInfo.cargo > 0 && (
            <span className="civ-lbl" style={{ color: '#e0b060' }}>
              ⚠ {vInfo.cargo} pion{vInfo.cargo === 1 ? '' : 's'} encore à bord — tout pion doit débarquer sur la terre ferme avant la fin du voyage (§23.56).
            </span>
          )}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button className="civ-btn" onClick={planner.finishVoyage} disabled={!vInfo.canFinish} title={vInfo.canFinish ? undefined : 'Au moins 1 escale requise, cale vide et fin hors haute mer (§23.55/.56)'}>
              ✓ Terminer l'itinéraire
            </button>
            <button className="civ-btn" onClick={planner.undoStop} disabled={voyage.length < 2}>↶ Annuler escale</button>
            <button className="civ-btn" onClick={planner.cancelVoyage}>Abandonner voyage</button>
          </div>
        </div>
      ) : !origin ? (
        <span className="civ-lbl">
          Cliquez sur une zone contenant vos pions comme point de <b>départ</b>. Les déplacements planifiés apparaissent en pointillés et ne sont définitifs qu'à la validation.
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="civ-lbl">
            Depuis <b>{name(origin)}</b> — réglez le nombre de pions puis cliquez sur une destination :
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <button className="civ-btn" onClick={() => setCount(count - 1)} disabled={count <= 1}>−</button>
            <input type="range" min={1} max={Math.max(1, cap)} value={count} onChange={(e) => setCount(+e.target.value)} style={{ width: 120 }} />
            <button className="civ-btn" onClick={() => setCount(count + 1)} disabled={count >= cap}>+</button>
            <b>{count}</b> <span className="civ-lbl">sur {cap}</span>
            <button className="civ-btn" onClick={() => setCount(cap)}>Tous</button>
            <button className="civ-btn" onClick={() => planner.onBoardClick(origin)}>Annuler</button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {planner.destinations.map((d) => (
              <button
                className="civ-btn"
                key={d.to}
                onClick={() => planner.onBoardClick(d.to)}
                style={d.byShip ? { borderColor: '#5cf', color: '#cfe8ff' } : undefined}
                title={d.byShip ? 'Embarquer ces pions sur votre navire et naviguer vers cette zone' : undefined}
              >
                {d.byShip ? `⛵ Embarquer → ${name(d.to)}` : `→ ${name(d.to)}`}
              </button>
            ))}
          </div>
          {planner.shipsAt(origin) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button className="civ-btn" style={{ borderColor: '#5cf', color: '#cfe8ff' }} onClick={planner.startVoyage}>
                ⛵ Planifier un voyage (cabotage à escales)
              </button>
            </div>
          )}
          {planner.embarkHint && <span className="civ-lbl" style={{ color: '#e0b060' }}>⚓ Pas d'embarquement ici : {planner.embarkHint}</span>}
        </div>
      )}

      {planner.queuedVoyages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="civ-lbl">Voyages maritimes planifiés ({planner.queuedVoyages.length}) :</span>
          {planner.queuedVoyages.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
              <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ⛵ {v.map((st) => `${name(st.area)}${st.load ? ` +${st.load}` : ''}${st.unload ? ` −${st.unload}` : ''}`).join(' → ')}
              </span>
              <button className="civ-btn" style={{ padding: '0 6px', lineHeight: '18px' }} onClick={() => planner.removeQueuedVoyage(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {queued.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minHeight: 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="civ-lbl">Mouvements planifiés ({queued.length}) :</span>
            <button className="civ-btn" onClick={undoLast}>↶ Défaire</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '2px 8px', maxHeight: 96, overflowY: 'auto', paddingRight: 4 }}>
            {queued.map((q, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {q.byShip ? '⛵ ' : ''}{name(q.from)} → {name(q.to)} ({q.count})
                </span>
                <button className="civ-btn" style={{ padding: '0 6px', lineHeight: '18px' }} onClick={() => removeQueued(i)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirming && (
        <div className="civ-msg" style={{ padding: '6px 10px', border: '1px solid #c9a24a', background: 'rgba(120,90,30,0.35)', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <b style={{ color: '#ffd98a' }}>⚠ Excédent de population — des pions seront perdus</b>
          {surplusWarnings.map((w) => (
            <span key={w.area}>
              <b>{w.name}</b> : {w.tokens} pions, mais {w.keep} seulement {w.canBuild ? 'suffisent à fonder la cité' : 'peuvent subsister'} — <b style={{ color: '#ffb0b0' }}>{w.lost} perdus</b>.
            </span>
          ))}
          <span className="civ-lbl">Redéployez-les ou confirmez pour terminer quand même.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4 }}>
        <button className="civ-btn" onClick={finish}>
          {confirming
            ? 'Terminer malgré les pertes'
            : (queued.length + planner.queuedVoyages.length)
            ? `Valider les déplacements (${queued.length + planner.queuedVoyages.length})`
            : 'Terminer sans déplacement'}
        </button>
        {confirming && <button className="civ-btn" onClick={() => setConfirming(false)}>↩ Poursuivre le mouvement</button>}
      </div>
    </div>
  );
}
