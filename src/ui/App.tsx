import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Rng } from 'digital-boardgame-framework';
import { adapter } from '../engine/index.js';
import type { Action, GameState, PlayerId } from '../engine/types.js';
import { HeuristicAI } from '../ai/heuristic.js';
import { useMapArt } from './mapArt.js';
import type { LocalSaveFile, LocalSessionConfig, ControllerType } from '../local/types.js';
import { createLocalSession } from '../local/session.js';
import { saveLocalGame, clearLocalSave } from '../local/persistence.js';
import { AreaPeekProvider, Board, MapArtBanner, nationFocusArea, scrollBoardTo } from './components/board/index.js';
import { TurnOrderTabs, PlayerHandoffModal, ImperialTopBar, DecisionRibbon, CodexOverlayModal, type View } from './components/navigation/index.js';
import { ZonePopover } from './components/hud/ZonePopover.js';
import { useMovementPlanner } from './components/phases/index.js';
import { CombatModal, CalamityModal, LocalDiagnosticModal } from './components/modals/index.js';
import { CardHand } from './cards/CardHand.js';
import { PhaseBanner } from './components/cinematic/PhaseBanner.js';
import { useFocusMode } from './hooks/useFocusMode.js';
import { useAnimatedMove } from './hooks/useAnimatedMove.js';

export * from './components/board/index.js'; export * from './components/navigation/index.js';
export * from './components/phases/index.js'; export * from './components/modals/index.js'; export * from './components/views/index.js';

const ai = new HeuristicAI();
const DEFAULT_CIVS: PlayerId[] = ['egypt', 'babylon', 'assyria', 'asia'];

export interface AppProps {
  sessionConfig?: LocalSessionConfig;
  initialSave?: LocalSaveFile;
  onExitToMenu?: () => void;
}

