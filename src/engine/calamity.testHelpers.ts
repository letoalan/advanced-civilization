import { adapter, createGame } from './index.js';
import { areas, adjacency, areaById, pieceCounts } from '../data/index.js';
import type { GameState, PlayerId } from './types.js';

export const coastal = areas.filter((a) => !a.isWater && (adjacency[a.id] ?? []).some((n) => areaById.get(n)?.isWater));
export const land = areas.filter((a) => !a.isWater);

export interface Opts {
  players?: PlayerId[];
  tokens?: Record<PlayerId, Record<string, number>>;
  cities?: Record<PlayerId, string[]>;
  hands?: Record<PlayerId, Record<string, number>>;
  tradedFrom?: Record<string, PlayerId>;
}

/** Controlled board at the trade phase; ending the trade triggers the calamity
 *  phase, which resolves whatever calamity cards players hold. */
export function scenario(o: Opts): GameState {
  const s = createGame({ players: o.players ?? ['egypt', 'babylon'], seed: 1, maxTurns: 60 });
  s.areas = {};
  for (const [owner, places] of Object.entries(o.tokens ?? {})) {
    for (const [aid, n] of Object.entries(places)) (s.areas[aid] ??= { tokens: {} }).tokens[owner] = n;
  }
  for (const [owner, aids] of Object.entries(o.cities ?? {})) {
    for (const aid of aids) (s.areas[aid] ??= { tokens: {} }).city = owner;
  }
  for (const id of s.seating) {
    const p = s.players[id]!;
    let board = 0, c = 0;
    for (const a of Object.values(s.areas)) { board += a.tokens[id] ?? 0; if (a.city === id) c++; }
    p.treasury = 0; p.stock = pieceCounts.tokens - board; p.citiesAvailable = pieceCounts.cities - c; p.advances = [];
    p.hand = o.hands?.[id] ?? {};
  }
  s.calamityTradedFrom = o.tradedFrom ?? {};
  s.phase = 'trade';
  s.activeOrder = [...s.seating];
  s.actedThisPhase = [];
  s.negotiation = { turnPointer: 0, passStreak: 0, actions: 0, nextOfferId: 0, offers: [], completed: [] };
  return s;
}

/** Drive through the trade and calamity phases: pass trading, and for the
 *  interactive calamity steps take the engine's suggested action (leader-targeting
 *  allocation / Monotheism conversion), stopping when a later phase begins. */
export function resolve(s: GameState): GameState {
  let guard = 0;
  while (guard++ < 200) {
    const actor = adapter.currentActor(s);
    if (!actor) break;
    if (s.phase === 'trade') { s = adapter.applyAction(s, { type: 'pass' }, actor); continue; }
    if (s.pendingCityChoice || s.pendingUnitLoss || s.pendingAllocation || s.pendingCivilWar || s.pendingPick || s.pendingSupport) {
      const kinds = ['chooseCities', 'chooseUnits', 'allocateLoss', 'civilWarSelect', 'civilWarKeep', 'pickAreas'];
      const suggested = adapter.legalActions(s, actor).find((a) => kinds.includes(a.type));
      s = adapter.applyAction(s, suggested ?? { type: 'pass' }, actor); continue;
    }
    break; // stop at a conversion choice or any later interactive phase
  }
  return s;
}
