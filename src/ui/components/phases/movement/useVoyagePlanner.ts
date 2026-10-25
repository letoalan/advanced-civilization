import { useState, useMemo, useCallback } from 'react';
import { areaById } from '../../../../data/index.js';
import type { VoyageStep } from './movementTypes.js';
import { walkVoyage } from './walkVoyage.js';

interface UseVoyagePlannerProps {
  range: number;
  astronomy: boolean;
  outSet: ReadonlySet<string>;
  available: (area: string) => number;
}

export function useVoyagePlanner({ range, astronomy, outSet, available }: UseVoyagePlannerProps) {
  const [voyage, setVoyage] = useState<VoyageStep[] | null>(null);
  const [queuedVoyages, setQueuedVoyages] = useState<VoyageStep[][]>([]);

  const walk = useMemo(
    () => (voyage ? walkVoyage(voyage, range, astronomy, outSet) : null),
    [voyage, range, astronomy, outSet],
  );

  const voyageInfo = useMemo(
    () =>
      voyage && walk
        ? {
            used: walk.used,
            range,
            cargo: walk.cargo,
            cargoAfter: walk.cargoAfter,
            canFinish: walk.used >= 1 && walk.cargo === 0 && !walk.endsOnOpenSea,
          }
        : null,
    [voyage, walk, range],
  );

  const startVoyage = useCallback((origin: string) => {
    setVoyage([{ area: origin }]);
  }, []);

  const cancelVoyage = useCallback(() => setVoyage(null), []);
  const undoStop = useCallback(() => setVoyage((v) => (v && v.length > 1 ? v.slice(0, -1) : v)), []);

  const finishVoyage = useCallback(() => {
    if (voyage && voyage.length >= 2) {
      setQueuedVoyages((qs) => [...qs, voyage]);
      setVoyage(null);
    }
  }, [voyage]);

  const setStopLoad = useCallback(
    (i: number, n: number) => {
      setVoyage((v) => {
        if (!v) return v;
        const st = v[i]!;
        const meta = areaById.get(st.area);
        if (!meta || meta.isWater) return v;
        const w = walkVoyage(v, range, astronomy, outSet);
        const cargoBefore = (w.cargoAfter[i] ?? 0) - (st.load ?? 0);
        const maxByHold = 5 - cargoBefore;
        const maxByTokens = available(st.area) + (st.load ?? 0);
        const load = Math.max(0, Math.min(n, maxByHold, maxByTokens));
        return v.map((s, j) => (j === i ? { ...s, load: load || undefined } : s));
      });
    },
    [range, astronomy, outSet, available],
  );

  const setStopUnload = useCallback(
    (i: number, n: number) => {
      setVoyage((v) => {
        if (!v) return v;
        const st = v[i]!;
        const meta = areaById.get(st.area);
        if (!meta || meta.isWater) return v;
        const w = walkVoyage(v, range, astronomy, outSet);
        const cargoArriving = (w.cargoAfter[i] ?? 0) + (st.unload ?? 0) - (st.load ?? 0);
        const unload = Math.max(0, Math.min(n, cargoArriving));
        return v.map((s, j) => (j === i ? { ...s, unload: unload || undefined } : s));
      });
    },
    [range, astronomy, outSet],
  );

  const removeQueuedVoyage = useCallback((i: number) => setQueuedVoyages((qs) => qs.filter((_, j) => j !== i)), []);

  const resetVoyages = useCallback(() => {
    setVoyage(null);
    setQueuedVoyages([]);
  }, []);

  return {
    voyage,
    queuedVoyages,
    walk,
    voyageInfo,
    startVoyage,
    cancelVoyage,
    undoStop,
    finishVoyage,
    setStopLoad,
    setStopUnload,
    removeQueuedVoyage,
    resetVoyages,
    setVoyage,
  };
}
