import { polygonCentroid, type TerritoryRegion } from '../../../data/territories.js';
import { RASTER_MAX, MIN_COMPONENT_AREA } from './constants.js';
import type { Ring } from './types.js';
import {
  pointInPoly,
  dpRing,
  bboxOf,
  bboxOverlap,
  polyAbsArea,
  netArea,
} from './geometryBasic.js';

export function traceAllLoops(edges: [number, number, number, number][]): Ring[] {
  const adj = new Map<number, { to: number; e: string }[]>(); const pts = new Map<number, [number, number]>();
  const key = (x: number, y: number) => x * 100000 + y; const ek = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  for (const [ax, ay, bx, by] of edges) {
    const ka = key(ax, ay), kb = key(bx, by); pts.set(ka, [ax, ay]); pts.set(kb, [bx, by]); const e = ek(ka, kb);
    if (!adj.has(ka)) adj.set(ka, []); if (!adj.has(kb)) adj.set(kb, []); adj.get(ka)!.push({ to: kb, e }); adj.get(kb)!.push({ to: ka, e });
  }
  const used = new Set<string>(); const loops: Ring[] = [];
  for (const s of adj.keys()) {
    let start: { to: number; e: string } | undefined;
    while ((start = adj.get(s)!.find((o) => !used.has(o.e)))) {
      const loop: Ring = [pts.get(s)!]; let cur = s; let step: { to: number; e: string } | undefined = start; let guard = 0;
      while (step && guard++ < edges.length + 5) {
        used.add(step.e); const nx = step.to; loop.push(pts.get(nx)!); if (nx === s) break; cur = nx; step = adj.get(cur)!.find((o) => !used.has(o.e));
      }
      if (loop.length >= 4) loops.push(loop);
    }
  }
  return loops;
}

export function polygonsFromMask(inside: (x: number, y: number) => boolean, W: number, H: number): { exterior: Ring; holes: Ring[] }[] {
  const lab = new Int32Array(W * H).fill(-1); let nc = 0; const st: number[] = [];
  for (let i = 0; i < W * H; i++) {
    const x = i % W, y = (i / W) | 0; if (lab[i] !== -1 || !inside(x, y)) continue;
    const id = nc++; st.length = 0; st.push(i); lab[i] = id;
    while (st.length) {
      const p = st.pop()!; const px = p % W, py = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx; if (lab[ni] === -1 && inside(nx, ny)) { lab[ni] = id; st.push(ni); }
      }
    }
  }
  const compEdges: [number, number, number, number][][] = Array.from({ length: nc }, () => []);
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H) ? -1 : lab[y * W + x]!;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const l = lab[y * W + x]!; if (l < 0) continue; const E = compEdges[l]!;
    if (at(x, y - 1) !== l) E.push([x, y, x + 1, y]); if (at(x, y + 1) !== l) E.push([x, y + 1, x + 1, y + 1]);
    if (at(x - 1, y) !== l) E.push([x, y, x, y + 1]); if (at(x + 1, y) !== l) E.push([x, y + 1, x + 1, y + 1]);
  }
  const out: { exterior: Ring; holes: Ring[] }[] = [];
  for (let c = 0; c < nc; c++) {
    const loops = traceAllLoops(compEdges[c]!); if (!loops.length) continue;
    loops.sort((a, b) => polyAbsArea(b) - polyAbsArea(a));
    out.push({ exterior: loops[0]!, holes: loops.slice(1) });
  }
  return out;
}

export function subtractWinner(subject: TerritoryRegion, winner: TerritoryRegion): { exterior: Ring; holes: Ring[] }[] | null {
  const [minx, miny, maxx, maxy] = bboxOf(subject.exterior);
  const bw = maxx - minx, bh = maxy - miny; if (bw <= 0 || bh <= 0) return null;
  const s = Math.min(1, RASTER_MAX / Math.max(bw, bh));
  const W = Math.max(2, Math.ceil(bw * s)), H = Math.max(2, Math.ceil(bh * s));
  const sh = subject.holes || [], wh = winner.holes || [];
  const mask = new Uint8Array(W * H); let removed = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = minx + (x + 0.5) / s, py = miny + (y + 0.5) / s;
    if (!pointInPoly([px, py], subject.exterior) || sh.some((h) => pointInPoly([px, py], h))) continue;
    if (pointInPoly([px, py], winner.exterior) && !wh.some((h) => pointInPoly([px, py], h))) { removed++; continue; }
    mask[y * W + x] = 1;
  }
  if (removed === 0) return null;
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  const toDisp = (loop: Ring) => dpRing(loop.map(([x, y]) => [+(minx + x / s).toFixed(1), +(miny + y / s).toFixed(1)] as [number, number]), 1.5);
  return polygonsFromMask(inside, W, H).map((c) => ({ exterior: toDisp(c.exterior), holes: c.holes.map(toDisp).filter((h) => h.length >= 3) })).filter((c) => c.exterior.length >= 3 && polyAbsArea(c.exterior) >= MIN_COMPONENT_AREA);
}

