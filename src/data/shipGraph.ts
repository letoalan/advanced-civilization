import shipEdgesRaw from './ship-edges.json' with { type: 'json' };
import type { ShipHop } from './types.js';

/** §23.57: "In Greece, some areas have two distinct coastlines." Only these
 *  keep their coastline sides; elsewhere a split in the traced shore water is
 *  just an artefact (e.g. Campania's water wraps the toe of Italy, report
 *  de91eafe), so the whole area's waterfront is one coastline. */
export const TWO_COASTLINE_AREAS: ReadonlySet<string> = new Set(['corinth', 'delphi']);

/** RAW §23.52 ship-move graph (scripts/build-ship-edges.mjs): a ship hops
 *  area-to-area across any border that includes water. Distinct from
 *  `adjacency` (the land graph) — it adds printed all-water borders (straits,
 *  island chains) that land tokens must not walk. `side` = which coastline
 *  sub-area the crossing uses on THIS area's shore (§23.57: a ship in a
 *  two-coastline area must leave by the side it entered); null = unambiguous. */
export const shipNeighbors: Map<string, ShipHop[]> = (() => {
  const m = new Map<string, ShipHop[]>();
  const edges = (shipEdgesRaw as { edges: { a: string; b: string; aSide: string | null; bSide: string | null }[] }).edges;
  const sideOf = (area: string, side: string | null) => (TWO_COASTLINE_AREAS.has(area) ? side : null);
  const push = (from: string, hop: ShipHop) => {
    const list = m.get(from) ?? [];
    m.set(from, list);
    if (!list.some((h) => h.to === hop.to && h.side === hop.side && h.toSide === hop.toSide)) list.push(hop);
  };
  for (const e of edges) {
    const aSide = sideOf(e.a, e.aSide);
    const bSide = sideOf(e.b, e.bSide);
    push(e.a, { to: e.b, side: aSide, toSide: bSide });
    push(e.b, { to: e.a, side: bSide, toSide: aSide });
  }
  return m;
})();
