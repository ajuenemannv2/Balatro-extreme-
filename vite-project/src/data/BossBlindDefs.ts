import type { BlindConfig } from '../types/Blind.ts';

export const BOSS_BLIND_DEFS: BlindConfig[] = [
  {
    id: 'boss_hook',
    name: 'The Hook',
    description: 'Discards 2 random cards from your hand after each hand played.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (_runState, played) => {
      // Engine responsibility: discard 2 random cards from the current hand.
      // played is provided for reference; actual mutation is handled by the game engine.
      void played;
    },
  },
  {
    id: 'boss_ox',
    name: 'The Ox',
    description: 'Playing the most played poker hand sets your money to $0.',
    isBoss: true,
    chipMultiplier: 1,
    activateEffect: (_runState) => {
      // Engine tracks mostPlayedHand via runState.mostPlayedHand.
    },
    onHandPlayed: (runState, _played) => {
      // If the hand played matches mostPlayedHand, set money to 0.
      // The engine compares the played hand type to runState.mostPlayedHand.
      // Actual hand-type comparison is done by the engine; signal via a deferred effect.
      runState.pendingDeferredEffects.push((rs) => {
        // TODO: compare last played hand type to rs.mostPlayedHand and set rs.money = 0
        void rs;
      });
    },
  },
  {
    id: 'boss_wall',
    name: 'The Wall',
    description: 'Extra large blind.',
    isBoss: true,
    chipMultiplier: 4,
  },
  {
    id: 'boss_wheel',
    name: 'The Wheel',
    description: '1 in 7 cards are drawn face down.',
    isBoss: true,
    chipMultiplier: 2,
    onCardDrawn: (_runState, card) => {
      if (Math.random() < 1 / 7) {
        return { ...card, faceUp: false };
      }
      return card;
    },
  },
  {
    id: 'boss_arm',
    name: 'The Arm',
    description: 'Decrease level of played poker hand after each hand.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (runState, _played) => {
      runState.pendingDeferredEffects.push((rs) => {
        // TODO: decrease level of the last played hand type in rs.handLevels
        void rs;
      });
    },
  },
  {
    id: 'boss_club',
    name: 'The Club',
    description: 'All Club cards are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Clubs') card.isDebuffed = true;
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Clubs') card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_fish',
    name: 'The Fish',
    description: 'All cards are drawn face down after each hand played.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (runState, _played) => {
      for (const card of runState.hand) {
        card.faceUp = false;
      }
    },
  },
  {
    id: 'boss_psychic',
    name: 'The Psychic',
    description: 'Must play exactly 5 cards.',
    isBoss: true,
    chipMultiplier: 2,
    // Enforcement is handled by the game engine using this id.
  },
  {
    id: 'boss_goad',
    name: 'The Goad',
    description: 'All Spade cards are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Spades') card.isDebuffed = true;
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Spades') card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_water',
    name: 'The Water',
    description: 'Start with 0 discards.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      runState.discardsRemaining = 0;
    },
    deactivateEffect: (_runState) => {
      // Discards are restored by the engine at round end.
    },
  },
  {
    id: 'boss_window',
    name: 'The Window',
    description: 'All Diamond cards are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Diamonds') card.isDebuffed = true;
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Diamonds') card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_manacle',
    name: 'The Manacle',
    description: 'Hand size is reduced by 1.',
    isBoss: true,
    chipMultiplier: 1.5,
    activateEffect: (runState) => {
      runState.handSize -= 1;
    },
    deactivateEffect: (runState) => {
      runState.handSize += 1;
    },
  },
  {
    id: 'boss_eye',
    name: 'The Eye',
    description: 'No repeat hand types this round.',
    isBoss: true,
    chipMultiplier: 2,
    // Enforcement handled by game engine checking runState.handPlayCounts for this blind.
  },
  {
    id: 'boss_mouth',
    name: 'The Mouth',
    description: 'Only 1 hand type may be played per round.',
    isBoss: true,
    chipMultiplier: 2,
    // Enforcement handled by game engine once first hand is played this round.
  },
  {
    id: 'boss_plant',
    name: 'The Plant',
    description: 'All face cards (J, Q, K) are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
          card.isDebuffed = true;
        }
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
          card.isDebuffed = false;
        }
      }
    },
  },
  {
    id: 'boss_serpent',
    name: 'The Serpent',
    description: 'After playing a hand, always draw to full hand size.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (runState, _played) => {
      // Engine should draw cards until hand.length === handSize after this effect fires.
      // Signal via a deferred effect.
      runState.pendingDeferredEffects.push((rs) => {
        // TODO: engine draws cards until rs.hand.length === rs.handSize
        void rs;
      });
    },
  },
  {
    id: 'boss_pillar',
    name: 'The Pillar',
    description: 'Cards played before this round are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.playedThisRound) {
        card.isDebuffed = true;
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.playedThisRound) {
        card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_needle',
    name: 'The Needle',
    description: 'Only 1 hand can be played this round.',
    isBoss: true,
    chipMultiplier: 1,
    activateEffect: (runState) => {
      runState.handsRemaining = 1;
    },
  },
  {
    id: 'boss_head',
    name: 'The Head',
    description: 'All Heart cards are debuffed.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Hearts') card.isDebuffed = true;
      }
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        if (card.suit === 'Hearts') card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_tooth',
    name: 'The Tooth',
    description: 'Lose $1 per card played.',
    isBoss: true,
    chipMultiplier: 1.5,
    onHandPlayed: (runState, played) => {
      runState.money -= played.length;
    },
  },
  {
    id: 'boss_flint',
    name: 'The Flint',
    description: 'Base Chips and Mult are halved.',
    isBoss: true,
    chipMultiplier: 2,
    // The engine halves base chips and mult for hand scoring when this blind is active.
  },
  {
    id: 'boss_mark',
    name: 'The Mark',
    description: 'All face cards are drawn face down.',
    isBoss: true,
    chipMultiplier: 2,
    onCardDrawn: (_runState, card) => {
      if (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K') {
        return { ...card, faceUp: false };
      }
      return card;
    },
  },
  {
    id: 'boss_amber_acorn',
    name: 'Amber Acorn',
    description: 'Flips and shuffles all Joker cards after each hand played.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (runState, _played) => {
      // Flip all jokers (toggle isDisabled) and shuffle their order.
      for (const joker of runState.jokers) {
        joker.isDisabled = !joker.isDisabled;
      }
      // Shuffle jokers in-place (Fisher-Yates).
      for (let i = runState.jokers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [runState.jokers[i], runState.jokers[j]] = [runState.jokers[j], runState.jokers[i]];
      }
    },
  },
  {
    id: 'boss_verdant_leaf',
    name: 'Verdant Leaf',
    description: 'All cards debuffed until a Joker is sold.',
    isBoss: true,
    chipMultiplier: 2,
    activateEffect: (runState) => {
      for (const card of runState.deck) {
        card.isDebuffed = true;
      }
      // The engine must un-debuff all cards when a joker is sold while this blind is active.
    },
    deactivateEffect: (runState) => {
      for (const card of runState.deck) {
        card.isDebuffed = false;
      }
    },
  },
  {
    id: 'boss_violet_vessel',
    name: 'Violet Vessel',
    description: 'Very large blind.',
    isBoss: true,
    chipMultiplier: 6,
  },
  {
    id: 'boss_crimson_heart',
    name: 'Crimson Heart',
    description: 'A random Joker is disabled each hand.',
    isBoss: true,
    chipMultiplier: 2,
    onHandPlayed: (runState, _played) => {
      const activeJokers = runState.jokers.filter((j) => !j.isDisabled);
      if (activeJokers.length > 0) {
        const target = activeJokers[Math.floor(Math.random() * activeJokers.length)];
        target.isDisabled = true;
        runState.pendingDeferredEffects.push((rs) => {
          // Re-enable after scoring this hand.
          const found = rs.jokers.find((j) => j.instanceId === target.instanceId);
          if (found) found.isDisabled = false;
        });
      }
    },
  },
  {
    id: 'boss_cerulean_bell',
    name: 'Cerulean Bell',
    description: 'Forces 1 random card to always be selected.',
    isBoss: true,
    chipMultiplier: 2,
    // Enforcement handled by game engine: one random card in hand is always included in selection.
  },
];
