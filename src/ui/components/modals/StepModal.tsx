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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8,6,3,0.82)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 120,
      }}
    >
      <div
        style={{
          background: '#211c14',
          color: '#eee',
          padding: 22,
          borderRadius: 12,
          border: `2px solid ${accent}`,
          width: 500,
          maxWidth: '92vw',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 8px 40px #000',
        }}
      >
        {pages[idx]}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <span className="civ-lbl" style={{ color: '#9a8d6a' }}>
            {idx + 1} / {pages.length}
          </span>
          <span style={{ display: 'flex', gap: 6 }}>
            {!last && (
              <button className="civ-btn" onClick={() => setSeen(token)}>
                Passer
              </button>
            )}
            <button className="civ-btn" onClick={() => (last ? setSeen(token) : setI((x) => x + 1))}>
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
      <div style={{ fontSize: 12, color: '#e6b85a', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {kicker}
      </div>
      <h2 style={{ margin: '4px 0 6px', color: titleColor }}>{title}</h2>
      {sub}
    </>
  );
}
