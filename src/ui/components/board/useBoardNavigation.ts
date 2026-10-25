import { useState, useRef, useEffect, useCallback, type MouseEvent as ReactMouseEvent } from 'react';

const MIN_ZOOM = 0.6; // Allows zooming out to see entire board comfortably
const MAX_ZOOM = 4.0; // Allows deep zoom (up to 400%) for tactical close-ups

export function useBoardNavigation() {
  const [zoom, setZoomRaw] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem('advciv-board-zoom'));
      return v >= MIN_ZOOM && v <= MAX_ZOOM ? v : 1;
    } catch {
      return 1;
    }
  });

  const [containerDims, setContainerDims] = useState<{ w: number; h: number }>({ w: 1000, h: 600 });

  const wrapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, sl: 0, st: 0 });
  const hasDragged = useRef(false);

  // ResizeObserver to track parent container dimensions reactively
  useEffect(() => {
    const container = wrapRef.current?.parentElement;
    if (!container) return;

    const update = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        setContainerDims({ w: container.clientWidth, h: container.clientHeight });
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const applyZoom = useCallback((newZoom: number, focalPoint?: { clientX: number; clientY: number }) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(newZoom * 100) / 100));
    const container = wrapRef.current?.parentElement;

    if (container && focalPoint) {
      const rect = container.getBoundingClientRect();
      const cursorX = focalPoint.clientX - rect.left;
      const cursorY = focalPoint.clientY - rect.top;

      const contentX = container.scrollLeft + cursorX;
      const contentY = container.scrollTop + cursorY;

      const ratio = clamped / zoom;
      const newScrollLeft = contentX * ratio - cursorX;
      const newScrollTop = contentY * ratio - cursorY;

      setZoomRaw(clamped);
      requestAnimationFrame(() => {
        container.scrollLeft = newScrollLeft;
        container.scrollTop = newScrollTop;
      });
    } else {
      setZoomRaw(clamped);
    }

    try {
      localStorage.setItem('advciv-board-zoom', String(clamped));
    } catch {
      /* ignore */
    }
  }, [zoom]);

  const zoomIn = () => applyZoom(zoom * 1.25);
  const zoomOut = () => applyZoom(zoom / 1.25);

  const zoomFit = () => {
    setZoomRaw(1.0);
    try {
      localStorage.setItem('advciv-board-zoom', '1');
    } catch {
      /* ignore */
    }
    const container = wrapRef.current?.parentElement;
    if (container) {
      container.scrollTo({
        left: (container.scrollWidth - container.clientWidth) / 2,
        top: (container.scrollHeight - container.clientHeight) / 2,
        behavior: 'smooth',
      });
    }
  };

  // Direct mouse wheel zoom (no modifier key required)
  useEffect(() => {
    const container = wrapRef.current?.parentElement;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      applyZoom(zoom * factor, { clientX: e.clientX, clientY: e.clientY });
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [zoom, applyZoom]);

  const onMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    const container = wrapRef.current?.parentElement;
    if (!container) return;
    isDragging.current = true;
    hasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY, sl: container.scrollLeft, st: container.scrollTop };
  };

  const onMouseMove = (e: ReactMouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;
    const container = wrapRef.current?.parentElement;
    if (container) {
      container.scrollLeft = dragStart.current.sl - dx;
      container.scrollTop = dragStart.current.st - dy;
    }
  };

  const onMouseUp = () => {
    isDragging.current = false;
  };

  // Complete Plateau Fit: Ensure the entire 3800x1405 plateau fits in the viewport at zoom = 1.0
  const baseFitWidth = Math.min(containerDims.w, containerDims.h * (3800 / 1405));
  const boardWidth = Math.max(300, Math.round(zoom * baseFitWidth));
  const boardHeight = Math.round(boardWidth * (1405 / 3800));
  const coverRatio = containerDims.h > 0 && baseFitWidth > 0 ? (containerDims.h * (3800 / 1405)) / baseFitWidth : 1.8;
  const zoomCover = () => applyZoom(coverRatio);

  return {
    zoom,
    boardWidth,
    boardHeight,
    wrapRef,
    isDragging: isDragging.current,
    hasDragged,
    applyZoom,
    zoomIn,
    zoomOut,
    zoomFit,
    zoomCover,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
}
