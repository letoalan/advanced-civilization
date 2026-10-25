import { upgradeProseLog } from 'digital-boardgame-framework';
import type { GameAdapter, GameResult } from 'digital-boardgame-framework';
import { LOG_CAP } from '../logging.js';
import { victoryScore } from '../phases/ast.js';
import { currentActor } from './currentActor.js';
import { legalActions } from './legalActions.js';
import { viewFor } from './viewFor.js';
import { applyAction } from './applyAction.js';
import type { Action, GameState, PlayerId } from '../types.js';

export class CivAdapter implements GameAdapter<GameState, Action, PlayerId> {
  schemaVersion = 2;

  migrate(rawState: unknown, fromVersion: number): GameState {
    const s = rawState as GameState;
    const raw = s.log as unknown[];
    if (fromVersion < 2 && Array.isArray(raw) && raw.some((l) => typeof l === 'string')) {
      const lines = raw.filter((l): l is string => typeof l === 'string');
      s.log = upgradeProseLog<PlayerId>(lines, s.turn).slice(-LOG_CAP);
    }
    s.schemaVersion = 2;
    return s as GameState;
  }

  currentActor(state: GameState): PlayerId | null {
    return currentActor(state);
  }

  legalActions(state: GameState, actor: PlayerId): Action[] {
    return legalActions(state, actor);
  }

  viewFor(state: GameState, viewer: PlayerId | null): GameState {
    return viewFor(state, viewer);
  }

  tryApplyAction(state: GameState, action: Action, actor: PlayerId): { state: GameState; ok: boolean; reason?: string } {
    try {
      return { state: this.applyAction(state, action, actor), ok: true };
    } catch (e) {
      return { state, ok: false, reason: (e as Error).message };
    }
  }

  applyAction(state: GameState, action: Action, actor: PlayerId): GameState {
    return applyAction(state, action, actor);
  }

  result(state: GameState): GameResult<PlayerId> | null {
    const over = state.finished || (state.maxTurns != null && state.turn >= state.maxTurns && state.phase === 'taxation');
    if (!over) return null;
    const scored = state.seating
      .map((id) => ({ id, score: victoryScore(state, id) }))
      .sort((a, b) => b.score - a.score);
    const ranking: PlayerId[] = scored.map((s) => s.id);
    const bestScore = scored.length ? scored[0]!.score : -Infinity;
    const winners = scored.filter((s) => s.score === bestScore).map((s) => s.id);
    return { winners, ranking, reason: `final score ${bestScore}` };
  }
}
