import type { GameState, PlayerId } from '../../../engine/types.js';
import type { View } from '../navigation/ViewNav.js';
import { AstView } from './AstView.js';
import { CensusView } from './CensusView.js';
import { ToolsView } from './ToolsView.js';
import { LogView } from './LogView.js';
import { GoodsView } from './GoodsView.js';

interface InfoViewProps {
  view: View;
  state: GameState;
  focus: PlayerId;
}

export function InfoView({ view, state, focus }: InfoViewProps) {
  if (view === 'ast') return <AstView state={state} />;
  if (view === 'census') return <CensusView state={state} />;
  if (view === 'tools') return <ToolsView state={state} focus={focus} />;
  if (view === 'log') return <LogView state={state} />;
  return <GoodsView state={state} focus={focus} />;
}