export function cutRegion(region: TerritoryRegion, path: Ring): { exterior: Ring; holes: Ring[] }[] | null {
  const [minx, miny, maxx, maxy] = bboxOf(region.exterior);
  const bw = maxx - minx, bh = maxy - miny; if (bw <= 0 || bh <= 0 || path.length < 2) return null;
  const s = Math.min(1, RASTER_MAX / Math.max(bw, bh));
  const W = Math.max(2, Math.ceil(bw * s)), H = Math.max(2, Math.ceil(bh * s));
  const holes = region.holes || [];
  const mask = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const px = minx + (x + 0.5) / s, py = miny + (y + 0.5) / s;
    if (pointInPoly([px, py], region.exterior) && !holes.some((h) => pointInPoly([px, py], h))) mask[y * W + x] = 1;
  }
  const P: [number, number][] = path.map(([x, y]) => [(x - minx) * s, (y - miny) * s]);
  const extend = (a: [number, number], b: [number, number], len: number): [number, number] => {
    const dx = a[0] - b[0], dy = a[1] - b[1]; const d = Math.hypot(dx, dy) || 1;
    return [a[0] + dx / d * len, a[1] + dy / d * len];
  };
  P[0] = extend(P[0]!, P[1]!, 16); P[P.length - 1] = extend(P[P.length - 1]!, P[P.length - 2]!, 16);
  const stamp = (cx: number, cy: number) => {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (dx * dx + dy * dy > 4) continue;
      const nx = Math.round(cx) + dx, ny = Math.round(cy) + dy;
      if (nx >= 0 && ny >= 0 && nx < W && ny < H) mask[ny * W + nx] = 0;
    }
  };
  for (let i = 0; i + 1 < P.length; i++) {
    const a = P[i]!, b = P[i + 1]!;
    const steps = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])));
    for (let t = 0; t <= steps; t++) stamp(a[0] + (b[0] - a[0]) * t / steps, a[1] + (b[1] - a[1]) * t / steps);
  }
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  const comps = polygonsFromMask(inside, W, H);
  if (comps.length < 2) return null;
  const toDisp = (loop: Ring) => dpRing(loop.map(([x, y]) => [+(minx + x / s).toFixed(1), +(miny + y / s).toFixed(1)] as [number, number]), 1.5);
  return comps.map((c) => ({ exterior: toDisp(c.exterior), holes: c.holes.map(toDisp).filter((h) => h.length >= 3) })).filter((c) => c.exterior.length >= 3 && polyAbsArea(c.exterior) >= MIN_COMPONENT_AREA);
}

export function ensureUniqueIds(regs: TerritoryRegion[]): TerritoryRegion[] {
  const seen = new Set<number>(); let max = regs.reduce((m, r) => Math.max(m, r.id), 0);
  return regs.map((r) => { if (seen.has(r.id)) { max += 1; seen.add(max); return { ...r, id: max }; } seen.add(r.id); return r; });
}

export function sanitizeRegions(regs: TerritoryRegion[]): TerritoryRegion[] {
  const kept = regs.filter((r) => r.exterior && r.exterior.length >= 3 && !(polyAbsArea(r.exterior) < MIN_COMPONENT_AREA && !r.category));
  return ensureUniqueIds(kept);
}

export function enforcePartition(regs: TerritoryRegion[], winnerId: number): TerritoryRegion[] {
  const winner = regs.find((r) => r.id === winnerId); if (!winner) return regs;
  const wb = bboxOf(winner.exterior); let maxId = regs.reduce((m, r) => Math.max(m, r.id), 0);
  const out: TerritoryRegion[] = [];
  for (const r of regs) {
    if (r.id === winnerId) { out.push(r); continue; }
    if (!bboxOverlap(wb, bboxOf(r.exterior))) { out.push(r); continue; }
    const res = subtractWinner(r, winner);
    if (res === null) { out.push(r); continue; }
    const mk = (id: number, c: { exterior: Ring; holes: Ring[] }): TerritoryRegion => ({
      ...r, id, exterior: c.exterior, holes: c.holes.length ? c.holes : undefined,
      area_px: netArea(c.exterior, c.holes), centroid: polygonCentroid(c.exterior),
    });
    for (let i = 0; i < res.length; i++) out.push(mk(i === 0 ? r.id : ++maxId, res[i]!));
  }
  return out;
}
