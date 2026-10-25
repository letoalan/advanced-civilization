import { useState, useRef, useLayoutEffect, type CSSProperties } from 'react';
import { anchors, BOARD_VIEWBOX, ALL_SHAPES } from '../../anchors.js';
import { areaById } from '../../../data/index.js';
import { outOfPlay } from '../../../engine/helpers.js';
import type { GameState } from '../../../engine/types.js';
import type { MapArt } from '../../mapArt.js';
import { usePeekContext } from './AreaPeekContext.js';
import { BoardBackground } from './BoardBackground.js';
import { CityMarker, TokenMarker, ShipMarker, CapacityBadge, TerrainGlyphs } from './BoardTokens.js';
import { AreaTooltip } from './AreaTooltip.js';

const SHAPE_BY_ID = new Map(ALL_SHAPES.map((s) => [s.id, s]));
const MAP_BTN: CSSProperties = {
  cursor: 'pointer',
  fontSize: 12,
  padding: '4px 9px',
  borderRadius: 6,
  border: '1px solid #7a4a18',
  background: 'rgba(13,58,74,0.88)',
  color: '#fff',
};
const ZOOM_LEVELS = [1, 1.5, 2, 3];

export interface BoardProps {
  state: GameState;
  selected: string | null;
  onSelect: (a: string | null) => void;
  highlight: Set<string>;
  zoomTo?: string | null;
  origin?: string | null;
  moved?: Set<string>;
  art?: MapArt | null;
}

