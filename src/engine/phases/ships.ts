import { areaById } from '../../data/index.js';
import { player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, isCoastal, setTokens } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

export function shipCount(s: GameState, id: PlayerId): number {
  let n = 0;
  for (const a of Object.values(s.areas)) n += a.ships?.[id] ?? 0;
  return n;
}

/** §22.3 ship maintenance, run when the ship-construction phase begins: each ship
 *  in play costs one token (from treasury, else levied from the ship's area);
 *  unmaintained ships return to stock. Then players may build (interactive). */
export function setupShipMaintenance(s: GameState): void {
  const owed: Record<PlayerId, number> = {};
  for (const id of s.seating) owed[id] = shipCount(s, id);
  s.shipMaintOwed = owed;
  s.shipsBuiltThisPhase = {};
  s.shipSteps = {};
}

/** §22.3: how many of `id`'s ships in `area` were already in play when this phase
 *  began and are still unpaid — only those may be scrapped (declined maintenance)
 *  or maintained by a levy from the area. */
export function scrappableShips(s: GameState, id: PlayerId, area: string): number {
  const here = s.areas[area]?.ships?.[id] ?? 0;
  const built = s.shipsBuiltThisPhase?.[id]?.[area] ?? 0;
  const paid = (s.shipSteps?.[id] ?? []).filter((st) => st.kind === 'maintain' && st.area === area).length;
  return Math.max(0, Math.min(here - built - paid, s.shipMaintOwed?.[id] ?? 0));
}

/** §22.3: pay one token per owed ship (treasury, else a levy from a ship's area);
 *  scrap any ship the player can't afford to maintain. Called when the player
 *  finishes Ship Construction. */
export function payShipMaintenance(s: GameState, id: PlayerId): void {
  const p = player(s, id);
  let owed = Math.min(s.shipMaintOwed?.[id] ?? 0, shipCount(s, id));
  while (owed > 0) {
    if (p.treasury > 0) { p.treasury -= 1; p.stock += 1; owed -= 1; continue; }
    // Levy a token from an area that holds a ship; if none, scrap an unmaintained ship.
    const levyArea = Object.entries(s.areas).find(([, a]) => (a.ships?.[id] ?? 0) > 0 && (a.tokens[id] ?? 0) > 0);
    if (levyArea) {
      const [aid, a] = levyArea;
      setTokens(s, aid, id, (a.tokens[id] ?? 0) - 1);
      p.stock += 1; owed -= 1; continue;
    }
    const shipArea = Object.entries(s.areas).find(([, a]) => (a.ships?.[id] ?? 0) > 0);
    if (!shipArea) break;
    const [aid, a] = shipArea;
    a.ships![id] = (a.ships![id] ?? 0) - 1;
    if (a.ships![id]! <= 0) delete a.ships![id];
    p.shipsAvailable += 1; owed -= 1;
    log(s, 'ship.scrap', id, `${id} could not maintain a ship in ${areaName(aid)}; it is scrapped (§22.3).`, { area: aid, count: 1, reason: 'maintenance' });
  }
  if (s.shipMaintOwed) s.shipMaintOwed[id] = 0;
}

