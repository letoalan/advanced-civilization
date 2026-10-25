import { areaById } from '../../data/index.js';
import { citySiteIn, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has, setTokens } from '../primitives.js';
import { markCityAcquired } from './surplus.js';
import type { GameState, PlayerId } from '../types.js';

export function applyBuildCity(s: GameState, actor: PlayerId, area: string, useTreasury = 0): void {
  const p = player(s, actor);
  const a = s.areas[area];
  if (!a) throw new Error('build city: empty area');
  if (a.city) throw new Error('build city: area already has a city');
  if (p.citiesAvailable <= 0) throw new Error('no cities available');
  if (areaById.get(area)?.isWater) throw new Error('cannot build a city at sea');
  const onBoard = a.tokens[actor] ?? 0;
  const required = citySiteIn(s, area) ? 6 : 12;
  const architecture = has(p, 'architecture') && !p.builtWithTreasuryThisTurn;
  const treasuryUsed = architecture ? Math.min(useTreasury, Math.floor(required / 2), p.treasury) : 0;
  if (treasuryUsed > 0 && Object.entries(a.tokens).some(([o, n]) => o !== actor && (n ?? 0) > 0)) {
    throw new Error('Architecture cannot build a city where another player or Barbarians have tokens (§25.3)');
  }
  if (onBoard + treasuryUsed < required) throw new Error(`build city: need ${required} tokens in ${area}`);
  const fromBoard = Math.min(onBoard, required - treasuryUsed);
  setTokens(s, area, actor, onBoard - fromBoard);
  p.stock += fromBoard;
  p.treasury -= treasuryUsed;
  p.stock += treasuryUsed;
  if (treasuryUsed > 0) p.builtWithTreasuryThisTurn = true;
  a.city = actor;
  p.citiesAvailable -= 1;
  markCityAcquired(s, actor, area);
  log(s, 'city.build', actor, `${actor} built a city in ${areaName(area)}${treasuryUsed > 0 ? ` (Architecture: ${treasuryUsed} from treasury)` : ''}.`, { area, treasuryUsed });
}
