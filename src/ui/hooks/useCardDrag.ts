import { useState, useCallback, useRef } from 'react';

export interface DragState {
  cardId: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

export function useCardDrag(onDrop?: (cardId: string, zoneId: string) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const startDrag = useCallback((cardId: string, e: React.PointerEvent) => {
    e.preventDefault();
    const initial = {
      cardId,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    };
    setDrag(initial);
    dragRef.current = initial;

    const onPointerMove = (ev: PointerEvent) => {
      if (!dragRef.current) return;
      const updated = {
        ...dragRef.current,
        x: ev.clientX,
        y: ev.clientY,
      };
      dragRef.current = updated;
      setDrag(updated);
    };

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (dragRef.current) {
        // Find drop zone element under pointer
        const elem = document.elementFromPoint(ev.clientX, ev.clientY);
        const dropZone = elem?.closest('[data-drop-zone]') as HTMLElement | null;
        if (dropZone && onDrop) {
          const zoneId = dropZone.getAttribute('data-drop-zone') ?? '';
          onDrop(dragRef.current.cardId, zoneId);
        }
      }

      setDrag(null);
      dragRef.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [onDrop]);

  return { drag, startDrag };
}
