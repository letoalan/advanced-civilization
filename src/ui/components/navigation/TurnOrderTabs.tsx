import { civById } from '../../../data/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

interface TurnOrderTabsProps {
  state: GameState;
  actor: PlayerId | null;
  seats: Record<PlayerId, 'human' | 'ai'>;
}

export function TurnOrderTabs({ state, actor, seats }: TurnOrderTabsProps) {
  return (
    <div style={{ display: 'flex' }}>
      {state.activeOrder.map((id) => (
        <div key={id} className={`civ-tab ${actor === id ? 'act' : ''}`}>
          <span
            style={{
              display: 'inline-block',
              width: 9,
              height: 9,
              background: civById.get(id)?.color,
              marginRight: 4,
              borderRadius: 2,
            }}
          />
          {civById.get(id)?.name}
          {seats[id] === 'ai' ? ' (IA)' : ''}
        </div>
      ))}
    </div>
  );
}
