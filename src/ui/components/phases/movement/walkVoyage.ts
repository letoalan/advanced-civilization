import { shipNeighbors, areaById } from '../../../../data/index.js';
import type { VoyageStep } from './movementTypes.js';

export function walkVoyage(steps: VoyageStep[], range: number, astronomy: boolean, outSet: ReadonlySet<string>) {
  let sides: (string | null)[] = [null];
  let cargo = 0;
  const cargoAfter: number[] = [];

  for (const [i, st] of steps.entries()) {
    cargo -= st.unload ?? 0;
    cargo += st.load ?? 0;
    cargoAfter.push(cargo);
    if (i < steps.length - 1) {
      const next = steps[i + 1]!.area;
      const hops = (shipNeighbors.get(st.area) ?? []).filter(
        (h) => h.to === next && (i === 0 || sides.some((side) => side == null || h.side == null || h.side === side)),
      );
      sides = hops.length ? [...new Set(hops.map((h) => h.toSide))] : [null];
    }
  }

  const used = steps.length - 1;
  const last = steps[steps.length - 1]!;
  const legalNext = new Set<string>();

  if (used < range) {
    for (const h of shipNeighbors.get(last.area) ?? []) {
      if (steps.length > 1 && h.side != null && !sides.some((side) => side == null || side === h.side)) continue;
      const a = areaById.get(h.to);
      if (!a || outSet.has(h.to)) continue;
      if (a.isOpenSea && !astronomy) continue;
      legalNext.add(h.to);
    }
  }

  const endsAtSea = !!areaById.get(last.area)?.isWater;
  const endsOnOpenSea = !!areaById.get(last.area)?.isOpenSea;

  return { used, cargo, cargoAfter, legalNext, endsAtSea, endsOnOpenSea };
}
