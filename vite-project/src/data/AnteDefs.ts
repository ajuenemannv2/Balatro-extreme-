/**
 * Chip targets indexed as ANTE_CHIP_TARGETS[ante - 1][blindIndex]
 * ante: 1-8, blindIndex: 0 = Small, 1 = Big, 2 = Boss
 */
export const ANTE_CHIP_TARGETS: number[][] = [
  [300,   450,   600],    // Ante 1
  [800,   1200,  1600],   // Ante 2
  [2000,  3000,  4000],   // Ante 3
  [5000,  8000,  11000],  // Ante 4
  [11000, 16000, 20000],  // Ante 5
  [20000, 30000, 40000],  // Ante 6
  [35000, 50000, 65000],  // Ante 7
  [75000, 110000, 110000], // Ante 8
];

export const BASE_HANDS = 4;
export const BASE_DISCARDS = 3;
export const BASE_HAND_SIZE = 8;
export const BASE_JOKER_SLOTS = 5;
export const BASE_CONSUMABLE_SLOTS = 2;

/** Small Blind name per ante (8 entries, one per ante). */
export const BLIND_NAMES_SMALL: string[] = [
  'Small Blind',
  'Small Blind',
  'Small Blind',
  'Small Blind',
  'Small Blind',
  'Small Blind',
  'Small Blind',
  'Small Blind',
];

/** Big Blind name per ante (8 entries, one per ante). */
export const BLIND_NAMES_BIG: string[] = [
  'Big Blind',
  'Big Blind',
  'Big Blind',
  'Big Blind',
  'Big Blind',
  'Big Blind',
  'Big Blind',
  'Big Blind',
];
