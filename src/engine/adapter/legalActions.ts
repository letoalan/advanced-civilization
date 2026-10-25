import { FULL_BOARD, startAreasFor } from '../boards.js';
import { advanceById, areaById } from '../../data/index.js';
import {
  citySiteIn,
  creditTowards,
  handValue,
  miningAvailable,
  navalDestinations,
  neighbors,
  player,
} from '../helpers.js';
import { has, isCoastal } from '../primitives.js';
import { currentActor } from './currentActor.js';
import { scrappableShips, shipCount } from '../phases/ships.js';
import { spendableHand } from '../phases/advances.js';
import { monotheismTargets } from '../phases/monotheism.js';
import { suggestDiscard } from '../phases/ast.js';
import { suggestSupportReduce } from '../phases/surplus.js';
import { grainCards, suggestAllocation, suggestCities, suggestUnits } from '../calamity/calamityPicks.js';
import { suggestPick } from '../calamity/calamityNamedPicks.js';
import { civilWarActor, suggestCivilWarSelect, unitSetPoints } from '../calamity/calamityCivilWar.js';
import type { Action, GameState, PlayerId } from '../types.js';

export function legalActions(state: GameState, actor: PlayerId): Action[] {
  if (currentActor(state) !== actor) return [];
  if (state.pendingStart) return startAreasFor(state.board ?? FULL_BOARD, actor).map((area) => ({ type: 'placeStart', area }) as Action);
  if (state.ninthStack?.awaiting) {
    const p9 = player(state, actor);
    const max = Math.min(Math.floor(p9.treasury / 18), state.trade.stacks[9]?.length ?? 0);
    return [{ type: 'pass' } as Action, ...Array.from({ length: max }, (_, i) => ({ type: 'buyTradeCard', count: i + 1 }) as Action)];
  }
  const p = player(state, actor);
  if (state.pendingDiscard && state.pendingDiscard.holder === actor) {
    return [{ type: 'chooseDiscard', cards: suggestDiscard(state, actor, state.pendingDiscard.count) }];
  }
  if (state.pendingPillage?.length && state.pendingPillage[0]!.attacker === actor) {
    const max = state.pendingPillage[0]!.taken;
    return Array.from({ length: max + 1 }, (_, n) => ({ type: 'pillage', count: max - n }) as Action);
  }
  if (state.pendingSupport && state.pendingSupport.holder === actor) {
    return [{ type: 'chooseCities', areas: [suggestSupportReduce(state, state.pendingSupport)] }];
  }
  if (state.pendingPick && state.pendingPick.chooser === actor) {
    return [{ type: 'pickAreas', areas: suggestPick(state, state.pendingPick) }];
  }
  const growthOwed = state.phase === 'populationExpansion'
    && (state.expansion?.remaining[actor] ?? 0) > 0
    && Object.values(state.expansion?.caps[actor] ?? {}).some((c) => c > 0)
    && p.stock > 0;
  const out: Action[] = growthOwed ? [] : [{ type: 'pass' }];
  switch (state.phase) {
    case 'taxation': {
      for (const rate of [1, 2, 3]) out.push({ type: 'setTaxRate', rate });
      break;
    }
    case 'populationExpansion': {
      const caps = state.expansion?.caps[actor] ?? {};
      if ((state.expansion?.remaining[actor] ?? 0) > 0) {
        for (const [aid, cap] of Object.entries(caps)) if (cap > 0) out.push({ type: 'placeTokens', placements: { [aid]: 1 } });
      }
      if (Object.values(state.expansion?.placed?.[actor] ?? {}).some((n) => n > 0)) out.push({ type: 'resetPlacement' });
      break;
    }
    case 'shipConstruction': {
      const inPlay = shipCount(state, actor);
      if (p.shipsAvailable > 0 && inPlay < 4) {
        for (const [aid, a] of Object.entries(state.areas)) {
          if (!isCoastal(state, aid)) continue;
          const occupies = (a.tokens[actor] ?? 0) > 0 || a.city === actor;
          if (occupies && (a.tokens[actor] ?? 0) + p.treasury >= 2) {
            if ((a.tokens[actor] ?? 0) > 0) out.push({ type: 'buildShips', builds: [{ area: aid, count: 1, payFrom: 'area' }] });
            if (p.treasury > 0) out.push({ type: 'buildShips', builds: [{ area: aid, count: 1, payFrom: 'treasury' }] });
            if ((a.tokens[actor] ?? 0) >= 2 && p.treasury >= 2) out.push({ type: 'buildShips', builds: [{ area: aid, count: 1, payFrom: 'split' }] });
          }
        }
      }
      for (const aid of Object.keys(state.areas)) if (scrappableShips(state, actor, aid) > 0) out.push({ type: 'scrapShip', area: aid });
      for (const [aid, a] of Object.entries(state.areas)) if (scrappableShips(state, actor, aid) > 0 && (a.tokens[actor] ?? 0) > 0) out.push({ type: 'maintainShip', area: aid });
      if (state.shipSteps?.[actor]?.length) out.push({ type: 'undoShip' });
      break;
    }
    case 'movement': {
      for (const [aid, a] of Object.entries(state.areas)) {
        const t = a.tokens[actor] ?? 0;
        if (t > 0) {
          const adj = neighbors(state, aid);
          for (const nb of adj) {
            if (areaById.get(nb)?.isWater) continue;
            out.push({ type: 'move', moves: [{ from: aid, to: nb, count: t }] });
          }
          if (has(p, 'roadbuilding')) {
            for (const via of adj) {
              const vArea = areaById.get(via);
              if (!vArea || vArea.isWater) continue;
              const va = state.areas[via];
              if (va && (Object.entries(va.tokens).some(([o, n]) => o !== actor && (n ?? 0) > 0) || (va.city && va.city !== actor))) continue;
              for (const to of neighbors(state, via)) {
                if (to === aid || adj.includes(to) || areaById.get(to)?.isWater) continue;
                out.push({ type: 'move', moves: [{ from: aid, to, count: t, via }] });
              }
            }
          }
        }
        if ((a.ships?.[actor] ?? 0) > 0) {
          const range = 4 + (has(p, 'clothmaking') ? 1 : 0);
          for (const to of navalDestinations(state, aid, range, has(p, 'astronomy'))) {
            out.push({ type: 'move', moves: [{ from: aid, to, count: Math.min(5, t), byShip: true }] });
          }
        }
      }
      break;
    }
    case 'cityConstruction': {
      for (const [aid, a] of Object.entries(state.areas)) {
        if (a.city) continue;
        const area = areaById.get(aid);
        if (!area || area.isWater) continue;
        const required = citySiteIn(state, aid) ? 6 : 12;
        const onBoard = a.tokens[actor] ?? 0;
        const shared = Object.entries(a.tokens).some(([o, n]) => o !== actor && (n ?? 0) > 0);
        const arch = has(p, 'architecture') && !p.builtWithTreasuryThisTurn && !shared;
        const maxTreasury = arch ? Math.min(Math.floor(required / 2), p.treasury) : 0;
        const reachable = onBoard + maxTreasury >= required;
        if (reachable && p.citiesAvailable > 0) {
          out.push({ type: 'buildCity', area: aid, useTreasury: Math.max(0, Math.min(maxTreasury, required - onBoard)) });
        }
      }
      break;
    }
    case 'acquireAdvances': {
      const commHand = spendableHand(p);
      const creditEligible = p.advances.filter((a) => !(p.advancesThisTurn ?? []).includes(a));
      for (const adv of advanceById.values()) {
        if (has(p, adv.id)) continue;
        if ((adv.prerequisites ?? []).some((pre) => !has(p, pre) || (p.advancesThisTurn ?? []).includes(pre))) continue;
        const credit = creditTowards(creditEligible, adv.id);
        const maxPay = handValue(commHand, { mining: miningAvailable(p) }) + p.treasury + credit;
        if (maxPay >= adv.cost) {
          out.push({ type: 'buyAdvance', advance: adv.id, spendCommodities: { ...commHand }, spendTreasury: Math.max(0, Math.min(p.treasury, adv.cost - credit - handValue(commHand, { mining: miningAvailable(p) }))) });
        }
      }
      break;
    }
    case 'calamity': {
      if (state.pendingCityChoice && state.pendingCityChoice.holder === actor) {
        return [{ type: 'chooseCities', areas: suggestCities(state, actor, state.pendingCityChoice.count) }];
      }
      if (state.pendingUnitLoss && state.pendingUnitLoss.holder === actor) {
        const pul = state.pendingUnitLoss;
        if (pul.calamityId === 'famine' && has(p, 'pottery')) {
          const commit = Math.min(Math.max(0, grainCards(p) - (p.grainLockedThisTurn ?? 0)), Math.ceil(pul.points / 4));
          const reduced = { ...pul, points: Math.max(0, pul.points - 4 * commit) };
          return [{ type: 'chooseUnits', ...suggestUnits(state, reduced), grainCommit: commit }];
        }
        return [{ type: 'chooseUnits', ...suggestUnits(state, pul) }];
      }
      if (state.pendingAllocation && state.pendingAllocation.holder === actor) {
        return [{ type: 'allocateLoss', allocation: suggestAllocation(state, state.pendingAllocation) }];
      }
      if (state.pendingCivilWar && civilWarActor(state.pendingCivilWar) === actor) {
        const cw = state.pendingCivilWar;
        if (cw.stage === 'victimKeep') {
          return [{ type: 'civilWarKeep', faction: unitSetPoints(cw.faction1) >= unitSetPoints(cw.faction2!) ? 1 : 2 }];
        }
        const sel = suggestCivilWarSelect(state);
        return [{ type: 'civilWarSelect', tokens: sel.tokens, cities: sel.cities }];
      }
      if (has(p, 'monotheism') && !p.convertedThisTurn) {
        for (const area of monotheismTargets(state, actor)) out.push({ type: 'convertArea', area });
      }
      break;
    }
    case 'trade': {
      out.push({ type: 'tradeWait' });
      break;
    }
  }
  return out;
}
