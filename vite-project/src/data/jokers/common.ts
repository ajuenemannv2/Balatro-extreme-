import type { JokerDefinition } from '../../types/Joker.ts';
import type { RunState } from '../../types/Run.ts';

export const COMMON_JOKER_DEFS: JokerDefinition[] = [
  {
    id: 'j_joker',
    name: 'Joker',
    rarity: 'Common',
    baseCost: 2,
    sellValue: 1,
    description: '+4 Mult',
    effect: () => ({ addMult: 4 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_greedy_joker',
    name: 'Greedy Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Played cards with {Diamond} suit give +3 Mult when scored',
    effect: (ctx) => ctx.currentCard?.suit === 'Diamonds' ? { addMult: 3 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_lusty_joker',
    name: 'Lusty Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Played cards with {Heart} suit give +3 Mult when scored',
    effect: (ctx) => ctx.currentCard?.suit === 'Hearts' ? { addMult: 3 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_wrathful_joker',
    name: 'Wrathful Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Played cards with {Spade} suit give +3 Mult when scored',
    effect: (ctx) => ctx.currentCard?.suit === 'Spades' ? { addMult: 3 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_gluttonous_joker',
    name: 'Gluttonous Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Played cards with {Club} suit give +3 Mult when scored',
    effect: (ctx) => ctx.currentCard?.suit === 'Clubs' ? { addMult: 3 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_jolly',
    name: 'Jolly Joker',
    rarity: 'Common',
    baseCost: 3,
    sellValue: 2,
    description: '+8 Mult if played hand contains a Pair',
    effect: (ctx) =>
      ['Pair', 'Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)
        ? { addMult: 8 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_zany',
    name: 'Zany Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+12 Mult if played hand contains a Three of a Kind',
    effect: (ctx) =>
      ['Three of a Kind', 'Full House', 'Five of a Kind', 'Flush House', 'Flush Five'].includes(ctx.handType)
        ? { addMult: 12 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_mad',
    name: 'Mad Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+10 Mult if played hand contains a Two Pair',
    effect: (ctx) =>
      ['Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)
        ? { addMult: 10 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_crazy',
    name: 'Crazy Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+12 Mult if played hand contains a Straight',
    effect: (ctx) =>
      ['Straight', 'Straight Flush'].includes(ctx.handType)
        ? { addMult: 12 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_droll',
    name: 'Droll Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+10 Mult if played hand contains a Flush',
    effect: (ctx) =>
      ['Flush', 'Straight Flush', 'Flush House', 'Flush Five'].includes(ctx.handType)
        ? { addMult: 10 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_sly',
    name: 'Sly Joker',
    rarity: 'Common',
    baseCost: 3,
    sellValue: 2,
    description: '+50 Chips if played hand contains a Pair',
    effect: (ctx) =>
      ['Pair', 'Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)
        ? { addChips: 50 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_wily',
    name: 'Wily Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+100 Chips if played hand contains a Three of a Kind',
    effect: (ctx) =>
      ['Three of a Kind', 'Full House', 'Five of a Kind', 'Flush House', 'Flush Five'].includes(ctx.handType)
        ? { addChips: 100 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_clever',
    name: 'Clever Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+80 Chips if played hand contains a Two Pair',
    effect: (ctx) =>
      ['Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)
        ? { addChips: 80 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_devious',
    name: 'Devious Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+100 Chips if played hand contains a Straight',
    effect: (ctx) =>
      ['Straight', 'Straight Flush'].includes(ctx.handType)
        ? { addChips: 100 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_crafty',
    name: 'Crafty Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+80 Chips if played hand contains a Flush',
    effect: (ctx) =>
      ['Flush', 'Straight Flush', 'Flush House', 'Flush Five'].includes(ctx.handType)
        ? { addChips: 80 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_half',
    name: 'Half Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+20 Mult if played hand has 3 or fewer cards',
    effect: (ctx) =>
      ctx.scoringCtx.playedCards.length <= 3 ? { addMult: 20 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_stencil',
    name: 'Joker Stencil',
    rarity: 'Common',
    baseCost: 8,
    sellValue: 4,
    description: '×1 Mult for each empty Joker slot. Joker Stencil included',
    effect: (ctx) => {
      const emptySlots = ctx.runState.maxJokerSlots - ctx.runState.jokers.length;
      return emptySlots > 0 ? { mulMult: 1 + emptySlots } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_four_fingers',
    name: 'Four Fingers',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: 'All Flushes and Straights can be made with 4 cards',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_mime',
    name: 'Mime',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Retrigger all card held in hand abilities',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_credit_card',
    name: 'Credit Card',
    rarity: 'Common',
    baseCost: 1,
    sellValue: 1,
    description: 'Go up to -$20 in debt',
    effect: () => ({}),
    onBuy: (rs: RunState) => { rs.money = Math.max(rs.money, -20); },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_ceremonial_dagger',
    name: 'Ceremonial Dagger',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'When Blind is selected, destroy Joker to the right and permanently add double its sell value to Mult',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.mult ?? 0 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_banner',
    name: 'Banner',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+30 Chips for each remaining discard',
    effect: (ctx) => ({ addChips: 30 * ctx.runState.discardsRemaining }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_mystic_summit',
    name: 'Mystic Summit',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+15 Mult when 0 discards remaining',
    effect: (ctx) => ctx.runState.discardsRemaining === 0 ? { addMult: 15 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_marble',
    name: 'Marble Joker',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Adds one Stone card to deck when Blind is selected',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_loyalty_card',
    name: 'Loyalty Card',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '×4 Mult every 6 hands played',
    effect: (ctx) => {
      const total = ctx.runState.handsThisRun ?? 0;
      return total > 0 && total % 6 === 0 ? { mulMult: 4 } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_8_ball',
    name: '8 Ball',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '1 in 4 chance for each played 8 to create a Tarot card when scored',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_misprint',
    name: 'Misprint',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+? Mult',
    effect: () => ({ addMult: Math.floor(Math.random() * 24) }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_dusk',
    name: 'Dusk',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Retrigger all played cards on final hand of the round',
    effect: (ctx) => ctx.runState.handsRemaining === 1 ? { retrigger: true } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_raised_fist',
    name: 'Raised Fist',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Adds double the rank of the lowest ranked card held in hand to Mult',
    effect: (ctx) => {
      const rankVals: Record<string, number> = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
        '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
      };
      const held = ctx.runState.hand.filter(
        (c) => !ctx.scoringCtx.playedCards.find((p) => p.id === c.id),
      );
      if (held.length === 0) return {};
      const minRank = Math.min(
        ...held.filter((c) => c.rank).map((c) => rankVals[c.rank!] ?? 14),
      );
      return { addMult: minRank * 2 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_chaos',
    name: 'Chaos the Clown',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '1 free Reroll per shop',
    effect: () => ({}),
    onBuy: (rs: RunState) => {
      rs.freeRerollsPerShop = (rs.freeRerollsPerShop ?? 0) + 1;
    },
    onSell: (rs: RunState) => {
      rs.freeRerollsPerShop = Math.max(0, (rs.freeRerollsPerShop ?? 0) - 1);
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_fibonacci',
    name: 'Fibonacci',
    rarity: 'Common',
    baseCost: 8,
    sellValue: 4,
    description: 'Each played Ace, 2, 3, 5, or 8 gives +8 Mult when scored',
    effect: (ctx) =>
      ['A', '2', '3', '5', '8'].includes(ctx.currentCard?.rank ?? '')
        ? { addMult: 8 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_steel_joker',
    name: 'Steel Joker',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: '+0.2 Mult for each Steel card in your full deck',
    effect: (ctx) => {
      const steelCount = [
        ...ctx.runState.deck,
        ...ctx.runState.hand,
        ...ctx.runState.discardPile,
      ].filter((c) => c.enhancement === 'steel').length;
      return steelCount > 0 ? { mulMult: 1 + 0.2 * steelCount } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_scary_face',
    name: 'Scary Face',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Played face cards (J, Q, K) give +30 Chips when scored',
    effect: (ctx) =>
      ['J', 'Q', 'K'].includes(ctx.currentCard?.rank ?? '')
        ? { addChips: 30 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_abstract',
    name: 'Abstract Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+3 Mult for each Joker card',
    effect: (ctx) => ({ addMult: 3 * ctx.runState.jokers.length }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_delayed_gratification',
    name: 'Delayed Gratification',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Earn $2 per discard if no discards used by end of round',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      // discardsRemaining equals initial discard count if none were used
      if (rs.discardsRemaining >= 3) rs.money += 2 * rs.discardsRemaining;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hack',
    name: 'Hack',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Retrigger each played 2, 3, 4, or 5',
    effect: (ctx) =>
      ['2', '3', '4', '5'].includes(ctx.currentCard?.rank ?? '')
        ? { retrigger: true }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_pareidolia',
    name: 'Pareidolia',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'All cards are considered Face cards',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_gros_michel',
    name: 'Gros Michel',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+15 Mult. 1 in 6 chance of being destroyed at end of round',
    effect: () => ({ addMult: 15 }),
    onRoundEnd: (rs: RunState) => {
      if (Math.random() < 1 / 6) {
        const idx = rs.jokers.findIndex((j) => j.id === 'j_gros_michel');
        if (idx !== -1) rs.jokers.splice(idx, 1);
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_even_steven',
    name: 'Even Steven',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Played cards with even rank (10, 8, 6, 4, 2) give +4 Mult when scored',
    effect: (ctx) =>
      ['2', '4', '6', '8', '10'].includes(ctx.currentCard?.rank ?? '')
        ? { addMult: 4 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_odd_todd',
    name: 'Odd Todd',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Played cards with odd rank (A, 9, 7, 5, 3) give +31 Chips when scored',
    effect: (ctx) =>
      ['A', '3', '5', '7', '9'].includes(ctx.currentCard?.rank ?? '')
        ? { addChips: 31 }
        : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_scholar',
    name: 'Scholar',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Played Aces give +20 Chips and +4 Mult when scored',
    effect: (ctx) =>
      ctx.currentCard?.rank === 'A' ? { addChips: 20, addMult: 4 } : {},
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_business_card',
    name: 'Business Card',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Played face cards have a 1 in 2 chance to give $1 when scored',
    effect: (ctx) => {
      if (
        ['J', 'Q', 'K'].includes(ctx.currentCard?.rank ?? '') &&
        Math.random() < 0.5
      ) {
        return { addMoney: 1 };
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_supernova',
    name: 'Supernova',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Adds the number of times poker hand has been played this run to Mult',
    effect: (ctx) => ({
      addMult: ctx.runState.handPlayCounts[ctx.handType] ?? 0,
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_ride_the_bus',
    name: 'Ride the Bus',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: '+1 Mult for each consecutive hand played without a scoring face card. Reset when a face card scores',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.streak ?? 0 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_space_joker',
    name: 'Space Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '1 in 4 chance to upgrade the level of played poker hand',
    effect: (ctx) => {
      if (Math.random() < 0.25) {
        ctx.runState.handLevels[ctx.handType] =
          (ctx.runState.handLevels[ctx.handType] ?? 1) + 1;
      }
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_egg',
    name: 'Egg',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 1,
    description: 'Gains $3 of sell value at end of each round',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_egg');
      if (j) j.sellValue += 3;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_burglar',
    name: 'Burglar',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'When Blind is selected, gain +3 Hands and lose all discards',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_blackboard',
    name: 'Blackboard',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: '×3 Mult if all cards held in hand are Spades or Clubs at end of round',
    effect: (ctx) => {
      const held = ctx.runState.hand.filter(
        (c) => !ctx.scoringCtx.playedCards.find((p) => p.id === c.id),
      );
      if (
        held.length > 0 &&
        held.every((c) => c.suit === 'Spades' || c.suit === 'Clubs')
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
    id: 'j_runner',
    name: 'Runner',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+15 Chips for each consecutive Straight',
    effect: (ctx) => {
      if (
        ctx.handType === 'Straight' ||
        ctx.handType === 'Straight Flush'
      ) {
        ctx.joker.runtimeCounters.chips =
          (ctx.joker.runtimeCounters.chips ?? 0) + 15;
      }
      return { addChips: ctx.joker.runtimeCounters.chips ?? 0 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_ice_cream',
    name: 'Ice Cream',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+100 Chips. -5 Chips for each hand played',
    effect: (ctx) => ({ addChips: ctx.joker.runtimeCounters.chips ?? 100 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_dna',
    name: 'DNA',
    rarity: 'Common',
    baseCost: 8,
    sellValue: 4,
    description: 'If first hand of round, add a permanent copy of the first played card to deck',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_splash',
    name: 'Splash',
    rarity: 'Common',
    baseCost: 3,
    sellValue: 2,
    description: 'Every played card counts in scoring',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_blue_joker',
    name: 'Blue Joker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+2 Chips for each remaining card in deck',
    effect: (ctx) => ({ addChips: 2 * ctx.runState.deck.length }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_sixth_sense',
    name: 'Sixth Sense',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'If first hand of round is a single 6, destroy it and create a Spectral card',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_constellation',
    name: 'Constellation',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains +0.1 Mult every time a Planet card is used',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hiker',
    name: 'Hiker',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Each played card permanently gains +5 Chips when scored',
    effect: (ctx) => {
      if (ctx.currentCard) ctx.currentCard.baseChips += 5;
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_green_joker',
    name: 'Green Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '+1 Mult per hand played, -1 Mult per discard',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.mult ?? 0 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_red_card',
    name: 'Red Card',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'When any Booster Pack is skipped, this card gains +3 Mult',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.mult ?? 0 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_madness',
    name: 'Madness',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'When Small or Big Blind is selected, gains +1 Mult and 1 random Joker is destroyed',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_square',
    name: 'Square Joker',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'This Joker gains +1 Chips if played hand has exactly 4 cards',
    effect: (ctx) => {
      if (ctx.scoringCtx.playedCards.length === 4) {
        ctx.joker.runtimeCounters.chips =
          (ctx.joker.runtimeCounters.chips ?? 0) + 1;
      }
      return { addChips: ctx.joker.runtimeCounters.chips ?? 0 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_seance',
    name: 'Seance',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'If played poker hand is a Straight Flush, create a random Spectral card',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_riff_raff',
    name: 'Riff-raff',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'When Blind is selected, create 2 random Common Jokers',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_vampire',
    name: 'Vampire',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: 'This Joker gains +0.1 Mult per scoring Enhanced card played. Removes card enhancement',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_shortcut',
    name: 'Shortcut',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: 'Allows Straights to be made with gaps of 1 rank (ex: 2, 4, 6, 8, 10)',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hologram',
    name: 'Hologram',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: 'This Joker gains +0.25 Mult every time a playing card is added to your deck',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.count ?? 0) * 0.25,
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_vagabond',
    name: 'Vagabond',
    rarity: 'Common',
    baseCost: 8,
    sellValue: 4,
    description: 'Create a Tarot card if hand is played with $4 or less',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_baron',
    name: 'Baron',
    rarity: 'Common',
    baseCost: 8,
    sellValue: 4,
    description: 'Each King held in hand gives ×1.5 Mult',
    effect: (ctx) => {
      const kings = ctx.runState.hand.filter(
        (c) =>
          c.rank === 'K' &&
          !ctx.scoringCtx.playedCards.find((p) => p.id === c.id),
      );
      if (kings.length === 0) return {};
      return { mulMult: Math.pow(1.5, kings.length) };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_cloud_9',
    name: 'Cloud 9',
    rarity: 'Common',
    baseCost: 7,
    sellValue: 4,
    description: 'Earn $1 for each 9 in your full deck at end of round',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const nines = [
        ...rs.deck,
        ...rs.hand,
        ...rs.discardPile,
      ].filter((c) => c.rank === '9').length;
      rs.money += nines;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_rocket',
    name: 'Rocket',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Earn $1 at end of round. Payout increases by $2 when Boss Blind is defeated',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_rocket');
      if (j) rs.money += j.runtimeCounters.payout ?? 1;
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_oops_all_6s',
    name: 'Oops! All 6s',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Doubles all listed probabilities (ex: 1 in 3 -> 1 in 1.5)',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_photograph',
    name: 'Photograph',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'First played face card each round gives ×2 Mult when scored',
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
    id: 'j_gift_card',
    name: 'Gift Card',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Add $1 to every Joker and Consumable in shop at end of round',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_turtle_bean',
    name: 'Turtle Bean',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: '+5 hand size, reduces by 1 each round',
    effect: () => ({}),
    onBuy: (rs: RunState) => { rs.handSize += 5; },
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_turtle_bean');
      if (j) {
        rs.handSize -= 1;
        j.runtimeCounters.rounds = (j.runtimeCounters.rounds ?? 0) + 1;
        if (j.runtimeCounters.rounds >= 5) {
          const idx = rs.jokers.indexOf(j);
          rs.jokers.splice(idx, 1);
          rs.handSize = Math.max(1, rs.handSize);
        }
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_erosion',
    name: 'Erosion',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: '+4 Mult for each card below starting deck size (52)',
    effect: (ctx) => {
      const total = [
        ...ctx.runState.deck,
        ...ctx.runState.hand,
        ...ctx.runState.discardPile,
      ].length;
      return { addMult: Math.max(0, 4 * (52 - total)) };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_reserved_parking',
    name: 'Reserved Parking',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Each face card held in hand has a 1 in 2 chance to give $1',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      const faces = rs.hand.filter((c) =>
        ['J', 'Q', 'K'].includes(c.rank ?? ''),
      );
      faces.forEach(() => {
        if (Math.random() < 0.5) rs.money += 1;
      });
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_mail_in_rebate',
    name: 'Mail-in Rebate',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: 'Earn $3 for each discarded card matching the current bonus rank. Bonus rank changes each round',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_to_the_moon',
    name: 'To the Moon',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'Earn an extra $1 of interest for every $5 you have at end of round',
    effect: () => ({}),
    onRoundEnd: (rs: RunState) => {
      if (rs.money > 0) {
        rs.money += Math.floor(rs.money / 5);
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_hallucination',
    name: 'Hallucination',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '1 in 2 chance to create a Tarot card when any Booster Pack is opened',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_lucky_cat',
    name: 'Lucky Cat',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains +0.25 Mult each time a Lucky card is triggered',
    effect: (ctx) => ({
      mulMult: 1 + (ctx.joker.runtimeCounters.mult ?? 0),
    }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_baseball_card',
    name: 'Baseball Card',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Uncommon Jokers each give ×1.5 Mult',
    effect: (ctx) => {
      const uncommons = ctx.runState.jokers.filter(
        (j) => j.rarity === 'Uncommon' && !j.isDisabled,
      ).length;
      return uncommons > 0 ? { mulMult: Math.pow(1.5, uncommons) } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_bull',
    name: 'Bull',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: '+2 Chips for each dollar you have',
    effect: (ctx) => ({ addChips: 2 * ctx.runState.money }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_diet_cola',
    name: 'Diet Cola',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'Sell this card: create a free Double Tag',
    effect: () => ({}),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_flash_card',
    name: 'Flash Card',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: 'This Joker gains +2 Mult per Reroll in the shop',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.mult ?? 0 }),
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  {
    id: 'j_popcorn',
    name: 'Popcorn',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 3,
    description: '+20 Mult. -4 Mult per round played',
    effect: (ctx) => ({ addMult: ctx.joker.runtimeCounters.mult ?? 20 }),
    onRoundEnd: (rs: RunState) => {
      const j = rs.jokers.find((j) => j.id === 'j_popcorn');
      if (j) {
        j.runtimeCounters.mult = Math.max(0, (j.runtimeCounters.mult ?? 20) - 4);
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
    id: 'j_trousers',
    name: 'Spare Trousers',
    rarity: 'Common',
    baseCost: 6,
    sellValue: 3,
    description: 'This Joker gains +2 Mult if played hand contains a Two Pair',
    effect: (ctx) => {
      if (['Two Pair', 'Full House', 'Flush House'].includes(ctx.handType)) {
        ctx.joker.runtimeCounters.mult =
          (ctx.joker.runtimeCounters.mult ?? 0) + 2;
      }
      return { addMult: ctx.joker.runtimeCounters.mult ?? 0 };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },
];
