import { areaById } from '../../../../data/index.js';
import { citySiteIn } from '../../../../engine/helpers.js';
import type { GameState, PlayerId } from '../../../../engine/types.js';
import type { QueuedMove, VoyageStep, SurplusWarning } from './movementTypes.js';

export function buildMovementPreview(
  state: GameState,
  actor: PlayerId | null,
  queued: QueuedMove[],
  queuedVoyages: VoyageStep[][],
): { previewState: GameState; moved: Set<string> } {
  if (!actor || (queued.length === 0 && queuedVoyages.length === 0)) {
    return { previewState: state, moved: new Set() };
  }

  const clone: GameState = JSON.parse(JSON.stringify(state));

  for (const q of queued) {
    const from = clone.areas[q.from] ?? (clone.areas[q.from] = { tokens: {} });
    const to = clone.areas[q.to] ?? (clone.areas[q.to] = { tokens: {} });
    from.tokens[actor] = (from.tokens[actor] ?? 0) - q.count;
    if ((from.tokens[actor] ?? 0) <= 0) delete from.tokens[actor];
    to.tokens[actor] = (to.tokens[actor] ?? 0) + q.count;
    if (q.byShip) {
      from.ships = from.ships ?? {};
      to.ships = to.ships ?? {};
      from.ships[actor] = (from.ships[actor] ?? 0) - 1;
      if ((from.ships[actor] ?? 0) <= 0) delete from.ships[actor];
      to.ships[actor] = (to.ships[actor] ?? 0) + 1;
    }
  }

  for (const v of queuedVoyages) {
    for (const st of v) {
      const a = clone.areas[st.area] ?? (clone.areas[st.area] = { tokens: {} });
      if (st.unload) a.tokens[actor] = (a.tokens[actor] ?? 0) + st.unload;
      if (st.load) {
        a.tokens[actor] = (a.tokens[actor] ?? 0) - st.load;
        if ((a.tokens[actor] ?? 0) <= 0) delete a.tokens[actor];
      }
    }
    const from = clone.areas[v[0]!.area]!;
    const to = clone.areas[v[v.length - 1]!.area] ?? (clone.areas[v[v.length - 1]!.area] = { tokens: {} });
    from.ships = from.ships ?? {};
    to.ships = to.ships ?? {};
    from.ships[actor] = (from.ships[actor] ?? 0) - 1;
    if ((from.ships[actor] ?? 0) <= 0) delete from.ships[actor];
    to.ships[actor] = (to.ships[actor] ?? 0) + 1;
  }

  const moved = new Set([
    ...queued.map((q) => q.to),
    ...queuedVoyages.flatMap((v) => v.filter((st) => st.unload).map((st) => st.area)),
  ]);

  return { previewState: clone, moved };
}

export function computeSurplusWarnings(state: GameState, actor: PlayerId | null, previewState: GameState): SurplusWarning[] {
  if (!actor) return [];
  const agriculture = !!state.players[actor]?.advances?.includes('agriculture');
  const out: SurplusWarning[] = [];

  for (const [aid, a] of Object.entries(previewState.areas)) {
    const tokens = a.tokens[actor] ?? 0;
    if (tokens <= 0) continue;
    const meta = areaById.get(aid);
    if (!meta || meta.isWater) continue;
    const contested = Object.entries(a.tokens).some(([o, n]) => o !== actor && (n ?? 0) > 0);
    if (contested) continue;
    const limit = a.city ? 0 : meta.sustains + (agriculture ? 1 : 0);
    const needed = citySiteIn(previewState, aid) ? 6 : 12;
    const canBuild = !a.city && tokens >= needed && (state.players[actor]?.citiesAvailable ?? 0) > 0;
    const keep = canBuild ? needed : limit;
    const lost = tokens - keep;
    if (lost > 0) out.push({ area: aid, name: meta.name, tokens, keep, lost, canBuild });
  }

  return out.sort((x, y) => y.lost - x.lost);
}
