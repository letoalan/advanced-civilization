// Platform-agnostic API router for Advanced Civilization online multiplayer.
// BOTH the Node dev host (src/server/http.ts, FsStore) and the Cloudflare Pages
// Function (functions/api/[[path]].ts, SupabaseStore) build a GameServer and
// delegate here. Keeping routing in one place is what makes local dev and
// production true parity — only the store/notifier/broadcaster differ.
import type { GameServer, ReportSubmission, BugReportRow, ReportFilter } from 'digital-boardgame-framework/server';
import { createGame, type Action, type GameState } from '../engine/index.js';
import { REPORT_CATEGORY } from '../report-meta.js';
// NOTE: import createGame from the engine (node-free), NOT newGameState from
// game-server.ts — that module top-level-imports FsStore (node:fs), which would
// break the Cloudflare Workers build of this shared router.
const newGameState = createGame;

export interface ApiResult {
  status: number;
  body: unknown;
}

type Server = GameServer<GameState, Action, string>;

// Map known framework error strings to HTTP status codes.
function errToStatus(message: string): number {
  if (message.includes('not found') || message.includes('No snapshot')) return 404;
  if (message.includes('Invalid token')) return 401;
  if (message.includes('Not your turn')) return 403;
  if (message.includes('Illegal action')) return 422;
  if (message.includes('already exists')) return 409; // concurrent write
  return 400;
}

import { handleReportRoutes } from './reportRoutes.js';

/** Route one request. `query` carries the per-seat `?token=`. `putReport` (when
 *  provided) backs the standalone `POST /api/report` used by hotseat play, which
 *  has no game/token to attach a report to. */
export async function handleApi(
  server: Server,
  method: string,
  pathname: string,
  query: URLSearchParams,
  body: unknown,
  putReport?: (row: BugReportRow) => Promise<void>,
): Promise<ApiResult> {
  const segs = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (segs[0] !== 'api') return { status: 404, body: { error: 'not found' } };

  const reportRes = await handleReportRoutes(server, method, segs, query, body, putReport);
  if (reportRes) return reportRes;

  const token = query.get('token') ?? '';

  try {
    // ---- games ----
    if (segs[1] === 'games') {
      // POST /api/games  { players, seed?, maxTurns?, emails?, boardPreset?, chooseStartAreas?, autoSkip? }
      if (segs.length === 2 && method === 'POST') {
        const b = (body ?? {}) as { players?: string[]; seed?: number; maxTurns?: number; emails?: Record<string, string>; ai?: Record<string, string>; boardPreset?: string; chooseStartAreas?: boolean; autoSkip?: boolean };
        if (!Array.isArray(b.players) || b.players.length < 2 || b.players.length > 6) {
          return { status: 422, body: { error: 'players must be an array of 2-6 nation ids' } };
        }
        let initialState: GameState;
        try {
          initialState = newGameState({ players: b.players, seed: b.seed, maxTurns: b.maxTurns, boardPreset: b.boardPreset, chooseStartAreas: b.chooseStartAreas === true, autoSkip: b.autoSkip === true });
        } catch (e) {
          // A rules-§16 setup problem (unknown preset / nation not available on
          // the board) is the caller's error, not a server fault.
          return { status: 422, body: { error: (e as Error).message } };
        }
        return { status: 200, body: await server.createGame({ initialState, players: b.players, emails: b.emails, ...(b.ai ? { ai: b.ai } : {}) }) };
      }

      const gameId = segs[2];
      if (!gameId) return { status: 404, body: { error: 'not found' } };

      // GET /api/games/:id
      if (segs.length === 3 && method === 'GET') return { status: 200, body: await server.fetch(gameId, token) };
      // GET /api/games/:id/legal
      if (segs[3] === 'legal' && method === 'GET') return { status: 200, body: await server.legalActions(gameId, token) };
      // POST /api/games/:id/claim  { identityToken } — attach a hub identity to
      // this seat (ranked attribution). Token-gated by the per-seat ?token=.
      if (segs[3] === 'claim' && method === 'POST') {
        const idTok = (body as { identityToken?: unknown })?.identityToken;
        if (typeof idTok !== 'string' || !idTok) return { status: 422, body: { error: 'identityToken required' } };
        const v = await server.claimSeat(gameId, token, idTok);
        return { status: 200, body: { ok: true, playerId: v.playerId } };
      }
      // POST /api/games/:id/move  { action, identityToken? }
      if (segs[3] === 'move' && method === 'POST') {
        const b = (body ?? {}) as { action: Action; identityToken?: unknown };
        // Ranked: best-effort attribute this seat from the move's identity
        // (idempotent, race-free — turns are sequential). Never blocks the move.
        if (typeof b.identityToken === 'string' && b.identityToken) {
          try { await server.claimSeat(gameId, token, b.identityToken); } catch { /* optional */ }
        }
        return { status: 200, body: await server.submit(gameId, token, b.action) };
      }
      // GET/POST /api/games/:id/messages
      if (segs[3] === 'messages') {
        if (method === 'GET') return { status: 200, body: await server.listMessages(gameId, token) };
        if (method === 'POST') return { status: 200, body: await server.postMessage(gameId, token, (body as { body: string }).body) };
      }
      // POST /api/games/:id/report
      if (segs[3] === 'report' && method === 'POST') {
        return { status: 200, body: await server.report(gameId, token, body as ReportSubmission) };
      }
    }



    return { status: 404, body: { error: 'no route', pathname, method } };
  } catch (e) {
    // Supabase/PostgREST throw a plain object ({ message, ... }); String(e) on
    // that is "[object Object]". Pull .message when present.
    const message =
      e instanceof Error ? e.message
      : e && typeof e === 'object' ? ((e as { message?: string }).message ?? JSON.stringify(e))
      : String(e);
    return { status: errToStatus(message), body: { error: message } };
  }
}
