import { useState, useMemo } from 'react';
import { civilizations } from '../../data/index.js';
import { boardPresets, availableNations, unavailableReason } from '../../engine/boards.js';
import { validateSessionConfig } from '../../local/session.js';
import type { LocalSessionConfig, LocalSeat, ControllerType } from '../../local/types.js';
import type { PlayerId } from '../../engine/types.js';

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
    DEFAULT_CIVS.slice(0, 4).map((cid, i) => ({
      civilizationId: cid,
      controller: (i === 0 ? 'human' : 'heuristic-ai') as ControllerType,
      displayName: i === 0 ? 'Joueur 1' : undefined,
    }))
  );

  const handlePlayerCountChange = (count: number) => {
    setNumPlayers(count);
    const newPresets = boardPresets(count);
    const newAllowed = new Set(availableNations(newPresets[0]!.config));
    const validChoices = [...civilizations].map((c) => c.id).filter((c) => newAllowed.has(c));

    const newSeats: LocalSeat[] = [];
    for (let i = 0; i < count; i++) {
      const existing = seats[i];
      const civ = (existing && newAllowed.has(existing.civilizationId))
        ? existing.civilizationId
        : (validChoices[i] ?? validChoices[0]!);

      newSeats.push({
        civilizationId: civ,
        controller: existing?.controller ?? (i === 0 ? 'human' : 'heuristic-ai'),
        displayName: existing?.displayName ?? (i === 0 ? 'Joueur 1' : undefined),
      });
    }
    setSeats(newSeats);
    setPresetId(null);
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

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, color: '#f0e6d2', padding: 20, overflowY: 'auto', background: '#14100c' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #5a3c1c', paddingBottom: 8 }}>
        <h2 style={{ margin: 0, color: '#ffd23f', fontSize: 20 }}>Configuration de la Partie Locale</h2>
        <button className="civ-btn" onClick={onBack}>← Retour</button>
      </div>

      {/* Nombre de participants */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#c8ad7f' }}>Nombre de joueurs :</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
            <button key={n} className={`civ-btn ${numPlayers === n ? 'on' : ''}`} onClick={() => handlePlayerCountChange(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Choix du plateau */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#c8ad7f' }}>Plateau de jeu (§16) :</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {presets.map((b) => (
            <button key={b.id} className={`civ-btn ${activePreset.id === b.id ? 'on' : ''}`} onClick={() => setPresetId(b.id)}>
              {b.label} <span style={{ color: '#baa' }}>({b.tokensPerPlayer} pions)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration des sièges */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#c8ad7f' }}>Attribution des civilisations et contrôleurs :</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
          {seats.map((seat, idx) => {
            const civInfo = civilizations.find((c) => c.id === seat.civilizationId);
            return (
              <div key={idx} style={{ background: '#1f1812', border: `2px solid ${civInfo?.color ?? '#555'}`, borderRadius: 6, padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: 13, color: civInfo?.color }}>Siège {idx + 1} : {civInfo?.name}</span>
                  <select
                    value={seat.controller}
                    onChange={(e) => updateSeat(idx, { controller: e.target.value as ControllerType })}
                    style={{ background: '#2c2217', color: '#eee', border: '1px solid #7a5020', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}
                  >
                    <option value="human">Humain</option>
                    <option value="heuristic-ai">IA Heuristique</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <select
                    value={seat.civilizationId}
                    onChange={(e) => updateSeat(idx, { civilizationId: e.target.value })}
                    style={{ flex: 1, background: '#2c2217', color: '#eee', border: '1px solid #7a5020', borderRadius: 4, padding: '3px 6px', fontSize: 12 }}
                  >
                    {civilizations.map((c) => (
                      <option key={c.id} value={c.id} disabled={!allowedCivs.has(c.id) && seat.civilizationId !== c.id}>
                        {c.name} {!allowedCivs.has(c.id) ? `(${unavailableReason(activePreset.config, c.id) || 'non dispo'})` : ''}
                      </option>
                    ))}
                  </select>
                  {seat.controller === 'human' && (
                    <input
                      type="text"
                      placeholder="Nom du joueur"
                      value={seat.displayName ?? ''}
                      onChange={(e) => updateSeat(idx, { displayName: e.target.value })}
                      style={{ width: 110, background: '#2c2217', color: '#eee', border: '1px solid #7a5020', borderRadius: 4, padding: '3px 6px', fontSize: 12 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Options de confidentialité et cadence */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 4, background: '#1c1610', padding: 8, borderRadius: 6, border: '1px solid #4a3015' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Confidentialité :</span>
          <button className={`civ-btn ${privacyMode === 'handoff' ? 'on' : ''}`} onClick={() => setPrivacyMode('handoff')}>
            Passage de main secret
          </button>
          <button className={`civ-btn ${privacyMode === 'open-table' ? 'on' : ''}`} onClick={() => setPrivacyMode('open-table')}>
            Table ouverte
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Cadence IA :</span>
          <button className={`civ-btn ${aiPace === 'readable' ? 'on' : ''}`} onClick={() => setAiPace('readable')}>
            Lisible (temporisé)
          </button>
          <button className={`civ-btn ${aiPace === 'instant' ? 'on' : ''}`} onClick={() => setAiPace('instant')}>
            Instantané
          </button>
        </div>
      </div>

      {/* Bouton de validation / lancement */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 10 }}>
        {!validation.valid && (
          <div style={{ color: '#e06666', fontSize: 12, fontWeight: 700 }}>⚠️ {validation.reason}</div>
        )}
        <button
          className="civ-btn"
          disabled={!validation.valid}
          style={{ fontSize: 16, padding: '10px 24px', fontWeight: 800, background: '#e69830' }}
          onClick={() => validation.valid && onLaunch(currentConfig)}
        >
          🚀 Commencer la partie
        </button>
      </div>
    </div>
  );
}
