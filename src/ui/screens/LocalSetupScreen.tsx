import { useState, useMemo } from 'react';
import { boardPresets, availableNations } from '../../engine/boards.js';
import { validateSessionConfig } from '../../local/session.js';
import type { LocalSessionConfig, LocalSeat, ControllerType } from '../../local/types.js';
import type { PlayerId } from '../../engine/types.js';
import {
  SeatCard,
  BoardPresetPicker,
  GameOptionsPicker,
  reconcileSeats,
  swapOrUpdateSeatCiv,
} from './setup/index.js';

interface LocalSetupScreenProps {
  onLaunch: (config: LocalSessionConfig) => void;
  onBack: () => void;
}

const DEFAULT_CIVS: PlayerId[] = ['egypt', 'babylon', 'assyria', 'asia'];

export function LocalSetupScreen({ onLaunch, onBack }: LocalSetupScreenProps) {
  const [numPlayers, setNumPlayers] = useState<number>(4);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [privacyMode, setPrivacyMode] = useState<'open-table' | 'handoff'>('handoff');
  const [aiPace, setAiPace] = useState<'instant' | 'readable'>('readable');

  const presets = useMemo(() => boardPresets(numPlayers), [numPlayers]);
  const activePreset = presets.find((b) => b.id === presetId) ?? presets[0]!;
  const allowedCivs = useMemo(() => new Set(availableNations(activePreset.config)), [activePreset]);

  const [seats, setSeats] = useState<LocalSeat[]>(() =>
    reconcileSeats(
      DEFAULT_CIVS.slice(0, 4).map((cid, i) => ({
        civilizationId: cid,
        controller: (i === 0 ? 'human' : 'heuristic-ai') as ControllerType,
        displayName: i === 0 ? 'Joueur 1' : undefined,
      })),
      4,
      boardPresets(4)[0]!.config
    )
  );

  const handlePlayerCountChange = (count: number) => {
    setNumPlayers(count);
    const newPresets = boardPresets(count);
    const matchedPreset = newPresets.find((b) => b.id === presetId) ?? newPresets[0]!;
    if (!newPresets.some((b) => b.id === presetId)) {
      setPresetId(null);
    }
    setSeats((prev) => reconcileSeats(prev, count, matchedPreset.config));
  };

  const handlePresetSelect = (id: string) => {
    setPresetId(id);
    const chosenPreset = presets.find((b) => b.id === id) ?? presets[0]!;
    setSeats((prev) => reconcileSeats(prev, numPlayers, chosenPreset.config));
  };

  const handleCivChange = (idx: number, newCivId: string) => {
    setSeats((prev) => swapOrUpdateSeatCiv(prev, idx, newCivId));
  };

  const updateSeat = (idx: number, patch: Partial<LocalSeat>) => {
    setSeats((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const currentConfig: LocalSessionConfig = {
    seats,
    boardPresetId: activePreset.id,
    privacyMode,
    aiPace,
  };

  const validation = validateSessionConfig(currentConfig);

  const gridColumns = numPlayers === 4 || numPlayers === 2
    ? 'repeat(2, minmax(0, 1fr))'
    : 'repeat(auto-fit, minmax(280px, 1fr))';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0e0b08', color: '#f0e6d2', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 1040, margin: '0 auto', boxSizing: 'border-box', padding: '16px 20px 32px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #5a3c1c', paddingBottom: 10 }}>
          <div>
            <h2 style={{ margin: 0, color: '#ffd23f', fontSize: 22, letterSpacing: 0.5 }}>
              Configuration de la Partie Locale
            </h2>
            <div style={{ fontSize: 12, color: '#a89882', marginTop: 2 }}>
              Paramétrez les participants, le découpage géographique et les règles d'Avalon Hill (1991)
            </div>
          </div>
          <button className="civ-btn" onClick={onBack} style={{ padding: '7px 14px' }}>
            ← Retour au menu
          </button>
        </div>

        {/* Nombre de participants */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#18120d', padding: '10px 14px', borderRadius: 8, border: '1px solid #4a341e' }}>
          <span style={{ fontWeight: 800, fontSize: 13, color: '#ffd23f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Nombre de joueurs :
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                className={`civ-btn ${numPlayers === n ? 'on' : ''}`}
                style={{ width: 36, height: 32, padding: 0, fontSize: 13, fontWeight: 800 }}
                onClick={() => handlePlayerCountChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: '#8e8070', marginLeft: 'auto' }}>
            Partie à {numPlayers} civilisations
          </span>
        </div>

        {/* Choix du plateau (§16) */}
        <BoardPresetPicker
          presets={presets}
          activePresetId={activePreset.id}
          onSelect={handlePresetSelect}
        />

        {/* Attribution des civilisations et contrôleurs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#ffd23f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Attribution des civilisations et contrôleurs :
            </span>
            <span style={{ fontSize: 11, color: '#a89882' }}>
              Basculez chaque siège en Humain ou IA · Permutation automatique sans doublon
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: 10 }}>
            {seats.map((seat, idx) => (
              <SeatCard
                key={idx}
                idx={idx}
                seat={seat}
                allSeats={seats}
                activePreset={activePreset}
                allowedCivs={allowedCivs}
                onUpdate={updateSeat}
                onCivChange={handleCivChange}
              />
            ))}
          </div>
        </div>

        {/* Options de confidentialité et cadence */}
        <GameOptionsPicker
          privacyMode={privacyMode}
          aiPace={aiPace}
          onPrivacyChange={setPrivacyMode}
          onAiPaceChange={setAiPace}
        />

        {/* Lancement de la partie */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {!validation.valid && (
            <div style={{ background: '#4d1919', border: '1px solid #c97', color: '#ffd2d2', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              ⚠️ {validation.reason}
            </div>
          )}
          <button
            className="civ-btn"
            disabled={!validation.valid}
            style={{
              fontSize: 16,
              padding: '12px 32px',
              fontWeight: 800,
              background: validation.valid ? 'linear-gradient(180deg, #f5a623 0%, #d47e12 100%)' : '#3a2b1c',
              borderColor: '#ffd23f',
              color: validation.valid ? '#1a0e03' : '#777',
              boxShadow: validation.valid ? '0 4px 15px rgba(245, 166, 35, 0.4)' : 'none',
              cursor: validation.valid ? 'pointer' : 'not-allowed',
            }}
            onClick={() => validation.valid && onLaunch(currentConfig)}
          >
            🚀 Commencer la partie
          </button>
        </div>

      </div>
    </div>
  );
}
