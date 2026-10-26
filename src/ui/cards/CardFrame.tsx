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
  const imageSrc = `/medias/images/${category}/${id}.png`;

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      style={{
        width,
        height,
        position: 'relative',
        borderRadius: 8,
        border: isSelected ? '2px solid var(--civ-gold-base)' : '1px solid var(--civ-gold-border-subtle)',
        boxShadow: isSelected ? '0 0 14px rgba(212, 175, 55, 0.6)' : 'var(--civ-glass-shadow)',
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.45 : 1,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        transform: isSelected ? 'translateY(-3px)' : 'none',
        overflow: 'hidden',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: CATEGORY_BACKGROUNDS[category] || '#10141b',
        color: 'var(--civ-marble)',
        boxSizing: 'border-box',
      }}
    >
      {/* Badge supérieur droit (ex: pile, coût, sévérité) */}
      {badge !== undefined && (
        <div
          style={{
            position: 'absolute',
            top: width < 80 ? 3 : 5,
            right: width < 80 ? 3 : 5,
            background: 'rgba(10, 13, 18, 0.88)',
            border: `1px solid ${badgeColor}`,
            color: badgeColor,
            fontWeight: 800,
            fontSize: width < 80 ? 9 : 10.5,
            padding: width < 80 ? '1px 4px' : '2px 6px',
            borderRadius: 3,
            zIndex: 3,
            lineHeight: 1,
          }}
        >
          {width < 75 && typeof badge === 'string' && badge.startsWith('Pile ')
            ? `P.${badge.slice(5)}`
            : badge}
        </div>
      )}

      {/* Badge de quantité (ex: x3 en main) */}
      {count !== undefined && count > 1 && (
        <div
          style={{
            position: 'absolute',
            top: width < 80 ? 3 : 5,
            left: width < 80 ? 3 : 5,
            background: 'var(--civ-gold-base)',
            color: '#10141b',
            fontWeight: 900,
            fontSize: width < 80 ? 9 : 10.5,
            padding: width < 80 ? '1px 4px' : '2px 6px',
            borderRadius: 3,
            zIndex: 3,
            lineHeight: 1,
            boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          ×{count}
        </div>
      )}

      {/* Contenu visuel : Image si présente, sinon Repli CSS vectoriel */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!imageError ? (
          <img
            src={imageSrc}
            alt={title}
            onError={() => setImageError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 6, textAlign: 'center', width: '100%', height: '100%' }}>
            <span style={{ fontSize: width < 80 ? 20 : 30, marginBottom: 2 }}>{CATEGORY_ICONS[category] || '🎴'}</span>
            <div style={{ fontSize: width < 80 ? 10 : 12, fontWeight: 800, color: 'var(--civ-gold-light)', maxWidth: '92%' }}>{title}</div>
            {subtitle && width >= 80 && <div style={{ fontSize: 9, color: 'var(--civ-stone-muted)', marginTop: 2 }}>{subtitle}</div>}
          </div>
        )}
      </div>

      {/* Cartouche d'informations inférieures : Toujours afficher le titre en clair */}
      <div
        style={{
          background: 'rgba(10, 13, 18, 0.94)',
          backdropFilter: 'blur(4px)',
          borderTop: '1px solid var(--civ-gold-border-subtle)',
          padding: width < 80 ? '2px 4px' : '3px 6px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: width < 75 ? 9 : width < 100 ? 10 : 11,
            fontWeight: 700,
            color: 'var(--civ-gold-light)',
            fontFamily: 'var(--civ-font-display)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: 0.3,
          }}
          title={title}
        >
          {title}
        </div>
        {children}
      </div>
    </div>
  );
}
