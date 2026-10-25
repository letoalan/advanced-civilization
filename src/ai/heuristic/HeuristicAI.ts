import type { PlayerController, ControllerContext } from 'digital-boardgame-framework';
import { areaById } from '../../data/index.js';
import { cityCount, citySiteIn } from '../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../engine/types.js';
import { planAdvancePurchase } from './advances.js';
import { planMovement } from './movement.js';
import { rivalsIn, supportAfter } from './movementCombat.js';
import { bestStart, convertValue, shipCount, shipUseful } from './shipsAndMisc.js';
import { planTradeTurn } from './trade.js';

export class HeuristicAI implements PlayerController<GameState, Action, PlayerId> {
  constructor(private readonly opts: { aggressive?: boolean; defensive?: boolean } = {}) {}

  async selectAction(ctx: ControllerContext<GameState, Action, PlayerId>): Promise<Action> {
    const { state, actor, adapter } = ctx;
    const actions = adapter.legalActions(state, actor);
    if (actions.length === 0) return { type: 'pass' };

    if (state.ninthStack?.awaiting) return { type: 'pass' };

    if (state.pendingStart) {
      const starts = actions.filter((a) => a.type === 'placeStart') as Extract<Action, { type: 'placeStart' }>[];
      if (starts.length) return bestStart(state, actor, starts);
    }

    const discard = actions.find((a) => a.type === 'chooseDiscard');
    if (discard) return discard;

    if (state.pendingPillage?.length) {
      const pill = (actions.filter((a) => a.type === 'pillage') as Extract<Action, { type: 'pillage' }>[])
        .sort((a, b) => b.count - a.count)[0];
      if (pill) return pill;
    }

    if (state.pendingSupport) {
      const c = actions.find((a) => a.type === 'chooseCities');
      if (c) return c;
    }

    if (state.pendingPick) {
      const pk = actions.find((a) => a.type === 'pickAreas');
      if (pk) return pk;
    }

    switch (state.phase) {
      case 'cityConstruction': {
        const builds = actions.filter((a) => a.type === 'buildCity') as Extract<Action, { type: 'buildCity' }>[];
        const cities = cityCount(state, actor);
        const tokens = Object.fromEntries(
          Object.entries(state.areas).map(([aid, a]) => [aid, a.tokens[actor] ?? 0]),
        );
        const supported = builds.find(
          (b) => supportAfter(state, actor, tokens, new Set([b.area])) >= 2 * (cities + 1),
        );
        return supported ?? { type: 'pass' };
      }
      case 'calamity': {
        const cityChoice = actions.find((a) => a.type === 'chooseCities');
        if (cityChoice) return cityChoice;
        const unitChoice = actions.find((a) => a.type === 'chooseUnits');
        if (unitChoice) return unitChoice;
        const cwSelect = actions.find((a) => a.type === 'civilWarSelect');
        if (cwSelect) return cwSelect;
        const cwKeep = actions.find((a) => a.type === 'civilWarKeep');
        if (cwKeep) return cwKeep;
        const pick = actions.find((a) => a.type === 'pickAreas');
        if (pick) return pick;
        const alloc = actions.find((a) => a.type === 'allocateLoss');
        if (alloc) return alloc;
        const converts = actions.filter((a) => a.type === 'convertArea') as Extract<Action, { type: 'convertArea' }>[];
        if (converts.length > 0)
          return converts.slice().sort((x, y) => convertValue(state, y.area) - convertValue(state, x.area))[0]!;
        return { type: 'pass' };
      }
      case 'acquireAdvances': {
        const buys = actions.filter((a) => a.type === 'buyAdvance') as Extract<Action, { type: 'buyAdvance' }>[];
        if (buys.length === 0) return { type: 'pass' };
        return (
          planAdvancePurchase(
            state.players[actor]!,
            buys.map((b) => b.advance ?? b.advances?.[0] ?? ''),
          ) ?? buys[0]!
        );
      }
      case 'shipConstruction': {
        const scrap = (actions.filter((a) => a.type === 'scrapShip') as Extract<Action, { type: 'scrapShip' }>[])
          .find((a) => !shipUseful(state, actor, a.area, state.areas[a.area]?.tokens[actor] ?? 0));
        if (scrap) return scrap;
        const builds = actions.filter((a) => a.type === 'buildShips') as Extract<Action, { type: 'buildShips' }>[];
        if (builds.length === 0 || shipCount(state, actor) >= 1) return { type: 'pass' };
        const levy = { treasury: 0, split: 1, area: 2 } as const;
        const best = builds
          .filter((b) => {
            const { area, payFrom } = b.builds[0]!;
            return shipUseful(
              state,
              actor,
              area,
              (state.areas[area]?.tokens[actor] ?? 0) - levy[payFrom ?? 'area'],
            );
          })
          .sort((x, y) => levy[x.builds[0]!.payFrom ?? 'area'] - levy[y.builds[0]!.payFrom ?? 'area'])[0];
        return best ?? { type: 'pass' };
      }
      case 'movement': {
        const plan = planMovement(state, actor, this.opts.aggressive ?? true, this.opts.defensive ?? true);
        if (plan) return plan;
        const moves = actions.filter((a) => a.type === 'move') as Extract<Action, { type: 'move' }>[];
        if (moves.length === 0) return { type: 'pass' };
        const scored = moves
          .filter((m) => !rivalsIn(state, actor, m.moves[0]!.to))
          .map((m) => {
            const dest = m.moves[0]!.to;
            const da = state.areas[dest];
            const area = areaById.get(dest);
            const empty = !da || Object.values(da.tokens).every((n) => n === 0) ? 1 : 0;
            const sustain = area?.sustains ?? 0;
            const site = citySiteIn(state, dest) ? 2 : 0;
            return { m, score: empty * 3 + sustain + site };
          });
        scored.sort((x, y) => y.score - x.score);
        return scored[0] && scored[0].score >= 3 ? scored[0].m : { type: 'pass' };
      }
      case 'taxation': {
        const me = state.players[actor]!;
        const cities = Object.values(state.areas).filter((a) => a.city === actor).length;
        const rate = me.treasury < 40 && me.stock >= cities * 3 ? 3 : 2;
        return { type: 'setTaxRate', rate };
      }
      case 'trade':
        return planTradeTurn(state, actor, ctx.rng) ?? { type: 'pass' };
      case 'populationExpansion': {
        const caps = state.expansion?.caps[actor] ?? {};
        if ((state.expansion?.remaining[actor] ?? 0) > 0) {
          const best = Object.entries(caps).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1])[0];
          if (best) return { type: 'placeTokens', placements: { [best[0]]: 1 } };
        }
        return { type: 'pass' };
      }
      default:
        return { type: 'pass' };
    }
  }
}
