import type { JokerDefinition } from '../../types/Joker.ts';
import type { RunState } from '../../types/Run.ts';

export const UNCOMMON_JOKER_DEFS: JokerDefinition[] = [
  {
    id: 'j_ancient_joker',
    name: 'Ancient Joker',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'Each played card with a random suit gives ×1.5 Mult when scored. Suit changes each round',
    perCard: true,
    effect: (ctx) => {
      const targetSuit = ctx.joker.runtimeCounters.suit !== undefined
        ? (['Spades', 'Hearts', 'Clubs', 'Diamonds'] as const)[ctx.joker.runtimeCounters.suit]
        : undefined;
      if (targetSuit && ctx.currentCard?.suit === targetSuit) {
        return { mulMult: 1.5 };
      }
      return {};
    },
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_ancient_joker');
      if (j) j.runtimeCounters.suit = Math.floor(Math.random() * 4);
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_ramen',
    name: 'Ramen',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '×2 Mult. Loses ×0.75 Mult per discard until destroyed',
    effect: (ctx) => {
      const mult = ctx.joker.runtimeCounters.mult ?? 2.0;
      return mult > 0 ? { mulMult: mult } : {};
    },
    onDiscard: (rs: RunState, _discarded) => {
      const j = rs.jokers.find((j) => j.id === 'j_ramen');
      if (j) {
        j.runtimeCounters.mult = (j.runtimeCounters.mult ?? 2.0) - 0.75;
        if (j.runtimeCounters.mult <= 0) {
          const idx = rs.jokers.indexOf(j);
          rs.jokers.splice(idx, 1);
        }
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_walkie_talkie',
    name: 'Walkie Talkie',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'Each played 10 or 4 gives +10 Chips and +4 Mult when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.rank === '10' || ctx.currentCard?.rank === '4'
        ? { addChips: 10, addMult: 4 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_seltzer',
    name: 'Seltzer',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'Retrigger all cards for the next 10 hands, then self-destructs',
    effect: () => ({}),
    isEternal: false,
    isPerishable: true,
    perishUsesLeft: 10,
    isRentable: false,
  },

  {
    id: 'j_castle',
    name: 'Castle',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains +3 Chips per discarded card that matches the current suit. Suit changes each round',
    effect: (ctx) => ({ addChips: ctx.joker.runtimeCounters.chips ?? 0 }),
    onDiscard: (rs: RunState, discarded) => {
      const j = rs.jokers.find((j) => j.id === 'j_castle');
      if (!j) return;
      const suitIdx = j.runtimeCounters.suit ?? 0;
      const suits = ['Spades', 'Hearts', 'Clubs', 'Diamonds'] as const;
      const targetSuit = suits[suitIdx];
      const count = discarded.filter((c) => c.suit === targetSuit).length;
      j.runtimeCounters.chips = (j.runtimeCounters.chips ?? 0) + count * 3;
    },
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_castle');
      if (j) j.runtimeCounters.suit = Math.floor(Math.random() * 4);
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_smiley_face',
    name: 'Smiley Face',
    rarity: 'Uncommon',
    baseCost: 5,
    sellValue: 3,
    description: 'Played face cards give +5 Mult when scored',
    perCard: true,
    effect: (ctx) =>
      ['J', 'Q', 'K'].includes(ctx.currentCard?.rank ?? '')
        ? { addMult: 5 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_campfire',
    name: 'Campfire',
    rarity: 'Uncommon',
    baseCost: 9,
    sellValue: 5,
    description: 'This Joker gains ×0.25 Mult each time a card is sold. Resets after each Boss Blind',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_golden_ticket',
    name: 'Golden Ticket',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'Played Gold cards earn $4 when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.enhancement === 'gold' ? { addMoney: 4 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_mr_bones',
    name: 'Mr. Bones',
    rarity: 'Uncommon',
    baseCost: 5,
    sellValue: 3,
    description: 'Prevents death if chips scored are at least 25% of required chips, then self-destructs',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_acrobat',
    name: 'Acrobat',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '×3 Mult on final hand of round',
    effect: (ctx) =>
      ctx.runState.handsRemaining === 1 ? { mulMult: 3 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_sock_and_buskin',
    name: 'Sock and Buskin',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'Retrigger all played face cards',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_swashbuckler',
    name: 'Swashbuckler',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'Adds the total sell value of all owned Jokers to Mult',
    effect: (ctx) => {
      const totalSellValue = ctx.runState.jokers
        .filter((j) => j.instanceId !== ctx.joker.instanceId)
        .reduce((sum, j) => sum + j.sellValue, 0);
      return { addMult: totalSellValue };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_troubadour',
    name: 'Troubadour',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '+2 hand size, -1 hand per round',
    effect: () => ({}),
    onBuy: (rs: RunState) => {
      rs.handSize += 2;
    },
    onSell: (rs: RunState) => {
      rs.handSize = Math.max(1, rs.handSize - 2);
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_certificate',
    name: 'Certificate',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'When round begins, add a random playing card with a random edition to your hand',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_smeared_joker',
    name: 'Smeared Joker',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'Hearts and Diamonds count as the same suit. Spades and Clubs count as the same suit',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_throwback',
    name: 'Throwback',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '+0.25 Mult for each time the ante was started with a skipped blind',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.skips ?? 0) * 0.25,
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hanging_chad',
    name: 'Hanging Chad',
    rarity: 'Uncommon',
    baseCost: 4,
    sellValue: 2,
    description: 'Retrigger first played card 2 additional times',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_rough_gem',
    name: 'Rough Gem',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'Played Diamond cards earn $1 when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.suit === 'Diamonds' ? { addMoney: 1 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_bloodstone',
    name: 'Bloodstone',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: '1 in 2 chance for played Heart cards to give ×1.5 Mult when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.suit === 'Hearts' && Math.random() < 0.5
        ? { mulMult: 1.5 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_arrowhead',
    name: 'Arrowhead',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'Played Spade cards give +50 Chips when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.suit === 'Spades' ? { addChips: 50 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_onyx_agate',
    name: 'Onyx Agate',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'Played Club cards give +7 Mult when scored',
    perCard: true,
    effect: (ctx) =>
      ctx.currentCard?.suit === 'Clubs' ? { addMult: 7 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_glass_joker',
    name: 'Glass Joker',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains +0.75 Mult each time a Glass card is destroyed',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_showman',
    name: 'Showman',
    rarity: 'Uncommon',
    baseCost: 5,
    sellValue: 3,
    description: 'Joker, Tarot, Planet, and Spectral cards may appear multiple times in the shop',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_flower_pot',
    name: 'Flower Pot',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '+3 Mult if played hand contains a Diamond, Club, Heart, and Spade card',
    effect: (ctx) => {
      const suits = new Set(
        ctx.scoringCtx.scoredCards.map((c) => c.suit),
      );
      if (
        suits.has('Diamonds') &&
        suits.has('Clubs') &&
        suits.has('Hearts') &&
        suits.has('Spades')
      ) {
        return { mulMult: 3 };
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_blueprint',
    name: 'Blueprint',
    rarity: 'Uncommon',
    baseCost: 10,
    sellValue: 5,
    description: 'Copies the effect of the Joker to the right',
    effect: (ctx) => {
      const myIdx = ctx.runState.jokers.findIndex(
        (j) => j.instanceId === ctx.joker.instanceId,
      );
      const rightJoker = ctx.runState.jokers[myIdx + 1];
      if (rightJoker && rightJoker.effect) {
        return rightJoker.effect({ ...ctx, joker: rightJoker });
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_wee_joker',
    name: 'Wee Joker',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'This Joker gains +8 Chips each time a played 2 is scored',
    perCard: true,
    effect: (ctx) => {
      if (ctx.currentCard?.rank === '2') {
        ctx.joker.runtimeCounters.chips =
          (ctx.joker.runtimeCounters.chips ?? 0) + 8;
      }
      return { addChips: ctx.joker.runtimeCounters.chips ?? 0 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_merry_andy',
    name: 'Merry Andy',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: '+3 discards each round, -1 hand size',
    effect: () => ({}),
    onBuy: (rs: RunState) => {
      rs.handSize = Math.max(1, rs.handSize - 1);
    },
    onSell: (rs: RunState) => {
      rs.handSize += 1;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_idol',
    name: 'The Idol',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'Each played card that matches the current rank and suit gives ×2 Mult. Card changes each round',
    perCard: true,
    effect: (ctx) => {
      const targetRank = ctx.joker.runtimeCounters.rank ?? 0;
      const targetSuit = ctx.joker.runtimeCounters.suit ?? 0;
      const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'] as const;
      const suits = ['Spades','Hearts','Clubs','Diamonds'] as const;
      if (
        ctx.currentCard?.rank === ranks[targetRank] &&
        ctx.currentCard?.suit === suits[targetSuit]
      ) {
        return { mulMult: 2 };
      }
      return {};
    },
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_the_idol');
      if (j) {
        j.runtimeCounters.rank = Math.floor(Math.random() * 13);
        j.runtimeCounters.suit = Math.floor(Math.random() * 4);
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_seeing_double',
    name: 'Seeing Double',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: '+4 Mult if played hand has a Club flush and another flush',
    effect: (ctx) => {
      const scored = ctx.scoringCtx.scoredCards;
      const hasClub = scored.some((c) => c.suit === 'Clubs');
      const hasOtherFlush =
        scored.some((c) => c.suit === 'Hearts') ||
        scored.some((c) => c.suit === 'Spades') ||
        scored.some((c) => c.suit === 'Diamonds');
      if (
        hasClub &&
        hasOtherFlush &&
        ['Flush', 'Straight Flush', 'Flush House', 'Flush Five'].includes(
          ctx.handType,
        )
      ) {
        return { mulMult: 4 };
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_matador',
    name: 'Matador',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'Earn $8 if played hand triggers the Boss Blind ability',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hit_the_road',
    name: 'Hit the Road',
    rarity: 'Uncommon',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains ×0.5 Mult for each Jack discarded this round',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    onDiscard: (rs: RunState, discarded) => {
      const j = rs.jokers.find((j) => j.id === 'j_hit_the_road');
      if (!j) return;
      const jacks = discarded.filter((c) => c.rank === 'J').length;
      j.runtimeCounters.mult = (j.runtimeCounters.mult ?? 0) + jacks * 0.5;
    },
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_hit_the_road');
      if (j) j.runtimeCounters.mult = 0;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_duo',
    name: 'The Duo',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '×2 Mult if played hand contains a Pair',
    effect: (ctx) =>
      ['Pair', 'Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)
        ? { mulMult: 2 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_trio',
    name: 'The Trio',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '×3 Mult if played hand contains a Three of a Kind',
    effect: (ctx) =>
      ['Three of a Kind', 'Full House', 'Five of a Kind', 'Flush House', 'Flush Five'].includes(
        ctx.handType,
      )
        ? { mulMult: 3 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_family',
    name: 'The Family',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '×4 Mult if played hand contains a Four of a Kind',
    effect: (ctx) =>
      ['Four of a Kind', 'Flush Five'].includes(ctx.handType)
        ? { mulMult: 4 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_order',
    name: 'The Order',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '×3 Mult if played hand contains a Straight',
    effect: (ctx) =>
      ['Straight', 'Straight Flush'].includes(ctx.handType)
        ? { mulMult: 3 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_the_tribe',
    name: 'The Tribe',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '×2 Mult if played hand contains a Flush',
    effect: (ctx) =>
      ['Flush', 'Straight Flush', 'Flush House', 'Flush Five'].includes(
        ctx.handType,
      )
        ? { mulMult: 2 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_stuntman',
    name: 'Stuntman',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: '+250 Chips, -2 hand size',
    effect: () => ({ addChips: 250 }),
    onBuy: (rs: RunState) => { rs.handSize = Math.max(1, rs.handSize - 2); },
    onSell: (rs: RunState) => { rs.handSize += 2; },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_invisible_joker',
    name: 'Invisible Joker',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'After 2 rounds, sell this Joker to Duplicate a random Joker',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_invisible_joker');
      if (j) {
        j.runtimeCounters.rounds = (j.runtimeCounters.rounds ?? 0) + 1;
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },
];
