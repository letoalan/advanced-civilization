import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  TERRITORIES, cloneRegions, loadTerritoryEdits, saveTerritoryEdits,
  polygonCentroid, polygonArea, categoryMeta,
  type TerritoryRegion, type Category,
} from '../../data/territories.js';
import {
  AREA_PTS, NATIVE_W, NATIVE_H, DISPLAY_W, DISPLAY_H, SCALE, INV_SCALE, CATS, nextId,
} from './territories/constants.js';
import {
  pointInPoly, distToSeg, dpRing, traceOutline, componentCount, sanitizeRegions,
  enforcePartition,
} from './territories/geometry.js';
import type { Drag, CutState, NameStatus } from './territories/types.js';
import { TerritorySidebar } from './territories/TerritorySidebar.js';
import { TerritoryCanvas } from './territories/TerritoryCanvas.js';
import { useTerritoryOperations } from './territories/useTerritoryOperations.js';

export default function TerritoriesTab() {
  const [base, setBase] = useState<TerritoryRegion[]>([]);
  const [regions, setRegions] = useState<TerritoryRegion[]>([]);
  const [selIds, setSelIds] = useState<number[]>([]);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const [drag, setDrag] = useState<Drag>(null);
  const [draft, setDraft] = useState<[number, number][] | null>(null);
  const [cut, setCut] = useState<CutState>(null);
  const [hideDone, setHideDone] = useState(false);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    const raw = cloneRegions(TERRITORIES.regions);
    const cleaned = sanitizeRegions(raw);
    setBase(cleaned);
    const edits = loadTerritoryEdits();
    setRegions(edits ? sanitizeRegions(edits) : cleaned);
  }, []);

  const isDirty = useMemo(() => JSON.stringify(regions) !== JSON.stringify(base), [regions, base]);
  useEffect(() => { if (regions.length && base.length) saveTerritoryEdits(regions, base); }, [regions, base]);

  const selectedSet = useMemo(() => new Set(selIds), [selIds]);
  const primaryId = selIds.length ? selIds[0]! : null;
  const primary = primaryId !== null ? regions.find((r) => r.id === primaryId) ?? null : null;

  const dScale = SCALE * zoom;
  const W2 = Math.round(DISPLAY_W * zoom), H2 = Math.round(DISPLAY_H * zoom);

  const toNative = (cx: number, cy: number): [number, number] | null => {
    const svg = svgRef.current; if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return [Math.round((cx - r.left) / dScale), Math.round((cy - r.top) / dScale)];
  };

  const selectCell = (id: number, additive: boolean) => {
    setSelectedVertex(null);
    setSelIds((cur) => (additive ? (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]) : [id]));
  };

  const scrollToCell = (r: TerritoryRegion) => {
    const el = boardScrollRef.current; if (!el) return;
    const [cx, cy] = polygonCentroid(r.exterior);
    el.scrollTo({ left: cx * dScale - el.clientWidth / 2, top: cy * dScale - el.clientHeight / 2, behavior: 'smooth' });
  };

  const ops = useTerritoryOperations(
    regions, setRegions, primaryId, selIds, setSelIds, setSelectedVertex, cut, setCut, draft, setDraft,
  );

  const MERGE_THR2 = (22 * INV_SCALE) ** 2;
  const mergeTargetFor = useCallback((ext: [number, number][], i: number): number => {
    const vi = ext[i]!; let best = -1, bd = MERGE_THR2;
    for (let k = 0; k < ext.length; k++) {
      if (k === i) continue;
      const ek = ext[k]!; const dx = ek[0] - vi[0], dy = ek[1] - vi[1]; const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  }, [MERGE_THR2]);

  const nameStatus = useCallback((r: TerritoryRegion): NameStatus => {
    const contains = AREA_PTS.filter((a) => pointInPoly(a.pt, r.exterior));
    if (contains.length === 1) {
      const match = r.name && r.name.toLowerCase() === contains[0]!.name.toLowerCase();
      return match ? { kind: 'ok', area: contains[0]! } : { kind: 'mismatch', area: contains[0]! };
    }
    return contains.length > 1 ? { kind: 'merged', areas: contains } : { kind: 'empty' };
  }, []);

  const counts = useMemo(() => {
    const c = { openSea: 0, coastal: 0, land: 0, cosmetic: 0, unset: 0 };
    for (const r of regions) if (r.category in c) c[r.category as keyof typeof c]++; else c.unset++;
    return c;
  }, [regions]);

  const nameSummary = useMemo(() => {
    let ok = 0, merged = 0, empty = 0, mismatch = 0;
    for (const r of regions) {
      const st = nameStatus(r);
      if (st.kind === 'ok') ok++; else if (st.kind === 'merged') merged++; else if (st.kind === 'empty') empty++; else mismatch++;
    }
    return { ok, merged, empty, mismatch };
  }, [regions, nameStatus]);

  const assignAreas = () => {
    setRegions((rs) => rs.map((r) => {
      const st = nameStatus(r);
      return st.kind === 'ok' || st.kind === 'mismatch' ? { ...r, name: st.area.name } : r;
    }));
  };

  const buildExport = () => ({
    _meta: { ...(TERRITORIES._meta ?? { schema: 'territory-polygons-v1', provenance: '', source: '', notes: [] }), provenance: 'owner-corrected' },
    image: { width: NATIVE_W, height: NATIVE_H },
    count: regions.length,
    regions: regions.map((r) => ({ id: r.id, ...(r.name ? { name: r.name } : {}), panel: r.panel, category: r.category, area_px: r.area_px, centroid: polygonCentroid(r.exterior), exterior: r.exterior, ...(r.holes?.length ? { holes: r.holes } : {}) })),
  });

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(buildExport())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'territories.json'; link.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveRepo = async () => {
    try {
      const res = await fetch('/__save-territories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildExport()) });
      const j = await res.json();
      alert(j.ok ? `Saved ${j.count} territories to src/data/territories.json` : `Save failed: ${j.error}`);
    } catch (e) { alert('Save failed: ' + e); }
  };

  const btn: React.CSSProperties = { padding: '4px 10px', background: '#2a2d34', color: '#e8e8ea', border: '1px solid #3a3d44', borderRadius: 4, cursor: 'pointer', fontSize: 13 };

  return (
    <div style={{ color: '#e8e8ea', fontFamily: 'system-ui, sans-serif', padding: 12 }}>
      <h2 style={{ marginTop: 0 }}>Territories editor</h2>
      <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button style={{ ...btn, color: '#80dc78', borderColor: '#3a5a3a' }} onClick={handleSaveRepo}>💾 Save to repo</button>
        <button style={{ ...btn, opacity: isDirty ? 1 : 0.5 }} onClick={handleExport} disabled={!isDirty}>⤓ Export</button>
        <button style={{ ...btn, opacity: isDirty ? 1 : 0.5 }} onClick={() => setRegions(cloneRegions(base))} disabled={!isDirty}>Reset</button>
        <label style={{ fontSize: 12, color: '#aaa', marginLeft: 8 }}>
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> dim categorised
        </label>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', marginLeft: 8 }}>
          <button style={{ ...btn, padding: '4px 9px' }} onClick={() => setZoom((z) => Math.max(0.5, +(z / 1.25).toFixed(3)))}>−</button>
          <button style={{ ...btn, padding: '4px 9px' }} onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
          <button style={{ ...btn, padding: '4px 9px' }} onClick={() => setZoom((z) => Math.min(6, +(z * 1.25).toFixed(3)))}>+</button>
        </span>
        <button style={{ ...btn, color: '#c9a0ff', borderColor: '#4a3a6a', marginLeft: 8 }} onClick={assignAreas}>🏷 Assign areas</button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9aa0a8' }}>
          {regions.length} cells · <span style={{ color: '#80dc78' }}>{nameSummary.ok} ok</span> · <span style={{ color: '#ffd54a' }}>{counts.unset} unset</span>
        </span>
      </div>
      <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', minHeight: 30 }}>
        {selIds.length > 0 && (
          <>
            <span style={{ fontSize: 13, color: '#ffd54a' }}>#{primaryId}:</span>
            {CATS.map((c) => (
              <button key={c} style={{ ...btn, borderColor: categoryMeta(c).stroke, color: categoryMeta(c).stroke }} onClick={() => ops.setCategory(c)}>{categoryMeta(c).label}</button>
            ))}
            <input placeholder="name" defaultValue={primary?.name ?? ''} key={primaryId} onBlur={(e) => ops.setName(e.target.value)} style={{ padding: '4px 8px', background: '#15171c', color: '#e8e8ea', border: '1px solid #3a3d44', borderRadius: 4, fontSize: 13, width: 180 }} />
            <button style={{ ...btn, color: '#ff8866' }} onClick={ops.deleteSelected}>Delete</button>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <TerritorySidebar regions={regions} selectedSet={selectedSet} nameStatus={nameStatus} onSelectCell={selectCell} onScrollToCell={scrollToCell} />
        <TerritoryCanvas
          boardScrollRef={boardScrollRef} svgRef={svgRef} width={W2} height={H2} dScale={dScale} regions={regions}
          selectedSet={selectedSet} selIds={selIds} primaryId={primaryId} primary={primary} selectedVertex={selectedVertex}
          drag={drag} draft={draft} cut={cut} hideDone={hideDone}
          onMouseMove={() => {}} onDoubleClick={() => {}} onSelectCell={selectCell}
          onVertexMouseDown={(i) => setSelectedVertex(i)} onCentroidMouseDown={() => {}}
          onAddDraftPoint={ops.addDraftPoint} onAddCutPoint={() => {}} toNative={toNative} mergeTargetFor={mergeTargetFor}
        />
      </div>
    </div>
  );
}