export default function App({ sessionConfig, initialSave, onExitToMenu }: AppProps) {
  const config = useMemo<LocalSessionConfig>(() => initialSave?.config ?? sessionConfig ?? {
    privacyMode: 'handoff',
    aiPace: 'readable',
    seats: DEFAULT_CIVS.map((c, i) => ({ civilizationId: c, controller: i === 0 ? 'human' : 'heuristic-ai' })),
  }, [sessionConfig, initialSave]);

  const [state, setState] = useState<GameState>(() => initialSave ? initialSave.state : createLocalSession(config));
  const [view, setView] = useState<View>('map');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string | null>(null);
  const [showDiag, setShowDiag] = useState(false);
  const [activeHuman, setActiveHuman] = useState<PlayerId | null>(null);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [privacy, setPrivacy] = useState<'open-table' | 'handoff'>(config.privacyMode);

  const rng = useRef(new Rng(Date.now() & 0xffff));
  const boardRef = useRef<HTMLDivElement>(null);
  const mapArt = useMapArt();
  const isIdle = useFocusMode();
  useAnimatedMove(state);

  const seats = useMemo(() => Object.fromEntries(config.seats.map((s) => [s.civilizationId, s.controller])) as Record<PlayerId, ControllerType>, [config]);
  const seatMap = useMemo(() => new Map(config.seats.map((s) => [s.civilizationId, s])), [config]);
  const actor = adapter.currentActor(state);
  const result = adapter.result(state);

  useEffect(() => {
    if (result) clearLocalSave();
    else saveLocalGame(config, state);
  }, [state, result, config]);

  useEffect(() => {
    if (!actor || seats[actor] !== 'human') return;
    if (privacy === 'handoff' && activeHuman !== actor) {
      setActiveHuman(actor);
      setHandoffOpen(true);
    }
  }, [actor, seats, privacy, activeHuman]);

  const apply = useCallback((a: Action) => {
    if (!actor) return;
    const r = adapter.tryApplyAction(state, a, actor);
    if (!r.ok) { setRejected(r.reason ?? 'Coup non autorisé.'); return; }
    setRejected(null);
    setState(r.state);
    setSelectedArea(null);
  }, [actor, state]);

  useEffect(() => {
    if (!actor || result || seats[actor] !== 'heuristic-ai') return;
    const delay = config.aiPace === 'readable' ? 220 : 0;
    const t = setTimeout(async () => {
      const action = await ai.selectAction({ state, actor, adapter, rng: rng.current });
      setState((s) => { const r = adapter.tryApplyAction(s, action, actor); return r.ok ? r.state : adapter.applyAction(s, { type: 'pass' }, actor); });
    }, delay);
    return () => clearTimeout(t);
  }, [state, actor, result, seats, config.aiPace]);

  const legal = useMemo(() => (actor ? adapter.legalActions(state, actor) : []), [state, actor]);
  const planner = useMovementPlanner(state, actor, legal, apply);
  const inMovement = !!actor && seats[actor] === 'human' && state.phase === 'movement';

  const activeHighlights = useMemo(() => {
    if (inMovement) return planner.highlight;
    if (state.pendingStart && actor && seats[actor] === 'human') {
      return new Set(legal.filter((a): a is Extract<Action, { type: 'placeStart' }> => a.type === 'placeStart').map((a) => a.area));
    }
    if (state.pendingPick && actor && seats[actor] === 'human') return new Set(state.pendingPick.candidates);
    return new Set<string>();
  }, [inMovement, planner.highlight, state.pendingStart, state.pendingPick, legal, actor, seats]);

  const handleSelectArea = useCallback((area: string | null) => {
    if (inMovement) { planner.onBoardClick(area); return; }
    if (area && state.pendingStart && actor && seats[actor] === 'human') {
      const match = legal.find((a) => a.type === 'placeStart' && a.area === area);
      if (match) { apply(match); return; }
    }
    if (area && state.phase === 'populationExpansion' && actor && seats[actor] === 'human') {
      const match = legal.find((a) => a.type === 'placeTokens' && Object.keys(a.placements).includes(area));
      if (match) { apply(match); return; }
    }
    setSelectedArea((prev) => (prev === area ? null : area));
  }, [inMovement, planner, state.pendingStart, state.phase, actor, seats, legal, apply]);

  const focus = actor ?? state.seating[0]!;

  const handleFocusMine = useCallback(() => {
    const target = inMovement && planner.origin ? planner.origin : (actor ? nationFocusArea(state, actor) : null);
    scrollBoardTo(boardRef.current, target);
  }, [inMovement, planner.origin, actor, state]);

  const handleFocusAll = useCallback(() => {
    if (boardRef.current) {
      boardRef.current.scrollTo({
        left: (boardRef.current.scrollWidth - boardRef.current.clientWidth) / 2,
        top: (boardRef.current.scrollHeight - boardRef.current.clientHeight) / 2,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <AreaPeekProvider>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0d12', color: '#f0e6d2' }}>
        <CombatModal events={state.lastCombats ?? []} you={focus} />
        <CalamityModal events={state.phase === 'calamity' ? [] : (state.lastCalamities ?? [])} you={focus} />
        {showDiag && <LocalDiagnosticModal state={state} config={config} onClose={() => setShowDiag(false)} />}
        {handoffOpen && actor && (
          <PlayerHandoffModal actor={actor} seat={seatMap.get(actor)} onReveal={() => setHandoffOpen(false)} onSwitchToOpenTable={() => { setPrivacy('open-table'); setHandoffOpen(false); }} />
        )}
        <PhaseBanner phase={state.phase} turn={state.turn} />
        <CodexOverlayModal view={view} onClose={() => setView('map')} onSelectView={setView} state={state} focus={focus} />
        <ImperialTopBar state={state} actor={actor} focus={focus} onFocusMine={handleFocusMine} onFocusAll={handleFocusAll} onOpenDiag={() => setShowDiag(true)} onExit={() => onExitToMenu ? onExitToMenu() : location.reload()} isIdle={isIdle} />

        {/* Central Map Board */}
        <div ref={boardRef} style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#0b1922', display: 'flex' }}>
          <Board
            state={inMovement ? planner.previewState : state}
            selected={inMovement ? planner.origin : selectedArea}
            onSelect={handleSelectArea}
            highlight={activeHighlights}
            origin={inMovement ? planner.origin : null}
            moved={inMovement ? planner.moved : undefined}
            zoomTo={inMovement ? planner.origin : null}
            art={mapArt.art}
          />
          <MapArtBanner mapArt={mapArt} />
          <ZonePopover areaId={selectedArea} state={state} onClose={() => setSelectedArea(null)} />
        </div>

        {actor && seats[actor] === 'human' && state.phase !== 'trade' && (
          <CardHand
            hand={state.players[actor]?.hand ?? {}}
            defaultExpanded={!!state.pendingDiscard}
          />
        )}

        <DecisionRibbon
          state={state}
          actor={actor}
          focus={focus}
          isHuman={!!actor && seats[actor] === 'human'}
          legal={legal}
          selectedArea={selectedArea}
          inMovement={inMovement}
          planner={planner}
          rejected={rejected}
          onApply={apply}
          onOpenCodex={(v: View) => setView(v)}
          activeCodex={view === 'map' ? null : view}
          result={result}
          isIdle={isIdle}
        />
        <TurnOrderTabs state={state} actor={actor} seats={seats as Record<PlayerId, 'human' | 'ai'>} />
      </div>
    </AreaPeekProvider>
  );
}
