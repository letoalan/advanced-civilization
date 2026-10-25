import { useState, type ReactNode } from 'react';

export interface CardFrameProps {
  category: 'commodities' | 'calamities' | 'advances';
  id: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  badgeColor?: string;
  count?: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  width?: number;
  height?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  commodities: '🏺',
  calamities: '⚡',
  advances: '📜',
};

const CATEGORY_BACKGROUNDS: Record<string, string> = {
  commodities: 'linear-gradient(145deg, #1f271b, #111a0d)',
  calamities: 'linear-gradient(145deg, #301313, #1c0808)',
  advances: 'linear-gradient(145deg, #1b212f, #0d121c)',
};

/**
 * Cadre de carte universel avec gestion d'image locale et repli CSS stylisé.
 */
export function CardFrame({
  category,
  id,
  title,
  subtitle,
  badge,
  badgeColor = '#ffd23f',
  count,
  isSelected,
  disabled,
  onClick,
  children,
  width = 140,
  height = 210,
}: CardFrameProps) {
  const [imageError, setImageError] = useState(false);
  const imageSrc = `/assets/cards/${category}/${id}.webp`;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: 8,
        border: isSelected ? '2px solid #ffd23f' : '1px solid #7a5a2a',
        boxShadow: isSelected ? '0 0 12px rgba(255, 210, 63, 0.6)' : '0 4px 10px rgba(0,0,0,0.5)',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isSelected ? 'translateY(-3px)' : 'none',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: CATEGORY_BACKGROUNDS[category] || '#181410',
        color: '#eee',
        boxSizing: 'border-box',
      }}
    >
      {/* Badge supérieur droit (ex: pile, coût, sévérité) */}
      {badge !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(10, 8, 6, 0.85)',
            border: `1px solid ${badgeColor}`,
            color: badgeColor,
            fontWeight: 800,
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            zIndex: 3,
            lineHeight: 1,
          }}
        >
          {badge}
        </div>
      )}

      {/* Badge de quantité (ex: x3 en main) */}
      {count !== undefined && count > 1 && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: '#ffd23f',
            color: '#1a1005',
            fontWeight: 900,
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            zIndex: 3,
            lineHeight: 1,
          }}
        >
          ×{count}
        </div>
      )}

      {/* Contenu visuel : Image si présente, sinon Repli CSS vectoriel */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {!imageError ? (
          <img
            src={imageSrc}
            alt={title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 8, textAlign: 'center', width: '100%', height: '100%' }}>
            <span style={{ fontSize: 32, marginBottom: 4 }}>{CATEGORY_ICONS[category] || '🎴'}</span>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f3e8cb', maxWidth: '90%' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 10, color: '#b5a585', marginTop: 2 }}>{subtitle}</div>}
          </div>
        )}
      </div>

      {/* Cartouche d'informations inférieures */}
      <div
        style={{
          background: 'rgba(16, 12, 8, 0.92)',
          borderTop: '1px solid #5a3c1c',
          padding: '4px 6px',
          minHeight: 38,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#e8dcba', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
