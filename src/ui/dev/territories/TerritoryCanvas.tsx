import { categoryMeta, polygonCentroid, type TerritoryRegion } from '../../../data/territories.js';
import { BOARD_SRC } from './constants.js';
import type { CutState, Drag } from './types.js';

interface TerritoryCanvasProps {
  boardScrollRef: React.RefObject<HTMLDivElement | null>;
  svgRef: React.RefObject<SVGSVGElement | null>;
  width: number;
  height: number;
  dScale: number;
  regions: TerritoryRegion[];
  selectedSet: Set<number>;
  selIds: number[];
  primaryId: number | null;
  primary: TerritoryRegion | null;
  selectedVertex: number | null;
  drag: Drag;
  draft: [number, number][] | null;
  cut: CutState;
  hideDone: boolean;
  onMouseMove: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onSelectCell: (id: number, additive: boolean) => void;
  onVertexMouseDown: (index: number) => void;
  onCentroidMouseDown: (e: React.MouseEvent) => void;
  onAddDraftPoint: (p: [number, number]) => void;
  onAddCutPoint: (p: [number, number]) => void;
  toNative: (cx: number, cy: number) => [number, number] | null;
  mergeTargetFor: (ext: [number, number][], i: number) => number;
}

export function TerritoryCanvas({
  boardScrollRef,
  svgRef,
  width,
  height,
  dScale,
  regions,
  selectedSet,
  selIds,
  primaryId,
  primary,
  selectedVertex,
  drag,
  draft,
  cut,
  hideDone,
  onMouseMove,
  onDoubleClick,
  onSelectCell,
  onVertexMouseDown,
  onCentroidMouseDown,
  onAddDraftPoint,
  onAddCutPoint,
  toNative,
  mergeTargetFor,
}: TerritoryCanvasProps) {
  return (
    <div
      ref={boardScrollRef}
      style={{
        position: 'relative',
        width: 1900,
        height: 1200,
        userSelect: 'none',
        overflow: 'auto',
        border: '1px solid #2a2d34',
      }}
    >
      <div style={{ position: 'relative', width, height }}>
        <img src={BOARD_SRC} width={width} height={height} alt="Board" draggable={false} style={{ display: 'block' }} />
        <svg
          ref={svgRef}
          width={width}
          height={height}
          onMouseMove={onMouseMove}
          onDoubleClick={onDoubleClick}
          style={{ position: 'absolute', top: 0, left: 0, cursor: 'default' }}
        >
          <rect x={0} y={0} width={width} height={height} fill="transparent" />
          {regions.map((r) => {
            const sel = selectedSet.has(r.id);
            const m = categoryMeta(r.category);
            const ringD = (ring: [number, number][]) =>
              'M' + ring.map(([x, y]) => `${(x * dScale).toFixed(1)},${(y * dScale).toFixed(1)}`).join('L') + 'Z';
            const d = ringD(r.exterior) + (r.holes || []).map(ringD).join('');
            const dim = hideDone && r.category !== '';
            const c = polygonCentroid(r.exterior);
            return (
              <g key={r.id} opacity={dim ? 0.25 : 1}>
                <path
                  d={d}
                  fillRule="evenodd"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onSelectCell(r.id, e.shiftKey);
                  }}
                  style={{
                    fill: r.category ? `${m.fill}55` : sel ? '#ffd54a22' : 'rgba(0,0,0,0.001)',
                    stroke: sel ? '#ffd54a' : m.stroke,
                    strokeWidth: sel ? 2.5 : r.category ? 1.3 : 1,
                    strokeLinejoin: 'round',
                    cursor: 'pointer',
                    pointerEvents: 'all',
                  }}
                />
                <text
                  x={c[0] * dScale}
                  y={c[1] * dScale}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={
                    {
                      fill: sel ? '#fff' : '#e8e8ea',
                      fontSize: 11,
                      fontWeight: 700,
                      pointerEvents: 'none',
                      paintOrder: 'stroke',
                      stroke: '#000',
                      strokeWidth: 2.5,
                    } as React.CSSProperties
                  }
                >
                  {r.id}
                </text>
              </g>
            );
          })}

          {selIds.length === 1 && primary && (() => {
            const c = polygonCentroid(primary.exterior);
            const mergeTarget =
              drag?.kind === 'vertex' && drag.id === primary.id ? mergeTargetFor(primary.exterior, drag.index) : -1;
            return (
              <g>
                {primary.exterior.map((p, i) => {
                  const vsel = selectedVertex === i;
                  const isMT = i === mergeTarget;
                  return (
                    <circle
                      key={i}
                      cx={p[0] * dScale}
                      cy={p[1] * dScale}
                      r={isMT ? 9 : vsel ? 7 : 5}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onVertexMouseDown(i);
                      }}
                      style={{
                        fill: isMT ? '#ff5a3a' : vsel ? '#ffd54a' : '#ff7ab8',
                        stroke: isMT ? '#fff' : '#1a1a1a',
                        strokeWidth: isMT ? 2 : 1,
                        cursor: 'grab',
                      }}
                    />
                  );
                })}
                <circle
                  cx={c[0] * dScale}
                  cy={c[1] * dScale}
                  r={6}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onCentroidMouseDown(e);
                  }}
                  style={{ fill: '#3ad6e0', stroke: '#0a2a2c', strokeWidth: 1.5, cursor: 'move' }}
                />
              </g>
            );
          })()}

          {draft !== null && (
            <g>
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="rgba(0,0,0,0.18)"
                style={{ cursor: 'crosshair' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const n = toNative(e.clientX, e.clientY);
                  if (n) onAddDraftPoint(n);
                }}
              />
              {draft.length > 0 && (
                <polyline
                  points={[...draft, ...(draft.length >= 3 ? [draft[0]!] : [])]
                    .map(([x, y]) => `${x * dScale},${y * dScale}`)
                    .join(' ')}
                  style={{
                    fill: draft.length >= 3 ? 'rgba(128,220,120,0.18)' : 'none',
                    stroke: '#80dc78',
                    strokeWidth: 2,
                    strokeDasharray: '5,3',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {draft.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0] * dScale}
                  cy={p[1] * dScale}
                  r={i === 0 ? 6 : 4}
                  style={{
                    fill: i === 0 ? '#ffd54a' : '#80dc78',
                    stroke: '#1a1a1a',
                    strokeWidth: 1,
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </g>
          )}

          {cut !== null && (
            <g>
              <rect
                x={0}
                y={0}
                width={width}
                height={height}
                fill="rgba(0,0,0,0.12)"
                style={{ cursor: 'crosshair' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const n = toNative(e.clientX, e.clientY);
                  if (n) onAddCutPoint(n);
                }}
              />
              {cut.pts.length > 0 && (
                <polyline
                  points={cut.pts.map(([x, y]) => `${x * dScale},${y * dScale}`).join(' ')}
                  style={{
                    fill: 'none',
                    stroke: '#ff8f5a',
                    strokeWidth: 2.5,
                    strokeDasharray: '6,4',
                    pointerEvents: 'none',
                  }}
                />
              )}
              {cut.pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0] * dScale}
                  cy={p[1] * dScale}
                  r={4}
                  style={{ fill: '#ff8f5a', stroke: '#1a1a1a', strokeWidth: 1, pointerEvents: 'none' }}
                />
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
