import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion.js';

export function useAnimatedNumber(target: number, durationMs = 400): number {
  const [displayValue, setDisplayValue] = useState(target);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || displayValue === target) {
      setDisplayValue(target);
      return;
    }

    const startValue = displayValue;
    const diff = target - startValue;
    const startTime = performance.now();

    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + diff * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [target, durationMs, reducedMotion]);

  return displayValue;
}
