import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { StartControls } from './StartControls.js';
import { NinthStackControls } from './NinthStackControls.js';
import { DiscardControls } from './DiscardControls.js';
import { PillageControls } from './PillageControls.js';
import { SupportControls } from './SupportControls.js';
import { PickControls } from './PickControls.js';
import { TaxationControls } from './TaxationControls.js';
import { ExpansionControls } from './ExpansionControls.js';
import { ShipControls } from './ShipControls.js';
import { CityConstructionControls } from './CityConstructionControls.js';
import { CityChoiceControls } from './CityChoiceControls.js';
import { UnitLossControls } from './UnitLossControls.js';
import { AllocationControls } from './AllocationControls.js';
import { CivilWarControls } from './CivilWarControls.js';
import { ConversionControls } from './ConversionControls.js';
import { AdvancePicker } from './AdvancePicker.js';
import { TradeControls } from './trade/index.js';

interface ActionListProps {
  legal: Action[];
  selectedArea: string | null;
  phase: string;
  onApply: (a: Action) => void;
  state: GameState;
  actor: PlayerId;
}

export function ActionList({ legal, selectedArea, phase, onApply, state, actor }: ActionListProps) {
  const pass = legal.find((a) => a.type === 'pass');

  if (state.pendingStart?.order[0] === actor) {
    return <StartControls state={state} legal={legal} selectedArea={selectedArea} onApply={onApply} actor={actor} />;
  }
  if (state.ninthStack?.awaiting) {
    return <NinthStackControls state={state} legal={legal} onApply={onApply} actor={actor} />;
  }
  if (state.pendingDiscard?.holder === actor) {
    return <DiscardControls state={state} onApply={onApply} />;
  }
  if (state.pendingPillage?.length && state.pendingPillage[0]!.attacker === actor) {
    return <PillageControls state={state} legal={legal} onApply={onApply} />;
  }
  if (state.pendingSupport?.holder === actor) {
    return <SupportControls state={state} legal={legal} onApply={onApply} />;
  }
  if (state.pendingPick?.chooser === actor) {
    return <PickControls key={state.pendingPick.stage} state={state} legal={legal} onApply={onApply} />;
  }
  if (phase === 'taxation') {
    return <TaxationControls state={state} legal={legal} actor={actor} onApply={onApply} />;
  }
  if (phase === 'populationExpansion') {
    return <ExpansionControls state={state} legal={legal} actor={actor} onApply={onApply} />;
  }
  if (phase === 'shipConstruction') {
    return <ShipControls state={state} legal={legal} actor={actor} onApply={onApply} />;
  }
  if (phase === 'cityConstruction') {
    return <CityConstructionControls state={state} legal={legal} actor={actor} onApply={onApply} />;
  }
  if (phase === 'calamity' && state.pendingCityChoice?.holder === actor) {
    return <CityChoiceControls state={state} legal={legal} onApply={onApply} />;
  }
  if (phase === 'calamity' && state.pendingUnitLoss?.holder === actor) {
    return <UnitLossControls state={state} legal={legal} onApply={onApply} />;
  }
  if (phase === 'calamity' && state.pendingAllocation?.holder === actor) {
    return <AllocationControls state={state} legal={legal} onApply={onApply} />;
  }
  if (
    phase === 'calamity' &&
    state.pendingCivilWar &&
    (state.pendingCivilWar.stage === 'beneficiarySelect' ? state.pendingCivilWar.beneficiary : state.pendingCivilWar.victim) === actor
  ) {
    return <CivilWarControls key={state.pendingCivilWar.stage} state={state} legal={legal} onApply={onApply} />;
  }
  if (phase === 'calamity') {
    return <ConversionControls state={state} legal={legal} onApply={onApply} />;
  }
  if (phase === 'acquireAdvances') {
    return <AdvancePicker state={state} actor={actor} onApply={onApply} />;
  }
  if (phase === 'trade') {
    return <TradeControls state={state} actor={actor} onApply={onApply} />;
  }

  return (
    <button className="civ-btn" onClick={() => pass && onApply(pass)}>
      Continuer
    </button>
  );
}
