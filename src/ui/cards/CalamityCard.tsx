import { CardFrame } from './CardFrame.js';
import { calamityById } from '../../data/index.js';

export const CALAMITY_NAMES_FR: Record<string, string> = {
  volcano: 'Éruption / Séisme',
  treachery: 'Trahison',
  famine: 'Famine',
  superstition: 'Superstition',
  civilwar: 'Guerre Civile',
  slaverevolt: "Révolte d'Esclaves",
  flood: 'Inondation',
  barbarianhordes: 'Hordes Barbares',
  epidemic: 'Épidémie',
  civildisorder: 'Désordre Civil',
  iconoclasm: 'Iconoclasme & Hérésie',
  piracy: 'Piraterie',
};

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
  const cal = calamityById.get(id);
  const titleFr = CALAMITY_NAMES_FR[id] ?? cal?.name ?? id;
  const isTradable = cal?.tradable ?? false;
  const badgeText = isTradable ? 'Négociable' : 'Non-négociable';
  const badgeColor = isTradable ? '#55c065' : '#e05555';

  return (
    <CardFrame
      category="calamities"
      id={id}
      title={titleFr}
      subtitle={cal?.name && cal.name !== titleFr ? cal.name : undefined}
      badge={`Pile ${cal?.level ?? 2}`}
      badgeColor="#e07777"
      isSelected={isSelected}
      disabled={disabled}
      onClick={onClick}
      width={width}
      height={height}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, marginTop: 2 }}>
        <span style={{ color: badgeColor, fontWeight: 700 }}>{badgeText}</span>
        <span style={{ color: '#aaa' }}>Gravité {cal?.severity ?? 1}</span>
      </div>
    </CardFrame>
  );
}