export function Board({ state, selected, onSelect, highlight, zoomTo, origin, moved, art }: BoardProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { peek } = usePeekContext();
  const [showTerrain, setShowTerrain] = useState(false);
  const [zoom, setZoomRaw] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('advciv-board-zoom'));
      return ZOOM_LEVELS.includes(v) ? v : 1;
    } catch {
      return 1;
    }
  });

  const wrapRef = useRef<HTMLDivElement>(null);
  const pendingCenter = useRef<{ fx: number; fy: number } | null>(null);

  const setZoom = (z: number) => {
    const el = wrapRef.current?.parentElement;
    if (el && el.scrollWidth > 0 && el.scrollHeight > 0) {
      pendingCenter.current = {
        fx: (el.scrollLeft + el.clientWidth / 2) / el.scrollWidth,
        fy: (el.scrollTop + el.clientHeight / 2) / el.scrollHeight,
      };
    }
    setZoomRaw(z);
    try {
      localStorage.setItem('advciv-board-zoom', String(z));
    } catch {
      /* ignore */
    }
  };

  useLayoutEffect(() => {
    const p = pendingCenter.current;
    pendingCenter.current = null;
    const el = wrapRef.current?.parentElement;
    if (p && el) el.scrollTo({ left: p.fx * el.scrollWidth - el.clientWidth / 2, top: p.fy * el.scrollHeight - el.clientHeight / 2 });
  }, [zoom]);

  const zi = ZOOM_LEVELS.indexOf(zoom);
  const outSet = outOfPlay(state);

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: zoom === 1 ? BOARD_VIEWBOX.w : `${zoom * 100}%`, maxWidth: zoom === 1 ? '100%' : undefined, margin: '0 auto' }}>
      <div style={{ position: 'sticky', top: 10, left: 10, zIndex: 25, height: 0, width: 0, overflow: 'visible' }}>
        <div style={{ display: 'flex', gap: 5, width: 'max-content' }}>
          <button onClick={() => setZoom(ZOOM_LEVELS[zi - 1] ?? 1)} disabled={zi <= 0} title="Zoom out" style={{ ...MAP_BTN, minWidth: 28, fontWeight: 700, opacity: zi <= 0 ? 0.5 : 1 }}>−</button>
          <button onClick={() => setZoom(1)} title="Réinitialiser le zoom" style={MAP_BTN}>🔍 {Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(ZOOM_LEVELS[zi + 1] ?? ZOOM_LEVELS[ZOOM_LEVELS.length - 1]!)} disabled={zi >= ZOOM_LEVELS.length - 1} title="Zoom in" style={{ ...MAP_BTN, minWidth: 28, fontWeight: 700, opacity: zi >= ZOOM_LEVELS.length - 1 ? 0.5 : 1 }}>+</button>
          <button onClick={() => setShowTerrain((s) => !s)} title="Afficher/masquer les terrains : 🌋 volcan · 🏛 cité · 🌊 plaine inondable" style={{ ...MAP_BTN, background: showTerrain ? '#3a5a2a' : MAP_BTN.background }}>
            🌋 Terrain: {showTerrain ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <svg viewBox={`0 0 ${BOARD_VIEWBOX.w} ${BOARD_VIEWBOX.h}`} style={{ width: '100%', display: 'block', background: '#0d3a4a' }}>
        <BoardBackground state={state} art={art} outSet={outSet} />

        {Object.keys(anchors).filter((aid) => !outSet.has(aid)).map((aid) => {
          const an = anchors[aid]!;
          const sh = SHAPE_BY_ID.get(aid);
          const a = state.areas[aid] ?? { tokens: {} as Record<string, number> };
          const meta = areaById.get(aid);
          const owners = Object.entries(a.tokens).filter(([, n]) => n > 0);
          const showCap = !!meta && !meta.isWater && (owners.length > 0 || !!a.city) && meta.sustains > 0;
          const isHi = highlight.has(aid);
          const isSel = selected === aid;
          const isPeek = peek.has(aid);
          const isOrigin = origin === aid;
          const isMoved = !!moved?.has(aid);
          const ships = Object.entries(a.ships ?? {}).filter(([, n]) => n > 0);

          return (
            <g key={aid} data-area={aid} onClick={() => onSelect(isSel ? null : aid)} onMouseEnter={() => setHovered(aid)} onMouseLeave={() => setHovered((h) => (h === aid ? null : h))} style={{ cursor: 'pointer' }}>
              {sh ? <polygon points={sh.points} fill={isSel ? '#ffffff22' : isOrigin ? '#ffd23f22' : 'transparent'} pointerEvents="all" /> : <circle cx={an.x} cy={an.y} r={an.r + 6} fill="transparent" />}
              {(isHi || isSel || isOrigin) && sh && <polygon points={sh.points} fill="none" stroke={isOrigin ? '#ffd23f' : isSel ? '#fff' : '#5cf'} strokeWidth={isOrigin ? 4 : 3} strokeLinejoin="round" pointerEvents="none" />}
              {isMoved && sh && <polygon points={sh.points} fill="none" stroke="#ffd23f" strokeWidth={2.5} strokeDasharray="8 5" strokeLinejoin="round" pointerEvents="none" />}
              {isPeek && (sh ? <polygon points={sh.points} fill="#ff5cf133" stroke="#ff5cf1" strokeWidth={5} strokeLinejoin="round" pointerEvents="none" /> : <circle cx={an.x} cy={an.y} r={an.r + 9} fill="none" stroke="#ff5cf1" strokeWidth={5} pointerEvents="none" />)}
              {a.city && <CityMarker cx={an.x} cy={an.y} r={an.r} owner={a.city} />}
              {owners.map(([owner, n], i) => <TokenMarker key={owner} cx={an.x} cy={an.y} r={an.r} owner={owner} count={n} offsetIndex={i} />)}
              {ships.map(([owner], i) => <ShipMarker key={'s' + owner} cx={an.x} cy={an.y} r={an.r} owner={owner} offsetIndex={i} />)}
              {showCap && <CapacityBadge cx={an.x} cy={an.y} r={an.r} limit={meta!.sustains} />}
              {showTerrain && meta && (() => {
                const glyphs = [meta.isVolcanoSite && '🌋', meta.isCitySite && '🏛', meta.isFloodplain && '🌊'].filter(Boolean).join('');
                return glyphs ? <TerrainGlyphs cx={an.x} cy={an.y} r={an.r} glyphs={glyphs} /> : null;
              })()}
            </g>
          );
        })}
      </svg>
      {hovered && anchors[hovered] && <AreaTooltip areaId={hovered} state={state} zoomed={!!zoomTo} />}
    </div>
  );
}
