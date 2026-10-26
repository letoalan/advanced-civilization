import { ActionDock, type ActionDockProps } from '../dock/ActionDock.js';

export type DecisionRibbonProps = ActionDockProps;

export function DecisionRibbon(props: DecisionRibbonProps) {
  return <ActionDock {...props} />;
}
