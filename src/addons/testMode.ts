import { GAME_RULES } from '../data/gameRules';

export interface GameplayTuning {
  cleanPhaseHoldMs: number;
}

const DEFAULT_TUNING: GameplayTuning = {
  cleanPhaseHoldMs: GAME_RULES.cleaning.phaseHoldMs,
};

const TEST_TUNING: GameplayTuning = {
  cleanPhaseHoldMs: GAME_RULES.cleaning.testPhaseHoldMs,
};

export function getGameplayTuning(): GameplayTuning {
  if (typeof window === 'undefined') {
    return DEFAULT_TUNING;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('test') === '1' ? TEST_TUNING : DEFAULT_TUNING;
}
