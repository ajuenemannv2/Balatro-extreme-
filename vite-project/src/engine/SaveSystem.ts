import type { RunState } from '../types/Run.ts';
import type { JokerInstance } from '../types/Joker.ts';
import { ALL_JOKER_DEFS } from '../data/jokers/index.ts';

const SAVE_KEY = 'balatro_run';

export function saveRun(state: RunState): void {
  try {
    const serialized = JSON.stringify(state, (_key, value) => {
      if (typeof value === 'function') return undefined;
      return value;
    });
    localStorage.setItem(SAVE_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save run:', e);
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as RunState;

    // Re-attach effect functions stripped by JSON.stringify
    state.jokers = (state.jokers as JokerInstance[]).map((j) => {
      const def = ALL_JOKER_DEFS.find(d => d.id === j.id);
      if (!def) return j;
      return {
        ...j,
        effect: def.effect,
        onBuy: def.onBuy,
        onSell: def.onSell,
        onRoundEnd: def.onRoundEnd,
        onDiscard: def.onDiscard,
        onMiniGameWin: def.onMiniGameWin,
        onMiniGameLose: def.onMiniGameLose,
      };
    });

    return state;
  } catch (e) {
    console.warn('Failed to load run:', e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function hasSave(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function saveSettings(settings: Record<string, unknown>): void {
  localStorage.setItem('balatro_settings', JSON.stringify(settings));
}

export function loadSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem('balatro_settings');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
