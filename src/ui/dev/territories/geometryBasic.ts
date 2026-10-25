import { polygonCentroid, type TerritoryRegion } from '../../../data/territories.js';
import type { Ring } from './types.js';

export function pointInPoly(p: [number, number], poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const pi = poly[i]!, pj = poly[j]!;
    const xi = pi[0], yi = pi[1], xj = pj[0], yj = pj[1];
    if (((yi > p[1]) !== (yj > p[1])) && (p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export function distToSeg(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy || 1;
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = a[0] + t * dx, cy = a[1] + t * dy;
  return (p[0] - cx) ** 2 + (p[1] - cy) ** 2;
}

export function dpRing(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length < 4) return pts;
  const sq = eps * eps;
  const d2 = (p: [number, number], a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const L = dx * dx + dy * dy;
    if (!L) return (p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2;
    let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L;
    t = Math.max(0, Math.min(1, t));
    return (p[0] - (a[0] + t * dx)) ** 2 + (p[1] - (a[1] + t * dy)) ** 2;
  };
  const sim = (s: number, e: number, arr: [number, number][]): [number, number][] => {
    let idx = -1, mx = 0;
    for (let i = s + 1; i < e; i++) {
      const d = d2(arr[i]!, arr[s]!, arr[e]!);
      if (d > mx) { mx = d; idx = i; }
    }
    return (mx > sq && idx !== -1) ? [...sim(s, idx, arr), ...sim(idx, e, arr).slice(1)] : [arr[s]!, arr[e]!];
  };
  let a1 = 1, best = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = (pts[i]![0] - pts[0]![0]) ** 2 + (pts[i]![1] - pts[0]![1]) ** 2;
    if (d > best) { best = d; a1 = i; }
  }
  const h1 = sim(0, a1, pts);
  const s2 = [...pts.slice(a1), pts[0]!];
  const h2 = sim(0, s2.length - 1, s2);
  return [...h1.slice(0, -1), ...h2.slice(0, -1)];
}

export function traceOutline(inside: (x: number, y: number) => boolean, W: number, H: number): [number, number][] | null {
  const edges: [number, number, number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!inside(x, y)) continue;
    if (!inside(x, y - 1)) edges.push([x, y, x + 1, y]);
    if (!inside(x, y + 1)) edges.push([x, y + 1, x + 1, y + 1]);
    if (!inside(x - 1, y)) edges.push([x, y, x, y + 1]);
    if (!inside(x + 1, y)) edges.push([x + 1, y, x + 1, y + 1]);
  }
  if (!edges.length) return null;
  const adj = new Map<number, { to: number; e: string }[]>();
  const pts = new Map<number, [number, number]>();
  const used = new Set<string>();
  const key = (x: number, y: number) => x * 100000 + y;
  const ek = (a: number, b: number) => (a < b ? `${a}_${b}` : `${b}_${a}`);
  for (const [ax, ay, bx, by] of edges) {
    const ka = key(ax, ay), kb = key(bx, by);
    pts.set(ka, [ax, ay]); pts.set(kb, [bx, by]);
    const e = ek(ka, kb);
    if (!adj.has(ka)) adj.set(ka, []); if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka)!.push({ to: kb, e }); adj.get(kb)!.push({ to: ka, e });
  }
  let bestLoop: [number, number][] | null = null;
  for (const startK of adj.keys()) {
    let cur = startK; const loop: [number, number][] = []; let steps = 0, started = false;
    while (steps++ < edges.length * 2 + 5) {
      const opts = adj.get(cur)!.filter((o) => !used.has(o.e));
      if (!opts.length) break;
      const o = opts[0]!; used.add(o.e); loop.push(pts.get(cur)!); cur = o.to; started = true;
      if (cur === startK) break;
    }
    if (started && loop.length >= 4 && (!bestLoop || loop.length > bestLoop.length)) bestLoop = loop;
  }
  return bestLoop;
}

export function componentCount(inside: (x: number, y: number) => boolean, W: number, H: number): number {
  const seen = new Uint8Array(W * H); let comps = 0; const stack: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (seen[i] || !inside(x, y)) continue;
    comps++; stack.length = 0; stack.push(i); seen[i] = 1;
    while (stack.length) {
      const p = stack.pop()!; const py = (p / W) | 0, px = p % W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = ny * W + nx; if (!seen[ni] && inside(nx, ny)) { seen[ni] = 1; stack.push(ni); }
      }
    }
  }
  return comps;
}

export const bboxOf = (pts: Ring): [number, number, number, number] => {
  let a: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of pts) {
    if (p[0] < a[0]) a[0] = p[0]; if (p[1] < a[1]) a[1] = p[1];
    if (p[0] > a[2]) a[2] = p[0]; if (p[1] > a[3]) a[3] = p[1];
  }
  return a;
};
export const bboxOverlap = (a: number[], b: number[]) => a[0]! <= b[2]! && b[0]! <= a[2]! && a[1]! <= b[3]! && b[1]! <= a[3]!;
export const polyAbsArea = (p: Ring) => {
  let s = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) s += p[j]![0] * p[i]![1] - p[i]![0] * p[j]![1];
  return Math.abs(s) / 2;
};
export const regionContains = (r: TerritoryRegion, p: [number, number]) => pointInPoly(p, r.exterior) && !(r.holes || []).some((h) => pointInPoly(p, h));
export const netArea = (ext: Ring, holes: Ring[]) => Math.round(polyAbsArea(ext) - holes.reduce((s, h) => s + polyAbsArea(h), 0));
