import { BOARD_VIEWBOX, ALL_SHAPES, COAST_SUBS } from '../../anchors.js';
import { SAHARA_INTERIEUR_POINTS } from './BoardAntiqueSahara.js';

interface BoardClassicBackgroundProps {
  outSet: ReadonlySet<string>;
}

export function BoardClassicBackground({ outSet }: BoardClassicBackgroundProps) {
  const sortedShapes = [...ALL_SHAPES].sort((a, b) => (a.isWater ? 0 : 1) - (b.isWater ? 0 : 1));

  return (
    <g id="classic-board-backdrop">
      <rect x={0} y={0} width={BOARD_VIEWBOX.w} height={BOARD_VIEWBOX.h} fill="#14506a" />
      {sortedShapes.map((s) => {
        const subs = !outSet.has(s.id) ? COAST_SUBS[s.id] : undefined;
        if (subs) {
          return (
            <g key={s.id} pointerEvents="none">
              {subs.map((sub, i) => (
                <polygon
                  key={i}
                  points={sub.points}
                  strokeLinejoin="round"
                  strokeWidth={0.8}
                  fill={sub.kind === 'sea' ? '#14506a' : '#c8a86a'}
                  stroke={sub.kind === 'sea' ? '#123f52' : '#9c7d3e'}
                />
              ))}
            </g>
          );
        }
        return (
          <polygon
            key={s.id}
            points={s.points}
            pointerEvents="none"
            strokeLinejoin="round"
            strokeWidth={1}
            fill={outSet.has(s.id) ? '#59564c' : s.isWater ? '#14506a' : '#c8a86a'}
            stroke={outSet.has(s.id) ? '#44423a' : s.isWater ? '#123f52' : '#9c7d3e'}
          />
        );
      })}
      {/* Plausible interior Sahara continental landmass */}
      {outSet.has('west-mauretania') ? (
        <polygon points={SAHARA_INTERIEUR_POINTS} fill="#59564c" stroke="#44423a" strokeWidth={1} pointerEvents="none" />
      ) : (
        <>
          <polygon
            points={SAHARA_INTERIEUR_POINTS}
            fill="#c8a86a"
            stroke="#9c7d3e"
            strokeWidth={1}
            strokeDasharray="4 2.5"
            strokeLinejoin="round"
            pointerEvents="none"
          />
          {/* Classic capacity badge ≤0 */}
          <g pointerEvents="none">
            <rect x={315} y={1240} width={30} height={16} rx={8} fill="#0d3a4a" stroke="#cfe8ff" strokeWidth={0.8} opacity={0.9} />
            <text x={330} y={1252} textAnchor="middle" fontSize={10} fontWeight="bold" fill="#cfe8ff">
              ≤0
            </text>
          </g>
          {/* Classic territory label */}
          <text
            x={330}
            y={1278}
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize={14}
            fontWeight="bold"
            fill="#3a2e1d"
            pointerEvents="none"
          >
            SAHARA INTÉRIEUR
          </text>
          <text
            x={330}
            y={1296}
            textAnchor="middle"
            fontFamily="sans-serif"
            fontSize={9.5}
            fontStyle="italic"
            fill="#5a472d"
            pointerEvents="none"
          >
            (0 population · 0 cité)
          </text>
        </>
      )}
    </g>
  );
}
