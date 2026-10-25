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
        background: '#1c1611',
        border: '1px solid #4a341e',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 3px 10px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* En-tête coloré avec contraste garanti */}
      <div
        style={{
          background: `linear-gradient(90deg, ${civColor} 0%, #281d14 100%)`,
          padding: '7px 12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #5a3c1c',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#ffd23f', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Siège {idx + 1}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: '#ffffff',
              textShadow: '0 1px 3px rgba(0,0,0,0.85)',
              letterSpacing: 0.5,
            }}
          >
            {civNameFr.toUpperCase()}
          </span>
        </div>

        {/* Sélecteur de contrôleur type boutons-onglets */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.5)', padding: 2, borderRadius: 5, gap: 2 }}>
          <button
            type="button"
            onClick={() => onUpdate(idx, { controller: 'human' })}
            style={{
              background: seat.controller === 'human' ? '#e69830' : 'transparent',
              color: seat.controller === 'human' ? '#000' : '#d2c4b0',
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
              background: seat.controller === 'heuristic-ai' ? '#6e5028' : 'transparent',
              color: seat.controller === 'heuristic-ai' ? '#ffd23f' : '#b2a490',
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
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#c8ad7f', marginBottom: 3 }}>
            Civilisation :
          </label>
          <select
            value={seat.civilizationId}
            onChange={(e) => onCivChange(idx, e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: '#2c2217',
              color: '#f0e6d2',
              border: '1px solid #7a5020',
              borderRadius: 4,
              padding: '5px 8px',
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
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#c8ad7f', marginBottom: 3 }}>
              Nom du joueur :
            </label>
            <input
              type="text"
              placeholder={`Joueur ${idx + 1}`}
              value={seat.displayName ?? ''}
              onChange={(e) => onUpdate(idx, { displayName: e.target.value })}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                background: '#2c2217',
                color: '#fff',
                border: '1px solid #7a5020',
                borderRadius: 4,
                padding: '5px 8px',
                fontSize: 12,
              }}
            />
          </div>
        ) : (
          <div style={{ fontSize: 11, color: '#9d8d7b', fontStyle: 'italic', padding: '4px 0' }}>
            Adversaire automatisé par l'IA Heuristique
          </div>
        )}
      </div>
    </div>
  );
}
