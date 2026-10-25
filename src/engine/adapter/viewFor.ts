import { clone } from '../primitives.js';
import type { GameState, PlayerId } from '../types.js';

export function viewFor(state: GameState, _viewer: PlayerId | null): GameState {
  if (_viewer == null) return state;
  const v = clone(state);
  for (const [id, p] of Object.entries(v.players)) {
    p.handCount = Object.values(p.hand).reduce((s, n) => s + n, 0);
    if (id !== _viewer) {
      p.hand = {} as Record<string, number>;
      p.calamities = [];
    }
  }
  for (const o of v.negotiation.offers) {
    if (o.from !== _viewer) o.give = { ...o.give, actual: {} };
    for (const r of o.responses) if (r.from !== _viewer) r.give = { ...r.give, actual: {} };
  }
  v.negotiation.completed = (v.negotiation.completed ?? []).filter((d) => d.a === _viewer || d.b === _viewer);
  return v;
}
