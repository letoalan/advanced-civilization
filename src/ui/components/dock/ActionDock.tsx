import { civById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { phaseLabel } from '../board/boardHelpers.js';
import type { View } from '../navigation/ViewNav.js';
import { ActionList } from '../phases/ActionList.js';
import { MovementControls } from '../phases/movement/MovementControls.js';
import type { MovementPlanner } from '../phases/movement/movementTypes.js';
import { GameOverSummary } from '../navigation/GameOverSummary.js';
import { DockCodexButtons } from './DockCodexButtons.js';
import { useTranslation } from '../../i18n/index.js';
import { useUiSettings } from '../../theme/settingsStore.js';

export interface ActionDockProps {
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

export function ActionDock({
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
}: ActionDockProps) {
  const { trCiv, t } = useTranslation();
  const [settings, setSettings] = useUiSettings();
  const currentCiv = actor ? civById.get(actor) : null;
  const civName = actor ? trCiv(actor) : '';
  const passAction = legal.find((a) => a.type === 'pass');

  const isTrade = state.phase === 'trade';

  return (
    <footer
      className={`glass-dock ${isIdle ? 'civ-focus-idle' : ''} ${isTrade ? 'glass-dock--trade' : ''}`}
      style={{
        pointerEvents: 'auto',
        minWidth: isTrade ? undefined : 480,
      }}
    >
      {/* Top Header Row: Phase + Actor Context + Codex Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(212, 175, 55, 0.12)',
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

          {actor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: currentCiv?.color ?? 'var(--civ-gold-base)',
                  boxShadow: `0 0 6px ${currentCiv?.color ?? 'var(--civ-gold-base)'}`,
                }}
              />
              <span style={{ fontWeight: 700, color: '#ffffff', letterSpacing: 0.3 }}>
                {civName}
              </span>
              <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)' }}>
                {isHuman ? `— ${t.common.yourTurn}` : `— ${t.common.aiTurn}`}
              </span>
            </div>
          )}
        </div>

        {/* Codex Tools buttons + Quick God Mode & HUD Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DockCodexButtons activeCodex={activeCodex} onOpenCodex={onOpenCodex} />

          <button
            onClick={() => setSettings({ godMode: !settings.godMode })}
            className={`glass-btn ${settings.godMode ? 'glass-btn--primary' : ''}`}
            title={t.dock.godModeHint}
            style={{ padding: '3px 6px', fontSize: 11 }}
          >
            <span>{settings.godMode ? '👁️' : '👁️‍🗨️'}</span>
          </button>

          <button
            onClick={() => setSettings({ hudStyle: 'ethereal-hud' })}
            className="glass-btn"
            title={t.settingsModal.etherealHud}
            style={{ padding: '3px 6px', fontSize: 10, color: 'var(--civ-gold-light)' }}
          >
            {t.dock.hudStyleEthereal}
          </button>
        </div>
      </div>

      {/* Rejection Error Alert if any */}
      {rejected && (
        <div
          className="animate-pop"
          style={{
            fontSize: 11,
            color: '#fca5a5',
            background: 'rgba(153, 27, 27, 0.85)',
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid #f87171',
          }}
        >
          ⚠ {rejected}
        </div>
      )}

      {/* Main Interaction Row with smooth scroll */}
      <div
        className="civ-custom-scrollbar"
        style={{
          display: 'flex',
          alignItems: isTrade ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: 14,
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(100vh - 140px)',
          paddingRight: 2,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {result ? (
            <GameOverSummary state={state} result={result} />
          ) : isHuman && actor ? (
            inMovement ? (
              <MovementControls planner={planner} />
            ) : (
              <ActionList
                legal={legal}
                selectedArea={selectedArea}
                phase={state.phase}
                onApply={onApply}
                state={state}
                actor={actor}
              />
            )
          ) : !result && (
            <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '4px 0' }}>
              Résolution automatique du tour par les arbitres impériaux…
            </div>
          )}
        </div>

        {/* Primary Action Button (hidden in trade because TradeControls has its own pass/wait buttons) */}
        {!isTrade && !inMovement && isHuman && actor && passAction && !result && (
          <div style={{ flexShrink: 0, alignSelf: 'center' }}>
            <button
              onClick={() => onApply(passAction)}
              className="glass-btn glass-btn--primary"
              style={{ padding: '7px 16px', fontSize: 11 }}
            >
              <span>{t.common.pass}</span>
              <span style={{ fontSize: 13 }}>➔</span>
            </button>
          </div>
        )}
      </div>
    </footer>
  );
}
