import { GlassTopBar } from '../hud/GlassTopBar.js';
import type { GameState, PlayerId } from '../../../engine/types.js';
import type { useMapArt } from '../../mapArt.js';

export interface ImperialTopBarProps {
  state: GameState;
  actor: PlayerId | null;
  focus: PlayerId;
  mapArt?: ReturnType<typeof useMapArt>;
  onFocusMine: () => void;
  onFocusAll: () => void;
  onOpenDiag?: () => void;
  onExit: () => void;
  isIdle?: boolean;
}

export function ImperialTopBar(props: ImperialTopBarProps) {
  return <GlassTopBar {...props} />;
}
