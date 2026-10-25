import { useState, useCallback, useMemo, useEffect } from 'react';
import { outOfPlay } from '../../../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../../../engine/types.js';
import type { MovementPlanner, QueuedMove } from './movementTypes.js';
import { useVoyagePlanner } from './useVoyagePlanner.js';
import { buildMovementPreview, computeSurplusWarnings } from './movementPreview.js';
import { computeMoveOptions, computeEmbarkHint } from './movementLegality.js';

export function useMovementPlanner(
  state: GameState,
  actor: PlayerId | null,
  legal: Action[],
  onApply: (a: Action) => void,
): MovementPlanner {
  const active = !!actor && state.phase === 'movement';
  const [origin, setOrigin] = useState<string | null>(null);
  const [count, setCountRaw] = useState(1);
  const [queued, setQueued] = useState<QueuedMove[]>([]);

  const advancesOf = state.players[actor ?? '']?.advances ?? [];
  const range = 4 + (advancesOf.includes('clothmaking') ? 1 : 0);
  const astronomy = advancesOf.includes('astronomy');
  const outSet = useMemo(() => outOfPlay(state), [state]);

  const moveOpts = useMemo(() => computeMoveOptions(legal), [legal]);

  const queuedFromSimple = useCallback(
    (area: string) => queued.filter((q) => q.from === area).reduce((s, q) => s + q.count, 0),
    [queued],
  );

  const available = useCallback(
    (area: string) => (state.areas?.[area]?.tokens[actor ?? ''] ?? 0) - queuedFromSimple(area),
    [state, actor, queuedFromSimple],
  );

  const voyagePlanner = useVoyagePlanner({ range, astronomy, outSet, available });

  useEffect(() => {
    setOrigin(null);
    setQueued([]);
    setCountRaw(1);
    voyagePlanner.resetVoyages();
  }, [actor, state.phase, state.turn]);

  const shipsLeft = useCallback(
    (area: string) =>
      (state.areas?.[area]?.ships?.[actor ?? ''] ?? 0) -
      queued.filter((q) => q.byShip && q.from === area).length -
      voyagePlanner.queuedVoyages.filter((v) => v[0]!.area === area).length -
      (voyagePlanner.voyage && voyagePlanner.voyage[0]!.area === area ? 1 : 0),
    [state, actor, queued, voyagePlanner.queuedVoyages, voyagePlanner.voyage],
  );

  const origins = useMemo(() => {
    const set = new Set<string>();
    for (const [from, opts] of moveOpts) {
      if (available(from) > 0 || (shipsLeft(from) > 0 && [...opts.values()].some((o) => o.byShip))) {
        set.add(from);
      }
    }
    return set;
  }, [moveOpts, available, shipsLeft]);

  const dests = useMemo(() => {
    const all = origin ? moveOpts.get(origin) : undefined;
    if (!all || !origin || shipsLeft(origin) > 0) return all;
    const out = new Map(all);
    for (const [to, o] of all) if (o.byShip) out.delete(to);
    return out;
  }, [origin, moveOpts, shipsLeft]);

  const highlight = useMemo(
    () =>
      new Set(
        voyagePlanner.voyage && voyagePlanner.walk
          ? [...voyagePlanner.walk.legalNext]
          : origin && dests
          ? [...dests.keys()]
          : [...origins],
      ),
    [voyagePlanner.voyage, voyagePlanner.walk, origin, dests, origins],
  );

  const setCount = useCallback(
    (n: number) => {
      const cap = origin ? available(origin) : 1;
      setCountRaw(Math.max(1, Math.min(n, Math.max(1, cap))));
    },
    [origin, available],
  );

  const onBoardClick = useCallback(
    (area: string | null) => {
      if (!active) return;
      if (!area) { setOrigin(null); return; }
      if (voyagePlanner.voyage && voyagePlanner.walk) {
        if (voyagePlanner.walk.legalNext.has(area)) voyagePlanner.setVoyage([...voyagePlanner.voyage, { area }]);
        return;
      }
      if (!origin) {
        if (origins.has(area)) { setOrigin(area); setCountRaw(1); }
        return;
      }
      if (area === origin) { setOrigin(null); return; }
      const opt = dests?.get(area);
      if (opt) {
        if (!opt.byShip && available(origin) <= 0) return;
        const max = Math.min(available(origin), opt.byShip ? 5 : Infinity);
        const n = opt.byShip ? Math.min(count, max) : Math.max(1, Math.min(count, max));
        if (!opt.byShip && n <= 0) return;
        setQueued((q) => [
          ...q,
          { from: origin, to: area, count: n, ...(opt.byShip ? { byShip: true } : {}), ...(opt.via ? { via: opt.via } : {}) },
        ]);
        setOrigin(null);
        setCountRaw(1);
        return;
      }
      if (origins.has(area)) { setOrigin(area); setCountRaw(1); }
    },
    [active, origin, origins, dests, count, available, voyagePlanner],
  );

  const removeQueued = useCallback((i: number) => setQueued((q) => q.filter((_, j) => j !== i)), []);
  const undoLast = useCallback(() => setQueued((q) => q.slice(0, -1)), []);

  const commit = useCallback(() => {
    if (queued.length || voyagePlanner.queuedVoyages.length) {
      onApply({
        type: 'move',
        moves: queued,
        ...(voyagePlanner.queuedVoyages.length ? { voyages: voyagePlanner.queuedVoyages } : {}),
      });
    }
  }, [queued, voyagePlanner.queuedVoyages, onApply]);

  const pass = useCallback(() => onApply({ type: 'pass' }), [onApply]);

  const { previewState, moved } = useMemo(
    () => buildMovementPreview(state, actor, queued, voyagePlanner.queuedVoyages),
    [state, actor, queued, voyagePlanner.queuedVoyages],
  );

  const surplusWarnings = useMemo(
    () => computeSurplusWarnings(state, actor, previewState),
    [state, actor, previewState],
  );

  const destinations =
    origin && dests ? [...dests.entries()].map(([to, o]) => ({ to, ...(o.byShip ? { byShip: true as const } : {}) })) : [];

  const embarkHint = useMemo(
    () => computeEmbarkHint(origin, actor, dests, state, shipsLeft),
    [origin, actor, dests, state, shipsLeft],
  );

  return {
    active,
    origin,
    count,
    queued,
    highlight,
    available,
    destinations,
    embarkHint,
    surplusWarnings,
    onBoardClick,
    setCount,
    removeQueued,
    undoLast,
    commit,
    pass,
    previewState,
    moved,
    voyage: voyagePlanner.voyage,
    voyageInfo: voyagePlanner.voyageInfo,
    startVoyage: () => origin && shipsLeft(origin) > 0 && (voyagePlanner.startVoyage(origin), setOrigin(null)),
    cancelVoyage: voyagePlanner.cancelVoyage,
    undoStop: voyagePlanner.undoStop,
    finishVoyage: voyagePlanner.finishVoyage,
    setStopLoad: voyagePlanner.setStopLoad,
    setStopUnload: voyagePlanner.setStopUnload,
    queuedVoyages: voyagePlanner.queuedVoyages,
    removeQueuedVoyage: voyagePlanner.removeQueuedVoyage,
    shipsAt: shipsLeft,
  };
}
