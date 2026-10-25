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
        background: accent ? '#ffd23f' : 'rgba(26,20,16,0.92)',
        color: accent ? '#1a1410' : '#ffd23f',
        border: '1px solid #ffd23f',
        borderRadius: 6,
        padding: '5px 11px',
        fontSize: 12,
        fontWeight: 700,
        boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
      }}
    >
      {label}
    </button>
  );

  if (mapArt.status === 'ready') return pill('Plateau : cartes originales ✓ · utiliser le tracé', mapArt.clearArt);
  if (collapsed && mapArt.status !== 'importing' && mapArt.status !== 'error') return pill('Charger les cartes originales…', expand, true);

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
