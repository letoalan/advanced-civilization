import { astTrackFor, commodityById, epochs, victoryScoring } from '../../data/index.js';
import {
  advancesFaceValue,
  cardGroupsHeld,
  cityCount,
  handValue,
  miningAvailable,
  player,
} from '../helpers.js';
import { log } from '../logging.js';
import { isCalamityCard } from '../tradeHelpers.js';
import type { GameState, PlayerId } from '../types.js';

export function commodityCardCount(hand: Record<string, number>): number {
  return Object.entries(hand).reduce((t, [c, n]) => t + (!isCalamityCard(c) ? n : 0), 0);
}

/** Surrender the chosen commodity cards to the bottom of their stacks. */
export function applyDiscard(s: GameState, holder: PlayerId, cards: string[]): void {
  const p = player(s, holder);
  for (const c of cards) {
    p.hand[c] = (p.hand[c] ?? 0) - 1;
    if ((p.hand[c] ?? 0) <= 0) delete p.hand[c];
    const stack = commodityById.get(c)?.stack;
    if (stack && s.trade.stacks[stack]) s.trade.stacks[stack]!.unshift(c);
  }
  log(s, 'hand.discard', holder, `${holder} discards ${cards.length} surplus commodity card${cards.length === 1 ? '' : 's'}, keeping 8 (§31.71).`, { count: cards.length });
}

/** §31.71 default: the lowest-value `count` commodity cards (cheapest to lose). */
export function suggestDiscard(s: GameState, holder: PlayerId, count: number): string[] {
  const hand = player(s, holder).hand;
  const cards = Object.entries(hand)
    .filter(([c, n]) => !isCalamityCard(c) && n > 0)
    .flatMap(([c, n]) => Array<string>(n).fill(c))
    .sort((a, b) => (commodityById.get(a)?.value ?? 0) - (commodityById.get(b)?.value ?? 0));
  return cards.slice(0, count);
}

/** §31.71: after buying advances, each player may keep at most 8 commodity cards;
 *  the excess (the player's choice) is surrendered to the bottom of its stack. */
export function enforceHandLimit(s: GameState): boolean {
  for (const id of s.seating) {
    const over = commodityCardCount(player(s, id).hand) - 8;
    if (over > 0) { s.pendingDiscard = { holder: id, count: over }; return true; }
  }
  return false;
}

/** Epoch a given (1-based) AST space belongs to, per the nation's track. */
export function epochAfterSpace(civId: PlayerId, space: number): typeof epochs[number] {
  const track = astTrackFor(civId);
  let chosen = epochs[0]!;
  for (const e of epochs) {
    const start = track.epochStart[e.id];
    if (start != null && space >= start) chosen = e;
  }
  return chosen;
}

export function isFinishSpace(civId: PlayerId, space: number): boolean {
  return space >= astTrackFor(civId).finishSpace;
}

export function canEnterEpoch(s: GameState, id: PlayerId, epoch: typeof epochs[number], nextSpace: number): boolean {
  const p = player(s, id);
  const req = epoch.requirements;
  const cities = cityCount(s, id);
  if (req.cities && cities < req.cities) return false;
  if (req.cards && p.advances.length < req.cards) return false;
  if (req.cardGroups && cardGroupsHeld(p.advances).size < req.cardGroups) return false;
  if (req.perSpaceCardValue) {
    const track = astTrackFor(id);
    const thr = track.lateIronThresholds;
    const idx = thr ? nextSpace - (track.finishSpace - thr.length) : 0;
    const need = thr ? (idx >= 0 && idx < thr.length ? thr[idx]! : 0) : nextSpace * track.pointsPerSpace;
    if (advancesFaceValue(p.advances) < need) return false;
  }
  return true;
}

export function runAstAdjustment(s: GameState): void {
  if (enforceHandLimit(s)) return;
  for (const id of s.seating) {
    const p = player(s, id);
    const cities = cityCount(s, id);
    if (cities === 0 && p.epoch !== 'stone') {
      p.astSpace = Math.max(0, p.astSpace - 1);
      log(s, 'ast.slideback', id, `${id} has no cities — AST marker slides back to ${p.astSpace}.`, { space: p.astSpace });
      continue;
    }
    const nextSpace = p.astSpace + 1;
    const nextEpoch = epochAfterSpace(id, nextSpace);
    if (canEnterEpoch(s, id, nextEpoch, nextSpace)) {
      p.astSpace = nextSpace;
      p.epoch = nextEpoch.id;
      if (isFinishSpace(id, p.astSpace)) {
        s.finished = true;
        log(s, 'ast.finish', id, `${id} reached the finish square at AST space ${p.astSpace}!`, { space: p.astSpace });
      }
    } else {
      log(s, 'ast.frozen', id, `${id} is frozen on the AST (epoch entry requirements unmet).`, { space: p.astSpace });
    }
  }
}

/** Victory score (rules §35.1). */
export function victoryScore(state: GameState, id: PlayerId): number {
  const p = player(state, id);
  let score = 0;
  if (victoryScoring) {
    score += advancesFaceValue(p.advances);
    score += handValue(p.hand, { mining: miningAvailable(p) });
    score += p.treasury;
    score += p.astSpace * victoryScoring.pointsPerAstSpace;
    score += cityCount(state, id) * victoryScoring.pointsPerCity;
  }
  return score;
}
