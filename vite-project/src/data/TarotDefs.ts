import type { TarotDefinition, ConsumableUseContext } from '../types/Consumable.ts';

const RANK_ORDER: string[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];

export const TAROT_DEFS: TarotDefinition[] = [
  {
    id: 'tarot_fool',
    name: 'The Fool',
    arcanaNumber: 0,
    description: 'Creates the last Tarot or Planet card used during this run.',
    targetCount: 0,
    effect: (_ctx: ConsumableUseContext) => {
      // TODO: engine resolves the last used tarot/planet id from runState and adds it to consumables.
    },
  },
  {
    id: 'tarot_magician',
    name: 'The Magician',
    arcanaNumber: 1,
    description: 'Enhances 1 selected card to Lucky.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'lucky';
      }
    },
  },
  {
    id: 'tarot_high_priestess',
    name: 'The High Priestess',
    arcanaNumber: 2,
    description: 'Creates 2 random Planet cards and adds them to your consumable slots.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      // TODO: engine picks 2 random planet defIds and pushes ConsumableInstances into runState.consumables.
      void ctx;
    },
  },
  {
    id: 'tarot_empress',
    name: 'The Empress',
    arcanaNumber: 3,
    description: 'Enhances up to 2 selected cards to Mult.',
    targetCount: 2,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'mult';
      }
    },
  },
  {
    id: 'tarot_emperor',
    name: 'The Emperor',
    arcanaNumber: 4,
    description: 'Creates 2 random Tarot cards and adds them to your consumable slots.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      // TODO: engine picks 2 random tarot defIds and pushes ConsumableInstances into runState.consumables.
      void ctx;
    },
  },
  {
    id: 'tarot_hierophant',
    name: 'The Hierophant',
    arcanaNumber: 5,
    description: 'Enhances up to 2 selected cards to Bonus.',
    targetCount: 2,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'bonus';
      }
    },
  },
  {
    id: 'tarot_lovers',
    name: 'The Lovers',
    arcanaNumber: 6,
    description: 'Enhances 1 selected card to Wild.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'wild';
      }
    },
  },
  {
    id: 'tarot_chariot',
    name: 'The Chariot',
    arcanaNumber: 7,
    description: 'Enhances 1 selected card to Steel.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'steel';
      }
    },
  },
  {
    id: 'tarot_justice',
    name: 'Justice',
    arcanaNumber: 8,
    description: 'Enhances 1 selected card to Glass.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'glass';
      }
    },
  },
  {
    id: 'tarot_hermit',
    name: 'The Hermit',
    arcanaNumber: 9,
    description: 'Doubles your current money (max $20 gain).',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const gain = Math.min(ctx.runState.money, 20);
      ctx.runState.money += gain;
    },
  },
  {
    id: 'tarot_wheel_of_fortune',
    name: 'The Wheel of Fortune',
    arcanaNumber: 10,
    description: '1 in 4 chance to add a random Edition to a random Joker.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (Math.random() < 0.25 && ctx.runState.jokers.length > 0) {
        const editions: Array<'foil' | 'holographic' | 'polychrome'> = ['foil', 'holographic', 'polychrome'];
        const joker = ctx.runState.jokers[Math.floor(Math.random() * ctx.runState.jokers.length)];
        joker.edition = editions[Math.floor(Math.random() * editions.length)];
      }
    },
  },
  {
    id: 'tarot_strength',
    name: 'Strength',
    arcanaNumber: 11,
    description: 'Increases the rank of up to 2 selected cards by 1.',
    targetCount: 2,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        if (card.rank === null) continue;
        const idx = RANK_ORDER.indexOf(card.rank);
        if (idx !== -1 && idx < RANK_ORDER.length - 1) {
          card.rank = RANK_ORDER[idx + 1] as typeof card.rank;
        }
        // A stays as A (already at top of rank order).
      }
    },
  },
  {
    id: 'tarot_hanged_man',
    name: 'The Hanged Man',
    arcanaNumber: 12,
    description: 'Destroys up to 2 selected cards.',
    targetCount: 2,
    effect: (ctx: ConsumableUseContext) => {
      const idsToRemove = new Set(ctx.selectedCards.map((c) => c.id));
      ctx.runState.deck = ctx.runState.deck.filter((c) => !idsToRemove.has(c.id));
      ctx.runState.hand = ctx.runState.hand.filter((c) => !idsToRemove.has(c.id));
    },
  },
  {
    id: 'tarot_death',
    name: 'Death',
    arcanaNumber: 13,
    description: 'Converts the left selected card to match the right selected card (copies rank and suit).',
    targetCount: 2,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.selectedCards.length < 2) return;
      const [left, right] = ctx.selectedCards;
      left.rank = right.rank;
      left.suit = right.suit;
    },
  },
  {
    id: 'tarot_temperance',
    name: 'Temperance',
    arcanaNumber: 14,
    description: 'Gives money equal to the total sell value of all Jokers (max $50).',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const total = ctx.runState.jokers.reduce((sum, j) => sum + j.sellValue, 0);
      ctx.runState.money += Math.min(total, 50);
    },
  },
  {
    id: 'tarot_devil',
    name: 'The Devil',
    arcanaNumber: 15,
    description: 'Enhances 1 selected card to Gold.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'gold';
      }
    },
  },
  {
    id: 'tarot_tower',
    name: 'The Tower',
    arcanaNumber: 16,
    description: 'Enhances 1 selected card to Stone.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.enhancement = 'stone';
      }
    },
  },
  {
    id: 'tarot_star',
    name: 'The Star',
    arcanaNumber: 17,
    description: 'Converts up to 3 selected cards to Diamonds.',
    targetCount: 3,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.suit = 'Diamonds';
      }
    },
  },
  {
    id: 'tarot_moon',
    name: 'The Moon',
    arcanaNumber: 18,
    description: 'Converts up to 3 selected cards to Clubs.',
    targetCount: 3,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.suit = 'Clubs';
      }
    },
  },
  {
    id: 'tarot_sun',
    name: 'The Sun',
    arcanaNumber: 19,
    description: 'Converts up to 3 selected cards to Hearts.',
    targetCount: 3,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.suit = 'Hearts';
      }
    },
  },
  {
    id: 'tarot_judgement',
    name: 'Judgement',
    arcanaNumber: 20,
    description: 'Creates a random Joker card.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      // TODO: engine picks a random JokerDefinition, creates a JokerInstance, adds to runState.jokers.
      void ctx;
    },
  },
  {
    id: 'tarot_world',
    name: 'The World',
    arcanaNumber: 21,
    description: 'Converts up to 3 selected cards to Spades.',
    targetCount: 3,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.suit = 'Spades';
      }
    },
  },
];
