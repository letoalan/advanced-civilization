import { anchors } from '../../anchors.js';
import { areaById } from '../../../data/index.js';
import { ATLAS_THEME } from './boardTheme.js';

interface BoardLabelsProps {
  zoom: number;
  outSet: ReadonlySet<string>;
}

export function BoardLabels({ zoom, outSet }: BoardLabelsProps) {
  const fontScale = zoom < 0.9 ? 7.5 : zoom < 1.3 ? 8.8 : zoom >= 2.2 ? 11.5 : 10;
  const strokeW = zoom < 1.0 ? 2.0 : 2.5;

  return (
    <g id="atlas-territory-labels" pointerEvents="none">
      {Object.keys(anchors).map((aid) => {
        if (outSet.has(aid)) return null;
        const an = anchors[aid];
        if (!an) return null;
        const meta = areaById.get(aid);
        if (!meta) return null;

        // Skip naval routing plumbing
        if (meta.coastalWater) return null;

        const isWater = meta.isWater;
        const labelY = an.y - an.r - 3;

        return (
          <text
            key={`lbl-${aid}`}
            x={an.x}
            y={labelY}
            textAnchor="middle"
            fontFamily={ATLAS_THEME.fontSerif}
            fontSize={fontScale}
            fontWeight="bold"
            letterSpacing={0.8}
            fill={isWater ? '#2a5369' : '#3d2e1f'}
            stroke={isWater ? 'rgba(235, 245, 252, 0.9)' : 'rgba(255, 252, 243, 0.92)'}
            strokeWidth={strokeW}
            strokeLinejoin="round"
            paintOrder="stroke fill"
            style={{ textTransform: 'uppercase' }}
          >
            {meta.name}
          </text>
        );
      })}
    </g>
  );
}
