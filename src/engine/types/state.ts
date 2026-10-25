/**
 * État global sérialisable d'une partie d'Advanced Civilization (GameState).
 */

import type { GameLogEntry } from 'digital-boardgame-framework';
import type { BoardConfig } from '../boards.js';
import type { PlayerId, Phase, PlayerState, AreaState, ShipPhaseStep } from './core.js';
import type { TradeStacks, OpenOffer, CompletedTrade } from './trade.js';
import type {
  PendingAllocation,
  PendingCityChoice,
  PendingUnitLoss,
  PendingDiscard,
  PendingSecondary,
  PendingPick,
  PendingCivilWar,
  PendingSupport,
  PendingPillage,
} from './pending.js';
import type { CombatEvent, CalamityEvent } from './events.js';

export interface GameState {
  schemaVersion: number;
  turn: number;
  phase: Phase;
  board?: BoardConfig;
  tokensPerPlayer?: number;
  activeOrder: PlayerId[];
  censusOrder?: PlayerId[];
  pendingRevolts?: Record<PlayerId, number>;
  actedThisPhase: PlayerId[];
  players: Record<PlayerId, PlayerState>;
  seating: PlayerId[];
  areas: Record<string, AreaState>;
  trade: TradeStacks;
  pendingCalamities: { calamityId: string; holder: PlayerId }[];
  negotiation: {
    turnPointer: number;
    passStreak: number;
    actions?: number;
    nextOfferId?: number;
    done?: PlayerId[];
    waitStreak?: number;
    offers: OpenOffer[];
    completed?: CompletedTrade[];
  };
  expansion?: {
    remaining: Record<PlayerId, number>;
    caps: Record<PlayerId, Record<string, number>>;
    placed?: Record<PlayerId, Record<string, number>>;
  };
  lastCalamities?: CalamityEvent[];
  calamityActive?: boolean;
  pendingAllocation?: PendingAllocation;
  pendingCityChoice?: PendingCityChoice;
  pendingUnitLoss?: PendingUnitLoss;
  pendingDiscard?: PendingDiscard;
  pendingCivilWar?: PendingCivilWar;
  pendingSecondary?: PendingSecondary;
  pendingPick?: PendingPick;
  pendingStart?: { order: PlayerId[] };
  ninthStack?: { order: PlayerId[]; at: number; awaiting: boolean };
  autoSkip?: boolean;
  calamityQueue?: { calamity: string; holder: PlayerId }[];
  pendingSupport?: PendingSupport;
  pendingPillage?: PendingPillage[];
  shipMaintOwed?: Record<PlayerId, number>;
  shipsBuiltThisPhase?: Record<PlayerId, Record<string, number>>;
  shipSteps?: Record<PlayerId, ShipPhaseStep[]>;
  lastCombats?: CombatEvent[];
  calamityTradedFrom: Record<string, PlayerId>;
  rngState: number;
  log: GameLogEntry<PlayerId>[];
  finished?: boolean;
  maxTurns?: number;
}
