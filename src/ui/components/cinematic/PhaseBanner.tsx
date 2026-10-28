import { useEffect, useState } from 'react';
import type { Phase } from '../../../engine/types.js';
import { usePrevious } from '../../hooks/usePrevious.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { useUiSettings } from '../../theme/settingsStore.js';
import { useTranslation } from '../../i18n/index.js';

interface PhaseBannerProps {
  phase: Phase;
  turn: number;
}

export function PhaseBanner({ phase, turn }: PhaseBannerProps) {
  const prevPhase = usePrevious(phase);
  const [visible, setVisible] = useState(false);
  const { trPhase, t } = useTranslation();
  const currentInfo = trPhase(phase);
  const reducedMotion = useReducedMotion();
  const [settings] = useUiSettings();

  useEffect(() => {
    if (prevPhase && prevPhase !== phase && settings.effects !== 'off' && !reducedMotion) {
      setVisible(true);
      const timer = window.setTimeout(() => setVisible(false), 2400);
      return () => window.clearTimeout(timer);
    }
  }, [phase, prevPhase, settings.effects, reducedMotion]);

  if (!visible || !currentInfo) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 68,
        left: 0,
        right: 0,
        zIndex: 150,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        className="glass-panel glass-panel--gold animate-banner-slide"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '12px 36px',
          background: 'linear-gradient(180deg, rgba(32, 22, 14, 0.95) 0%, rgba(18, 12, 8, 0.98) 100%)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.85), 0 0 24px var(--civ-gold-glow)',
          borderTop: '2px solid #ffd23f',
          borderBottom: '2px solid #ffd23f',
          borderRadius: 8,
          animation: 'civ-banner-slide 2.4s ease forwards',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 800, color: '#ffd23f', letterSpacing: 2, textTransform: 'uppercase' }}>
          {t.common.turn} {turn} · Phase {currentInfo.num}
        </span>
        <h2 style={{ margin: '2px 0', fontSize: 20, fontWeight: 900, color: '#ffffff', fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          {currentInfo.title}
        </h2>
        <span style={{ fontSize: 11, color: '#e0d2b4', fontStyle: 'italic' }}>
          {currentInfo.subtitle}
        </span>
      </div>
    </div>
  );
}
