import { CardFrame } from './CardFrame.js';
import { commodityById } from '../../data/index.js';

export const COMMODITY_NAMES_FR: Record<string, string> = {
  ochre: 'Ocre',
  hides: 'Peaux',
  iron: 'Fer',
  papyrus: 'Papyrus',
  salt: 'Sel',
  timber: 'Bois',
  grain: 'Céréales',
  oil: 'Huile',
  cloth: 'Tissu',
  wine: 'Vin',
  bronze: 'Bronze',
  silver: 'Argent',
  resin: 'Résine',
  spices: 'Épices',
  dye: 'Teinture',
  gems: 'Pierres précieuses',
  gold: 'Or',
  ivory: 'Ivoire',
};

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
  const comm = commodityById.get(id);
  const titleFr = COMMODITY_NAMES_FR[id] ?? comm?.name ?? id;
  const subtitle = comm?.name && comm.name !== titleFr ? comm.name : undefined;
  const value = comm?.value ?? 1;
  const stack = comm?.stack ?? 1;
  const setValue = count && count > 0 ? count * count * value : value;

  return (
    <CardFrame
      category="commodities"
      id={id}
      title={titleFr}
      subtitle={subtitle}
      badge={`Pile ${stack}`}
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
          <span style={{ color: '#ffd23f', fontWeight: 800 }}>Série : {setValue} pts</span>
        ) : (
          <span>max {comm?.count ?? 7}</span>
        )}
      </div>
    </CardFrame>
  );
}
