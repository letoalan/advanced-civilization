import { anchors, BOARD_VIEWBOX } from '../../anchors.js';
import { civById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';

export function prettyPhase(p: string): string {
  return p.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

export function phaseLabel(s: GameState): string {
  if (s.pendingStart) return 'Choix des zones de départ';
  if (s.ninthStack?.awaiting) return 'Achat Or / Ivoire (9e pile)';
  return prettyPhase(s.phase);
}

export function legalAreas(legal: Action[], _phase: string): Set<string> {
  const set = new Set<string>();
  for (const a of legal) {
    if (a.type === 'move') a.moves.forEach((m) => set.add(m.to));
    if (a.type === 'buildCity') set.add(a.area);
    if (a.type === 'placeStart') set.add(a.area);
  }
  return set;
}

export function nationFocusArea(state: GameState, id: PlayerId): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const [aid, a] of Object.entries(state.areas)) {
    if (!anchors[aid]) continue;
    const score = (a.tokens[id] ?? 0) + (a.city === id ? 6 : 0);
    if (score > bestScore && score > 0) {
      bestScore = score;
      best = aid;
    }
  }
  const home = civById.get(id)?.start;
  return best ?? (home && anchors[home] ? home : null);
}

export function scrollBoardTo(container: HTMLElement | null, areaId: string | null) {
  if (!container || !areaId) return;
  const an = anchors[areaId];
  if (!an) return;
  const doScroll = () => {
    const svg = container.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      setTimeout(doScroll, 100);
      return;
    }
    const sx = rect.width / BOARD_VIEWBOX.w;
    const sy = rect.height / BOARD_VIEWBOX.h;
    container.scrollTo({
      left: Math.max(0, an.x * sx - container.clientWidth / 2),
      top: Math.max(0, an.y * sy - container.clientHeight / 2),
      behavior: 'smooth',
    });
  };
  doScroll();
}
