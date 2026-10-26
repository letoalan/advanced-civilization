import { useState, useEffect } from 'react';
import type { MovementPlanner } from './movementTypes.js';
import { ContinentalMovementControls } from './ContinentalMovementControls.js';
import { MaritimeFleetControls } from './MaritimeFleetControls.js';

interface MovementControlsProps {
  planner: MovementPlanner;
}

export function MovementControls({ planner }: MovementControlsProps) {
  const { queued, queuedVoyages, commit, pass, surplusWarnings, voyage, playerShips } = planner;
  const [mode, setMode] = useState<'continental' | 'maritime'>('continental');
  const [confirming, setConfirming] = useState(false);

  // If a maritime voyage is initiated, automatically switch mode to maritime
  useEffect(() => {
    if (voyage) setMode('maritime');
  }, [voyage]);

  useEffect(() => {
    setConfirming(false);
  }, [queued, queuedVoyages]);

  const finish = () => {
    if (surplusWarnings.length && !confirming) {
      setConfirming(true);
      return;
    }
    if (queued.length || queuedVoyages.length) commit();
    else pass();
  };

  const totalMoves = queued.length + queuedVoyages.length;
  const landCount = queued.filter((q) => !q.byShip).length;
  const seaCount = queuedVoyages.length + queued.filter((q) => q.byShip).length;
  const totalShips = playerShips.reduce((s, sh) => s + sh.count, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Mode Selector Tabs: Continental vs Maritime */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--civ-gold-border-subtle)', paddingBottom: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`glass-btn ${mode === 'continental' ? 'glass-btn--primary' : ''}`}
            onClick={() => setMode('continental')}
            style={{ padding: '4px 12px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>🚶 Mouvements Continentaux</span>
            {landCount > 0 && <span style={{ background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: 10, fontSize: 10 }}>{landCount}</span>}
          </button>
          <button
            className={`glass-btn ${mode === 'maritime' ? 'glass-btn--primary' : ''}`}
            onClick={() => setMode('maritime')}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderColor: mode === 'maritime' ? '#38bdf8' : undefined,
            }}
          >
            <span>⛵ Flotte & Expéditions Maritimes</span>
            {totalShips > 0 && <span style={{ background: 'rgba(2, 132, 199, 0.4)', padding: '1px 5px', borderRadius: 10, fontSize: 10, color: '#bae6fd' }}>{totalShips} nav.</span>}
            {seaCount > 0 && <span style={{ background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: 10, fontSize: 10 }}>{seaCount}</span>}
          </button>
        </div>

        <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
          Total planifié : <b style={{ color: totalMoves > 0 ? '#86efac' : 'var(--civ-marble)' }}>{totalMoves}</b> opération{totalMoves > 1 ? 's' : ''}
        </span>
      </div>

      {/* Mode-specific content */}
      <div style={{ minHeight: 120 }}>
        {mode === 'continental' ? (
          <ContinentalMovementControls planner={planner} />
        ) : (
          <MaritimeFleetControls planner={planner} />
        )}
      </div>

      {/* Surplus Warning Alert */}
      {confirming && (
        <div style={{ padding: '8px 12px', border: '1px solid #c9a24a', background: 'rgba(120, 90, 30, 0.45)', borderRadius: 6, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <b style={{ color: '#ffd98a' }}>⚠ Excédent de population constaté après mouvements</b>
          {surplusWarnings.map((w) => (
            <span key={w.area}>
              <b>{w.name}</b> : {w.tokens} pions, mais {w.keep} seulement {w.canBuild ? 'suffisent à fonder la cité' : 'peuvent subsister'} — <b style={{ color: '#ffb0b0' }}>{w.lost} perdus</b>.
            </span>
          ))}
          <span style={{ color: 'var(--civ-parchment)', fontStyle: 'italic' }}>
            Ajustez vos mouvements terrestres ou navals, ou confirmez ci-dessous pour valider malgré les pertes.
          </span>
        </div>
      )}

      {/* Final Action Bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          className={`glass-btn ${totalMoves > 0 || confirming ? 'glass-btn--primary' : ''}`}
          onClick={finish}
          style={{ padding: '7px 18px', fontSize: 11, fontWeight: 700 }}
        >
          {confirming
            ? 'Terminer malgré les pertes'
            : totalMoves > 0
            ? `Valider les déplacements (${totalMoves}) ➔`
            : 'Terminer sans déplacement ➔'}
        </button>
        {confirming && (
          <button className="glass-btn" onClick={() => setConfirming(false)} style={{ padding: '7px 12px', fontSize: 11 }}>
            ↩ Poursuivre le mouvement
          </button>
        )}
      </div>
    </div>
  );
}
