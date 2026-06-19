import type { RunState } from '../types/Run.ts';

export interface VoucherDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  upgradeOf?: string;
  effect: (runState: RunState) => void;
}

// Many voucher effects reference fields that extend RunState at runtime.
// These are accessed via type cast and annotated with TODO comments so the
// engine can add the corresponding fields to RunState as needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtRunState = RunState & Record<string, any>;

export const VOUCHER_DEFS: VoucherDefinition[] = [
  // ── Overstock ───────────────────────────────────────────────────────────────
  {
    id: 'overstock',
    name: 'Overstock',
    description: '+1 card slot in the shop.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add shopCardSlots to RunState
      r.shopCardSlots = (r.shopCardSlots ?? 4) + 1;
    },
  },
  {
    id: 'overstock_plus',
    name: 'Overstock Plus',
    description: '+2 card slots in the shop.',
    cost: 10,
    upgradeOf: 'overstock',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.shopCardSlots = (r.shopCardSlots ?? 4) + 2;
    },
  },

  // ── Clearance Sale ──────────────────────────────────────────────────────────
  {
    id: 'clearance_sale',
    name: 'Clearance Sale',
    description: 'All items in the shop are 25% cheaper.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add shopDiscount to RunState
      r.shopDiscount = 0.25;
    },
  },
  {
    id: 'liquidation',
    name: 'Liquidation',
    description: 'All items in the shop are 50% cheaper.',
    cost: 10,
    upgradeOf: 'clearance_sale',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.shopDiscount = 0.5;
    },
  },

  // ── Grabber ─────────────────────────────────────────────────────────────────
  {
    id: 'grabber',
    name: 'Grabber',
    description: '+1 hand per round.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxHands to RunState (separate from handsRemaining)
      r.maxHands = (r.maxHands ?? 4) + 1;
    },
  },
  {
    id: 'nacho_tong',
    name: 'Nacho Tong',
    description: '+1 hand per round.',
    cost: 10,
    upgradeOf: 'grabber',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.maxHands = (r.maxHands ?? 4) + 1;
    },
  },

  // ── Wasteful ─────────────────────────────────────────────────────────────────
  {
    id: 'wasteful',
    name: 'Wasteful',
    description: '+1 discard per round.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add maxDiscards to RunState (separate from discardsRemaining)
      r.maxDiscards = (r.maxDiscards ?? 3) + 1;
    },
  },
  {
    id: 'recyclomancy',
    name: 'Recyclomancy',
    description: '+1 discard per round.',
    cost: 10,
    upgradeOf: 'wasteful',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.maxDiscards = (r.maxDiscards ?? 3) + 1;
    },
  },

  // ── Tarot Merchant ───────────────────────────────────────────────────────────
  {
    id: 'tarot_merchant',
    name: 'Tarot Merchant',
    description: 'Tarot cards are cheaper in the shop.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add tarotDiscount to RunState
      r.tarotDiscount = true;
    },
  },
  {
    id: 'tarot_tycoon',
    name: 'Tarot Tycoon',
    description: 'Tarot cards are even cheaper in the shop.',
    cost: 10,
    upgradeOf: 'tarot_merchant',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.tarotTycoon = true;
    },
  },

  // ── Planet Merchant ──────────────────────────────────────────────────────────
  {
    id: 'planet_merchant',
    name: 'Planet Merchant',
    description: 'Planet cards are cheaper in the shop.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add planetDiscount to RunState
      r.planetDiscount = true;
    },
  },
  {
    id: 'planet_tycoon',
    name: 'Planet Tycoon',
    description: 'Planet cards are even cheaper in the shop.',
    cost: 10,
    upgradeOf: 'planet_merchant',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.planetTycoon = true;
    },
  },

  // ── Magic Trick ──────────────────────────────────────────────────────────────
  {
    id: 'magic_trick',
    name: 'Magic Trick',
    description: 'Playing cards can appear in the shop.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add playingCardsInShop to RunState
      r.playingCardsInShop = true;
    },
  },
  {
    id: 'illusion',
    name: 'Illusion',
    description: 'Playing cards in the shop can have Editions.',
    cost: 10,
    upgradeOf: 'magic_trick',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.playingCardsWithEdition = true;
    },
  },

  // ── Hieroglyph ───────────────────────────────────────────────────────────────
  {
    id: 'hieroglyph',
    name: 'Hieroglyph',
    description: '-1 Ante, but -1 hand per round.',
    cost: 10,
    effect: (rs) => {
      rs.ante -= 1;
    },
  },
  {
    id: 'petroglyph',
    name: 'Petroglyph',
    description: '-1 Blind per Ante.',
    cost: 10,
    upgradeOf: 'hieroglyph',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add blindsSkipped to RunState
      r.blindsSkipped = (r.blindsSkipped ?? 0) + 1;
    },
  },

  // ── Director's Cut ───────────────────────────────────────────────────────────
  {
    id: 'directors_cut',
    name: "Director's Cut",
    description: 'Reroll the Boss Blind once per Ante.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add bossRerolls to RunState
      r.bossRerolls = 1;
    },
  },
  {
    id: 'retcon',
    name: 'Retcon',
    description: 'Reroll the Boss Blind unlimited times.',
    cost: 10,
    upgradeOf: 'directors_cut',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.bossRerolls = 999;
    },
  },

  // ── Painting ─────────────────────────────────────────────────────────────────
  {
    id: 'painting',
    name: 'Painting',
    description: '+1 Consumable slot.',
    cost: 10,
    effect: (rs) => {
      rs.maxConsumableSlots += 1;
    },
  },
  {
    id: 'sculpture',
    name: 'Sculpture',
    description: '+1 Consumable slot.',
    cost: 10,
    upgradeOf: 'painting',
    effect: (rs) => {
      rs.maxConsumableSlots += 1;
    },
  },

  // ── Palette ──────────────────────────────────────────────────────────────────
  {
    id: 'palette',
    name: 'Palette',
    description: '+1 Hand Size.',
    cost: 10,
    effect: (rs) => {
      rs.handSize += 1;
    },
  },
  {
    id: 'paint_brush',
    name: 'Paint Brush',
    description: '+1 Hand Size.',
    cost: 10,
    upgradeOf: 'palette',
    effect: (rs) => {
      rs.handSize += 1;
    },
  },

  // ── Crystal Ball ─────────────────────────────────────────────────────────────
  {
    id: 'crystal_ball',
    name: 'Crystal Ball',
    description: '+1 Consumable slot.',
    cost: 10,
    effect: (rs) => {
      rs.maxConsumableSlots += 1;
    },
  },
  {
    id: 'omen_globe',
    name: 'Omen Globe',
    description: 'Spectral cards can appear in Celestial Packs.',
    cost: 10,
    upgradeOf: 'crystal_ball',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add spectralsInShop to RunState
      r.spectralsInShop = true;
    },
  },

  // ── Telescope ────────────────────────────────────────────────────────────────
  {
    id: 'telescope',
    name: 'Telescope',
    description: 'Celestial Packs always contain the Planet card for your most played hand.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add telescopeActive to RunState
      r.telescopeActive = true;
    },
  },
  {
    id: 'observatory',
    name: 'Observatory',
    description: 'Jokers with a Planet card trigger +X Mult.',
    cost: 10,
    upgradeOf: 'telescope',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.observatoryActive = true;
    },
  },

  // ── Hone ─────────────────────────────────────────────────────────────────────
  {
    id: 'hone',
    name: 'Hone',
    description: 'Cards appear with Editions 2× more often.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add editionChanceMultiplier to RunState
      r.editionChanceMultiplier = 2;
    },
  },
  {
    id: 'glow_up',
    name: 'Glow Up',
    description: 'Cards appear with Editions 4× more often.',
    cost: 10,
    upgradeOf: 'hone',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.editionChanceMultiplier = 4;
    },
  },

  // ── Reroll Surplus ───────────────────────────────────────────────────────────
  {
    id: 'reroll_surplus',
    name: 'Reroll Surplus',
    description: 'Rerolls cost $2 less.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add rerollDiscount to RunState
      r.rerollDiscount = (r.rerollDiscount ?? 0) + 2;
    },
  },
  {
    id: 'reroll_glut',
    name: 'Reroll Glut',
    description: 'Rerolls cost $1 less.',
    cost: 10,
    upgradeOf: 'reroll_surplus',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.rerollDiscount = (r.rerollDiscount ?? 0) + 1;
    },
  },

  // ── Seed Money ───────────────────────────────────────────────────────────────
  {
    id: 'seed_money',
    name: 'Seed Money',
    description: 'Earn $1 more interest per blind.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add interestBonus to RunState
      r.interestBonus = (r.interestBonus ?? 0) + 1;
    },
  },
  {
    id: 'money_tree',
    name: 'Money Tree',
    description: 'Earn $2 more interest per blind.',
    cost: 10,
    upgradeOf: 'seed_money',
    effect: (rs) => {
      const r = rs as ExtRunState;
      r.interestBonus = (r.interestBonus ?? 0) + 2;
    },
  },

  // ── Hiring Sign ──────────────────────────────────────────────────────────────
  {
    id: 'hiring_sign',
    name: 'Hiring Sign',
    description: 'Jokers cost $2 less.',
    cost: 10,
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add jokerCostReduction to RunState
      r.jokerCostReduction = (r.jokerCostReduction ?? 0) + 2;
    },
  },
  {
    id: 'signing_bonus',
    name: 'Signing Bonus',
    description: 'One Joker per shop is free.',
    cost: 10,
    upgradeOf: 'hiring_sign',
    effect: (rs) => {
      const r = rs as ExtRunState;
      // TODO: add freeJokerPerShop to RunState
      r.freeJokerPerShop = true;
    },
  },

  // ── Blank / Antimatter ───────────────────────────────────────────────────────
  {
    id: 'blank',
    name: 'Blank',
    description: 'Does nothing.',
    cost: 10,
    effect: (_rs) => {
      // Intentional no-op.
    },
  },
  {
    id: 'antimatter',
    name: 'Antimatter',
    description: '+1 Joker slot.',
    cost: 10,
    upgradeOf: 'blank',
    effect: (rs) => {
      rs.maxJokerSlots += 1;
    },
  },
];
