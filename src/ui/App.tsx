import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Rng } from 'digital-boardgame-framework';
import { adapter, createGame } from '../engine/index.js';
import type { Action, GameState, PlayerId } from '../engine/types.js';
import { civById } from '../data/index.js';
import { HeuristicAI } from '../ai/heuristic.js';
import { useMapArt } from './mapArt.js';
import type { LocalSaveFile, LocalSessionConfig, ControllerType } from '../local/types.js';
import { createLocalSession } from '../local/session.js';
import { saveLocalGame, clearLocalSave } from '../local/persistence.js';
import { AreaPeekProvider, Board, Minimap, MapArtBanner, nationFocusArea, scrollBoardTo, phaseLabel } from './components/board/index.js';
import { StatusPanel, UpcomingCalamities, GameOverSummary, TurnOrderTabs, ViewNav, PlayerHandoffModal, type View } from './components/navigation/index.js';
import { ActionList, MovementControls, useMovementPlanner } from './components/phases/index.js';
import { CombatModal, CalamityModal, LocalDiagnosticModal } from './components/modals/index.js';
import { InfoView } from './components/views/index.js';

export * from './components/board/index.js';
export * from './components/navigation/index.js';
export * from './components/phases/index.js';
export * from './components/modals/index.js';
export * from './components/views/index.js';

const ai = new HeuristicAI();
const DEFAULT_CIVS: PlayerId[] = ['egypt', 'babylon', 'assyria', 'asia'];

export interface AppProps {
  sessionConfig?: LocalSessionConfig;
  initialSave?: LocalSaveFile;
  onExitToMenu?: () => void;
}

export default function App({ sessionConfig, initialSave, onExitToMenu }: AppProps) {
  const config = useMemo<LocalSessionConfig>(() => {
    if (initialSave) return initialSave.config;
    if (sessionConfig) return sessionConfig;
    return {
      privacyMode: 'handoff',
      aiPace: 'readable',
      seats: DEFAULT_CIVS.map((c, i) => ({ civilizationId: c, controller: i === 0 ? 'human' : 'heuristic-ai' })),
    };
  }, [sessionConfig, initialSave]);

  const [state, setState] = useState<GameState>(() => {
    if (initialSave) return initialSave.state;
    return createLocalSession(config);
  });
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
    if (area && state.pendingStart && actor && seats[actor] === 'human') {
      const match = legal.find((a) => a.type === 'placeStart' && a.area === area);
      if (match) { apply(match); return; }
    }
    setSelectedArea((prev) => (prev === area ? null : area));
  }, [state.pendingStart, actor, seats, legal, apply]);

  useEffect(() => {
    if (view !== 'map') return;
    const target = inMovement && planner.origin ? planner.origin : (actor ? nationFocusArea(state, actor) : null);
    const t = setTimeout(() => scrollBoardTo(boardRef.current, target), 60);
    return () => clearTimeout(t);
  }, [actor, state.phase, view, inMovement, planner.origin]);

  const focus = actor ?? state.seating[0]!;

  return (
    <AreaPeekProvider>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#0a0d12', color: '#f0e6d2' }}>
        <CombatModal events={state.lastCombats ?? []} you={focus} />
        <CalamityModal events={state.phase === 'calamity' ? [] : (state.lastCalamities ?? [])} you={focus} />
        {showDiag && <LocalDiagnosticModal state={state} config={config} onClose={() => setShowDiag(false)} />}
        {handoffOpen && actor && (
          <PlayerHandoffModal actor={actor} seat={seatMap.get(actor)} onReveal={() => setHandoffOpen(false)} onSwitchToOpenTable={() => { setPrivacy('open-table'); setHandoffOpen(false); }} />
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {view === 'map' ? (
            <div ref={boardRef} style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#0b1922', display: 'flex' }}>
              <Board state={state} selected={selectedArea} onSelect={handleSelectArea} highlight={activeHighlights} origin={planner.origin} moved={planner.moved} art={mapArt.art} />
              <MapArtBanner mapArt={mapArt} />
            </div>
          ) : (
            <div style={{ flex: 1, overflow: 'auto', background: '#17130e' }}>
              <InfoView view={view} state={state} focus={focus} />
            </div>
          )}

          <div style={{ width: 340, display: 'flex', flexDirection: 'column', background: '#14100c', borderLeft: '2px solid #5a3c1c' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid #4a3015', padding: 6 }}>
              <StatusPanel state={state} id={focus} />
              <ViewNav currentView={view} onSelectView={setView} onExit={() => onExitToMenu ? onExitToMenu() : location.reload()} />
            </div>

            <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
              {result ? <GameOverSummary state={state} result={result} /> : (
                <>
                  <div className="civ-msg" style={{ padding: '6px 10px', textAlign: 'center' }}>
                    {actor ? <><b style={{ color: civById.get(actor)?.color }}>{civById.get(actor)?.name}</b> — {state.pendingStart ? 'choisit sa zone de départ' : state.ninthStack?.awaiting ? 'peut acheter dans la 9e pile' : phaseLabel(state)}</> : 'Résolution…'}
                  </div>
                  {rejected && <div className="civ-msg" style={{ background: 'rgba(120,42,42,0.5)', border: '1px solid #c66' }}>⚠ {rejected}</div>}
                  <UpcomingCalamities state={state} />
                  {actor && seats[actor] === 'human'
                    ? (inMovement ? <MovementControls planner={planner} /> : <ActionList legal={legal} selectedArea={selectedArea} phase={state.phase} onApply={apply} state={state} actor={actor} />)
                    : <div className="civ-lbl" style={{ textAlign: 'center', padding: 8 }}>Tour de l'IA en cours…</div>}
                </>
              )}
            </div>

            <div style={{ borderTop: '1px solid #4a3015', padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: '#ffd23f' }}>{phaseLabel(state).toUpperCase()}</span>
                <span className="civ-lbl">Tour {state.turn}</span>
              </div>
              <Minimap boardRef={boardRef} onJumpToMap={() => setView('map')} />
              <button className="civ-btn" style={{ fontSize: 11, padding: '3px 8px', marginTop: 2 }} onClick={() => setShowDiag(true)}>
                🛠 Diagnostic local
              </button>
            </div>
          </div>
        </div>

        <TurnOrderTabs state={state} actor={actor} seats={seats as Record<PlayerId, 'human' | 'ai'>} />
      </div>
    </AreaPeekProvider>
  );
}
