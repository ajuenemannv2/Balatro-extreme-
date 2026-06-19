import type { PlayingCard } from './Card.ts';
import type { HandType } from './Score.ts';
import type { JokerInstance } from './Joker.ts';
import type { ConsumableInstance } from './Consumable.ts';

export interface RunState {
  seed: string;
  rngState: number;
  stakeLevel: number;
  ante: number;
  blindIndex: number;
  money: number;
  handsRemaining: number;
  discardsRemaining: number;
  handSize: number;
  maxJokerSlots: number;
  maxConsumableSlots: number;
  deck: PlayingCard[];
  hand: PlayingCard[];
  discardPile: PlayingCard[];
  playedThisRound: PlayingCard[];
  jokers: JokerInstance[];
  consumables: ConsumableInstance[];
  vouchers: string[];
  handLevels: Record<HandType, number>;
  handPlayCounts: Record<HandType, number>;
  chipTarget: number;
  chipsScored: number;
  shopRerollCost: number;
  activeBlindId: string | null;
  bossBlindHandsPlayed: number;
  mostPlayedHand: HandType | null;
  pendingDeferredEffects: Array<(rs: RunState) => void>;
  pendingPlanetCards: HandType[];
  skipNextBoss: boolean;
  handsThisRun: number;
  discountsActive: number;
  freeRerollsPerShop: number;
}

