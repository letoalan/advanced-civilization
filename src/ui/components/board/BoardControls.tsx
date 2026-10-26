import type { CSSProperties } from 'react';
import type { BoardStyle } from './boardTheme.js';

interface BoardControlsProps {
  zoom: number;
  style: BoardStyle;
  showTerrain: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onZoomCover?: () => void;
  onToggleStyle: () => void;
  onToggleTerrain: () => void;
}

const BTN_BASE: CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid #785a28',
  background: 'rgba(20, 26, 34, 0.92)',
  color: '#f3ebd7',
  backdropFilter: 'blur(6px)',
  fontWeight: 600,
  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  transition: 'background 0.15s ease, border-color 0.15s ease',
};

export function BoardControls({
  zoom,
  style,
  showTerrain,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onZoomCover,
  onToggleStyle,
  onToggleTerrain,
}: BoardControlsProps) {
  return (
    <div style={{ position: 'sticky', top: 10, left: 10, zIndex: 25, height: 0, width: 0, overflow: 'visible' }}>
      <div style={{ display: 'flex', gap: 6, width: 'max-content', alignItems: 'center' }}>
        <button onClick={onZoomOut} title="Zoom arrière" style={{ ...BTN_BASE, minWidth: 28, justifyContent: 'center' }}>
          −
        </button>
        <button
          onClick={onZoomFit}
          title="Réinitialiser l'échelle (100% couverture)"
          style={{ ...BTN_BASE, minWidth: 54, justifyContent: 'center', borderColor: zoom === 1 ? '#ffd23f' : '#785a28' }}
        >
          🔍 {Math.round(zoom * 100)}%
        </button>
        <button onClick={onZoomIn} title="Zoom avant" style={{ ...BTN_BASE, minWidth: 28, justifyContent: 'center' }}>
          +
        </button>

        <button
          onClick={onZoomFit}
          title="Afficher l'intégralité du plateau antique (100% sans rognage)"
          style={{
            ...BTN_BASE,
            borderColor: zoom === 1 ? '#ffd23f' : '#785a28',
            background: zoom === 1 ? 'rgba(55, 42, 20, 0.94)' : BTN_BASE.background,
          }}
        >
          🗺 Carte complète
        </button>

        {onZoomCover && (
          <button
            onClick={onZoomCover}
            title="Zoom supérieur pour couvrir tout l'écran verticalement"
            style={{ ...BTN_BASE }}
          >
            📐 Couvrir
          </button>
        )}

        <button
          onClick={onToggleStyle}
          title="Basculer entre le style moderne (Atlas Antique) et le style traditionnel (Classique 1991)"
          style={{
            ...BTN_BASE,
            borderColor: style === 'atlas' ? '#c4a976' : '#556677',
            background: style === 'atlas' ? 'rgba(45, 36, 24, 0.94)' : BTN_BASE.background,
            color: style === 'atlas' ? '#ffd88a' : '#ddd',
          }}
        >
          🗺 {style === 'atlas' ? 'Atlas Antique' : 'Classique'}
        </button>

        <button
          onClick={onToggleTerrain}
          title="Afficher/masquer les terrains : 🌋 volcan · 🏛 cité · 🌊 plaine inondable"
          style={{
            ...BTN_BASE,
            borderColor: showTerrain ? '#65a30d' : '#785a28',
            background: showTerrain ? 'rgba(30, 48, 16, 0.94)' : BTN_BASE.background,
          }}
        >
          🌋 Terrains: {showTerrain ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
