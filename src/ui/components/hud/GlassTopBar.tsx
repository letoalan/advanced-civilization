import { useState } from 'react';
import { CivBadge } from './CivBadge.js';
import { ResourceCaskets } from './ResourceCaskets.js';
import { CalamityAlertBadge } from './CalamityAlertBadge.js';
import { SettingsModal } from './SettingsModal.js';
import { ZoomFitIcon, SettingsIcon } from '../../theme/icons/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';
import type { useMapArt } from '../../mapArt.js';
import { useTranslation, LanguageSelector } from '../../i18n/index.js';
import { useUiSettings } from '../../theme/settingsStore.js';

interface GlassTopBarProps {
  state: GameState;
  actor: PlayerId | null;
  focus: PlayerId;
  mapArt?: ReturnType<typeof useMapArt>;
  onFocusMine: () => void;
  onFocusAll: () => void;
  onExit: () => void;
  isIdle?: boolean;
}

export function GlassTopBar({
  state,
  actor,
  focus,
  mapArt,
  onFocusMine,
  onFocusAll,
  onExit,
  isIdle,
}: GlassTopBarProps) {
  const p = state.players[focus];
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useUiSettings();
  const { t } = useTranslation();

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
            title={t.topBar.myCiv}
            style={{ padding: '4px 8px' }}
          >
            {t.topBar.myCiv}
          </button>

          <button
            onClick={onFocusAll}
            className="glass-btn"
            title={t.topBar.zoomFit}
            style={{ padding: '4px 8px' }}
          >
            <ZoomFitIcon size={14} />
          </button>

          {/* God Mode (Vision Divine) Toggle */}
          <button
            onClick={() => setSettings({ godMode: !settings.godMode })}
            className={`glass-btn ${settings.godMode ? 'glass-btn--primary' : ''}`}
            title={t.dock.godModeHint}
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            <span>{settings.godMode ? '👁️' : '👁️‍🗨️'}</span>
          </button>

          {/* Quick HUD Switcher (Reversibility Toggle: Option 3 Ethereal vs Classic Dock) */}
          <button
            onClick={() => setSettings({ hudStyle: settings.hudStyle === 'ethereal-hud' ? 'classic-dock' : 'ethereal-hud' })}
            className="glass-btn"
            title={`${t.settingsModal.hudStyle} (${settings.hudStyle === 'ethereal-hud' ? t.dock.hudStyleEthereal : t.dock.hudStyleClassic})`}
            style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700 }}
          >
            {settings.hudStyle === 'ethereal-hud' ? '✨ HUD' : '📦 Dock'}
          </button>

          {/* Quick Language Toggle */}
          <LanguageSelector compact />

          <button
            onClick={() => setShowSettings(true)}
            className="glass-btn"
            title={t.topBar.settings}
            style={{ padding: '4px 8px' }}
          >
            <SettingsIcon size={14} />
          </button>

          <button
            onClick={onExit}
            className="glass-btn"
            title={t.topBar.menu}
            style={{ padding: '4px 8px', color: '#fca5a5' }}
          >
            {t.topBar.menu}
          </button>
        </div>
      </header>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} mapArt={mapArt} />
    </>
  );
}
