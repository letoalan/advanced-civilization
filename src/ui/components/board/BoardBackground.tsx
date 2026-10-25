import { BOARD_VIEWBOX, MAP_PANELS, ALL_SHAPES, COAST_SUBS, mainToCombined } from '../../anchors.js';
import { playAreas } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import type { MapArt } from '../../mapArt.js';

interface BoardBackgroundProps {
  state: GameState;
  art?: MapArt | null;
  outSet: ReadonlySet<string>;
}

export function BoardBackground({ state, art, outSet }: BoardBackgroundProps) {
  const panelOn = (k: 'western' | 'main' | 'eastern') =>
    !state.board || (k === 'western' ? state.board.west : k === 'eastern' ? state.board.east : true);

  const cropCovers = (state.board?.crops ?? [])
    .map((c) => ({
      key: c,
      pts: (playAreas.coverPolygons?.[c] ?? [])
        .map((p) => {
          const [x, y] = mainToCombined(p);
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' '),
    }))
    .filter((c) => c.pts.length > 0);

  return (
    <>
      {art ? (
        MAP_PANELS.filter((m) => panelOn(m.key)).map((m) => (
          <image key={m.key} href={art[m.key]} x={m.x} y={m.y} width={m.w} height={m.h} />
        ))
      ) : (
        <>
          <rect x={0} y={0} width={BOARD_VIEWBOX.w} height={BOARD_VIEWBOX.h} fill="#14506a" />
          {[...ALL_SHAPES].sort((a, b) => (a.isWater ? 0 : 1) - (b.isWater ? 0 : 1)).map((s) => {
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
        </>
      )}

      {MAP_PANELS.filter((m) => !panelOn(m.key)).map((m) => (
        <rect key={`off-${m.key}`} x={m.x} y={m.y} width={m.w} height={m.h} fill="#10141a" opacity={0.82} pointerEvents="none" />
      ))}

      {cropCovers.map((c) => (
        <polygon
          key={`crop-${c.key}`}
          points={c.pts}
          fill="#10141a"
          opacity={0.62}
          stroke="#e6e7e8"
          strokeWidth={2.5}
          strokeDasharray="10 6"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      ))}
    </>
  );
}
