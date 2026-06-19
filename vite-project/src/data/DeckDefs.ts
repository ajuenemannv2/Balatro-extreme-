import type { RunState } from '../types/Run.ts';

export interface DeckDefinition {
  id: string;
  name: string;
  description: string;
  applyToRun: (runState: RunState) => void;
}

// Deck effects reference fields that extend RunState at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtRunState = RunState & Record<string, any>;

export const DECK_DEFS: DeckDefinition[] = [
  {
    id: 'red_deck',
    name: 'Red Deck',
    description: '+1 discard per round.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxDiscards to RunState
      r.maxDiscards = (r.maxDiscards ?? 3) + 1;
    },
  },
  {
    id: 'blue_deck',
    name: 'Blue Deck',
    description: '+1 hand per round.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxHands to RunState
      r.maxHands = (r.maxHands ?? 4) + 1;
    },
  },
  {
    id: 'yellow_deck',
    name: 'Yellow Deck',
    description: 'Start with an extra $10.',
    applyToRun: (rs) => {
      rs.money += 10;
    },
  },
  {
    id: 'green_deck',
    name: 'Green Deck',
    description: 'No interest earned. Earn $1 per hand won and $1 per discard used.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add noInterest, moneyPerHand, moneyPerDiscard to RunState
      r.noInterest = true;
      r.moneyPerHand  = (r.moneyPerHand  ?? 0) + 1;
      r.moneyPerDiscard = (r.moneyPerDiscard ?? 0) + 1;
    },
  },
  {
    id: 'black_deck',
    name: 'Black Deck',
    description: '+1 Joker slot. -1 hand per round.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      rs.maxJokerSlots += 1;
      r.maxHands = (r.maxHands ?? 4) - 1;
    },
  },
  {
    id: 'magic_deck',
    name: 'Magic Deck',
    description: 'Start with the Crystal Ball Voucher and an Arcana Pack.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add startingVouchers and startingPacks to RunState
      r.startingVouchers = [...(r.startingVouchers ?? []), 'crystal_ball'];
      r.startingPacks    = [...(r.startingPacks ?? []), 'arcana'];
    },
  },
  {
    id: 'nebula_deck',
    name: 'Nebula Deck',
    description: '-1 Consumable slot. Planet cards upgrade their hand type when used.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      rs.maxConsumableSlots -= 1;
      // TODO: add planetsUpgradeOnUse to RunState
      r.planetsUpgradeOnUse = true;
    },
  },
  {
    id: 'ghost_deck',
    name: 'Ghost Deck',
    description: 'Spectral cards can appear in the shop.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add spectralsInShop to RunState
      r.spectralsInShop = true;
    },
  },
  {
    id: 'abandoned_deck',
    name: 'Abandoned Deck',
    description: 'Start with no Face cards in the deck.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add removeFaceCards to RunState; engine removes J/Q/K on deck build
      r.removeFaceCards = true;
    },
  },
  {
    id: 'checkered_deck',
    name: 'Checkered Deck',
    description: 'Start with only Spades and Hearts in the deck.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add onlySpadesAndHearts to RunState; engine filters deck on build
      r.onlySpadesAndHearts = true;
    },
  },
  {
    id: 'zodiac_deck',
    name: 'Zodiac Deck',
    description: 'Start with 3 random Vouchers.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add startingRandomVouchers to RunState; engine picks 3 random vouchers on run start
      r.startingRandomVouchers = 3;
    },
  },
  {
    id: 'painted_deck',
    name: 'Painted Deck',
    description: '+2 Hand Size. -1 Joker slot.',
    applyToRun: (rs) => {
      rs.handSize      += 2;
      rs.maxJokerSlots -= 1;
    },
  },
  {
    id: 'anaglyph_deck',
    name: 'Anaglyph Deck',
    description: 'After defeating each Boss Blind, gain a random Tag.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add tagAfterBoss to RunState; engine awards a random tag after boss blind is beaten
      r.tagAfterBoss = true;
    },
  },
  {
    id: 'plasma_deck',
    name: 'Plasma Deck',
    description: 'Chips and Mult are averaged together during scoring.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add plasmaDeck to RunState; engine balances chips×mult during scoring
      r.plasmaDeck = true;
    },
  },
  {
    id: 'erratic_deck',
    name: 'Erratic Deck',
    description: 'All card ranks and suits are randomised.',
    applyToRun: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add erraticDeck to RunState; engine randomises all card ranks/suits on deck build
      r.erraticDeck = true;
    },
  },
];
