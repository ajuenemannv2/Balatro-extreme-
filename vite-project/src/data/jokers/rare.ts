import type { JokerDefinition } from '../../types/Joker.ts';
import type { RunState } from '../../types/Run.ts';

export const RARE_JOKER_DEFS: JokerDefinition[] = [
  {
    id: 'j_brainstorm',
    name: 'Brainstorm',
    rarity: 'Rare',
    baseCost: 10,
    sellValue: 5,
    description: 'Copies the effect of the leftmost Joker',
    effect: (ctx) => {
      const leftJoker = ctx.runState.jokers[0];
      if (leftJoker && leftJoker.instanceId !== ctx.joker.instanceId && leftJoker.effect) {
        return leftJoker.effect({ ...ctx, joker: leftJoker });
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_satellite',
    name: 'Satellite',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: 'Earn $1 at end of round per unique Planet card used this run',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const uniquePlanets = new Set(rs.pendingPlanetCards).size;
      rs.money += uniquePlanets;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_shoot_the_moon',
    name: 'Shoot the Moon',
    rarity: 'Rare',
    baseCost: 5,
    sellValue: 3,
    description: 'Each Queen held in hand gives +13 Mult',
    effect: (ctx) => {
      const queens = ctx.runState.hand.filter(
        (c) =>
          c.rank === 'Q' &&
          !ctx.scoringCtx.playedCards.find((p) => p.id === c.id),
      );
      return queens.length > 0 ? { addMult: 13 * queens.length } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_drivers_license',
    name: "Driver's License",
    rarity: 'Rare',
    baseCost: 7,
    sellValue: 4,
    description: '+3 Mult for each unique enhancement in your full deck. Activates when you have at least 16 enhanced cards',
    effect: (ctx) => {
      const allCards = [
        ...ctx.runState.deck,
        ...ctx.runState.hand,
        ...ctx.runState.discardPile,
      ];
      const enhanced = allCards.filter((c) => c.enhancement !== 'none');
      if (enhanced.length < 16) return {};
      const uniqueEnhancements = new Set(enhanced.map((c) => c.enhancement))
        .size;
      return { mulMult: 1 + 3 * uniqueEnhancements };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_cartomancer',
    name: 'Cartomancer',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: 'Create a Tarot card when Blind is selected, if you have a free consumable slot',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_astronomer',
    name: 'Astronomer',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: 'All Planet cards and Celestial Packs in the shop are free',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_burnt_joker',
    name: 'Burnt Joker',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: 'Upgrade the most played poker hand. Destroys itself after one use',
    effect: (ctx) => {
      if (ctx.runState.mostPlayedHand && !ctx.joker.runtimeCounters.used) {
        ctx.joker.runtimeCounters.used = 1;
        ctx.runState.handLevels[ctx.runState.mostPlayedHand] =
          (ctx.runState.handLevels[ctx.runState.mostPlayedHand] ?? 1) + 1;
        ctx.runState.pendingDeferredEffects.push((rs: RunState) => {
          const idx = rs.jokers.findIndex((j) => j.id === 'j_burnt_joker');
          if (idx !== -1) rs.jokers.splice(idx, 1);
        });
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_bootstraps',
    name: 'Bootstraps',
    rarity: 'Rare',
    baseCost: 7,
    sellValue: 4,
    description: '+2 Mult for every $5 you have',
    effect: (ctx) => ({
      addMult: 2 * Math.floor(ctx.runState.money / 5),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_cavendish',
    name: 'Cavendish',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: '×3 Mult for the most played poker hand this run. 1 in 6 chance of being destroyed at end of round',
    effect: (ctx) => {
      if (
        ctx.runState.mostPlayedHand &&
        ctx.handType === ctx.runState.mostPlayedHand
      ) {
        return { mulMult: 3 };
      }
      return {};
    },
    onRoundEnd: (rs: RunState) => {
      if (Math.random() < 1 / 6) {
        const idx = rs.jokers.findIndex((j) => j.id === 'j_cavendish');
        if (idx !== -1) rs.jokers.splice(idx, 1);
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_card_sharp',
    name: 'Card Sharp',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: '×3 Mult if played poker hand has already been played this round',
    effect: (ctx) => {
      const played = ctx.joker.runtimeCounters.handsPlayedThisRound ?? 0;
      return played > 0 ? { mulMult: 3 } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_red_belt',
    name: 'Red Belt',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: '+3 Mult on the highest scoring card played',
    effect: (ctx) => {
      const scored = ctx.scoringCtx.scoredCards;
      if (scored.length === 0 || !ctx.currentCard) return {};
      const highest = scored.reduce((best, c) =>
        c.baseChips > best.baseChips ? c : best,
      );
      return ctx.currentCard.id === highest.id ? { addMult: 3 } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_triboulet',
    name: 'Triboulet',
    rarity: 'Rare',
    baseCost: 9,
    sellValue: 5,
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
    id: 'j_yorick',
    name: 'Yorick',
    rarity: 'Rare',
    baseCost: 10,
    sellValue: 5,
    description: 'This Joker gains ×1 Mult for every 23rd card discarded',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    onDiscard: (rs: RunState, discarded) => {
      const j = rs.jokers.find((j) => j.id === 'j_yorick');
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
    id: 'j_chicot',
    name: 'Chicot',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: 'Disables the effect of every Boss Blind',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_perkeo',
    name: 'Perkeo',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: 'Creates a Negative copy of 1 random consumable in your possession at the end of each shop',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_canio',
    name: 'Canio',
    rarity: 'Rare',
    baseCost: 10,
    sellValue: 5,
    description: 'This Joker gains ×1 Mult each time a playing card is destroyed',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_bootstraps_rare',
    name: 'Hanging Bootstraps',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: '+1 Mult for each $2 you have',
    effect: (ctx) => ({
      addMult: Math.floor(ctx.runState.money / 2),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_obelisk',
    name: 'Obelisk',
    rarity: 'Rare',
    baseCost: 8,
    sellValue: 4,
    description: 'This Joker gains ×0.2 Mult each consecutive hand you play without playing the most played poker hand',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_luchador',
    name: 'Luchador',
    rarity: 'Rare',
    baseCost: 5,
    sellValue: 3,
    description: 'Sell this Joker to disable the current Boss Blind',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_photograph_rare',
    name: 'Photograph (Rare)',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: 'First played face card each hand gives ×2 Mult when scored',
    effect: (ctx) => {
      if (
        ['J', 'Q', 'K'].includes(ctx.currentCard?.rank ?? '') &&
        !ctx.joker.runtimeCounters.used
      ) {
        ctx.joker.runtimeCounters.used = 1;
        return { mulMult: 2 };
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_golden_joker',
    name: 'Golden Joker',
    rarity: 'Rare',
    baseCost: 6,
    sellValue: 3,
    description: 'Earn $4 at end of round',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => { rs.money += 4; },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_lucky_joker',
    name: 'Lucky Joker',
    rarity: 'Rare',
    baseCost: 5,
    sellValue: 3,
    description: '+20 Mult for each Lucky card trigger',
    effect: (ctx) =>
      ctx.currentCard?.enhancement === 'lucky'
        ? { addMult: 20 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_spare_trousers_rare',
    name: 'Luckier Trousers',
    rarity: 'Rare',
    baseCost: 7,
    sellValue: 4,
    description: 'This Joker gains +4 Mult if played hand contains a Two Pair or better',
    effect: (ctx) => {
      if (
        ['Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House',
          'Four of a Kind', 'Straight Flush', 'Five of a Kind', 'Flush House', 'Flush Five',
        ].includes(ctx.handType)
      ) {
        ctx.joker.runtimeCounters.mult =
          (ctx.joker.runtimeCounters.mult ?? 0) + 4;
      }
      return { addMult: ctx.joker.runtimeCounters.mult ?? 0 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },
];
