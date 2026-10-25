import { CardFrame } from './CardFrame.js';
import { advanceById } from '../../data/index.js';

export const ADVANCE_NAMES_FR: Record<string, string> = {
  pottery: 'Poterie',
  clothmaking: 'Tissage',
  metalworking: 'Métallurgie',
  agriculture: 'Agriculture',
  engineering: 'Ingénierie',
  roadbuilding: 'Routes',
  mining: 'Mines',
  astronomy: 'Astronomie',
  coinage: 'Monnayage',
  medicine: 'Médecine',
  mathematics: 'Mathématiques',
  drama: 'Théâtre & Poésie',
  music: 'Musique',
  architecture: 'Architecture',
  literacy: 'Écriture',
  law: 'Droit',
  democracy: 'Démocratie',
  military: 'Armée Permanente',
  philosophy: 'Philosophie',
  mysticism: 'Mysticisme',
  deism: 'Déisme',
  enlightenment: 'Éveil Spirituel',
  monotheism: 'Monothéisme',
  theology: 'Théologie',
};

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
  const adv = advanceById.get(id);
  const titleFr = ADVANCE_NAMES_FR[id] ?? adv?.name ?? id;
  const primaryGroup = adv?.groups[0] ?? 'Crafts';
  const groupColor = GROUP_COLORS[primaryGroup] ?? '#ffd23f';
  const baseCost = adv?.cost ?? 50;
  const cost = effectiveCost !== undefined ? effectiveCost : baseCost;

  return (
    <CardFrame
      category="advances"
      id={id}
      title={titleFr}
      subtitle={adv?.name && adv.name !== titleFr ? adv.name : undefined}
      badge={owned ? 'Acquis ✓' : `${cost} pts`}
      badgeColor={owned ? '#55c065' : groupColor}
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
      width={width}
      height={height}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, marginTop: 2 }}>
        <span style={{ color: groupColor, fontWeight: 700 }}>{adv?.groups.join(' / ')}</span>
        {adv?.prerequisites?.length ? (
          <span style={{ color: '#bbb' }} title={`Prérequis : ${adv.prerequisites.join(', ')}`}>Req : {adv.prerequisites[0]}</span>
        ) : (
          <span style={{ color: '#888' }}>Base {baseCost}</span>
        )}
      </div>
    </CardFrame>
  );
}
