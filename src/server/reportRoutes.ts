import type { GameServer, BugReportRow, ReportFilter } from 'digital-boardgame-framework/server';
import type { Action, GameState } from '../engine/index.js';
import { REPORT_CATEGORY } from '../report-meta.js';

export interface ApiResult {
  status: number;
  body: unknown;
}

type Server = GameServer<GameState, Action, string>;

export async function handleReportRoutes(
  server: Server,
  method: string,
  segs: string[],
  query: URLSearchParams,
  body: unknown,
  putReport?: (row: BugReportRow) => Promise<void>,
): Promise<ApiResult | null> {
  if (segs[1] === 'report' && segs.length === 2 && method === 'GET') {
    const reporter = query.get('reporter');
    if (!reporter) return { status: 422, body: { error: 'reporter required' } };
    const marker = `reporter:${reporter}`;
    const all = await server.listReports({ bodies: false });
    const mine = all
      .filter((r) => {
        const msg = r.message ?? '';
        if (msg.includes(marker)) return true;
        const untagged = !/<!--\s*reporter:/.test(msg);
        return untagged && r.gameId === 'hotseat' && (r.clientBuild ?? '').includes('web-ui-hotseat');
      })
      .map((r) => ({
        reportId: r.reportId,
        message: (r.message ?? '').replace(/\s*<!--\s*reporter:[^>]*-->\s*/g, '').trim(),
        severity: r.severity,
        category: r.category,
        createdAt: r.createdAt,
        resolution: r.resolution ?? null,
        tagged: (r.message ?? '').includes(marker),
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return { status: 200, body: { reports: mine } };
  }

  if (segs[1] === 'report' && segs.length === 2 && method === 'POST') {
    if (!putReport) return { status: 501, body: { error: 'standalone reporting not configured' } };
    const b = (body ?? {}) as Partial<BugReportRow> & { snapshot?: string };
    if (typeof b.message !== 'string' || !b.message.trim()) return { status: 422, body: { error: 'message required' } };
    const reporter = query.get('reporter') ?? '';
    const reportId = (globalThis.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.round(Math.random() * 1e9)}`);
    const snapshot = b.serverSnapshot ?? b.snapshot ?? '';
    const taggedMessage = reporter ? `${b.message}\n\n<!-- reporter:${reporter} -->` : b.message;
    await putReport({
      reportId,
      gameId: b.gameId ?? 'hotseat',
      reporterSide: b.reporterSide ?? '?',
      turnNumber: b.turnNumber ?? 0,
      serverSnapshot: snapshot,
      reporterView: snapshot,
      clientLog: Array.isArray(b.clientLog) ? b.clientLog : [],
      message: taggedMessage,
      severity: b.severity ?? 'bug',
      category: b.category ?? REPORT_CATEGORY,
      clientBuild: b.clientBuild,
      userAgent: b.userAgent,
      createdAt: new Date().toISOString(),
    });
    return { status: 200, body: { reportId } };
  }

  if (segs[1] === 'reports') {
    if (segs.length === 2 && method === 'GET') {
      const filter: ReportFilter = {};
      if (query.get('unresolved') === '1') filter.unresolved = true;
      const category = query.get('category');
      if (category) filter.category = category;
      const appId = query.get('app_id');
      if (appId) filter.appId = appId;
      const severity = query.get('severity');
      if (severity) filter.severity = severity;
      const since = query.get('since');
      if (since) filter.since = since;
      const gameId = query.get('gameId');
      if (gameId) filter.gameId = gameId;
      filter.bodies = query.get('full') === '1';
      return { status: 200, body: await server.listReports(filter) };
    }
    if (segs[3] === 'resolve' && method === 'POST') {
      await server.resolveReport(segs[2]!, (body as { note?: string })?.note ?? '');
      return { status: 200, body: { ok: true } };
    }
  }

  return null;
}
