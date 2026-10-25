import { areaById, adjacency } from '../../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../../engine/types.js';

export function computeMoveOptions(legal: Action[]): Map<string, Map<string, { max: number; byShip?: boolean; via?: string }>> {
  const byFrom = new Map<string, Map<string, { max: number; byShip?: boolean; via?: string }>>();
  for (const a of legal) {
    if (a.type !== 'move') continue;
    const m = a.moves[0]!;
    if (!byFrom.has(m.from)) byFrom.set(m.from, new Map());
    const dest = byFrom.get(m.from)!;
    if (!dest.has(m.to) || (!m.byShip && dest.get(m.to)!.byShip)) {
      dest.set(m.to, { max: m.count, ...(m.byShip ? { byShip: true } : {}), ...(m.via ? { via: m.via } : {}) });
    }
  }
  return byFrom;
}

export function computeEmbarkHint(
  origin: string | null,
  actor: PlayerId | null,
  dests: Map<string, { byShip?: boolean }> | undefined,
  state: GameState,
  shipsLeft: (area: string) => number,
): string | null {
  if (!origin || !actor) return null;
  if (dests && [...dests.values()].some((o) => o.byShip)) return null;
  const meta = areaById.get(origin);
  if (!meta || meta.isWater) return null;
  if ((state.areas?.[origin]?.ships?.[actor] ?? 0) > 0 && shipsLeft(origin) <= 0) {
    return 'Tous les navires ici ont déjà un trajet planifié ce tour — annulez un déplacement pour en libérer un.';
  }
  const a = state.areas?.[origin];
  if ((a?.tokens?.[actor] ?? 0) <= 0) return null;
  const waters = (adjacency[origin] ?? []).filter((n) => areaById.get(n)?.isWater);
  if (waters.length === 0) return null;
  if ((a?.ships?.[actor] ?? 0) <= 0) return 'Un navire allié doit être présent dans cette zone côtière pour embarquer.';
  const allOpenSea = waters.every((n) => areaById.get(n)?.isOpenSea);
  const hasAstronomy = !!state.players[actor]?.advances?.includes('astronomy');
  if (allOpenSea && !hasAstronomy) return 'Cette côte ne donne que sur la haute mer (progrès Astronomie requis, §23.52).';
  return null;
}
