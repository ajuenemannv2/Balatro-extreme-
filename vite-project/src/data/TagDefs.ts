import type { RunState } from '../types/Run.ts';

export interface TagDefinition {
  id: string;
  name: string;
  description: string;
  effect: (runState: RunState) => void;
}

// Tags reference fields that extend RunState at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtRunState = RunState & Record<string, any>;

export const TAG_DEFS: TagDefinition[] = [
  {
    id: 'uncommon_tag',
    name: 'Uncommon Tag',
    description: 'Skip the next Blind to receive a free Uncommon Joker.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add pendingFreeJokerRarity to RunState
      r.pendingFreeJokerRarity = 'Uncommon';
    },
  },
  {
    id: 'rare_tag',
    name: 'Rare Tag',
    description: 'Skip the next Blind to receive a free Rare Joker.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.pendingFreeJokerRarity = 'Rare';
    },
  },
  {
    id: 'negative_tag',
    name: 'Negative Tag',
    description: 'Skip the next Blind to receive a free Joker with Negative Edition.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add pendingNegativeJoker to RunState
      r.pendingNegativeJoker = true;
    },
  },
  {
    id: 'foil_tag',
    name: 'Foil Tag',
    description: 'The next Joker purchased from the shop will have Foil Edition.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add nextJokerEdition to RunState
      r.nextJokerEdition = 'foil';
    },
  },
  {
    id: 'holo_tag',
    name: 'Holographic Tag',
    description: 'The next Joker purchased from the shop will have Holographic Edition.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.nextJokerEdition = 'holo';
    },
  },
  {
    id: 'poly_tag',
    name: 'Polychrome Tag',
    description: 'The next Joker purchased from the shop will have Polychrome Edition.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.nextJokerEdition = 'polychrome';
    },
  },
  {
    id: 'investment_tag',
    name: 'Investment Tag',
    description: 'Earn +$25 after completing the next Blind.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add pendingMoney to RunState
      r.pendingMoney = (r.pendingMoney ?? 0) + 25;
    },
  },
  {
    id: 'voucher_tag',
    name: 'Voucher Tag',
    description: 'A free Voucher appears in the next shop.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add freeVoucherNextShop to RunState
      r.freeVoucherNextShop = true;
    },
  },
  {
    id: 'boss_tag',
    name: 'Boss Tag',
    description: 'Skip the next Boss Blind.',
    effect: (rs) => {
      rs.skipNextBoss = true;
    },
  },
  {
    id: 'standard_tag',
    name: 'Standard Tag',
    description: 'Receive a free Standard Pack.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add freePackNextShop to RunState
      r.freePackNextShop = 'standard';
    },
  },
  {
    id: 'charm_tag',
    name: 'Charm Tag',
    description: 'Receive a free Arcana Pack.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.freePackNextShop = 'arcana';
    },
  },
  {
    id: 'meteor_tag',
    name: 'Meteor Tag',
    description: 'Receive a free Celestial Pack.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.freePackNextShop = 'celestial';
    },
  },
  {
    id: 'buffoon_tag',
    name: 'Buffoon Tag',
    description: 'Receive a free Buffoon Pack.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.freePackNextShop = 'buffoon';
    },
  },
  {
    id: 'handy_tag',
    name: 'Handy Tag',
    description: '+1 hand per round.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxHands to RunState
      r.maxHands = (r.maxHands ?? 4) + 1;
    },
  },
  {
    id: 'garbage_tag',
    name: 'Garbage Tag',
    description: '+1 discard per round.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxDiscards to RunState
      r.maxDiscards = (r.maxDiscards ?? 3) + 1;
    },
  },
  {
    id: 'ethereal_tag',
    name: 'Ethereal Tag',
    description: 'Receive a free Spectral Pack.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.freePackNextShop = 'spectral';
    },
  },
  {
    id: 'coupon_tag',
    name: 'Coupon Tag',
    description: 'All items in the next shop are 50% off.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add shopDiscount to RunState
      r.shopDiscount = Math.max(r.shopDiscount ?? 0, 0.5);
    },
  },
  {
    id: 'double_tag',
    name: 'Double Tag',
    description: 'The next Tag you earn is doubled.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add doubleTagActive to RunState
      r.doubleTagActive = true;
    },
  },
  {
    id: 'juggle_tag',
    name: 'Juggle Tag',
    description: '+3 Hand Size for the next round.',
    effect: (rs) => {
      rs.handSize += 3;
    },
  },
  {
    id: 'd6_tag',
    name: 'D6 Tag',
    description: 'The next Joker you buy will have a random Edition.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add nextJokerRandomEdition to RunState
      r.nextJokerRandomEdition = true;
    },
  },
  {
    id: 'topup_tag',
    name: 'Top-up Tag',
    description: 'Receive a free Common Joker.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.pendingFreeJokerRarity = 'Common';
    },
  },
  {
    id: 'speed_tag',
    name: 'Speed Tag',
    description: '-2 Blinds before the next Boss Blind.',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add blindsUntilBossReduction to RunState
      r.blindsUntilBossReduction = (r.blindsUntilBossReduction ?? 0) + 2;
    },
  },
  {
    id: 'orbital_tag',
    name: 'Orbital Tag',
    description: 'Upgrade a random poker hand by 1 level.',
    effect: (rs) => {
      // TODO: pick random hand type and increment its level in rs.handLevels
      const handTypes = Object.keys(rs.handLevels) as Array<keyof typeof rs.handLevels>;
      if (handTypes.length > 0) {
        const chosen = handTypes[Math.floor(Math.random() * handTypes.length)];
        rs.handLevels[chosen] = (rs.handLevels[chosen] ?? 1) + 1;
      }
    },
  },
];
