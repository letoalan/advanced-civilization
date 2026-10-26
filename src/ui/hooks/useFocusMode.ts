import { useEffect, useState, useRef } from 'react';
import { useUiSettings } from '../theme/settingsStore.js';

export function useFocusMode(): boolean {
  const [settings] = useUiSettings();
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!settings.focusMode) {
      setIsIdle(false);
      return;
    }

    const resetTimer = () => {
      setIsIdle(false);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setIsIdle(true);
      }, settings.focusIdleSeconds * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [settings.focusMode, settings.focusIdleSeconds]);

  return isIdle;
}
