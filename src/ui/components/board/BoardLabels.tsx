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

        // Level of Detail (LOD):
        // Hide minor provinces (sustains <= 1 and no city site) when zoomed out to full Mediterranean
        if (zoom < 0.82 && !meta.isWater && meta.sustains <= 1 && !meta.isCitySite) {
          return null;
        }

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
            fontWeight="700"
            letterSpacing={isWater ? 1.4 : 0.8}
            fill={isWater ? '#255a73' : '#1f252e'}
            stroke={isWater ? 'rgba(235, 246, 252, 0.94)' : 'rgba(250, 248, 240, 0.94)'}
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
