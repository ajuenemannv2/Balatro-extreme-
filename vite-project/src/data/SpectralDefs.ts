import type { SpectralDefinition, ConsumableUseContext } from '../types/Consumable.ts';
import type { Suit, Rank, Enhancement } from '../types/Card.ts';

const FACE_RANKS: Rank[] = ['J', 'Q', 'K'];
const NUMBERED_RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10'];
const ALL_SUITS: Suit[] = ['Spades', 'Hearts', 'Clubs', 'Diamonds'];
const ALL_RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const ENHANCEMENTS: Enhancement[] = ['bonus','mult','wild','glass','steel','stone','gold','lucky'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const SPECTRAL_DEFS: SpectralDefinition[] = [
  {
    id: 'spectral_familiar',
    name: 'Familiar',
    description: 'Destroys 1 random card in your hand and adds 3 random Enhanced Face cards to your deck.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.hand.length === 0) return;
      const idx = Math.floor(Math.random() * ctx.runState.hand.length);
      const [removed] = ctx.runState.hand.splice(idx, 1);
      ctx.runState.deck = ctx.runState.deck.filter((c) => c.id !== removed.id);
      for (let i = 0; i < 3; i++) {
        ctx.runState.deck.push({
          id: `familiar_face_${Date.now()}_${i}`,
          rank: randomItem(FACE_RANKS),
          suit: randomItem(ALL_SUITS),
          baseChips: 10,
          enhancement: randomItem(ENHANCEMENTS),
          edition: 'base',
          seal: 'none',
          isDebuffed: false,
          faceUp: true,
        });
      }
    },
  },
  {
    id: 'spectral_grim',
    name: 'Grim',
    description: 'Destroys 1 random card in your hand and adds 2 Enhanced Aces to your deck.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.hand.length === 0) return;
      const idx = Math.floor(Math.random() * ctx.runState.hand.length);
      const [removed] = ctx.runState.hand.splice(idx, 1);
      ctx.runState.deck = ctx.runState.deck.filter((c) => c.id !== removed.id);
      for (let i = 0; i < 2; i++) {
        ctx.runState.deck.push({
          id: `grim_ace_${Date.now()}_${i}`,
          rank: 'A',
          suit: randomItem(ALL_SUITS),
          baseChips: 11,
          enhancement: randomItem(ENHANCEMENTS),
          edition: 'base',
          seal: 'none',
          isDebuffed: false,
          faceUp: true,
        });
      }
    },
  },
  {
    id: 'spectral_incantation',
    name: 'Incantation',
    description: 'Destroys 1 random card in your hand and adds 4 random Enhanced numbered cards to your deck.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.hand.length === 0) return;
      const idx = Math.floor(Math.random() * ctx.runState.hand.length);
      const [removed] = ctx.runState.hand.splice(idx, 1);
      ctx.runState.deck = ctx.runState.deck.filter((c) => c.id !== removed.id);
      for (let i = 0; i < 4; i++) {
        const rank = randomItem(NUMBERED_RANKS);
        ctx.runState.deck.push({
          id: `incantation_num_${Date.now()}_${i}`,
          rank,
          suit: randomItem(ALL_SUITS),
          baseChips: parseInt(rank, 10),
          enhancement: randomItem(ENHANCEMENTS),
          edition: 'base',
          seal: 'none',
          isDebuffed: false,
          faceUp: true,
        });
      }
    },
  },
  {
    id: 'spectral_talisman',
    name: 'Talisman',
    description: 'Adds a Gold Seal to 1 selected card.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.seal = 'gold';
      }
    },
  },
  {
    id: 'spectral_aura',
    name: 'Aura',
    description: 'Adds a random Edition (Foil, Holographic, or Polychrome) to 1 selected card.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      const editions: Array<'foil' | 'holographic' | 'polychrome'> = ['foil', 'holographic', 'polychrome'];
      for (const card of ctx.selectedCards) {
        card.edition = randomItem(editions);
      }
    },
  },
  {
    id: 'spectral_wraith',
    name: 'Wraith',
    description: 'Creates a random Rare Joker and sets your money to $0.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      ctx.runState.money = 0;
      // TODO: engine picks a random Rare JokerDefinition, creates a JokerInstance, adds to runState.jokers.
    },
  },
  {
    id: 'spectral_sigil',
    name: 'Sigil',
    description: 'Converts all cards in your hand to a single random suit.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const suit = randomItem(ALL_SUITS);
      for (const card of ctx.runState.hand) {
        card.suit = suit;
      }
    },
  },
  {
    id: 'spectral_ouija',
    name: 'Ouija',
    description: 'Converts all cards in your hand to a single random rank. -1 Hand Size.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const rank = randomItem(ALL_RANKS);
      for (const card of ctx.runState.hand) {
        card.rank = rank;
      }
      ctx.runState.handSize -= 1;
    },
  },
  {
    id: 'spectral_ectoplasm',
    name: 'Ectoplasm',
    description: 'Adds Negative Edition to a random Joker. -1 Joker slot.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.jokers.length > 0) {
        const joker = randomItem(ctx.runState.jokers);
        joker.edition = 'negative';
      }
      ctx.runState.maxJokerSlots -= 1;
    },
  },
  {
    id: 'spectral_immolate',
    name: 'Immolate',
    description: 'Destroys 5 random cards in your hand and gains $20.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const count = Math.min(5, ctx.runState.hand.length);
      for (let i = 0; i < count; i++) {
        if (ctx.runState.hand.length === 0) break;
        const idx = Math.floor(Math.random() * ctx.runState.hand.length);
        const [removed] = ctx.runState.hand.splice(idx, 1);
        ctx.runState.deck = ctx.runState.deck.filter((c) => c.id !== removed.id);
      }
      ctx.runState.money += 20;
    },
  },
  {
    id: 'spectral_ankh',
    name: 'Ankh',
    description: 'Creates a copy of a random Joker and destroys all other Jokers.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.jokers.length === 0) return;
      const chosen = randomItem(ctx.runState.jokers);
      const copy = {
        ...chosen,
        instanceId: `ankh_copy_${Date.now()}`,
        runtimeCounters: { ...chosen.runtimeCounters },
      };
      ctx.runState.jokers = [copy];
    },
  },
  {
    id: 'spectral_deja_vu',
    name: 'Deja Vu',
    description: 'Adds a Red Seal to 1 selected card.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.seal = 'red';
      }
    },
  },
  {
    id: 'spectral_hex',
    name: 'Hex',
    description: 'Adds Polychrome Edition to a random Joker and destroys all other Jokers.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      if (ctx.runState.jokers.length === 0) return;
      const chosen = randomItem(ctx.runState.jokers);
      chosen.edition = 'polychrome';
      ctx.runState.jokers = [chosen];
    },
  },
  {
    id: 'spectral_trance',
    name: 'Trance',
    description: 'Adds a Blue Seal to 1 selected card.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.seal = 'blue';
      }
    },
  },
  {
    id: 'spectral_medium',
    name: 'Medium',
    description: 'Adds a Purple Seal to 1 selected card.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        card.seal = 'purple';
      }
    },
  },
  {
    id: 'spectral_cryptid',
    name: 'Cryptid',
    description: 'Creates 2 copies of 1 selected card and adds them to your deck.',
    targetCount: 1,
    effect: (ctx: ConsumableUseContext) => {
      for (const card of ctx.selectedCards) {
        for (let i = 0; i < 2; i++) {
          ctx.runState.deck.push({
            ...card,
            id: `cryptid_copy_${Date.now()}_${i}`,
          });
        }
      }
    },
  },
  {
    id: 'spectral_the_soul',
    name: 'The Soul',
    description: 'Creates a random Legendary Joker.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      // TODO: engine picks a random Legendary JokerDefinition, creates a JokerInstance, adds to runState.jokers.
      void ctx;
    },
  },
  {
    id: 'spectral_black_hole',
    name: 'Black Hole',
    description: 'Upgrades every poker hand by 1 level.',
    targetCount: 0,
    effect: (ctx: ConsumableUseContext) => {
      const handTypes = Object.keys(ctx.runState.handLevels) as Array<keyof typeof ctx.runState.handLevels>;
      for (const ht of handTypes) {
        ctx.runState.handLevels[ht] = (ctx.runState.handLevels[ht] ?? 1) + 1;
      }
    },
  },
];
