import type { MouseEvent, RefObject } from 'react';
import { BOARD_VIEWBOX, ALL_SHAPES } from '../../anchors.js';

interface MinimapProps {
  boardRef: RefObject<HTMLDivElement | null>;
  onJumpToMap?: () => void;
}

/**
 * Minimap miniature permettant de cliquer pour déplacer la vue principale.
 */
export function Minimap({ boardRef, onJumpToMap }: MinimapProps) {
  const handleClick = (e: MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - r.left) / r.width;
    const fy = (e.clientY - r.top) / r.height;
    if (onJumpToMap) onJumpToMap();

    setTimeout(() => {
      const el = boardRef.current;
      if (el) {
        el.scrollTo({
          left: fx * el.scrollWidth - el.clientWidth / 2,
          top: fy * el.scrollHeight - el.clientHeight / 2,
          behavior: 'smooth',
        });
      }
    }, 80);
  };

  return (
    <div style={{ flex: 1, border: '2px solid #7a4a18', background: '#0d3a4a', overflow: 'hidden', minHeight: 60 }} title="Cliquer pour centrer la carte ici">
      <svg
        viewBox={`0 0 ${BOARD_VIEWBOX.w} ${BOARD_VIEWBOX.h}`}
        style={{ width: '100%', display: 'block', cursor: 'pointer' }}
        onClick={handleClick}
      >
        <rect x={0} y={0} width={BOARD_VIEWBOX.w} height={BOARD_VIEWBOX.h} fill="#14506a" />
        {ALL_SHAPES.filter((s) => !s.isWater).map((s) => (
          <polygon key={s.id} points={s.points} fill="#c8a86a" stroke="none" />
        ))}
      </svg>
    </div>
  );
}
