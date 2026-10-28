import { useEffect } from 'react';
import type { GameState, PlayerId } from '../../../engine/types.js';
import type { View } from './ViewNav.js';
import { InfoView } from '../views/InfoView.js';
import { CloseIcon, TechIcon, TradeIcon, AstIcon, ChronicleIcon } from '../../theme/icons/index.js';
import { useTranslation } from '../../i18n/index.js';

interface CodexOverlayModalProps {
  view: View | null;
  onClose: () => void;
  onSelectView: (v: View) => void;
  state: GameState;
  focus: PlayerId;
}

export function CodexOverlayModal({
  view,
  onClose,
  onSelectView,
  state,
  focus,
}: CodexOverlayModalProps) {
  const { t } = useTranslation();

  const codexTabs: { id: View; label: string; icon: (act: boolean) => React.ReactNode }[] = [
    { id: 'tools', label: t.codex.progress, icon: (act) => <TechIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'goods', label: t.codex.trade, icon: (act) => <TradeIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'ast', label: t.codex.ast, icon: (act) => <AstIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'log', label: t.codex.chronicles, icon: (act) => <ChronicleIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'census', label: t.codex.census, icon: () => <span>🗂️</span> },
  ];

  useEffect(() => {
    if (!view || view === 'map') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, onClose]);

  if (!view || view === 'map') return null;

  return (
    <div
      onClick={onClose}
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(5, 7, 10, 0.82)',
        backdropFilter: 'var(--civ-blur)',
        WebkitBackdropFilter: 'var(--civ-blur)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 14px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel glass-panel--gold animate-pop"
        style={{
          width: '100%',
          maxWidth: 1100,
          height: '88vh',
          maxHeight: 860,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--civ-glass-shadow-lg)',
          border: '1px solid var(--civ-gold-border)',
        }}
      >
        {/* Codex Header Bar */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--civ-gold-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: 'rgba(16, 21, 28, 0.92)',
          }}
        >
          {/* Codex Tab Selector */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'var(--civ-font-display)',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--civ-gold-light)',
                letterSpacing: 1.2,
                marginRight: 10,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🏛️</span>
              <span>{t.codex.title}</span>
            </span>

            {codexTabs.map((tab) => {
              const active = tab.id === view;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectView(tab.id)}
                  className={`glass-btn ${active ? 'glass-btn--primary' : ''}`}
                  style={{ padding: '5px 12px', fontSize: 11 }}
                >
                  {tab.icon(active)}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Close Codex Button */}
          <button onClick={onClose} className="glass-btn" title={t.codex.closeTooltip}>
            <CloseIcon size={14} />
            <span>{t.codex.close}</span>
          </button>
        </div>

        {/* Codex Content Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            background: 'rgba(10, 13, 18, 0.85)',
          }}
        >
          <InfoView view={view} state={state} focus={focus} />
        </div>
      </div>
    </div>
  );
}
