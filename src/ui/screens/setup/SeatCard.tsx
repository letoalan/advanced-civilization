import { civilizations } from '../../../data/index.js';
import { unavailableReason, type BoardPreset } from '../../../engine/boards.js';
import type { LocalSeat } from '../../../local/types.js';
import { getCivNameFr, translateReason } from './setupTranslations.js';

interface SeatCardProps {
  idx: number;
  seat: LocalSeat;
  allSeats: LocalSeat[];
  activePreset: BoardPreset;
  allowedCivs: Set<string>;
  onUpdate: (idx: number, patch: Partial<LocalSeat>) => void;
  onCivChange: (idx: number, newCivId: string) => void;
}

export function SeatCard({
  idx,
  seat,
  allSeats,
  activePreset,
  allowedCivs,
  onUpdate,
  onCivChange,
}: SeatCardProps) {
  const civInfo = civilizations.find((c) => c.id === seat.civilizationId);
  const civColor = civInfo?.color ?? '#8c602a';
  const civNameFr = getCivNameFr(seat.civilizationId);

  return (
    <div
      style={{
        background: 'rgba(16, 21, 28, 0.85)',
        backdropFilter: 'var(--civ-blur-sm)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: 'var(--civ-glass-shadow)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* En-tête de siège d'expédition */}
      <div
        style={{
          background: `linear-gradient(90deg, ${civColor} 0%, rgba(20, 26, 36, 0.95) 100%)`,
          padding: '8px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Siège {idx + 1}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              fontFamily: 'var(--civ-font-display)',
              color: '#ffffff',
              letterSpacing: 0.8,
            }}
          >
            {civNameFr.toUpperCase()}
          </span>
        </div>

        {/* Sélecteur de contrôleur */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 5, gap: 2 }}>
          <button
            type="button"
            onClick={() => onUpdate(idx, { controller: 'human' })}
            style={{
              background: seat.controller === 'human' ? 'var(--civ-gold-base)' : 'transparent',
              color: seat.controller === 'human' ? '#000' : 'var(--civ-stone-muted)',
              border: 'none',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
          >
            👤 Humain
          </button>
          <button
            type="button"
            onClick={() => onUpdate(idx, { controller: 'heuristic-ai' })}
            style={{
              background: seat.controller === 'heuristic-ai' ? 'rgba(50, 65, 88, 0.8)' : 'transparent',
              color: seat.controller === 'heuristic-ai' ? 'var(--civ-gold-light)' : 'var(--civ-stone-muted)',
              border: 'none',
              borderRadius: 3,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 8px',
              cursor: 'pointer',
              transition: 'all .15s ease',
            }}
          >
            🤖 IA
          </button>
        </div>
      </div>

      {/* Corps de la carte */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--civ-gold-base)', marginBottom: 4 }}>
            Civilisation antique :
          </label>
          <select
            value={seat.civilizationId}
            onChange={(e) => onCivChange(idx, e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(22, 28, 38, 0.85)',
              color: 'var(--civ-marble)',
              border: '1px solid var(--civ-gold-border-subtle)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {civilizations.map((c) => {
              const isAllowed = allowedCivs.has(c.id);
              const otherIdx = allSeats.findIndex((s, i) => i !== idx && s.civilizationId === c.id);
              const isTakenByOther = otherIdx !== -1;
              const reason = unavailableReason(activePreset.config, c.id);
              const frReason = translateReason(reason);

              let note = '';
              if (!isAllowed) {
                note = ` (${frReason || 'non disponible'})`;
              } else if (isTakenByOther) {
                note = ` (Siège ${otherIdx + 1} — permuter)`;
              }

              return (
                <option key={c.id} value={c.id} disabled={!isAllowed}>
                  {getCivNameFr(c.id)}{note}
                </option>
              );
            })}
          </select>
        </div>

        {seat.controller === 'human' ? (
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--civ-gold-base)', marginBottom: 4 }}>
              Nom de l'archonte / joueur :
            </label>
            <input
              type="text"
              placeholder={`Joueur ${idx + 1}`}
              value={seat.displayName ?? ''}
              onChange={(e) => onUpdate(idx, { displayName: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: 'rgba(22, 28, 38, 0.85)',
                color: 'var(--civ-marble)',
                border: '1px solid var(--civ-gold-border-subtle)',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 12,
              }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '4px 0' }}>
            Adversaire automatisé par l'IA Heuristique
          </div>
        )}
      </div>
    </div>
  );
}
