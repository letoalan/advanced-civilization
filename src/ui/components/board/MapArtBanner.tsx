import { useState, type ChangeEvent } from 'react';
import type { useMapArt } from '../../mapArt.js';

interface MapArtBannerProps {
  mapArt: ReturnType<typeof useMapArt>;
}

/**
 * Control to load the original board art from a VASSAL module locally in the browser.
 */
export function MapArtBanner({ mapArt }: MapArtBannerProps) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('civ-art-banner-hidden') === '1');

  const collapse = () => {
    localStorage.setItem('civ-art-banner-hidden', '1');
    setCollapsed(true);
  };
  const expand = () => {
    localStorage.removeItem('civ-art-banner-hidden');
    setCollapsed(false);
  };
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) mapArt.importVmod(f);
  };

  if (mapArt.status === 'loading') return null;

  const pill = (label: string, onClick: () => void, accent = false) => (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 10,
        bottom: 10,
        zIndex: 25,
        cursor: 'pointer',
        background: accent ? 'rgba(36, 26, 17, 0.9)' : 'rgba(20, 15, 10, 0.85)',
        color: '#ffd23f',
        border: '1px solid #6b4317',
        borderRadius: 6,
        padding: '4px 9px',
        fontSize: 11,
        fontWeight: 600,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      🎨 {label}
    </button>
  );

  if (mapArt.status === 'ready') return pill('Cartes originales actives ✓ (retirer)', mapArt.clearArt);
  if (collapsed && mapArt.status !== 'importing' && mapArt.status !== 'error') return pill('Cartes VASSAL…', expand, false);

  return (
    <div
      style={{
        position: 'absolute',
        left: 10,
        bottom: 10,
        zIndex: 25,
        maxWidth: 360,
        background: 'rgba(26,20,16,0.96)',
        color: '#fff',
        border: '2px solid #ffd23f',
        borderRadius: 8,
        padding: '10px 12px',
        fontSize: 13,
        lineHeight: 1.4,
        boxShadow: '0 2px 12px rgba(0,0,0,0.6)',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 4 }}>Utiliser les cartes originales du jeu</div>
      <div style={{ opacity: 0.9 }}>
        Cette version trace un schéma géométrique. Si vous possédez le module VASSAL d'Advanced Civilization, vous pouvez charger ses cartes originales ici (fichiers extraits localement sur votre poste).
      </div>
      {mapArt.status === 'error' && <div style={{ color: '#ff9', marginTop: 6 }}>Impossible de lire le fichier : {mapArt.error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <label className="civ-btn" style={{ cursor: 'pointer', background: '#ffd23f', color: '#1a1410', fontWeight: 700, padding: '4px 10px', borderRadius: 5 }}>
          {mapArt.status === 'importing' ? 'Lecture…' : 'Charger .vmod…'}
          <input type="file" accept=".vmod,.zip,application/zip" onChange={onFile} style={{ display: 'none' }} disabled={mapArt.status === 'importing'} />
        </label>
        <button onClick={collapse} style={{ background: 'none', border: 'none', color: '#cfe8ff', cursor: 'pointer', fontSize: 12 }}>Conserver le tracé</button>
      </div>
    </div>
  );
}
