import { useState } from 'react';
import { civById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { phaseLabel } from '../board/boardHelpers.js';
import type { View } from '../navigation/ViewNav.js';
import { ActionList } from '../phases/ActionList.js';
import { MovementControls } from '../phases/movement/MovementControls.js';
import type { MovementPlanner } from '../phases/movement/movementTypes.js';
import { GameOverSummary } from '../navigation/GameOverSummary.js';
import { DockCodexButtons } from './DockCodexButtons.js';
import { TradeControls } from '../phases/trade/index.js';
import { tradeRound } from '../../../engine/index.js';
import { useTranslation } from '../../i18n/index.js';
import { useUiSettings } from '../../theme/settingsStore.js';
import { CloseIcon } from '../../theme/icons/index.js';

export interface EtherealHudProps {
  state: GameState;
  actor: PlayerId | null;
  focus: PlayerId;
  isHuman: boolean;
  legal: Action[];
  selectedArea: string | null;
  inMovement: boolean;
  planner: MovementPlanner;
  rejected: string | null;
  onApply: (a: Action) => void;
  onOpenCodex: (view: View) => void;
  activeCodex: View | null;
  result: ReturnType<typeof import('../../../engine/index.js').adapter.result>;
  isIdle?: boolean;
}

/**
 * Option 3: HUD Flottant Contextuel & Transparence Éthérée (God Mode)
 * Libère la Méditerranée centrale en remplaçant le panneau fixe massif par des îlots
 * contextuels légers, translucides, minimisables et commutables.
 */
export function EtherealHud({
  state,
  actor,
  isHuman,
  legal,
  selectedArea,
  inMovement,
  planner,
  rejected,
  onApply,
  onOpenCodex,
  activeCodex,
  result,
  isIdle,
}: EtherealHudProps) {
  const { trCiv, t } = useTranslation();
  const [settings, setSettings] = useUiSettings();
  const [tradeMinimized, setTradeMinimized] = useState(false);

  const currentCiv = actor ? civById.get(actor) : null;
  const civName = actor ? trCiv(actor) : '';
  const passAction = legal.find((a) => a.type === 'pass');
  const isTrade = state.phase === 'trade';

  // 1. Situation: Phase de Commerce (Marché Négociation)
  if (isTrade && actor && isHuman && !result) {
    const { current: curRound, max: maxRounds } = tradeRound(state);

    if (tradeMinimized) {
      return (
        <div
          className="ethereal-minimized-pill animate-fade-in"
          onClick={() => setTradeMinimized(false)}
          title={t.dock.expand}
        >
          <span style={{ fontSize: 13 }}>🏛️</span>
          <span>
            {t.trade.tradingPost} ({curRound}/{maxRounds})
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              background: 'var(--civ-gold-base)',
              color: '#0a0d12',
              fontWeight: 800,
              fontSize: 10,
            }}
          >
            {t.dock.expand} 🔼
          </span>
        </div>
      );
    }

    return (
      <div className="ethereal-slate-overlay animate-fade-in">
        {/* Top Control Header for the Trade Slate */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
            paddingBottom: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--civ-gold-border)',
                color: 'var(--civ-gold-light)',
                fontFamily: 'var(--civ-font-display)',
                fontWeight: 800,
                fontSize: 10,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {phaseLabel(state)}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: currentCiv?.color ?? 'var(--civ-gold-base)',
                  boxShadow: `0 0 6px ${currentCiv?.color ?? 'var(--civ-gold-base)'}`,
                }}
              />
              <span style={{ fontWeight: 700, color: '#ffffff', fontSize: 12 }}>
                {civName}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Quick God Mode Toggle */}
            <button
              onClick={() => setSettings({ godMode: !settings.godMode })}
              className={`glass-btn ${settings.godMode ? 'glass-btn--primary' : ''}`}
              title={t.dock.godModeHint}
              style={{ padding: '3px 8px', fontSize: 11 }}
            >
              <span>{settings.godMode ? '👁️' : '👁️‍🗨️'}</span>
              <span>{t.dock.seeBoard}</span>
            </button>

            {/* Minimize Slate button */}
            <button
              onClick={() => setTradeMinimized(true)}
              className="glass-btn"
              title={t.dock.minimize}
              style={{ padding: '3px 10px', fontSize: 11 }}
            >
              <span>🔽 {t.dock.minimize}</span>
            </button>

            {/* Reversibility Switcher */}
            <button
              onClick={() => setSettings({ hudStyle: 'classic-dock' })}
              className="glass-btn"
              title={t.settingsModal.classicDock}
              style={{ padding: '3px 8px', fontSize: 10, opacity: 0.75 }}
            >
              {t.dock.hudStyleClassic}
            </button>
          </div>
        </div>

        {/* Content: Trade Controls */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <TradeControls state={state} actor={actor} onApply={onApply} />
        </div>
      </div>
    );
  }

  // 2. Situation: Phase de Mouvement (Capsule Flottante de Marche)
  if (inMovement && actor && isHuman && !result) {
    return (
      <footer
        className={`ethereal-hud-capsule animate-pop ${isIdle ? 'civ-focus-idle' : ''}`}
        style={{
          width: 'auto',
          minWidth: 380,
          padding: '6px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Movement Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid var(--civ-gold-border)',
                color: 'var(--civ-gold-light)',
                fontWeight: 800,
                fontSize: 9.5,
                textTransform: 'uppercase',
              }}
            >
              🚶 {phaseLabel(state)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--civ-parchment)' }}>
              <b>{civName}</b>
            </span>
          </div>

          {/* Movement Controls Inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MovementControls planner={planner} />
          </div>

          {/* Utility Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setSettings({ godMode: !settings.godMode })}
              className={`glass-btn ${settings.godMode ? 'glass-btn--primary' : ''}`}
              title={t.dock.godModeHint}
              style={{ padding: '3px 6px', fontSize: 11 }}
            >
              <span>{settings.godMode ? '👁️' : '👁️‍🗨️'}</span>
            </button>

            <button
              onClick={() => setSettings({ hudStyle: 'classic-dock' })}
              className="glass-btn"
              title={t.settingsModal.classicDock}
              style={{ padding: '3px 6px', fontSize: 9.5, opacity: 0.6 }}
            >
              📦
            </button>
          </div>
        </div>

        {rejected && (
          <div
            className="animate-pop"
            style={{
              fontSize: 10.5,
              color: '#fca5a5',
              background: 'rgba(153, 27, 27, 0.85)',
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid #f87171',
              marginTop: 2,
            }}
          >
            ⚠ {rejected}
          </div>
        )}
      </footer>
    );
  }

  // 3. Situation: Toutes les autres phases (Capsule Flottante Aérienne)
  return (
    <footer
      className={`ethereal-hud-capsule animate-fade-in ${isIdle ? 'civ-focus-idle' : ''}`}
      style={{
        pointerEvents: 'auto',
        minWidth: 380,
      }}
    >
      {/* Top Header: Phase + Actor Context + Codex Navigation + God Mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              padding: '2px 7px',
              borderRadius: 4,
              background: 'rgba(212, 175, 55, 0.14)',
              border: '1px solid var(--civ-gold-border)',
              color: 'var(--civ-gold-light)',
              fontFamily: 'var(--civ-font-display)',
              fontWeight: 800,
              fontSize: 9.5,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {phaseLabel(state)}
          </span>

          {actor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: currentCiv?.color ?? 'var(--civ-gold-base)',
                  boxShadow: `0 0 5px ${currentCiv?.color ?? 'var(--civ-gold-base)'}`,
                }}
              />
              <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: 0.3, fontSize: 11 }}>
                {civName}
              </span>
              <span style={{ fontSize: 9.5, color: 'var(--civ-stone-muted)' }}>
                {isHuman ? `— ${t.common.yourTurn}` : `— ${t.common.aiTurn}`}
              </span>
            </div>
          )}
        </div>

        {/* Action Codex Buttons & Quick Mode Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DockCodexButtons activeCodex={activeCodex} onOpenCodex={onOpenCodex} />

          {/* Quick God Mode Peek */}
          <button
            onClick={() => setSettings({ godMode: !settings.godMode })}
            className={`glass-btn ${settings.godMode ? 'glass-btn--primary' : ''}`}
            title={t.dock.godModeHint}
            style={{ padding: '3px 6px', fontSize: 11 }}
          >
            <span>{settings.godMode ? '👁️' : '👁️‍🗨️'}</span>
          </button>

          {/* Reversibility Switcher */}
          <button
            onClick={() => setSettings({ hudStyle: 'classic-dock' })}
            className="glass-btn"
            title={t.settingsModal.classicDock}
            style={{ padding: '3px 6px', fontSize: 9.5, opacity: 0.6 }}
          >
            📦
          </button>
        </div>
      </div>

      {/* Rejection Alert if any */}
      {rejected && (
        <div
          className="animate-pop"
          style={{
            fontSize: 10.5,
            color: '#fca5a5',
            background: 'rgba(153, 27, 27, 0.85)',
            padding: '3px 8px',
            borderRadius: 4,
            border: '1px solid #f87171',
          }}
        >
          ⚠ {rejected}
        </div>
      )}

      {/* Main Interactive Controls */}
      <div
        className="civ-custom-scrollbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100vh - 170px)',
          paddingRight: 2,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {result ? (
            <GameOverSummary state={state} result={result} />
          ) : isHuman && actor ? (
            <ActionList
              legal={legal}
              selectedArea={selectedArea}
              phase={state.phase}
              onApply={onApply}
              state={state}
              actor={actor}
            />
          ) : !result && (
            <div style={{ fontSize: 10.5, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '3px 0' }}>
              Résolution automatique du tour par les arbitres impériaux…
            </div>
          )}
        </div>

        {/* Primary Pass Action Button */}
        {!inMovement && isHuman && actor && passAction && !result && (
          <div style={{ flexShrink: 0, alignSelf: 'center' }}>
            <button
              onClick={() => onApply(passAction)}
              className="glass-btn glass-btn--primary"
              style={{ padding: '5px 14px', fontSize: 11 }}
            >
              <span>{t.common.pass}</span>
              <span style={{ fontSize: 12 }}>➔</span>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
