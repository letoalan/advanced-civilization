import { CardFrame } from './CardFrame.js';
import { advanceById } from '../../data/index.js';
import { useTranslation } from '../i18n/index.js';
import { fr } from '../i18n/locales/fr.js';

export const ADVANCE_NAMES_FR: Record<string, string> = Object.fromEntries(
  Object.entries(fr.data.advances).map(([k, v]) => [k, v.name])
);

const GROUP_COLORS: Record<string, string> = {
  Crafts: '#d97824',
  Sciences: '#2c82c9',
  Arts: '#8e44ad',
  Civics: '#c0392b',
  Religion: '#d4af37',
};

interface AdvanceCardProps {
  id: string;
  owned?: boolean;
  effectiveCost?: number;
  isSelected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  width?: number;
  height?: number;
}

/**
 * Carte d'avance de civilisation (24 progrès classés par domaine).
 */
export function AdvanceCard({
  id,
  owned,
  effectiveCost,
  isSelected,
  disabled,
  onClick,
  width = 130,
  height = 195,
}: AdvanceCardProps) {
  const { trAdvance, t } = useTranslation();
  const adv = advanceById.get(id);
  const { name: title } = trAdvance(id);
  const primaryGroup = adv?.groups[0] ?? 'Crafts';
  const groupColor = GROUP_COLORS[primaryGroup] ?? '#ffd23f';
  const baseCost = adv?.cost ?? 50;
  const cost = effectiveCost !== undefined ? effectiveCost : baseCost;

  const translatedGroups = adv?.groups
    .map((g) => t.advances.categories[g as keyof typeof t.advances.categories] ?? g)
    .join(' / ');

  return (
    <CardFrame
      category="advances"
      id={id}
      title={title}
      badge={owned ? `${t.advances.owned} ✓` : `${cost} ${t.common.points}`}
      badgeColor={owned ? '#55c065' : groupColor}
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
      width={width}
      height={height}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, marginTop: 2 }}>
        <span style={{ color: groupColor, fontWeight: 700 }}>{translatedGroups}</span>
        {adv?.prerequisites?.length ? (
          <span style={{ color: '#bbb' }} title={`${t.advances.prerequisites} : ${adv.prerequisites.join(', ')}`}>
            Req : {adv.prerequisites[0]}
          </span>
        ) : (
          <span style={{ color: '#888' }}>Base {baseCost}</span>
        )}
      </div>
    </CardFrame>
  );
}