export function applyBuildShips(s: GameState, actor: PlayerId, builds: { area: string; count: number; payFrom?: 'area' | 'treasury' | 'split' }[]): void {
  const p = player(s, actor);
  for (const b of builds) {
    const a = s.areas[b.area];
    const area = areaById.get(b.area);
    if (!a || !area) throw new Error('build ships: unknown area');
    if (!isCoastal(s, b.area)) throw new Error('ships must be built at a coastal area');
    if ((a.tokens[actor] ?? 0) <= 0 && a.city !== actor) throw new Error('must occupy the area to build a ship there');
    for (let i = 0; i < b.count; i++) {
      if (shipCount(s, actor) >= 4) throw new Error('max 4 ships in play (§22.4)');
      if (p.shipsAvailable <= 0) throw new Error('no ships left in stock');
      let cost = 2, fromArea = 0, fromTreasury = 0;
      const takeArea = () => { const n = Math.min(cost, a.tokens[actor] ?? 0); setTokens(s, b.area, actor, (a.tokens[actor] ?? 0) - n); p.stock += n; cost -= n; fromArea += n; };
      const takeTreasury = () => { const n = Math.min(cost, p.treasury); p.treasury -= n; p.stock += n; cost -= n; fromTreasury += n; };
      if (b.payFrom === 'split') {
        if ((a.tokens[actor] ?? 0) < 1 || p.treasury < 1) throw new Error('a split payment needs a token in the area and one in treasury');
        cost = 1; takeArea(); cost = 1; takeTreasury();
      } else if (b.payFrom === 'treasury') { takeTreasury(); takeArea(); } else { takeArea(); takeTreasury(); }
      if (cost > 0) throw new Error('not enough tokens/treasury to build a ship');
      (a.ships ??= {})[actor] = (a.ships[actor] ?? 0) + 1;
      p.shipsAvailable -= 1;
      const built = ((s.shipsBuiltThisPhase ??= {})[actor] ??= {});
      built[b.area] = (built[b.area] ?? 0) + 1;
      ((s.shipSteps ??= {})[actor] ??= []).push({ kind: 'build', area: b.area, fromArea, fromTreasury });
    }
    log(s, 'ship.build', actor, `${actor} built ${b.count} ship(s) in ${areaName(b.area)}${b.payFrom === 'treasury' ? ' (paid from treasury)' : b.payFrom === 'split' ? ' (paid 1 from the area, 1 from treasury)' : ''}.`, { area: b.area, count: b.count, paidFrom: b.payFrom ?? 'area' });
  }
}

export function applyScrapShip(s: GameState, actor: PlayerId, area: string): void {
  const a = s.areas[area];
  if (!a || (a.ships?.[actor] ?? 0) <= 0) throw new Error('no ship of yours to scrap there');
  if (scrappableShips(s, actor, area) <= 0) throw new Error('a ship built this phase cannot be scrapped — only ships already in play may go unmaintained (§22.3)');
  a.ships![actor] = (a.ships![actor] ?? 0) - 1;
  if (a.ships![actor]! <= 0) delete a.ships![actor];
  player(s, actor).shipsAvailable += 1;
  if (s.shipMaintOwed) s.shipMaintOwed[actor] = Math.max(0, (s.shipMaintOwed[actor] ?? 0) - 1);
  ((s.shipSteps ??= {})[actor] ??= []).push({ kind: 'scrap', area });
  log(s, 'ship.scrap', actor, `${actor} scraps a ship in ${areaName(area)} (§22.3).`, { area, count: 1, reason: 'voluntary' });
}

export function applyMaintainShip(s: GameState, actor: PlayerId, area: string): void {
  const a = s.areas[area];
  if (!a || scrappableShips(s, actor, area) <= 0) throw new Error('no unmaintained ship of yours there (§22.3)');
  if ((a.tokens[actor] ?? 0) <= 0) throw new Error('no token of yours in that area to levy (§22.3)');
  setTokens(s, area, actor, (a.tokens[actor] ?? 0) - 1);
  player(s, actor).stock += 1;
  if (s.shipMaintOwed) s.shipMaintOwed[actor] = Math.max(0, (s.shipMaintOwed[actor] ?? 0) - 1);
  ((s.shipSteps ??= {})[actor] ??= []).push({ kind: 'maintain', area });
  log(s, 'ship.maintain', actor, `${actor} maintains the ship in ${areaName(area)} with a token from the area (§22.3).`, { area });
}

export function applyUndoShip(s: GameState, actor: PlayerId): void {
  const step = s.shipSteps?.[actor]?.pop();
  if (!step) throw new Error('no ship build or scrap to undo this phase');
  const p = player(s, actor);
  const a = (s.areas[step.area] ??= { tokens: {} });
  if (step.kind === 'build') {
    a.ships![actor] = (a.ships![actor] ?? 0) - 1;
    if (a.ships![actor]! <= 0) delete a.ships![actor];
    p.shipsAvailable += 1;
    const built = s.shipsBuiltThisPhase?.[actor];
    if (built) {
      built[step.area] = (built[step.area] ?? 0) - 1;
      if (built[step.area]! <= 0) delete built[step.area];
    }
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
}
