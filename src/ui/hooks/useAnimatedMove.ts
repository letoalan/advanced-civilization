import { useEffect } from 'react';
import type { GameState } from '../../engine/types.js';
import { usePrevious } from './usePrevious.js';
import { soundManager } from '../sound/soundManager.js';

export function useAnimatedMove(state: GameState) {
  const prevState = usePrevious(state);

  useEffect(() => {
    if (!prevState) return;

    // Check if phase changed to calamity
    if (state.phase === 'calamity' && prevState.phase !== 'calamity') {
      soundManager.playThunder();
      return;
    }

    // Check if trade or purchase occurred
    if (state.turn !== prevState.turn || state.phase !== prevState.phase) {
      soundManager.playCard();
    }
  }, [state, prevState]);
}
