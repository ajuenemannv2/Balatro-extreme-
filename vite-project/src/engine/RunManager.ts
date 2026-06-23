import type { RunState } from '../types/Run.ts';
import type { HandType } from '../types/Score.ts';
import { buildStandardDeck, shuffleDeck } from './DeckBuilder.ts';
import { RNG } from './RNG.ts';
import { getChipTarget, selectBossBlind, initRound, activateBlind } from './BlindManager.ts';
import { ALL_JOKER_DEFS } from '../data/jokers/index.ts';
import { DECK_DEFS } from '../data/DeckDefs.ts';
import { BASE_HANDS, BASE_DISCARDS, BASE_HAND_SIZE, BASE_JOKER_SLOTS, BASE_CONSUMABLE_SLOTS } from '../data/AnteDefs.ts';
import { EventBus } from '../utils/EventBus.ts';

const ALL_HAND_TYPES: HandType[] = [
  'High Card','Pair','Two Pair','Three of a Kind','Straight','Flush',
  'Full House','Four of a Kind','Straight Flush','Five of a Kind','Flush House','Flush Five'
];

function makeInitialHandLevels(): Record<HandType, number> {
  const levels = {} as Record<HandType, number>;
  for (const ht of ALL_HAND_TYPES) levels[ht] = 1;
  return levels;
}

function makeInitialHandCounts(): Record<HandType, number> {
  const counts = {} as Record<HandType, number>;
  for (const ht of ALL_HAND_TYPES) counts[ht] = 0;
  return counts;
}

export function createNewRun(seed: string, stakeLevel: number, deckId: string): RunState {
  const rng = new RNG(seed);
  const rawDeck = buildStandardDeck();
  const deck = shuffleDeck(rawDeck, rng);

  const bossId = selectBossBlind(1, rng, []);

  const state: RunState = {
    seed,
    rngState: rng.getState(),
    stakeLevel,
    ante: 1,
    blindIndex: 0,
    money: 4,
    handsRemaining: BASE_HANDS,
    discardsRemaining: BASE_DISCARDS,
    handSize: BASE_HAND_SIZE,
    maxJokerSlots: BASE_JOKER_SLOTS,
    maxConsumableSlots: BASE_CONSUMABLE_SLOTS,
    deck,
    hand: [],
    discardPile: [],
    playedThisRound: [],
    jokers: [],
    consumables: [],
    vouchers: [],
    handLevels: makeInitialHandLevels(),
    handPlayCounts: makeInitialHandCounts(),
    chipTarget: getChipTarget(1, 0),
    chipsScored: 0,
    shopRerollCost: 5,
    activeBlindId: bossId,
    bossBlindHandsPlayed: 0,
    mostPlayedHand: null,
    pendingDeferredEffects: [],
    pendingPlanetCards: [],
    skipNextBoss: false,
    handsThisRun: 0,
    discountsActive: 0,
    freeRerollsPerShop: 0,
    lastHandScore: 0,
  };

  // Apply deck type
  const deckDef = DECK_DEFS.find(d => d.id === deckId);
  if (deckDef) deckDef.applyToRun(state);

  return state;
}

export function getRNG(state: RunState): RNG {
  const rng = new RNG(state.seed);
  rng.setState(state.rngState);
  return rng;
}

export function advanceToNextBlind(state: RunState, rng: RNG): void {
  state.blindIndex += 1;
  if (state.blindIndex > 2) {
    state.blindIndex = 0;
    state.ante += 1;
  }
  if (state.ante > 8) {
    EventBus.emit('game_won', state);
    return;
  }
  state.chipTarget = getChipTarget(state.ante, state.blindIndex);
  if (state.blindIndex === 2) {
    const prevBosses: string[] = [];
    state.activeBlindId = selectBossBlind(state.ante, rng, prevBosses);
  } else {
    state.activeBlindId = null;
  }
  state.rngState = rng.getState();
  EventBus.emit('blind_ready', state);
}

export function startBlind(state: RunState): void {
  initRound(state);
  if (state.blindIndex === 2) activateBlind(state);
  EventBus.emit('blind_started', state);
}

export function addJokerToRun(state: RunState, defId: string, edition: import('../types/Card.ts').Edition = 'base'): boolean {
  if (state.jokers.length >= state.maxJokerSlots) {
    // Negative edition jokers can exceed slot limit
    if (edition !== 'negative') return false;
  }
  const def = ALL_JOKER_DEFS.find(j => j.id === defId);
  if (!def) return false;
  const instance = {
    ...def,
    instanceId: `${defId}_${Date.now()}_${Math.random()}`,
    edition,
    runtimeCounters: {},
    isDisabled: false,
  };
  state.jokers.push(instance);
  def.onBuy?.(state);
  return true;
}

export function applyDeferredEffects(state: RunState): void {
  const effects = [...state.pendingDeferredEffects];
  state.pendingDeferredEffects = [];
  for (const fn of effects) fn(state);
}
