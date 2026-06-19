import type { PlayingCard } from './Card.ts';

export type HandType =
  | 'High Card'
  | 'Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Five of a Kind'
  | 'Flush House'
  | 'Flush Five';

export type AnimationHint =
  | { type: 'card_glow'; cardId: string }
  | { type: 'joker_activate'; jokerId: string }
  | { type: 'chip_add'; delta: number }
  | { type: 'mult_add'; delta: number }
  | { type: 'mult_mul'; factor: number }
  | { type: 'money_add'; delta: number };

export interface ScoringStep {
  source: string;
  addChips?: number;
  addMult?: number;
  mulMult?: number;
  chipsAfter: number;
  multAfter: number;
  hints: AnimationHint[];
}

export interface ScoringContext {
  playedCards: PlayingCard[];
  scoredCards: PlayingCard[];
  handType: HandType;
  handLevel: number;
  chips: number;
  mult: number;
  steps: ScoringStep[];
}

export interface ScoringResult {
  finalScore: number;
  handType: HandType;
  steps: ScoringStep[];
  deferredMoney: number;
  destroyedCardIds: string[];
  createdConsumables: string[];
}
