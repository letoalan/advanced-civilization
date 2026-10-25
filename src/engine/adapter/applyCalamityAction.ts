import { calamityById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has } from '../primitives.js';
import { checkCitySupport, reduceForSupport, reduceSpecificCity } from '../phases/surplus.js';
import { setupCalamityConversion } from '../phases/monotheism.js';
import { pushCalamityEvent } from '../calamity/calamityEvents.js';
import { finalizePick, resumeAfterChoice, runCalamity, startNextSecondary } from '../calamity/calamityRunner.js';
import {
  applyChosenUnits,
  grainCards,
  reduceChosenCities,
  secondaryLossesFromAllocation,
  validateAllocation,
  validateUnits,
} from '../calamity/calamityPicks.js';
import { floodAllocationSpec } from '../calamity/calamityPrimary.js';
import {
  annexFaction,
  civilWarActor,
  militaryReduceFaction,
  subtractSet,
  unitInventory,
  unitSetPoints,
  validateCivilWarSelect,
} from '../calamity/calamityCivilWar.js';
import { applyPick, validatePick } from '../calamity/calamityNamedPicks.js';
import type { Action, GameState, PlayerId, UnitSet } from '../types.js';

export function tryApplyCalamityAction(s: GameState, action: Action, actor: PlayerId): boolean {
  switch (action.type) {
    case 'allocateLoss': {
      const a = s.pendingAllocation;
      if (!a) throw new Error('no secondary-victim allocation is pending');
      if (actor !== a.holder) throw new Error('only the primary victim directs these losses (§29.64)');
      validateAllocation(a, action.allocation);
      s.pendingSecondary = { calamityId: a.calamityId, primary: a.holder, queue: secondaryLossesFromAllocation(s, a, action.allocation), before: a.before, overviewBefore: a.overviewBefore };
      s.pendingAllocation = undefined;
      startNextSecondary(s);
      return true;
    }
    case 'chooseCities': {
      if (s.pendingSupport && s.pendingSupport.holder === actor) {
        const sup = s.pendingSupport;
        const areas = [...new Set(action.areas)];
        if (areas.length !== 1) throw new Error('reduce exactly one city for support (§26.32)');
        if (!sup.candidates.includes(areas[0]!)) throw new Error('newly-built cities must be reduced first (§26.32)');
        reduceSpecificCity(s, actor, areas[0]!);
        log(s, 'city.reduce', actor, `${actor} reduces the city in ${areaName(areas[0]!)} for support (§26.32).`, { area: areas[0]!, reason: 'support' });
        const { holder, lock, mode, before, overviewBefore } = sup;
        s.pendingSupport = undefined;
        if (mode === 'slaverevolt') {
          if (reduceForSupport(s, holder, lock, { mode, before, overviewBefore })) return true;
          pushCalamityEvent(s, 'slaverevolt', holder, before! as any, overviewBefore!, true);
          runCalamity(s);
          if (!s.calamityActive) setupCalamityConversion(s);
        } else {
          checkCitySupport(s);
        }
        return true;
      }
      const c = s.pendingCityChoice;
      if (!c) throw new Error('no city reduction is pending');
      if (actor !== c.holder) throw new Error('only the primary victim chooses which cities to reduce (§30)');
      const areas = [...new Set(action.areas)];
      if (areas.length !== c.count) throw new Error(`choose exactly ${c.count} cit${c.count === 1 ? 'y' : 'ies'} (§30.321)`);
      if (areas.some((aid) => s.areas[aid]?.city !== actor)) throw new Error('you may only reduce your own cities');
      reduceChosenCities(s, actor, areas);
      log(s, 'city.reduce', actor, `${actor} reduces ${areas.map(areaName).join(', ')} (${calamityById.get(c.calamityId)?.name ?? c.calamityId}).`, { areas, calamity: c.calamityId });
      s.pendingCityChoice = undefined;
      if (s.pendingSecondary && s.pendingSecondary.queue[0]?.victim === actor) {
        s.pendingSecondary.queue.shift();
        startNextSecondary(s);
      } else {
        resumeAfterChoice(s, c.calamityId, c.holder, c.before as any, c.overviewBefore);
      }
      return true;
    }
    case 'chooseUnits': {
      const u = s.pendingUnitLoss;
      if (!u) throw new Error('no unit loss is pending');
      if (actor !== u.holder) throw new Error('only the affected player chooses which units to give up (§29.63)');
      let eff = u;
      if (u.calamityId === 'famine' && (action.grainCommit ?? 0) > 0) {
        const pp = player(s, actor);
        if (!has(pp, 'pottery')) throw new Error('only a Pottery holder may commit Grain against Famine (§30.312)');
        const commit = Math.min(action.grainCommit!, Math.max(0, grainCards(pp) - (pp.grainLockedThisTurn ?? 0)), Math.ceil(u.points / 4));
        if (commit > 0) {
          pp.grainLockedThisTurn = (pp.grainLockedThisTurn ?? 0) + commit;
          log(s, 'calamity.famine.grain', actor, `${actor} commits ${commit} Grain card${commit === 1 ? '' : 's'} against Famine (−${4 * commit}, locked until next turn §30.312).`, { calamity: 'famine', grain: commit, reduction: 4 * commit });
          eff = { ...u, points: Math.max(0, u.points - 4 * commit) };
        }
      }
      validateUnits(s, eff, action);
      applyChosenUnits(s, eff, action);
      const { calamityId, holder, before, overviewBefore, areas } = u;
      s.pendingUnitLoss = undefined;
      if (s.pendingSecondary && s.pendingSecondary.queue[0]?.victim === holder) {
        s.pendingSecondary.queue.shift();
        startNextSecondary(s);
        return true;
      }
      if (calamityId === 'flood' && areas) {
        const spec = floodAllocationSpec(s, holder, areas);
        if (spec) { s.pendingAllocation = { ...spec, areas, before, overviewBefore }; return true; }
      }
      resumeAfterChoice(s, calamityId, holder, before as any, overviewBefore);
      return true;
    }
    case 'civilWarSelect': {
      const cw = s.pendingCivilWar;
      if (!cw) throw new Error('no Civil War is pending');
      if (cw.stage === 'victimKeep') throw new Error('the Civil War factions are already selected');
      if (actor !== civilWarActor(cw)) throw new Error(`it is not ${actor}'s Civil War selection`);
      const target = cw.stage === 'victimSelect' ? cw.victimPoints : cw.beneficiaryPoints;
      const sel: UnitSet = { tokens: { ...action.tokens }, cities: [...new Set(action.cities)] };
      validateCivilWarSelect(s, cw, sel, target);
      if (cw.stage === 'victimSelect') {
        cw.faction1 = sel;
        cw.stage = 'beneficiarySelect';
        log(s, 'calamity.civilwar.select', cw.victim, `${cw.victim} chooses ${unitSetPoints(sel)} unit points for the first Civil War faction (§30.4121).`, { calamity: 'civilwar', points: unitSetPoints(sel), by: 'victim' });
      } else {
        for (const [aid, n] of Object.entries(sel.tokens)) cw.faction1.tokens[aid] = (cw.faction1.tokens[aid] ?? 0) + n;
        cw.faction1.cities.push(...sel.cities);
        cw.faction2 = subtractSet(unitInventory(s, cw.victim), cw.faction1);
        log(s, 'calamity.civilwar.select', cw.beneficiary, `${cw.beneficiary} adds ${unitSetPoints(sel)} of ${cw.victim}'s units to the first faction (§30.4123).`, { calamity: 'civilwar', points: unitSetPoints(sel), by: 'beneficiary', victim: cw.victim });
        if (cw.military) {
          militaryReduceFaction(s, cw.victim, cw.faction1, 5);
          militaryReduceFaction(s, cw.victim, cw.faction2, 5);
          log(s, 'calamity.civilwar.military', cw.victim, `Military makes ${cw.victim}'s Civil War bloodier — 5 unit points removed from each faction (§30.414).`, { calamity: 'civilwar', points: 5 });
        }
        cw.stage = 'victimKeep';
      }
      return true;
    }
    case 'civilWarKeep': {
      const cw = s.pendingCivilWar;
      if (!cw) throw new Error('no Civil War is pending');
      if (cw.stage !== 'victimKeep') throw new Error('the Civil War factions are not yet selected');
      if (actor !== cw.victim) throw new Error('only the victim chooses which faction to keep (§30.415)');
      if (action.faction !== 1 && action.faction !== 2) throw new Error('choose faction 1 or 2');
      const annexed = action.faction === 1 ? cw.faction2! : cw.faction1;
      const kept = action.faction === 1 ? cw.faction1 : cw.faction2!;
      annexFaction(s, cw.victim, cw.beneficiary, annexed);
      log(s, 'calamity.civilwar.keep', cw.victim, `${cw.victim} keeps the ${action.faction === 1 ? 'first' : 'second'} faction (${unitSetPoints(kept)} pts); ${cw.beneficiary} annexes the other (${unitSetPoints(annexed)} pts) (§30.415).`, { calamity: 'civilwar', kept: unitSetPoints(kept), annexed: unitSetPoints(annexed), beneficiary: cw.beneficiary });
      const { victim, before, overviewBefore } = cw;
      s.pendingCivilWar = undefined;
      resumeAfterChoice(s, 'civilwar', victim, before as any, overviewBefore);
      return true;
    }
    case 'pickAreas': {
      const pk = s.pendingPick;
      if (!pk) throw new Error('no city selection is pending');
      if (actor !== pk.chooser) throw new Error(`it is not ${actor}'s city selection (§30)`);
      const areas = [...new Set(action.areas)];
      validatePick(s, pk, areas);
      const res = applyPick(s, pk, areas);
      if (res) finalizePick(s, res.calamityId, res.victim, res.before, res.overviewBefore);
      return true;
    }
    default:
      return false;
  }
}
