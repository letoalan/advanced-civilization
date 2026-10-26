import { useState } from 'react';
import { CivBadge } from './CivBadge.js';
import { ResourceCaskets } from './ResourceCaskets.js';
import { CalamityAlertBadge } from './CalamityAlertBadge.js';
import { SettingsModal } from './SettingsModal.js';
import { ZoomFitIcon, SettingsIcon } from '../../theme/icons/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

interface GlassTopBarProps {
  state: GameState;
  actor: PlayerId | null;
  focus: PlayerId;
  onFocusMine: () => void;
  onFocusAll: () => void;
  onExit: () => void;
  isIdle?: boolean;
}

export function GlassTopBar({
  state,
  actor,
  focus,
  onFocusMine,
  onFocusAll,
  onExit,
  isIdle,
}: GlassTopBarProps) {
  const p = state.players[focus];
  const [showSettings, setShowSettings] = useState(false);

  if (!p) return null;

  let boardTokens = 0;
  let boardCities = 0;
  let boardShips = 0;
  for (const a of Object.values(state.areas)) {
    boardTokens += a.tokens[focus] ?? 0;
    if (a.city === focus) boardCities += 1;
    boardShips += a.ships?.[focus] ?? 0;
  }

  return (
    <>
      <header
        className={`glass-topbar ${isIdle ? 'civ-focus-idle' : ''}`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Left: Heraldic Medallion, Name, AST progression */}
        <CivBadge player={p} focus={focus} isActor={actor === focus} />

        {/* Center: Resource Caskets */}
        <ResourceCaskets
          player={p}
          boardTokens={boardTokens}
          boardCities={boardCities}
          boardShips={boardShips}
        />

        {/* Right: Calamities Alert + Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CalamityAlertBadge player={p} />

          <button
            onClick={onFocusMine}
            className="glass-btn"
            title="Centrer la caméra sur ma civilisation"
            style={{ padding: '4px 8px' }}
          >
            Ma Civ
          </button>

          <button
            onClick={onFocusAll}
            className="glass-btn"
            title="Vue d'ensemble Méditerranée (Zoom optimal)"
            style={{ padding: '4px 8px' }}
          >
            <ZoomFitIcon size={14} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="glass-btn"
            title="Réglages de l'interface"
            style={{ padding: '4px 8px' }}
          >
            <SettingsIcon size={14} />
          </button>

          <button
            onClick={onExit}
            className="glass-btn"
            title="Retour au menu principal"
            style={{ padding: '4px 8px', color: '#fca5a5' }}
          >
            Menu
          </button>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
