import { ActionDock, type ActionDockProps } from '../dock/ActionDock.js';
import { EtherealHud } from '../dock/EtherealHud.js';
import { useUiSettings } from '../../theme/settingsStore.js';

export type DecisionRibbonProps = ActionDockProps;

/**
 * Decision Ribbon: Dynamically serves either Option 3 (Ethereal HUD) or the Classic Dock
 * with seamless 1-click reversibility based on user settings.
 */
export function DecisionRibbon(props: DecisionRibbonProps) {
  const [settings] = useUiSettings();

  if (settings.hudStyle === 'classic-dock') {
    return <ActionDock {...props} />;
  }

  return <EtherealHud {...props} />;
}
