import { polygonCentroid, type TerritoryRegion } from '../../../data/territories.js';
import type { CutState, Drag } from './types.js';

interface TerritoryOverlaysProps {
  width: number;
  height: number;
  dScale: number;
  selIds: number[];
  primary: TerritoryRegion | null;
  selectedVertex: number | null;
  drag: Drag;
  draft: [number, number][] | null;
  cut: CutState;
  onVertexMouseDown: (index: number) => void;
  onCentroidMouseDown: (e: React.MouseEvent) => void;
  onAddDraftPoint: (p: [number, number]) => void;
  onAddCutPoint: (p: [number, number]) => void;
  toNative: (cx: number, cy: number) => [number, number] | null;
  mergeTargetFor: (ext: [number, number][], i: number) => number;
}

export function TerritoryOverlays({
  width,
  height,
  dScale,
  selIds,
  primary,
  selectedVertex,
  drag,
  draft,
  cut,
  onVertexMouseDown,
  onCentroidMouseDown,
  onAddDraftPoint,
  onAddCutPoint,
  toNative,
  mergeTargetFor,
}: TerritoryOverlaysProps) {
  return (
    <>
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
    </>
  );
}
