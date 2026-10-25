import { advanceById } from '../../data/index.js';
import {
  actingPlayer,
  astOrder,
  censusOrder,
  creditTowards,
  handValue,
  miningAvailable,
  player,
  populationCount,
} from '../helpers.js';
import { log } from '../logging.js';
import { AUTO_PHASES, has } from '../primitives.js';
import { militaryLast, runCensus } from './census.js';
import { runConflict } from './conflict.js';
import { checkCitySupport, runRemoveSurplus } from './surplus.js';
import { closeNinthWindow, runTradeAcquisition } from './tradeAcquisition.js';
import { runAstAdjustment } from './ast.js';
import { spendableHand } from './advances.js';
import { tradableCards, tradeActor, tradePhaseEnded } from './tradeNegotiation.js';
import { payShipMaintenance, setupShipMaintenance } from './ships.js';
import { collectTax, resolvePendingRevolts, setupTaxation } from './taxation.js';
import { setupPopulationExpansion } from './expansion.js';
import { runCalamity } from '../calamity/calamityRunner.js';
import { setupCalamityConversion } from './monotheism.js';
import { legalActions } from '../adapter/legalActions.js';
import { PHASE_ORDER, type GameState, type Phase, type PlayerId, type PlayerState } from '../types.js';

export const PHASE_NAME: Partial<Record<Phase, string>> = {
  cityConstruction: 'city building',
  acquireAdvances: 'buying advances',
  shipConstruction: 'ship building',
  trade: 'trading',
};

export function nextPhase(phase: Phase): Phase {
  const i = PHASE_ORDER.indexOf(phase);
  return PHASE_ORDER[(i + 1) % PHASE_ORDER.length]!;
}

export function runAutoPhase(s: GameState): void {
  switch (s.phase) {
    case 'census': return runCensus(s);
    case 'conflict': return runConflict(s);
    case 'removeSurplus': return runRemoveSurplus(s);
    case 'tradeAcquisition': return runTradeAcquisition(s);
    case 'astAdjustment': return runAstAdjustment(s);
  }
}

export function enterPhase(s: GameState, phase: Phase): void {
  s.phase = phase;
  if (phase === 'astAdjustment') return;
  if (!AUTO_PHASES.has(phase)) {
    const census = s.censusOrder?.length ? s.censusOrder : (s.activeOrder.length ? s.activeOrder : censusOrder(s));
    const astPhases = phase === 'taxation' || phase === 'populationExpansion' || phase === 'calamity' || phase === 'acquireAdvances';
    s.activeOrder = (phase === 'movement' || phase === 'shipConstruction') ? militaryLast(s, census)
      : astPhases ? astOrder(s)
      : [...census];
    s.actedThisPhase = [];
    if (phase === 'trade') {
      const opener = Math.max(0, s.turn - 1) % Math.max(1, s.activeOrder.length);
      s.negotiation = { turnPointer: opener, passStreak: 0, actions: 0, nextOfferId: 0, done: [], offers: [], completed: [], waitStreak: 0 };
    }
    if (phase === 'shipConstruction') setupShipMaintenance(s);
    if (phase === 'taxation') setupTaxation(s);
    if (phase === 'calamity') { runCalamity(s); if (!s.calamityActive) setupCalamityConversion(s); }
    if (phase === 'acquireAdvances') checkCitySupport(s);
    if (phase === 'populationExpansion') { if (resolvePendingRevolts(s)) return; setupPopulationExpansion(s); }
  }
}

export function applyPass(s: GameState, actor: PlayerId, skipped?: string): void {
  if (s.ninthStack?.awaiting) {
    log(s, 'trade.buyNinth.skip', actor, `${actor} buys nothing from the ninth stack.`, {});
    closeNinthWindow(s);
    return;
  }
  if (s.phase === 'populationExpansion' && (s.expansion?.remaining[actor] ?? 0) > 0
    && Object.values(s.expansion?.caps[actor] ?? {}).some((c) => c > 0) && player(s, actor).stock > 0) {
    throw new Error('population expansion is automatic and may not be voluntarily curtailed (§20.2)');
  }
  if (skipped) log(s, 'phase.skip', actor, `${actor} skips ${PHASE_NAME[s.phase] ?? s.phase} — ${skipped}.`, { phase: s.phase, reason: skipped });
  if (s.phase === 'trade') {
    s.negotiation.done = [...(s.negotiation.done ?? []), actor].filter((p, i, a) => a.indexOf(p) === i);
    s.negotiation.passStreak += 1;
    s.negotiation.turnPointer += 1;
  } else if (!s.actedThisPhase.includes(actor)) {
    if (s.phase === 'taxation') collectTax(s, actor, 2);
    if (s.phase === 'shipConstruction') payShipMaintenance(s, actor);
    if (!skipped && (s.phase === 'movement' || s.phase === 'cityConstruction' || s.phase === 'acquireAdvances')) {
      const bought = (player(s, actor).advancesThisTurn ?? []).length;
      const what = s.phase === 'movement' ? 'no moves made this phase' : s.phase === 'cityConstruction' ? 'no city built this phase'
        : bought > 0 ? `done buying advances (${bought} bought this turn)` : 'no advances bought this phase';
      log(s, 'phase.pass', actor, `${actor} passed — ${what}.`, {});
    }
    s.actedThisPhase.push(actor);
  }
}

