import { areaById, shipNeighbors } from '../../data/index.js';
import { neighbors, outOfPlay, player, shipReachable } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, has, setTokens } from '../primitives.js';
import type { GameState, PlayerId, VoyageStep } from '../types.js';

/** Validate and execute one ship voyage (§23.5). */
export function applyVoyage(
  s: GameState,
  actor: PlayerId,
  steps: VoyageStep[],
  arrivedOverland: Record<string, number>,
  debarked: Record<string, number>,
): void {
  const p = player(s, actor);
  if (steps.length < 2) throw new Error('a voyage must enter at least one area (§23.52)');
  const range = 4 + (has(p, 'clothmaking') ? 1 : 0);
  if (steps.length - 1 > range) throw new Error(`a ship may enter at most ${range} areas per phase (§23.52${range === 5 ? '/§23.53' : ''})`);
  const astro = has(p, 'astronomy');
  const outSet = outOfPlay(s);
  const start = steps[0]!.area;
  const startArea = s.areas[start];
  if ((startArea?.ships?.[actor] ?? 0) <= 0) throw new Error(`no ship in ${start} to sail`);
  let sides: (string | null)[] = [null];
  for (let i = 1; i < steps.length; i++) {
    const from = steps[i - 1]!.area, to = steps[i]!.area;
    const hops = (shipNeighbors.get(from) ?? []).filter((h) => h.to === to
      && (i === 1 || sides.some((side) => side == null || h.side == null || h.side === side)));
    const hop = hops[0];
    if (!hop) {
      const anyEdge = (shipNeighbors.get(from) ?? []).some((h) => h.to === to);
      throw new Error(anyEdge
        ? `illegal sea move ${from}->${to}: a ship must leave by the coastline it entered (§23.57)`
        : `illegal sea move ${from}->${to}: no water boundary to cross (§23.52)`);
    }
    const a = areaById.get(to);
    if (!a || outSet.has(to)) throw new Error(`illegal sea move ${from}->${to}: out of play`);
    if (a.isOpenSea && !astro) throw new Error(`ships may not enter open sea without Astronomy (§23.52/§23.54): ${to}`);
    sides = [...new Set(hops.map((h) => h.toSide))];
  }
  const last = steps[steps.length - 1]!.area;
  if (areaById.get(last)?.isOpenSea) throw new Error(`a ship may not end its movement on open sea (§23.55): ${last}`);
  let aboard = 0;
  for (const [i, st] of steps.entries()) {
    const meta = areaById.get(st.area);
    if ((st.load ?? 0) < 0 || (st.unload ?? 0) < 0) throw new Error('voyage load/unload must be non-negative');
    if (st.unload) {
      if (!meta || meta.isWater) throw new Error(`cannot debark tokens at sea (${st.area})`);
      if (st.unload > aboard) throw new Error(`debarking ${st.unload} at ${st.area} but only ${aboard} aboard`);
      aboard -= st.unload;
      const at = (s.areas[st.area] ??= { tokens: {} });
      at.tokens[actor] = (at.tokens[actor] ?? 0) + st.unload;
      debarked[st.area] = (debarked[st.area] ?? 0) + st.unload;
    }
    if (st.load) {
      if (!meta || meta.isWater) throw new Error(`cannot embark tokens at sea (${st.area})`);
      const at = s.areas[st.area];
      const avail = (at?.tokens[actor] ?? 0) - (arrivedOverland[st.area] ?? 0) - (debarked[st.area] ?? 0);
      if (st.load > avail) throw new Error(`tokens that already moved this phase may not board a ship at ${st.area} (§23.51/§23.56)`);
      aboard += st.load;
      if (aboard > 5) throw new Error('a ship carries at most 5 tokens (§23.51)');
      setTokens(s, st.area, actor, (at!.tokens[actor] ?? 0) - st.load);
    }
    if (i === steps.length - 1 && aboard > 0) throw new Error('no token may remain aboard a ship at the end of the movement phase (§23.56)');
  }
  const fromShips = s.areas[start]!;
  fromShips.ships![actor] = (fromShips.ships![actor] ?? 0) - 1;
  if (fromShips.ships![actor]! <= 0) delete fromShips.ships![actor];
  const destA = (s.areas[last] ??= { tokens: {} });
  (destA.ships ??= {})[actor] = (destA.ships[actor] ?? 0) + 1;
  const legs = steps.map((st) => `${areaName(st.area)}${st.load ? ` +${st.load}` : ''}${st.unload ? ` −${st.unload}` : ''}`).join(' → ');
  log(s, 'move.voyage', actor, `${actor}'s ship sailed ${legs} (§23.5).`, {
    steps: steps.map((st) => ({ area: st.area, ...(st.load ? { load: st.load } : {}), ...(st.unload ? { unload: st.unload } : {}) })),
  });
}

