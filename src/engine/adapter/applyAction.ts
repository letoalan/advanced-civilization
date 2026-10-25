import { FULL_BOARD, startAreasFor } from '../boards.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, clone, has, setTokens } from '../primitives.js';
import { isCalamityCard } from '../tradeHelpers.js';
import { collectTax } from '../phases/taxation.js';
import { applyPlaceTokens, applyResetPlacement } from '../phases/expansion.js';
import { applyMovement } from '../phases/movement.js';
import { applyBuildShips, scrappableShips } from '../phases/ships.js';
import { applyBuildCity } from '../phases/cities.js';
import { applyBuyAdvance } from '../phases/advances.js';
import { applyAcceptResponse, applyPostOffer, applyRespondOffer, applyWithdrawOffer } from '../phases/tradeNegotiation.js';
import { applyBuyTradeCard, closeNinthWindow } from '../phases/tradeAcquisition.js';
import { applyPillage } from '../phases/conflictHelpers.js';
import { applyConvert } from '../phases/monotheism.js';
import { applyDiscard } from '../phases/ast.js';
import { applyPass, normalize } from '../phases/normalization.js';
import { currentActor } from './currentActor.js';
import { tryApplyCalamityAction } from './applyCalamityAction.js';
import type { Action, GameState, PlayerId } from '../types.js';

