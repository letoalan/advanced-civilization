import { CardFrame } from './CardFrame.js';
import { calamityById } from '../../data/index.js';
import { useTranslation } from '../i18n/index.js';
import { fr } from '../i18n/locales/fr.js';

export const CALAMITY_NAMES_FR: Record<string, string> = Object.fromEntries(
  Object.entries(fr.data.calamities).map(([k, v]) => [k, v.name])
);

interface CalamityCardProps {
  id: string;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
}

/**
 * Carte de calamité (12 fléaux, 4 non-négociables et 8 négociables).
 */
export function CalamityCard({
  id,
  isSelected,
  disabled,
  onClick,
  width = 130,
  height = 195,
}: CalamityCardProps) {
  const { trCalamity, t, lang } = useTranslation();
  const cal = calamityById.get(id);
  const { name: title } = trCalamity(id);
  const isTradable = cal?.tradable ?? false;
  const badgeText = isTradable ? t.calamity.tradable : t.calamity.nonTradable;
  const badgeColor = isTradable ? '#55c065' : '#e05555';

  const stackLabel = lang === 'de' ? `Stapel ${cal?.level ?? 2}` : lang === 'es' ? `Pila ${cal?.level ?? 2}` : lang === 'en' ? `Stack ${cal?.level ?? 2}` : `Pile ${cal?.level ?? 2}`;
  const severityLabel = lang === 'de' ? 'Schweregrad' : lang === 'es' ? 'Severidad' : lang === 'en' ? 'Severity' : 'Gravité';

  return (
    <CardFrame
      category="calamities"
      id={id}
      title={title}
      badge={stackLabel}
      badgeColor="#e07777"
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
      width={width}
      height={height}
    >
      {width >= 75 ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: width < 90 ? 8.5 : 10, marginTop: 1 }}>
          <span style={{ color: badgeColor, fontWeight: 700 }}>{badgeText}</span>
          <span style={{ color: '#aaa' }}>{severityLabel} {cal?.severity ?? 1}</span>
        </div>
      ) : (
        <div style={{ fontSize: 7.5, color: badgeColor, fontWeight: 700, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isTradable ? '⚡ ' + t.calamity.tradable : '⛔ ' + t.calamity.nonTradable}
        </div>
      )}
    </CardFrame>
  );
}
