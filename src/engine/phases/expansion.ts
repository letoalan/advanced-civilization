import { astOrder, player } from '../helpers.js';
import { log } from '../logging.js';
import { areaName, setTokens } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

/** Eligible growth per area for `id`: +1 where it has exactly 1 token, +2 where
 *  it has >=2 (§13). */
export function growthCaps(s: GameState, id: PlayerId): Record<string, number> {
  const caps: Record<string, number> = {};
  for (const [aid, a] of Object.entries(s.areas)) {
    if (a.city) continue; // §20.1: tokens are never added to areas with cities
    const t = a.tokens[id] ?? 0;
    if (t > 0) caps[aid] = t >= 2 ? 2 : 1;
  }
  return caps;
}

/** §13 population growth. If a player has enough stock, all growth is applied
 *  automatically. If not, the growth is left for the player to *place* their
 *  limited stock where they choose (interactive), via `placeTokens`. */
export function setupPopulationExpansion(s: GameState): void {
  s.expansion = { remaining: {}, caps: {}, placed: {} };
  for (const id of astOrder(s)) { // §20.3: population increases in A.S.T. order
    const p = player(s, id);
    const caps = growthCaps(s, id);
    const needed = Object.values(caps).reduce((a, b) => a + b, 0);
    if (p.stock >= needed) {
      for (const [aid, cap] of Object.entries(caps)) {
        s.areas[aid]!.tokens[id] = (s.areas[aid]!.tokens[id] ?? 0) + cap;
        p.stock -= cap;
      }
      if (needed > 0) {
        log(s, 'tokens.grow', id, `${id}'s population grew by ${needed} token${needed === 1 ? '' : 's'} across ${Object.keys(caps).length} area${Object.keys(caps).length === 1 ? '' : 's'} (§13).`, { total: needed, areas: caps });
      }
      if (!s.actedThisPhase.includes(id)) s.actedThisPhase.push(id);
    } else if (p.stock <= 0) {
      if (!s.actedThisPhase.includes(id)) s.actedThisPhase.push(id); // nothing to place
    } else {
      s.expansion.remaining[id] = p.stock;
      s.expansion.caps[id] = caps;
    }
  }
}

export function applyPlaceTokens(s: GameState, actor: PlayerId, placements: Record<string, number>): void {
  const exp = s.expansion;
  const caps = exp?.caps[actor];
  let rem = exp?.remaining[actor] ?? 0;
  const p = player(s, actor);
  if (!caps) throw new Error('no growth to place');
  for (const [aid, n] of Object.entries(placements)) {
    if (n <= 0) continue;
    if ((caps[aid] ?? 0) < n) throw new Error(`exceeds growth capacity in ${aid}`);
    if (n > rem || n > p.stock) throw new Error('not enough stock to place');
    s.areas[aid]!.tokens[actor] = (s.areas[aid]!.tokens[actor] ?? 0) + n;
    p.stock -= n; caps[aid] = (caps[aid] ?? 0) - n; rem -= n;
    const mine = ((exp!.placed ??= {})[actor] ??= {});
    mine[aid] = (mine[aid] ?? 0) + n;
  }
  exp!.remaining[actor] = rem;
  const placed = Object.entries(placements).filter(([, n]) => n > 0);
  if (placed.length) {
    log(s, 'tokens.place', actor, `${actor} placed ${placed.reduce((t, [, n]) => t + n, 0)} token${placed.reduce((t, [, n]) => t + n, 0) === 1 ? '' : 's'}: ${placed.map(([aid, n]) => `${areaName(aid)} +${n}`).join(', ')} (§18).`, { placements: Object.fromEntries(placed) });
  }
}

/** Return every token this player placed this phase to stock and restore their
 *  growth capacity, so they can place again from scratch (report 271f360c). */
export function applyResetPlacement(s: GameState, actor: PlayerId): void {
  const exp = s.expansion;
  const placed = exp?.placed?.[actor];
  const caps = exp?.caps[actor];
  if (!exp || !caps || !placed || !Object.values(placed).some((n) => n > 0)) throw new Error('no placed tokens to take back');
  const p = player(s, actor);
  let total = 0;
  for (const [aid, n] of Object.entries(placed)) {
    if (n <= 0) continue;
    setTokens(s, aid, actor, (s.areas[aid]?.tokens[actor] ?? 0) - n);
    p.stock += n; caps[aid] = (caps[aid] ?? 0) + n; total += n;
  }
  exp.remaining[actor] = (exp.remaining[actor] ?? 0) + total;
  exp.placed![actor] = {};
  log(s, 'tokens.reset', actor, `${actor} takes back the ${total} token${total === 1 ? '' : 's'} placed and starts the placement over.`, { total });
}
