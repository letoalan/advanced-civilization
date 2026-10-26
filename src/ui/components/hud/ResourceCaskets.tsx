import { PopIcon, CityIcon, ShipIcon, TreasuryIcon } from '../../theme/icons/index.js';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber.js';
import type { PlayerState } from '../../../engine/types.js';

interface ResourceCasketsProps {
  player: PlayerState;
  boardTokens: number;
  boardCities: number;
  boardShips: number;
}

export function ResourceCaskets({ player, boardTokens, boardCities, boardShips }: ResourceCasketsProps) {
  const animTokens = useAnimatedNumber(boardTokens);
  const animCities = useAnimatedNumber(boardCities);
  const animShips = useAnimatedNumber(boardShips);
  const animTreasury = useAnimatedNumber(player.treasury);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
      {/* Population */}
      <div className="glass-casket" title={`Population sur le plateau : ${boardTokens} (Stock restant : ${player.stock})`}>
        <PopIcon size={14} color="#ffd23f" />
        <span>{animTokens}</span>
        <span style={{ opacity: 0.45, fontSize: 10 }}>/55</span>
      </div>

      {/* Cities */}
      <div className="glass-casket" title={`Cités bâties : ${boardCities} / 9`}>
        <CityIcon size={14} color="#ffd23f" />
        <span>{animCities}</span>
        <span style={{ opacity: 0.45, fontSize: 10 }}>/9</span>
      </div>

      {/* Ships */}
      <div className="glass-casket" title={`Navires à flot : ${boardShips} / 4`}>
        <ShipIcon size={14} color="#60a5fa" />
        <span>{animShips}</span>
        <span style={{ opacity: 0.45, fontSize: 10 }}>/4</span>
      </div>

      {/* Treasury */}
      <div className="glass-casket" title={`Trésor impérial : ${player.treasury} or`}>
        <TreasuryIcon size={14} color="#ffd54f" />
        <span style={{ color: '#ffd54f', fontWeight: 700 }}>{animTreasury}</span>
      </div>
    </div>
  );
}