export function applyAction(state: GameState, action: Action, actor: PlayerId): GameState {
  const s = clone(state);
  const expected = currentActor(s);
  if (expected !== actor) throw new Error(`not ${actor}'s turn (expected ${expected})`);
  if (s.pendingStart && action.type !== 'placeStart') throw new Error('choose a start area first (§16.3)');

  if (tryApplyCalamityAction(s, action, actor)) {
    normalize(s);
    return s;
  }

  switch (action.type) {
    case 'placeStart': {
      if (!s.pendingStart) throw new Error('start areas have already been chosen');
      if (!startAreasFor(s.board ?? FULL_BOARD, actor).includes(action.area)) throw new Error(`${areaName(action.area)} is not one of ${actor}'s start areas (§16.3)`);
      (s.areas[action.area] ??= { tokens: {} }).tokens[actor] = (s.areas[action.area]!.tokens[actor] ?? 0) + 1;
      player(s, actor).stock -= 1;
      log(s, 'setup.start', actor, `${actor} starts in ${areaName(action.area)} (§16.3).`, { area: action.area });
      s.pendingStart.order = s.pendingStart.order.slice(1);
      if (s.pendingStart.order.length === 0) s.pendingStart = undefined;
      break;
    }
    case 'pass': applyPass(s, actor); break;
    case 'postOffer':
      if (s.phase !== 'trade') throw new Error('postOffer only in trade phase');
      applyPostOffer(s, actor, action);
      s.negotiation.turnPointer += 1; s.negotiation.waitStreak = 0;
      break;
    case 'respondOffer':
      if (s.phase !== 'trade') throw new Error('respondOffer only in trade phase');
      applyRespondOffer(s, actor, action);
      s.negotiation.turnPointer += 1; s.negotiation.waitStreak = 0;
      break;
    case 'acceptResponse':
      if (s.phase !== 'trade') throw new Error('acceptResponse only in trade phase');
      applyAcceptResponse(s, actor, action);
      s.negotiation.turnPointer += 1; s.negotiation.waitStreak = 0;
      break;
    case 'withdrawOffer':
      if (s.phase !== 'trade') throw new Error('withdrawOffer only in trade phase');
      applyWithdrawOffer(s, actor);
      s.negotiation.turnPointer += 1; s.negotiation.waitStreak = 0;
      break;
    case 'tradeWait':
      if (s.phase !== 'trade') throw new Error('tradeWait only in trade phase');
      s.negotiation.waitStreak = (s.negotiation.waitStreak ?? 0) + 1;
      s.negotiation.turnPointer += 1;
      log(s, 'trade.wait', actor, `${actor} waits to see the others' offers.`, {});
      break;
    case 'buyTradeCard':
      if (!s.ninthStack?.awaiting) throw new Error('Gold/Ivory can only be bought right after you collect your trade cards (§27.51)');
      applyBuyTradeCard(s, actor, action.count);
      closeNinthWindow(s);
      break;
    case 'setTaxRate': {
      if (s.phase !== 'taxation') throw new Error('the tax rate is chosen during taxation');
      if (!has(player(s, actor), 'coinage')) throw new Error('only a player with Coinage may set the tax rate (§32.421)');
      collectTax(s, actor, action.rate);
      if (!s.actedThisPhase.includes(actor)) s.actedThisPhase.push(actor);
      break;
    }
    case 'pillage': applyPillage(s, actor, action.count); break;
    case 'placeTokens':
      if (s.phase !== 'populationExpansion') throw new Error('placeTokens only in population expansion');
      applyPlaceTokens(s, actor, action.placements);
      break;
    case 'resetPlacement':
      if (s.phase !== 'populationExpansion') throw new Error('resetPlacement only in population expansion');
      applyResetPlacement(s, actor);
      break;
    case 'move':
      if (s.phase !== 'movement') throw new Error('move only in movement phase');
      applyMovement(s, actor, action.moves, action.voyages);
      if (!s.actedThisPhase.includes(actor)) s.actedThisPhase.push(actor);
      break;
    case 'buildShips':
      if (s.phase !== 'shipConstruction') throw new Error('buildShips only in shipConstruction phase');
      applyBuildShips(s, actor, action.builds);
      break;
    case 'scrapShip': {
      if (s.phase !== 'shipConstruction') throw new Error('scrapShip only in shipConstruction phase');
      const a = s.areas[action.area];
      if (!a || (a.ships?.[actor] ?? 0) <= 0) throw new Error('no ship of yours to scrap there');
      if (scrappableShips(s, actor, action.area) <= 0) throw new Error('a ship built this phase cannot be scrapped — only ships already in play may go unmaintained (§22.3)');
      a.ships![actor] = (a.ships![actor] ?? 0) - 1; if (a.ships![actor]! <= 0) delete a.ships![actor];
      player(s, actor).shipsAvailable += 1;
      if (s.shipMaintOwed) s.shipMaintOwed[actor] = Math.max(0, (s.shipMaintOwed[actor] ?? 0) - 1);
      ((s.shipSteps ??= {})[actor] ??= []).push({ kind: 'scrap', area: action.area });
      log(s, 'ship.scrap', actor, `${actor} scraps a ship in ${areaName(action.area)} (§22.3).`, { area: action.area, count: 1, reason: 'voluntary' });
      break;
    }
    case 'maintainShip': {
      if (s.phase !== 'shipConstruction') throw new Error('maintainShip only in shipConstruction phase');
      const a = s.areas[action.area];
      if (!a || scrappableShips(s, actor, action.area) <= 0) throw new Error('no unmaintained ship of yours there (§22.3)');
      if ((a.tokens[actor] ?? 0) <= 0) throw new Error('no token of yours in that area to levy (§22.3)');
      setTokens(s, action.area, actor, (a.tokens[actor] ?? 0) - 1);
      player(s, actor).stock += 1;
      if (s.shipMaintOwed) s.shipMaintOwed[actor] = Math.max(0, (s.shipMaintOwed[actor] ?? 0) - 1);
      ((s.shipSteps ??= {})[actor] ??= []).push({ kind: 'maintain', area: action.area });
      log(s, 'ship.maintain', actor, `${actor} maintains the ship in ${areaName(action.area)} with a token from the area (§22.3).`, { area: action.area });
      break;
    }
    case 'undoShip': {
      if (s.phase !== 'shipConstruction') throw new Error('undoShip only in shipConstruction phase');
      const step = s.shipSteps?.[actor]?.pop();
      if (!step) throw new Error('no ship build or scrap to undo this phase');
      const p = player(s, actor);
      const a = (s.areas[step.area] ??= { tokens: {} });
      if (step.kind === 'build') {
        a.ships![actor] = (a.ships![actor] ?? 0) - 1; if (a.ships![actor]! <= 0) delete a.ships![actor];
        p.shipsAvailable += 1;
        const built = s.shipsBuiltThisPhase?.[actor];
        if (built) { built[step.area] = (built[step.area] ?? 0) - 1; if (built[step.area]! <= 0) delete built[step.area]; }
        setTokens(s, step.area, actor, (a.tokens[actor] ?? 0) + step.fromArea);
        p.stock -= step.fromArea + step.fromTreasury;
        p.treasury += step.fromTreasury;
        log(s, 'ship.undo', actor, `${actor} takes back the ship built in ${areaName(step.area)}.`, { area: step.area, undid: 'build', fromArea: step.fromArea, fromTreasury: step.fromTreasury });
      } else if (step.kind === 'maintain') {
        setTokens(s, step.area, actor, (a.tokens[actor] ?? 0) + 1);
        p.stock -= 1;
        if (s.shipMaintOwed) s.shipMaintOwed[actor] = (s.shipMaintOwed[actor] ?? 0) + 1;
        log(s, 'ship.undo', actor, `${actor} takes back the token paid to maintain the ship in ${areaName(step.area)}.`, { area: step.area, undid: 'maintain' });
      } else {
        (a.ships ??= {})[actor] = (a.ships[actor] ?? 0) + 1;
        p.shipsAvailable -= 1;
        if (s.shipMaintOwed) s.shipMaintOwed[actor] = (s.shipMaintOwed[actor] ?? 0) + 1;
        log(s, 'ship.undo', actor, `${actor} keeps the ship in ${areaName(step.area)} after all.`, { area: step.area, undid: 'scrap' });
      }
      break;
    }
    case 'buildCity':
      if (s.phase !== 'cityConstruction') throw new Error('buildCity only in cityConstruction phase');
      applyBuildCity(s, actor, action.area, action.useTreasury);
      break;
    case 'buyAdvance':
      if (s.phase !== 'acquireAdvances') throw new Error('buyAdvance only in acquireAdvances phase');
      applyBuyAdvance(s, actor, action.advances ?? (action.advance ? [action.advance] : []), action.spendCommodities, action.spendTreasury);
      break;
    case 'convertArea':
      if (s.phase !== 'calamity') throw new Error('Monotheism conversion happens at the end of the calamity phase (§29/§32.941)');
      applyConvert(s, actor, action.area);
      if (!s.actedThisPhase.includes(actor)) s.actedThisPhase.push(actor);
      break;
    case 'chooseDiscard': {
      const d = s.pendingDiscard;
      if (!d) throw new Error('no hand-limit discard is pending');
      if (actor !== d.holder) throw new Error('only the over-limit player chooses what to discard (§31.71)');
      const cards = action.cards;
      if (cards.length !== d.count) throw new Error(`discard exactly ${d.count} surplus card${d.count === 1 ? '' : 's'} (§31.71)`);
      const have: Record<string, number> = {};
      for (const c of cards) {
        if (isCalamityCard(c)) throw new Error('calamity cards do not count toward the hand limit');
        have[c] = (have[c] ?? 0) + 1;
        if (have[c] > (player(s, actor).hand[c] ?? 0)) throw new Error(`you do not hold that many ${c}`);
      }
      applyDiscard(s, actor, cards);
      s.pendingDiscard = undefined;
      break;
    }
    default:
      throw new Error(`action ${(action as Action).type} not valid here`);
  }

  normalize(s);
  return s;
}
