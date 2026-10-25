import { BOARD_VIEWBOX, ALL_SHAPES, COAST_SUBS } from '../../anchors.js';
import { ATLAS_THEME } from './boardTheme.js';
import { BoardAntiqueSahara } from './BoardAntiqueSahara.js';

interface BoardAntiqueBackgroundProps {
  outSet: ReadonlySet<string>;
}

// Classical Latin macro watermarks for ancient seas
const SEA_CALLIGRAPHY = [
  { name: 'OCEANUS ATLANTICUS', x: 380, y: 720, size: 22, rot: -15 },
  { name: 'MARE TYRRHENUM', x: 820, y: 640, size: 14, rot: 35 },
  { name: 'MARE IONIUM', x: 1220, y: 690, size: 14, rot: 40 },
  { name: 'MARE AEGAEUM', x: 1540, y: 750, size: 13, rot: -30 },
  { name: 'PONTUS EUXINUS', x: 1820, y: 220, size: 18, rot: 0 },
  { name: 'MARE NOSTRUM', x: 1380, y: 940, size: 24, rot: 4 },
  { name: 'MARE ARABICUM', x: 2360, y: 1280, size: 15, rot: 35 },
  { name: 'SINUS PERSICUS', x: 2720, y: 740, size: 14, rot: 45 },
];

export function BoardAntiqueBackground({ outSet }: BoardAntiqueBackgroundProps) {
  // Collect all playable land polygons for bathymetric contour echoes
  const landRipples: string[] = [];
  for (const s of ALL_SHAPES) {
    if (outSet.has(s.id)) continue;
    const subs = COAST_SUBS[s.id];
    if (subs) {
      for (const sub of subs) {
        if (sub.kind === 'land') landRipples.push(sub.points);
      }
    } else if (!s.isWater) {
      landRipples.push(s.points);
    }
  }

  const sortedShapes = [...ALL_SHAPES].sort((a, b) => (a.isWater ? 0 : 1) - (b.isWater ? 0 : 1));

  return (
    <g id="atlas-board-backdrop">
      {/* Deep Mediterranean marine canvas */}
      <rect x={0} y={0} width={BOARD_VIEWBOX.w} height={BOARD_VIEWBOX.h} fill="url(#atlas-sea-gradient)" />

      {/* Classical antique sea calligraphy */}
      <g id="atlas-sea-names" pointerEvents="none">
        {SEA_CALLIGRAPHY.map((sea) => (
          <text
            key={sea.name}
            x={sea.x}
            y={sea.y}
            transform={`rotate(${sea.rot} ${sea.x} ${sea.y})`}
            textAnchor="middle"
            fill="#3d6880"
            opacity={0.32}
            fontFamily={ATLAS_THEME.fontSerif}
            fontSize={sea.size}
            fontStyle="italic"
            letterSpacing={7}
            fontWeight="bold"
          >
            {sea.name}
          </text>
        ))}
      </g>

      {/* Concentric bathymetric coastal wave ripples radiating outwards into the sea */}
      <g id="atlas-bathymetry" pointerEvents="none">
        {landRipples.map((pts, i) => (
          <polygon key={`r3-${i}`} points={pts} fill="none" stroke="#16394c" strokeWidth={11} strokeLinejoin="round" opacity={0.65} />
        ))}
        {landRipples.map((pts, i) => (
          <polygon key={`r2-${i}`} points={pts} fill="none" stroke="#1e4961" strokeWidth={6} strokeLinejoin="round" opacity={0.8} />
        ))}
        {landRipples.map((pts, i) => (
          <polygon key={`r1-${i}`} points={pts} fill="none" stroke="#2a607d" strokeWidth={3} strokeLinejoin="round" opacity={0.9} />
        ))}
      </g>

      {/* Terrestrial parchment polygons & coastal sub-divisions */}
      <g id="atlas-land-masses" pointerEvents="none">
        {sortedShapes.map((s) => {
          const isOut = outSet.has(s.id);
          const subs = !isOut ? COAST_SUBS[s.id] : undefined;

          if (subs) {
            return (
              <g key={s.id}>
                {subs.map((sub, i) => (
                  <polygon
                    key={i}
                    points={sub.points}
                    strokeLinejoin="round"
                    strokeWidth={sub.kind === 'land' ? 1.4 : 0.8}
                    fill={sub.kind === 'sea' ? '#112b38' : 'url(#atlas-coast-gradient)'}
                    stroke={sub.kind === 'sea' ? '#193f54' : '#3d2d1d'}
                  />
                ))}
              </g>
            );
          }

          if (isOut) {
            return (
              <g key={s.id}>
                <polygon points={s.points} strokeLinejoin="round" strokeWidth={1.2} fill="#1d2127" stroke="#363f4b" />
                <polygon points={s.points} strokeLinejoin="round" fill="url(#atlas-out-hatch)" opacity={0.35} />
              </g>
            );
          }

          if (s.isWater) {
            return (
              <polygon
                key={s.id}
                points={s.points}
                strokeLinejoin="round"
                strokeWidth={0.8}
                strokeDasharray="6 4"
                fill="transparent"
                stroke="#1c4257"
              />
            );
          }

          return (
            <polygon
              key={s.id}
              points={s.points}
              strokeLinejoin="round"
              strokeWidth={1.1}
              strokeDasharray="4 2.5"
              fill="url(#atlas-land-gradient)"
              stroke="#7c6346"
            />
          );
        })}

        {/* Plausible interior Sahara desert continental landmass */}
        <BoardAntiqueSahara isOut={outSet.has('west-mauretania')} />
      </g>
    </g>
  );
}
