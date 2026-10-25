import { Rng } from 'digital-boardgame-framework';
import { calamityById } from '../../data/index.js';
import { cityCount, player } from '../helpers.js';
import { log } from '../logging.js';
import { has } from '../primitives.js';
import { setupCalamityConversion } from '../phases/monotheism.js';
import { checkCitySupport } from '../phases/surplus.js';
import { startBarbarians } from './calamityBarbarians.js';
import { startCivilWar } from './calamityCivilWar.js';
import {
  AreaSnapshot,
  boardOverview,
  capCalamitiesPerPlayer,
  heldCalamities,
  nextHeldCalamity,
  pushCalamityEvent,
  snapAreas,
} from './calamityEvents.js';
import { boardUnitPoints, unitPointsInAreas } from './calamityGeography.js';
import {
  bestFloodRegion,
  floodAllocationSpec,
  primaryCityCount,
  startFloodCity,
  startPiracy,
  startSlaveRevolt,
  startTreachery,
  startVolcano,
} from './calamityPrimary.js';
import type { GameState, PendingAllocation, PlayerId } from '../types.js';

export type AllocationSpec = Omit<PendingAllocation, 'before' | 'overviewBefore'>;

export function secondaryAllocationFor(s: GameState, calId: string, holder: PlayerId): AllocationSpec | null {
  const trader = s.calamityTradedFrom[calId];
  const rivals = s.seating.filter((o) => o !== holder && o !== trader);
  if (calId === 'famine' || calId === 'epidemic') {
    const pool = calId === 'famine' ? 20 : 25;
    const per = calId === 'famine' ? 8 : 10;
    const cityWorth = calId === 'epidemic' ? 4 : 5;
    const caps: Record<PlayerId, number> = {};
    for (const v of rivals) {
      const c = Math.min(per, boardUnitPoints(s, v));
      if (c > 0) caps[v] = c;
    }
    return Object.keys(caps).length ? { calamityId: calId, holder, kind: 'unitPoints', pool, caps, cityWorth } : null;
  }
  if (calId === 'iconoclasm') {
    const caps: Record<PlayerId, number> = {};
    for (const v of rivals) {
      if (has(player(s, v), 'theology')) continue;
      const c = Math.min(has(player(s, v), 'philosophy') ? 1 : 2, cityCount(s, v));
      if (c > 0) caps[v] = c;
    }
    return Object.keys(caps).length ? { calamityId: calId, holder, kind: 'cities', pool: 2, caps, cityWorth: 5 } : null;
  }
  return null;
}

export function startPrimary(s: GameState, calId: string, holder: PlayerId, before: AreaSnapshot, overviewBefore: string, rng: Rng): boolean {
  const cityCut = primaryCityCount(s, calId, holder);
  if (cityCut !== null) {
    const n = Math.min(cityCut, cityCount(s, holder));
    if (n > 0) { s.pendingCityChoice = { calamityId: calId, holder, count: n, before: before as any, overviewBefore }; return true; }
    return false;
  }
  const p = player(s, holder);
  if (calId === 'famine' || calId === 'epidemic') {
    const points = calId === 'famine'
      ? 10
      : Math.max(0, 16 - (has(p, 'medicine') ? 8 : 0) + (has(p, 'roadbuilding') ? 5 : 0));
    if (points > 0 && boardUnitPoints(s, holder) > 0) {
      s.pendingUnitLoss = { calamityId: calId, holder, points: Math.min(points, boardUnitPoints(s, holder)), cityWorth: calId === 'epidemic' ? 4 : 5, mode: 'remove', before: before as any, overviewBefore };
      return true;
    }
    return false;
  }
  if (calId === 'flood') {
    const region = bestFloodRegion(s, holder);
    if (region) {
      const pts = Math.min(has(p, 'engineering') ? 7 : 17, unitPointsInAreas(s, holder, region));
      if (pts > 0) { s.pendingUnitLoss = { calamityId: 'flood', holder, points: pts, cityWorth: 5, mode: 'remove', areas: region, before: before as any, overviewBefore }; return true; }
      return false;
    }
    return startFloodCity(s, holder, before, overviewBefore);
  }
  if (calId === 'civilwar') return startCivilWar(s, holder, before, overviewBefore);
  if (calId === 'treachery') return startTreachery(s, holder, before, overviewBefore);
  if (calId === 'piracy') return startPiracy(s, holder, before, overviewBefore);
  if (calId === 'slaverevolt') return startSlaveRevolt(s, holder, before, overviewBefore);
  if (calId === 'volcano') return startVolcano(s, holder, before, overviewBefore);
  if (calId === 'barbarianhordes') return startBarbarians(s, holder, before, overviewBefore, rng);
  log(s, 'calamity.unmodeled', holder, `${holder} suffers ${calamityById.get(calId)?.name ?? calId} (effect not modeled).`, { calamity: calId });
  return false;
}

