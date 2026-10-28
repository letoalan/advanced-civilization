import { useState, useMemo } from 'react';
import { boardPresets, availableNations } from '../../engine/boards.js';
import { validateSessionConfig } from '../../local/session.js';
import type { LocalSessionConfig, LocalSeat, ControllerType } from '../../local/types.js';
import type { PlayerId } from '../../engine/types.js';
import { useTranslation, LanguageSelector } from '../i18n/index.js';
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
  const { t } = useTranslation();
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
        displayName: i === 0 ? 'Commandeur 1' : undefined,
      })),
      4,
      boardPresets(4)[0]!.config
    )
  );

  const handlePlayerCountChange = (count: number) => {
    setNumPlayers(count);
    const newPresets = boardPresets(count);
    const matchedPreset = newPresets.find((b) => b.id === presetId) ?? newPresets[0]!;
    if (!newPresets.some((b) => b.id === presetId)) setPresetId(null);
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'radial-gradient(ellipse at 50% 10%, #161e2a 0%, #0a0d12 100%)', color: 'var(--civ-marble)', overflowY: 'auto' }}>
      <div style={{ width: '100%', maxWidth: 1060, margin: '0 auto', boxSizing: 'border-box', padding: '20px 24px 36px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        
        {/* Curatorial Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--civ-gold-border)', paddingBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: 'var(--civ-font-display)', color: 'var(--civ-gold-light)', fontSize: 24, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {t.setup.title}
            </h2>
            <div style={{ fontFamily: 'var(--civ-font-serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--civ-parchment)', marginTop: 2 }}>
              {t.setup.subtitle}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LanguageSelector compact />
            <button className="glass-btn" onClick={onBack} style={{ padding: '8px 16px' }}>
              {t.setup.back}
            </button>
          </div>
        </div>

        {/* Nombre de participants */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 18px', background: 'rgba(14, 18, 25, 0.75)' }}>
          <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, fontSize: 12, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {t.setup.numCivs}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button
                key={n}
                className={`glass-btn ${numPlayers === n ? 'glass-btn--primary' : ''}`}
                style={{ width: 36, height: 32, padding: 0, fontSize: 13, fontWeight: 800 }}
                onClick={() => handlePlayerCountChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)', marginLeft: 'auto' }}>
            {t.setup.diplomaticPool(numPlayers)}
          </span>
        </div>

        {/* Choix du découpage géographique */}
        <BoardPresetPicker
          presets={presets}
          activePresetId={activePreset.id}
          onSelect={handlePresetSelect}
        />

        {/* Attribution des civilisations et contrôleurs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, fontSize: 12, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {t.setup.seatsTitle}
            </span>
            <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
              {t.setup.seatsDesc}
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

        {/* Options de discrétion et cadence */}
        <GameOptionsPicker
          privacyMode={privacyMode}
          aiPace={aiPace}
          onPrivacyChange={setPrivacyMode}
          onAiPaceChange={setAiPace}
        />

        {/* Lancement de la partie */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {!validation.valid && (
            <div style={{ background: 'rgba(153, 27, 27, 0.85)', border: '1px solid #f87171', color: '#ffd2d2', padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
              ⚠️ {validation.reason}
            </div>
          )}
          <button
            className="glass-btn glass-btn--primary"
            disabled={!validation.valid}
            style={{
              fontSize: 15,
              padding: '12px 36px',
              letterSpacing: 1.2,
            }}
            onClick={() => validation.valid && onLaunch(currentConfig)}
          >
            {t.setup.launchButton}
          </button>
        </div>
      </div>
    </div>
  );
}