export function applyMovement(
  s: GameState,
  actor: PlayerId,
  moves: { from: string; to: string; count: number; via?: string; byShip?: boolean }[],
  voyages?: VoyageStep[][],
): void {
  const p = player(s, actor);
  const road = has(p, 'roadbuilding');
  const arrivedOverland: Record<string, number> = {};
  const debarked: Record<string, number> = {};
  for (const m of moves) {
    const from = s.areas[m.from];
    if (!from || (from.tokens[actor] ?? 0) < m.count) throw new Error(`illegal move: not enough tokens in ${m.from}`);
    if (m.byShip) {
      const embarkable = (from.tokens[actor] ?? 0) - (arrivedOverland[m.from] ?? 0) - (debarked[m.from] ?? 0);
      if (m.count > embarkable) throw new Error(`tokens that moved overland into ${m.from} this phase may not then board a ship (§23.51)`);
      if (m.count > 5) throw new Error('a ship carries at most 5 tokens (§23.51)');
      const range = 4 + (has(p, 'clothmaking') ? 1 : 0);
      const path = shipReachable(s, m.from, range, has(p, 'astronomy')).get(m.to);
      if (!path) throw new Error(`illegal sea move ${m.from}->${m.to}: out of range`);
      const steps: VoyageStep[] = [
        { area: m.from, ...(m.count > 0 ? { load: m.count } : {}) },
        ...path.slice(0, -1).map((area) => ({ area })),
        { area: m.to, ...(m.count > 0 ? { unload: m.count } : {}) },
      ];
      applyVoyage(s, actor, steps, arrivedOverland, debarked);
      continue;
    }
    const adjacent = neighbors(s, m.from).includes(m.to);
    const via = m.via;
    const viaArea = via ? s.areas[via] : undefined;
    const roadReachable = !!(road && via && neighbors(s, m.from).includes(via) && neighbors(s, via).includes(m.to)
      && !areaById.get(via)?.isWater
      && (!viaArea || (Object.keys(viaArea.tokens).every((o) => o === actor || (viaArea.tokens[o] ?? 0) === 0)
        && (!viaArea.city || viaArea.city === actor))));
    if (!adjacent && !roadReachable) throw new Error(`illegal move ${m.from}->${m.to}: not reachable`);
    setTokens(s, m.from, actor, (from.tokens[actor] ?? 0) - m.count);
    const to = (s.areas[m.to] ??= { tokens: {} });
    to.tokens[actor] = (to.tokens[actor] ?? 0) + m.count;
    arrivedOverland[m.to] = (arrivedOverland[m.to] ?? 0) + m.count;
    log(s, 'move.land', actor, `${actor} moved ${m.count} token${m.count === 1 ? '' : 's'} ${areaName(m.from)} → ${areaName(m.to)}${m.via ? ` via ${areaName(m.via)} (§32.251)` : ' (§23.3)'}.`, { from: m.from, to: m.to, count: m.count, ...(m.via ? { via: m.via } : {}) });
  }
  for (const v of voyages ?? []) applyVoyage(s, actor, v, arrivedOverland, debarked);
}