export function finishPrimary(s: GameState, calId: string, holder: PlayerId, before: AreaSnapshot, overviewBefore: string, interactive: boolean): boolean {
  const alloc = secondaryAllocationFor(s, calId, holder);
  if (alloc) { s.pendingAllocation = { ...alloc, before: before as any, overviewBefore }; return true; }
  pushCalamityEvent(s, calId, holder, before, overviewBefore, interactive);
  return false;
}

export function resumeAfterChoice(s: GameState, calId: string, holder: PlayerId, before: AreaSnapshot, overviewBefore: string): void {
  if (finishPrimary(s, calId, holder, before, overviewBefore, true)) return;
  runCalamity(s);
  if (!s.calamityActive) setupCalamityConversion(s);
}

export function finalizePick(s: GameState, calamityId: string, victim: PlayerId, before: AreaSnapshot, overviewBefore: string): void {
  s.pendingPick = undefined;
  pushCalamityEvent(s, calamityId, victim, before, overviewBefore, true);
  runCalamity(s);
  if (!s.calamityActive) setupCalamityConversion(s);
}

export function startNextSecondary(s: GameState): void {
  const ps = s.pendingSecondary!;
  while (ps.queue.length) {
    const head = ps.queue[0]!;
    if (head.kind === 'cities') {
      const n = Math.min(head.amount, cityCount(s, head.victim));
      if (n > 0) { s.pendingCityChoice = { calamityId: ps.calamityId, holder: head.victim, count: n, before: ps.before, overviewBefore: ps.overviewBefore }; return; }
    } else {
      const avail = head.areas ? unitPointsInAreas(s, head.victim, head.areas) : boardUnitPoints(s, head.victim);
      const points = Math.min(head.amount, avail);
      if (points > 0) { s.pendingUnitLoss = { calamityId: ps.calamityId, holder: head.victim, points, cityWorth: head.cityWorth, mode: 'remove', areas: head.areas, before: ps.before, overviewBefore: ps.overviewBefore }; return; }
    }
    ps.queue.shift();
  }
  const { calamityId, primary, before, overviewBefore } = ps;
  s.pendingSecondary = undefined;
  pushCalamityEvent(s, calamityId, primary, before as any, overviewBefore, true);
  runCalamity(s);
  if (!s.calamityActive) setupCalamityConversion(s);
}

export function runCalamity(s: GameState): void {
  const rng = Rng.fromState(s.rngState);
  if (!s.calamityActive) { s.calamityActive = true; s.lastCalamities = []; capCalamitiesPerPlayer(s, rng); }
  let next: ReturnType<typeof nextHeldCalamity>;
  while ((next = nextHeldCalamity(s))) {
    const { calamityId, holder } = next;
    const before = snapAreas(s);
    const overviewBefore = boardOverview(s);
    delete player(s, holder).hand[`calamity:${calamityId}`];
    s.calamityQueue = heldCalamities(s);
    const lvl = calamityById.get(calamityId)?.level;
    if (lvl && s.trade.stacks[lvl]) s.trade.stacks[lvl]!.unshift(`calamity:${calamityId}`);
    if (startPrimary(s, calamityId, holder, before, overviewBefore, rng)) { s.rngState = rng.serialize(); return; }
    if (finishPrimary(s, calamityId, holder, before, overviewBefore, false)) { s.rngState = rng.serialize(); return; }
  }
  s.calamityActive = false;
  s.calamityQueue = undefined;
  s.pendingCalamities = [];
  s.calamityTradedFrom = {};
  s.rngState = rng.serialize();
  checkCitySupport(s);
}
