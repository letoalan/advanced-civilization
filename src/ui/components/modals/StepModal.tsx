import { useState, useEffect, type ReactNode } from 'react';

interface StepModalProps {
  token: string;
  pages: ReactNode[];
  accent: string;
}

/**
 * Overlay de déroulement pas à pas d'événements (calamités, combats).
 */
export function StepModal({ token, pages, accent }: StepModalProps) {
  const [seen, setSeen] = useState('');
  const [i, setI] = useState(0);

  useEffect(() => {
    setI(0);
  }, [token]);

  if (!pages.length || seen === token) return null;

  const idx = Math.min(i, pages.length - 1);
  const last = idx >= pages.length - 1;

  return (
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 10, 0.82)',
        backdropFilter: 'var(--civ-blur-sm)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 120,
      }}
    >
      <div
        className="glass-panel glass-panel--gold animate-pop"
        style={{
          background: 'rgba(14, 18, 25, 0.94)',
          backdropFilter: 'var(--civ-blur)',
          color: 'var(--civ-marble)',
          padding: 24,
          borderRadius: 12,
          border: '1px solid var(--civ-gold-border)',
          width: 500,
          maxWidth: '92vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: 'var(--civ-glass-shadow-lg)',
        }}
      >
        {pages[idx]}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <span className="civ-lbl" style={{ color: 'var(--civ-stone-muted)' }}>
            Événement {idx + 1} / {pages.length}
          </span>
          <span style={{ display: 'flex', gap: 8 }}>
            {!last && (
              <button className="glass-btn" onClick={() => setSeen(token)}>
                Passer
              </button>
            )}
            <button className="glass-btn glass-btn--primary" onClick={() => (last ? setSeen(token) : setI((x) => x + 1))}>
              {last ? 'Continuer' : 'Suivant →'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export function stepHead(kicker: string, title: string, titleColor: string, sub?: ReactNode) {
  return (
    <>
      <div style={{ fontSize: 11, color: 'var(--civ-gold-base)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {kicker}
      </div>
      <h2 style={{ margin: '6px 0 8px', color: titleColor, fontFamily: 'var(--civ-font-display)', fontSize: 18, letterSpacing: 0.6 }}>{title}</h2>
      {sub}
    </>
  );
}
