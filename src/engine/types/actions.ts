/**
 * Actions du jeu Advanced Civilization.
 */

import type { PlayerId, VoyageStep } from './core.js';
import type { TradeBundle } from './trade.js';

export interface PlaceTokensAction {
  type: 'placeTokens';
  placements: Record<string, number>;
}

export interface ResetPlacementAction {
  type: 'resetPlacement';
}

export interface MoveAction {
  type: 'move';
  moves: { from: string; to: string; count: number; via?: string; byShip?: boolean }[];
  voyages?: VoyageStep[][];
}

export interface BuildCityAction {
  type: 'buildCity';
  area: string;
  useTreasury?: number;
}

export interface ResolveConflictAction {
  type: 'resolveConflict';
  area: string;
}

export interface BuildShipsAction {
  type: 'buildShips';
  builds: { area: string; count: number; payFrom?: 'area' | 'treasury' | 'split' }[];
}

export interface ScrapShipAction {
  type: 'scrapShip';
  area: string;
}

export interface MaintainShipAction {
  type: 'maintainShip';
  area: string;
}

export interface UndoShipAction {
  type: 'undoShip';
}

export interface TradeAcquisitionAction {
  type: 'drawTradeCards';
}

export interface PostOfferAction {
  type: 'postOffer';
  give: TradeBundle;
  wants: string[];
}

export interface RespondOfferAction {
  type: 'respondOffer';
  offerId: number;
  give: TradeBundle;
}

export interface AcceptResponseAction {
  type: 'acceptResponse';
  offerId: number;
  responder: PlayerId;
}

export interface WithdrawOfferAction {
  type: 'withdrawOffer';
}

export interface TradeWaitAction {
  type: 'tradeWait';
}

export interface BuyTradeCardAction {
  type: 'buyTradeCard';
  count: number;
}

export interface BuyAdvanceAction {
  type: 'buyAdvance';
  advance?: string;
  advances?: string[];
  spendCommodities?: Record<string, number>;
  spendTreasury?: number;
}

export interface SetTaxRateAction {
  type: 'setTaxRate';
  rate: number;
}

export interface ConvertAreaAction {
  type: 'convertArea';
  area: string;
}

export interface AllocateLossAction {
  type: 'allocateLoss';
  allocation: Record<PlayerId, number>;
}

export interface ChooseCitiesAction {
  type: 'chooseCities';
  areas: string[];
}

export interface ChooseUnitsAction {
  type: 'chooseUnits';
  tokens: Record<string, number>;
  cities: string[];
  cityKeep?: Record<string, number>;
  grainCommit?: number;
}

export interface PillageAction {
  type: 'pillage';
  count: number;
}

export interface ChooseDiscardAction {
  type: 'chooseDiscard';
  cards: string[];
}

export interface CivilWarSelectAction {
  type: 'civilWarSelect';
  tokens: Record<string, number>;
  cities: string[];
}

export interface CivilWarKeepAction {
  type: 'civilWarKeep';
  faction: 1 | 2;
}

export interface PlaceStartAction {
  type: 'placeStart';
  area: string;
}

export interface PickAreasAction {
  type: 'pickAreas';
  areas: string[];
}

export interface ResolveCalamityAction {
  type: 'resolveCalamity';
  calamityId: string;
  choices?: Record<string, unknown>;
}

export interface PassAction {
  type: 'pass';
}

export type Action =
  | PlaceStartAction
  | SetTaxRateAction
  | ConvertAreaAction
  | AllocateLossAction
  | ChooseCitiesAction
  | ChooseUnitsAction
  | ChooseDiscardAction
  | PillageAction
  | CivilWarSelectAction
  | CivilWarKeepAction
  | PickAreasAction
  | PlaceTokensAction
  | MoveAction
  | BuildShipsAction
  | ScrapShipAction
  | MaintainShipAction
  | UndoShipAction
  | ResetPlacementAction
  | ResolveConflictAction
  | BuildCityAction
  | TradeAcquisitionAction
  | PostOfferAction
  | RespondOfferAction
  | AcceptResponseAction
  | WithdrawOfferAction
  | TradeWaitAction
  | BuyTradeCardAction
  | ResolveCalamityAction
  | BuyAdvanceAction
  | PassAction;
