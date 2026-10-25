import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame, useIdentity, SignInBar } from 'digital-boardgame-framework/client';
import type { GameClientApi } from 'digital-boardgame-framework/client';
import type { LogEntry } from 'digital-boardgame-framework';
import { adapter } from '../../engine/index.js';
import type { Action, GameState, PlayerId } from '../../engine/index.js';
import { civById } from '../../data/index.js';
import { claimSeat, createCivClient, fetchMyReports, realtimeSubscribe, resolutionNote, type MyReport } from '../../client/api.js';
import { REPORT_CATEGORY } from '../../report-meta.js';
import { ActionList, AreaPeekProvider, Board, CalamityModal, CombatModal, InfoView, MovementControls, ReportModal, StatusPanel, UpcomingCalamities, legalAreas, nationFocusArea, phaseLabel, scrollBoardTo, useMovementPlanner, type View } from '../App.js';

const API = '';
const EMPTY_STATE = { areas: {}, players: {}, phase: '', turn: 0 } as unknown as GameState;

export function OnlineGame({ gameId, token }: { gameId: string; token: string }) {
  const { identity } = useIdentity();
  const identityTokenRef = useRef<string | undefined>(undefined);
  identityTokenRef.current = identity?.token;
  const client: GameClientApi<GameState, Action> = useMemo(
    () => createCivClient({ baseUrl: API, gameId, token, getIdentityToken: () => identityTokenRef.current }),
    [gameId, token],
  );
  useEffect(() => {
    if (identity?.token) void claimSeat(API, gameId, token, identity.token);
  }, [identity?.token, gameId, token]);
  const subscribe = useMemo(() => realtimeSubscribe(gameId, import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY), [gameId]);
  const game = useGame<GameState, Action>(client, { pollMs: 2500, ...(subscribe ? { subscribe } : {}) });
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>('map');

  const submitAction = useCallback((a: Action) => { void game.submit(a); setSelected(null); }, [game]);
  const moveActor = game.view && game.yourTurn && game.view.phase === 'movement' ? ((game.you ?? null) as PlayerId | null) : null;
  const planner = useMovementPlanner(game.view ?? EMPTY_STATE, moveActor, game.legalActions, submitAction);

  const boardRef = useRef<HTMLDivElement>(null);
  const recenterKey = useRef('');
  useEffect(() => {
    if (!game.view || view !== 'map') return;
    const me = (game.you ?? game.view.seating[0]!) as PlayerId;
    const inMove = !!game.yourTurn && game.view.phase === 'movement';
    const key = `${game.view.phase}|${game.yourTurn}|${game.you}|${view}`;
    if (inMove && !planner.origin && recenterKey.current === key) return;
    recenterKey.current = key;
    const target = inMove && planner.origin ? planner.origin : nationFocusArea(game.view, me);
    const t = setTimeout(() => scrollBoardTo(boardRef.current, target), 60);
    return () => clearTimeout(t);
  }, [game.view?.phase, game.yourTurn, game.you, planner.origin, view]);

  if (game.error) return <Centered>Connection error: {game.error.message}</Centered>;
  if (!game.view) return <Centered>Connecting to game {gameId}…</Centered>;
  const s = game.view;
  const you = (game.you ?? s.seating[0]!) as PlayerId;
  const onClock = adapter.currentActor(s);
  const inMovement = !!game.yourTurn && s.phase === 'movement';
  const inPlacement = !!game.yourTurn && s.phase === 'populationExpansion';
  const placeCaps = (inPlacement ? s.expansion?.caps[you] : undefined) ?? {};
  const placeHighlight = new Set(Object.entries(placeCaps).filter(([, c]) => c > 0).map(([a]) => a));
  const onPlaceClick = (area: string | null) => { if (area && (placeCaps[area] ?? 0) > 0) submitAction({ type: 'placeTokens', placements: { [area]: 1 } }); };

  return (
    <AreaPeekProvider>
      <div ref={boardRef} style={{ flex: 1, position: 'relative', overflow: 'auto', background: '#0d3a4a' }}>
        <CombatModal events={s.lastCombats ?? []} you={you} />
        <CalamityModal events={s.phase === 'calamity' ? [] : (s.lastCalamities ?? [])} you={you} />
        {view === 'map'
          ? <Board
              state={inMovement ? planner.previewState : s}
              selected={inMovement ? planner.origin : selected}
              onSelect={inMovement ? planner.onBoardClick : inPlacement ? onPlaceClick : setSelected}
              highlight={inMovement ? planner.highlight : inPlacement ? placeHighlight : legalAreas(game.legalActions, s.phase)}
              origin={inMovement ? planner.origin : null}
              moved={inMovement ? planner.moved : undefined}
              zoomTo={inMovement ? planner.origin : null}
            />
          : <InfoView view={view} state={s} focus={you} />}
      </div>
      <div className="civ-bar" style={{ display: 'flex', gap: 6, padding: 6, minHeight: 170, maxHeight: '42vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 78 }}>
          {(['map', 'ast', 'census', 'tools', 'goods'] as View[]).map((v) => (
            <button key={v} className={`civ-nav ${view === v ? 'on' : ''}`} onClick={() => setView(v)}>{v.toUpperCase()}</button>
          ))}
        </div>
        <StatusPanel state={s} id={you} />
        <div className="civ-panel" style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
          {game.gameOver ? (
            <div className="civ-msg" style={{ padding: 10 }}>
              <div>Game over.</div>
              {game.ranked && (
                <p style={{ margin: '8px 0 0', fontSize: 13, color: game.ranked.recorded ? '#6c6' : '#caa' }}>
                  {game.ranked.recorded
                    ? '✓ Recorded to the leaderboard.'
                    : game.ranked.reason === 'one-player'
                      ? 'Not ranked — both seats were the same player (you need different people/identities).'
                      : game.ranked.reason === 'no-identities'
                        ? 'Not ranked — no identities were attached to the seats.'
                        : "Not ranked — couldn't reach the leaderboard."}
                </p>
              )}
            </div>
          ) : game.yourTurn ? (
            <>
              <div className="civ-msg" style={{ padding: '6px 10px', textAlign: 'center' }}>Your turn — {phaseLabel(s)}</div>
              <UpcomingCalamities state={s} />
              {inMovement
                ? <MovementControls planner={planner} />
                : <ActionList legal={game.legalActions} selectedArea={selected} phase={s.phase} onApply={submitAction} state={s} actor={you} />}
            </>
          ) : (
            <>
              <UpcomingCalamities state={s} />
              <div className="civ-lbl" style={{ textAlign: 'center', padding: 8 }}>
                Waiting for <b style={{ color: onClock ? civById.get(onClock)?.color : '#fff' }}>{onClock ? civById.get(onClock)?.name : '…'}</b> ({phaseLabel(s)})
              </div>
            </>
          )}
        </div>
        <div className="civ-panel" style={{ width: 210, padding: 6, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ textAlign: 'center', fontWeight: 800, letterSpacing: 1 }}>{phaseLabel(s).toUpperCase()}</div>
          <div className="civ-lbl">Turn {s.turn} · you are <b style={{ color: civById.get(you)?.color }}>{civById.get(you)?.name}</b></div>
          <SignInBar leaderboardHref="https://games-hub-5vo.pages.dev/leaderboard?game=advanced-civilization" />
          <button className="civ-btn" onClick={() => downloadLog(s, gameId)}>Download game log</button>
          <BugReport client={client} view={s} />
        </div>
      </div>
    </AreaPeekProvider>
  );
}

function BugReport({ client, view }: { client: GameClientApi<GameState, Action>; view: GameState }) {
  const [open, setOpen] = useState(false);
  const [mine, setMine] = useState<MyReport[]>([]);
  const refreshMine = useCallback(() => { fetchMyReports(API).then(setMine).catch(() => {}); }, []);
  useEffect(() => { refreshMine(); }, [refreshMine]);
  const answered = mine.filter((r) => resolutionNote(r.resolution));
  const send = async (message: string, severity: string) => {
    const clientLog: LogEntry[] = view.log.map((m, i) => ({ turn: view.turn, kind: 'log', payload: typeof m === 'string' ? m : m.msg ?? m.kind, ts: i }));
    const { reportId } = await client.report({ message, severity, category: REPORT_CATEGORY, clientLog, clientBuild: 'web-ui', userAgent: navigator.userAgent } as never);
    setTimeout(refreshMine, 500);
    return reportId as string;
  };
  return (
    <>
      <button className="civ-btn" onClick={() => { refreshMine(); setOpen(true); }}>Report a problem{answered.length ? ` (${answered.length} ✓)` : ''}</button>
      {open && <ReportModal mine={mine} onSend={send} onClose={() => setOpen(false)} />}
    </>
  );
}

function downloadLog(s: GameState, gameId: string) {
  const text = `Advanced Civilization — game ${gameId}, turn ${s.turn}\n\n${s.log.map((l) => typeof l === 'string' ? l : l.msg ?? l.kind).join('\n')}`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url; a.download = `civ-${gameId}-log.txt`; a.click();
  URL.revokeObjectURL(url);
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eee', fontSize: 18 }}>{children}</div>;
}