export function closestAdvanceNote(p: PlayerState): string {
  const creditEligible = p.advances.filter((a) => !(p.advancesThisTurn ?? []).includes(a));
  const have = handValue(spendableHand(p), { mining: miningAvailable(p) }) + p.treasury;
  let best: { name: string; need: number } | null = null;
  for (const adv of advanceById.values()) {
    if (has(p, adv.id)) continue;
    if ((adv.prerequisites ?? []).some((pre) => !has(p, pre) || (p.advancesThisTurn ?? []).includes(pre))) continue;
    const need = adv.cost - creditTowards(creditEligible, adv.id);
    if (!best || need < best.need) best = { name: adv.name, need };
  }
  return best ? ` (cheapest: ${best.name} at ${best.need} after credits; cards and treasury total ${have})` : '';
}

export function forcedSkip(s: GameState): { actor: PlayerId; reason: string } | null {
  if (!s.autoSkip) return null;
  if (s.pendingStart || s.ninthStack?.awaiting || s.pendingDiscard || s.pendingPillage?.length || s.pendingSupport
    || s.pendingCityChoice || s.pendingUnitLoss || s.pendingAllocation || s.pendingCivilWar || s.pendingPick || s.pendingSecondary) return null;
  if (s.phase === 'trade') {
    const actor = tradeActor(s);
    if (!actor) return null;
    if (tradableCards(s, actor) < 3) return { actor, reason: 'fewer than three tradable cards (§28.3)' };
    const done = s.negotiation.done ?? [];
    const partners = s.activeOrder.filter((id) => id !== actor && !done.includes(id) && tradableCards(s, id) >= 3);
    if (partners.length === 0) return { actor, reason: 'no one else still trading has three cards' };
    return null;
  }
  if (s.phase !== 'cityConstruction' && s.phase !== 'acquireAdvances' && s.phase !== 'shipConstruction') return null;
  const actor = actingPlayer(s);
  if (!actor) return null;
  const legal = legalActions(s, actor);
  if (!legal.length || legal.some((a) => a.type !== 'pass')) return null;
  const reason = s.phase === 'cityConstruction' ? 'no city can be built'
    : s.phase === 'acquireAdvances' ? ((player(s, actor).advancesThisTurn ?? []).length ? 'nothing more is affordable' : 'no advance is affordable') + closestAdvanceNote(player(s, actor))
    : 'no ship can be built';
  return { actor, reason };
}

export function normalize(s: GameState): void {
  let guard = 0;
  while (guard++ < 1000) {
    if (s.pendingStart) return;
    if (s.finished && s.phase === 'taxation') return;
    if (AUTO_PHASES.has(s.phase)) {
      runAutoPhase(s);
      if (s.pendingDiscard || s.pendingSupport || s.pendingPillage?.length || s.ninthStack?.awaiting) return;
      const np = nextPhase(s.phase);
      if (np === 'taxation') {
        if (s.finished || (s.maxTurns && s.turn >= s.maxTurns)) { s.phase = 'taxation'; return; }
        s.turn += 1;
        s.censusOrder = s.activeOrder = censusOrder(s);
        s.actedThisPhase = [];
        log(s, 'census.order', null, `Turn ${s.turn} census: ${s.censusOrder.map((id) => `${id} ${populationCount(s, id)}`).join(', ')} (§21).`, { order: [...s.censusOrder], populations: Object.fromEntries(s.censusOrder.map((id) => [id, populationCount(s, id)])) });
        for (const id of s.seating) {
          const q = player(s, id);
          q.convertedThisTurn = false;
          q.builtWithTreasuryThisTurn = false;
          q.grainLockedThisTurn = 0;
          q.miningUsedThisTurn = false;
          q.citiesBuiltThisTurn = [];
          q.advancesThisTurn = [];
        }
      }
      enterPhase(s, np);
      continue;
    }
    if (s.phase === 'trade') {
      if (tradePhaseEnded(s)) { enterPhase(s, nextPhase(s.phase)); continue; }
      const skip = forcedSkip(s);
      if (skip) { applyPass(s, skip.actor, skip.reason); continue; }
      return;
    }
    if (actingPlayer(s) == null) {
      enterPhase(s, nextPhase(s.phase));
      continue;
    }
    const skip = forcedSkip(s);
    if (skip) { applyPass(s, skip.actor, skip.reason); continue; }
    return;
  }
  throw new Error('normalize: phase loop did not converge');
}
