import { useState } from 'react';
import { anchors, BOARD_VIEWBOX, ALL_SHAPES } from '../../anchors.js';
import { areaById } from '../../../data/index.js';
import { outOfPlay } from '../../../engine/helpers.js';
import type { GameState } from '../../../engine/types.js';
import type { MapArt } from '../../mapArt.js';
import { usePeekContext } from './AreaPeekContext.js';
import { BoardBackground } from './BoardBackground.js';
import { CityMarker, TokenMarker, ShipMarker, CapacityBadge, CitySiteEmblem, VolcanoEmblem, FloodplainEmblem } from './BoardTokens.js';
import { AreaTooltip } from './AreaTooltip.js';
import { BoardLabels } from './BoardLabels.js';
import { BoardControls } from './BoardControls.js';
import { useBoardNavigation } from './useBoardNavigation.js';
import { getStoredBoardStyle, setStoredBoardStyle, type BoardStyle, ATLAS_THEME, CLASSIC_THEME } from './boardTheme.js';

const SHAPE_BY_ID = new Map(ALL_SHAPES.map((s) => [s.id, s]));

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
  const [style, setStyle] = useState<BoardStyle>(getStoredBoardStyle);

  const {
    zoom,
    boardWidth,
    boardHeight,
    wrapRef,
    isDragging,
    hasDragged,
    zoomIn,
    zoomOut,
    zoomFit,
    zoomCover,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  } = useBoardNavigation();

  const handleToggleStyle = () => {
    const next: BoardStyle = style === 'atlas' ? 'classic' : 'atlas';
    setStyle(next);
    setStoredBoardStyle(next);
  };

  const outSet = outOfPlay(state);
  const theme = style === 'atlas' ? ATLAS_THEME : CLASSIC_THEME;

  return (
    <div
      ref={wrapRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        position: 'relative',
        flexShrink: 0,
        width: `${boardWidth}px`,
        height: `${boardHeight}px`,
        minHeight: zoom < 1.05 ? undefined : '100%',
        margin: 'auto',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: 'none',
      }}
    >
      <BoardControls
        zoom={zoom}
        style={style}
        showTerrain={showTerrain}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onZoomFit={zoomFit}
        onZoomCover={zoomCover}
        onToggleStyle={handleToggleStyle}
        onToggleTerrain={() => setShowTerrain((s) => !s)}
      />

      <svg
        viewBox={`0 0 ${BOARD_VIEWBOX.w} ${BOARD_VIEWBOX.h}`}
        style={{ width: '100%', height: '100%', display: 'block', background: theme.sea }}
      >
        <BoardBackground state={state} art={art} outSet={outSet} style={style} />
        {style === 'atlas' && <BoardLabels zoom={zoom} outSet={outSet} />}

        {Object.keys(anchors).filter((aid) => !outSet.has(aid)).map((aid) => {
          const an = anchors[aid]!;
          const sh = SHAPE_BY_ID.get(aid);
          const a = state.areas[aid] ?? { tokens: {} as Record<string, number> };
          const meta = areaById.get(aid);
          const owners = Object.entries(a.tokens).filter(([, n]) => n > 0);
          const isHi = highlight.has(aid);
          const isSel = selected === aid;
          const isHov = hovered === aid;
          const showCap = !!meta && !meta.isWater && meta.sustains > 0 && !a.city && (zoom >= 0.85 || isSel || isHi || isHov || owners.length > 0);
          const showCitySite = !!meta && meta.isCitySite && !a.city;
          const isPeek = peek.has(aid);
          const isOrigin = origin === aid;
          const isMoved = !!moved?.has(aid);
          const ships = Object.entries(a.ships ?? {}).filter(([, n]) => n > 0);

          const fillTactical = isSel ? theme.selection : isOrigin ? theme.origin : isHi ? theme.highlight : 'transparent';
          const strokeTactical = isOrigin ? theme.originStroke : isSel ? theme.selectionStroke : isHi ? theme.highlightStroke : undefined;

          return (
            <g
              key={aid}
              data-area={aid}
              onClick={() => { if (!hasDragged.current) onSelect(isSel ? null : aid); }}
              onMouseEnter={() => setHovered(aid)}
              onMouseLeave={() => setHovered((h) => (h === aid ? null : h))}
              style={{ cursor: isHi || isSel || isOrigin || owners.length > 0 ? 'pointer' : 'default' }}
            >
              {sh ? (
                <polygon
                  points={sh.points}
                  fill={fillTactical}
                  stroke={isHov && style === 'atlas' ? 'rgba(255, 230, 140, 0.5)' : undefined}
                  strokeWidth={isHov && style === 'atlas' ? 2 : undefined}
                  pointerEvents="all"
                />
              ) : (
                <circle cx={an.x} cy={an.y} r={an.r + 6} fill="transparent" />
              )}

              {(isHi || isSel || isOrigin) && sh && strokeTactical && (
                <polygon
                  points={sh.points}
                  fill="none"
                  stroke={strokeTactical}
                  strokeWidth={isOrigin ? 4 : isHi ? 3.5 : 3}
                  strokeDasharray={isHi && !isSel ? '8 4' : undefined}
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              )}

              {isMoved && sh && (
                <polygon points={sh.points} fill="none" stroke="#ffd23f" strokeWidth={2.5} strokeDasharray="8 5" strokeLinejoin="round" pointerEvents="none" />
              )}

              {isPeek && (sh ? (
                <polygon points={sh.points} fill="#ff5cf133" stroke="#ff5cf1" strokeWidth={5} strokeLinejoin="round" pointerEvents="none" />
              ) : (
                <circle cx={an.x} cy={an.y} r={an.r + 9} fill="none" stroke="#ff5cf1" strokeWidth={5} pointerEvents="none" />
              ))}

              {showCitySite && <CitySiteEmblem cx={an.x} cy={an.y} hasPieces={owners.length > 0} style={style} />}
              {a.city && <CityMarker cx={an.x} cy={an.y} r={an.r} owner={a.city} isNaturalSite={meta?.isCitySite ?? false} style={style} />}
              {owners.map(([owner, n], i) => (
                <TokenMarker key={owner} cx={an.x} cy={an.y} r={an.r} owner={owner} count={n} offsetIndex={i} style={style} />
              ))}
              {ships.map(([owner], i) => (
                <ShipMarker key={'s' + owner} cx={an.x} cy={an.y} r={an.r} owner={owner} offsetIndex={i} style={style} />
              ))}
              {showCap && <CapacityBadge cx={an.x} cy={an.y} r={an.r} limit={meta!.sustains} hasPieces={owners.length > 0 || showCitySite} style={style} />}
              {meta?.isVolcanoSite && <VolcanoEmblem cx={an.x + an.r * 0.72} cy={an.y + an.r * 0.52} style={style} />}
              {meta?.isFloodplain && <FloodplainEmblem cx={an.x} cy={an.y + an.r * 0.78} style={style} />}
            </g>
          );
        })}
      </svg>
      {hovered && anchors[hovered] && <AreaTooltip areaId={hovered} state={state} zoomed={!!zoomTo} />}
    </div>
  );
}
