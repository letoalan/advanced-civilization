import { useCallback } from 'react';
import {
  TERRITORIES,
  polygonCentroid,
  polygonArea,
  type TerritoryRegion,
  type Category,
} from '../../../data/territories.js';
import {
  NATIVE_W,
  NATIVE_H,
  INV_SCALE,
  nextId,
} from './constants.js';
import {
  dpRing,
  traceOutline,
  componentCount,
  polyAbsArea,
  cutRegion,
  netArea,
  enforcePartition,
} from './geometry.js';
import type { CutState, Ring } from './types.js';

export function useTerritoryOperations(
  regions: TerritoryRegion[],
  setRegions: React.Dispatch<React.SetStateAction<TerritoryRegion[]>>,
  primaryId: number | null,
  selIds: number[],
  setSelIds: React.Dispatch<React.SetStateAction<number[]>>,
  setSelectedVertex: (v: number | null) => void,
  cut: CutState,
  setCut: (c: CutState) => void,
  draft: [number, number][] | null,
  setDraft: React.Dispatch<React.SetStateAction<[number, number][] | null>>,
) {
  const selectedSet = new Set(selIds);

  const setCategory = (cat: Category) => {
    if (!selIds.length) return;
    setRegions((rs) => rs.map((r) => (selectedSet.has(r.id) ? { ...r, category: cat } : r)));
  };

  const setName = (name: string) => {
    if (!selIds.length) return;
    const nm = name.trim();
    setRegions((rs) => rs.map((r) => (selectedSet.has(r.id) ? { ...r, name: nm || undefined } : r)));
  };

  const deleteVertex = () => {
    if (primaryId === null) return;
    setRegions((rs) =>
      rs.map((r) =>
        r.id === primaryId && r.exterior.length > 3
          ? { ...r, exterior: r.exterior.filter((_, i) => i !== 0) }
          : r,
      ),
    );
    setSelectedVertex(null);
  };

  const deleteSelected = () => {
    if (!selIds.length) return;
    if (!confirm(`Delete ${selIds.length} cell(s)?`)) return;
    setRegions((rs) => rs.filter((r) => !selectedSet.has(r.id)));
    setSelIds([]);
    setSelectedVertex(null);
  };

  const finishCut = () => {
    if (!cut || cut.pts.length < 2) return;
    const r = regions.find((x) => x.id === cut.id);
    if (!r) { setCut(null); return; }
    const comps = cutRegion(r, cut.pts);
    if (!comps) {
      alert("The line didn't divide the cell — draw it all the way across, from one side to the other.");
      return;
    }
    comps.sort((a, b) => polyAbsArea(b.exterior) - polyAbsArea(a.exterior));
    setRegions((rs) => {
      let maxId = rs.reduce((m, x) => Math.max(m, x.id), 0);
      const others = rs.filter((x) => x.id !== r.id);
      const mk = (id: number, c: { exterior: Ring; holes: Ring[] }): TerritoryRegion => ({
        ...r,
        id,
        exterior: c.exterior,
        holes: c.holes.length ? c.holes : undefined,
        area_px: netArea(c.exterior, c.holes),
        centroid: polygonCentroid(c.exterior),
      });
      return [...others, ...comps.map((c, i) => mk(i === 0 ? r.id : ++maxId, c))];
    });
    setSelIds([cut.id]);
    setCut(null);
  };

  const commitDraft = (pts: [number, number][]) => {
    const id = nextId(regions);
    setRegions((rs) =>
      enforcePartition(
        [
          ...rs,
          {
            id,
            panel: '',
            category: '' as Category,
            area_px: polygonArea(pts),
            centroid: polygonCentroid(pts),
            exterior: pts,
          },
        ],
        id,
      ),
    );
    setSelIds([id]);
  };

  const finishDraft = () => {
    if (draft && draft.length >= 3) {
      commitDraft(draft.slice());
      setDraft(null);
    }
  };

  const addDraftPoint = (p: [number, number]) => {
    setDraft((d) => {
      if (!d) return d;
      if (d.length >= 3) {
        const d0 = d[0]!;
        const dx = p[0] - d0[0];
        const dy = p[1] - d0[1];
        if (dx * dx + dy * dy < (18 * INV_SCALE) ** 2) {
          commitDraft(d.slice());
          return null;
        }
      }
      return [...d, p];
    });
  };

  return {
    setCategory,
    setName,
    deleteVertex,
    deleteSelected,
    finishCut,
    finishDraft,
    addDraftPoint,
  };
}
