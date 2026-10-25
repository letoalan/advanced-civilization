import { MAP_PANELS, mainToCombined } from '../../anchors.js';
import { playAreas } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import type { MapArt } from '../../mapArt.js';
import type { BoardStyle } from './boardTheme.js';
import { BoardClassicBackground } from './BoardClassicBackground.js';
import { BoardAntiqueBackground } from './BoardAntiqueBackground.js';
import { BoardAntiqueDefs } from './BoardAntiqueDefs.js';

interface BoardBackgroundProps {
  state: GameState;
  art?: MapArt | null;
  outSet: ReadonlySet<string>;
  style?: BoardStyle;
}

export function BoardBackground({ state, art, outSet, style = 'atlas' }: BoardBackgroundProps) {
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
      ) : style === 'classic' ? (
        <BoardClassicBackground outSet={outSet} />
      ) : (
        <>
          <BoardAntiqueDefs />
          <BoardAntiqueBackground outSet={outSet} />
        </>
      )}

      {MAP_PANELS.filter((m) => !panelOn(m.key)).map((m) => (
        <rect
          key={`off-${m.key}`}
          x={m.x}
          y={m.y}
          width={m.w}
          height={m.h}
          fill="#0c1015"
          opacity={0.85}
          pointerEvents="none"
        />
      ))}

      {cropCovers.map((c) => (
        <polygon
          key={`crop-${c.key}`}
          points={c.pts}
          fill="#0c1015"
          opacity={0.65}
          stroke={style === 'atlas' ? '#c4a976' : '#e6e7e8'}
          strokeWidth={2}
          strokeDasharray="9 6"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      ))}
    </>
  );
}
