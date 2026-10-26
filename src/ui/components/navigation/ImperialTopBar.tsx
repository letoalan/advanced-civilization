import { GlassTopBar } from '../hud/GlassTopBar.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

export interface ImperialTopBarProps {
  state: GameState;
  actor: PlayerId | null;
  focus: PlayerId;
  onFocusMine: () => void;
  onFocusAll: () => void;
  onOpenDiag?: () => void;
  onExit: () => void;
  isIdle?: boolean;
}

export function ImperialTopBar(props: ImperialTopBarProps) {
  return <GlassTopBar {...props} />;
}
