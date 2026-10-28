import { CardFrame } from './CardFrame.js';
import { commodityById } from '../../data/index.js';
import { useTranslation } from '../i18n/index.js';
import { fr } from '../i18n/locales/fr.js';

export const COMMODITY_NAMES_FR: Record<string, string> = fr.data.commodities;

interface CommodityCardProps {
  id: string;
  count?: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
}

/**
 * Carte de marchandise (18 produits, 9 piles).
 */
export function CommodityCard({
  id,
  count,
  isSelected,
  disabled,
  onClick,
  width = 130,
  height = 195,
}: CommodityCardProps) {
  const { trCommodity, lang, t } = useTranslation();
  const comm = commodityById.get(id);
  const title = trCommodity(id);
  const value = comm?.value ?? 1;
  const stack = comm?.stack ?? 1;
  const setValue = count && count > 0 ? count * count * value : value;

  const stackLabel = lang === 'de' ? `Stapel ${stack}` : lang === 'es' ? `Pila ${stack}` : lang === 'en' ? `Stack ${stack}` : `Pile ${stack}`;
  const setLabel = lang === 'en' ? 'Set' : lang === 'de' ? 'Set' : lang === 'es' ? 'Serie' : 'Série';

  return (
    <CardFrame
      category="commodities"
      id={id}
      title={title}
      badge={stackLabel}
      badgeColor="#ffd23f"
      count={count}
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
      width={width}
      height={height}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#bbb', marginTop: 2 }}>
        <span>Val. : {value}</span>
        {count && count > 1 ? (
          <span style={{ color: '#ffd23f', fontWeight: 800 }}>{setLabel} : {setValue} {t.common.points}</span>
        ) : (
          <span>max {comm?.count ?? 7}</span>
        )}
      </div>
    </CardFrame>
  );
}
