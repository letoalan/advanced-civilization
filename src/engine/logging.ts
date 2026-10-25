import { appendGameLog } from 'digital-boardgame-framework';
import type { GameState, PlayerId } from './types.js';

// Raised 500 → 2000 (report 283a6cda): with movement/placement/census/surplus
// now logged, a full game runs well past 500 entries and the reporter wants the
// whole record scrollable. ~150 B/entry keeps worst-case state growth ~300 KB.
export const LOG_CAP = 2000;
export const RULE_RE = /§(\d+(?:\.\d+)*)/;

export function log(s: GameState, kind: string, side: PlayerId | null, msg: string, payload?: Record<string, unknown>): void {
  const rule = RULE_RE.exec(msg)?.[1];
  const p = rule ? { ...payload, rule } : payload;
  appendGameLog(s.log, { turn: s.turn, phase: s.phase, side, kind, msg, ...(p ? { payload: p } : {}) }, LOG_CAP);
}

/** Seq of the newest log entry (or -1) — capture before a sub-resolution, then
 *  use logMsgsSince to collect the prose of what it appended (robust to the cap
 *  trimming old entries, unlike array indexes). */
export function lastLogSeq(s: GameState): number {
  return s.log.length ? s.log[s.log.length - 1]!.seq : -1;
}

export function logMsgsSince(s: GameState, seq: number): string[] {
  return s.log.filter((e) => e.seq > seq).map((e) => e.msg ?? e.kind);
}
