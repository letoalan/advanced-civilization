import { astOrder, cityCount, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, citiesOf, has, isPlayer } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

/** Collect one player's tax: each city costs `rate` tokens from stock → treasury
 *  (§19.1). If stock can't cover every city, the unpayable cities revolt (§19.31)
 *  — unless the player holds Democracy, whose cities never revolt (§19.34). */
export function collectTax(s: GameState, id: PlayerId, rate: number): void {
  const p = player(s, id);
  const cities = cityCount(s, id);
  const r = Math.max(1, Math.min(3, Math.trunc(rate)));
  p.taxRate = r; // remembered as the default for next turn's prompt
  const cost = cities * r;
  if (p.stock >= cost || has(p, 'democracy')) {
    const collected = Math.min(p.stock, cost);
    p.stock -= collected; p.treasury += collected;
    if (collected > 0) log(s, 'tax.collect', id, `${id} collected ${collected} tax (rate ${r}) from ${cities} cities.`, { amount: collected, rate: r, cities });
    return;
  }
  // §19.31: pay for as many cities as stock allows; the remainder revolt — but
  // revolts are resolved only AFTER every player has paid, so record them now.
  const payable = Math.floor(p.stock / r);
  const collected = payable * r;
  p.stock -= collected; p.treasury += collected;
  const revolting = cities - payable;
  (s.pendingRevolts ??= {})[id] = revolting;
  log(s, 'tax.shortfall', id, `${id} could only pay tax for ${payable}/${cities} cities (rate ${r}) — ${revolting} will revolt (§19.31).`, { amount: collected, rate: r, cities, payable, revolting });
}

/** §19.32: the rival with the most units in stock (token = 1, unplaced city = 5)
 *  who still has a city piece to install. */
export function bestRevoltTaker(s: GameState, owner: PlayerId): PlayerId | null {
  const reserves = (x: PlayerId) => player(s, x).stock + 5 * player(s, x).citiesAvailable;
  return s.seating
    .filter((o) => o !== owner && isPlayer(s, o) && player(s, o).citiesAvailable > 0)
    .sort((x, y) => reserves(y) - reserves(x))[0] ?? null;
}

/** §19.3: resolve tax revolts in A.S.T. order. The beneficiary (most stock) CHOOSES
 *  which of the revolting player's cities to take over (§19.32), so each revolt
 *  pauses for that pick; cities no one can take are eliminated (§19.33). Returns
 *  true if it paused for a choice. */
export function resolvePendingRevolts(s: GameState): boolean {
  const pending = s.pendingRevolts;
  if (!pending) return false;
  for (const id of astOrder(s)) {
    let n = pending[id] ?? 0;
    while (n > 0) {
      const taker = bestRevoltTaker(s, id);
      if (!taker) {
        // §19.33: no one can take the remaining revolting cities — they collapse.
        for (const aid of citiesOf(s, id).slice(0, n)) {
          delete s.areas[aid]!.city;
          player(s, id).citiesAvailable += 1;
          log(s, 'city.collapse', id, `The revolting city in ${areaName(aid)} collapses — no one could take it over (§19.33).`, { area: aid });
        }
        n = 0;
        break;
      }
      // §19.32: the beneficiary picks which of the owner's cities to seize.
      const take = Math.min(n, player(s, taker).citiesAvailable);
      pending[id] = n; // remaining recorded; resume continues from here
      s.pendingPick = { chooser: taker, stage: 'taxRevolt', victim: id, count: take, candidates: citiesOf(s, id) };
      return true;
    }
    pending[id] = 0;
  }
  s.pendingRevolts = {};
  return false;
}

/** §19 taxation. Coinage holders WITH cities choose their rate (1-3) — they're
 *  left to act; everyone else is auto-taxed at rate 2 on phase entry. */
export function setupTaxation(s: GameState): void {
  s.pendingRevolts = {}; // revolts this phase accumulate here, resolved once all have paid
  for (const id of astOrder(s)) {
    const p = player(s, id);
    if (has(p, 'coinage') && cityCount(s, id) > 0) continue; // interactive — they pick the rate
    collectTax(s, id, 2);
    if (!s.actedThisPhase.includes(id)) s.actedThisPhase.push(id);
  }
}
