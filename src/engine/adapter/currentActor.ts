import { actingPlayer } from '../helpers.js';
import { civilWarActor } from '../calamity/calamityCivilWar.js';
import { tradeActor } from '../phases/tradeNegotiation.js';
import { AUTO_PHASES } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

export function currentActor(state: GameState): PlayerId | null {
  if (state.pendingStart) return state.pendingStart.order[0] ?? null;
  if (state.ninthStack?.awaiting) return state.ninthStack.order[state.ninthStack.at] ?? null;
  if (state.finished && state.phase === 'taxation') return null;
  if (state.pendingDiscard) return state.pendingDiscard.holder;
  if (state.pendingPillage?.length) return state.pendingPillage[0]!.attacker;
  if (state.pendingSupport) return state.pendingSupport.holder;
  if (AUTO_PHASES.has(state.phase)) return null;
  if (state.pendingCityChoice) return state.pendingCityChoice.holder;
  if (state.pendingUnitLoss) return state.pendingUnitLoss.holder;
  if (state.pendingAllocation) return state.pendingAllocation.holder;
  if (state.pendingCivilWar) return civilWarActor(state.pendingCivilWar);
  if (state.pendingPick) return state.pendingPick.chooser;
  if (state.phase === 'trade') return tradeActor(state);
  return actingPlayer(state);
}
