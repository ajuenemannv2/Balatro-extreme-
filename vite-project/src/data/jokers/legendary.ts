import type { JokerDefinition } from '../../types/Joker.ts';
import type { RunState } from '../../types/Run.ts';

export const LEGENDARY_JOKER_DEFS: JokerDefinition[] = [
  {
    id: 'j_canio_legendary',
    name: 'Canio',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 10,
    description: 'This Joker gains ×1 Mult each time a playing card is destroyed',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_triboulet_legendary',
    name: 'Triboulet',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 10,
    description: 'Played Kings and Queens each give ×2 Mult when scored',
    effect: (ctx) =>
      ctx.currentCard?.rank === 'K' || ctx.currentCard?.rank === 'Q'
        ? { mulMult: 2 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_yorick_legendary',
    name: 'Yorick',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 10,
    description: 'This Joker gains ×1 Mult for every 23rd card discarded',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    onDiscard: (rs: RunState, discarded) => {
      const j = rs.jokers.find((j) => j.id === 'j_yorick_legendary');
      if (!j) return;
      const prev = j.runtimeCounters.totalDiscarded ?? 0;
      const next = prev + discarded.length;
      const prevMilestones = Math.floor(prev / 23);
      const nextMilestones = Math.floor(next / 23);
      j.runtimeCounters.mult =
        (j.runtimeCounters.mult ?? 0) + (nextMilestones - prevMilestones);
      j.runtimeCounters.totalDiscarded = next;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_chicot_legendary',
    name: 'Chicot',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 10,
    description: 'Disables the effect of every Boss Blind',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_perkeo_legendary',
    name: 'Perkeo',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 10,
    description: 'Creates a Negative copy of 1 random consumable in your possession at the end of each shop',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },
];
