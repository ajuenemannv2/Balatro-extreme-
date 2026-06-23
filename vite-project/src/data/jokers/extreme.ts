import type { JokerDefinition } from '../../types/Joker.ts';

export const EXTREME_JOKER_DEFS: JokerDefinition[] = [
  // ─── 1. FORTUNE'S COIN ───────────────────────────────────────────────────
  {
    id: 'xj_fortunes_coin',
    name: "Fortune's Coin",
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 3,
    description: 'After each hand: flip a coin. WIN: +$5. LOSE: -$2.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'coin_flip',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: '+$5',
    miniGameLoseDesc: '-$2',
    onMiniGameWin: (rs) => {
      rs.money += 5;
      return { addMoney: 5 };
    },
    onMiniGameLose: (rs) => {
      rs.money = Math.max(0, rs.money - 2);
      return {};
    },
  },

  // ─── 2. SHELL MAESTRO ────────────────────────────────────────────────────
  {
    id: 'xj_shell_maestro',
    name: 'Shell Maestro',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'After first hand each round: shell game. WIN: ×2 Mult. LOSE: ×0.5 Mult.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'shell_game',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameMaxPerRound: 1,
    miniGameWinDesc: '×2 Mult this hand',
    miniGameLoseDesc: '×0.5 Mult this hand',
    onMiniGameWin: (_rs, lastScore) => ({ scaleLastScore: lastScore * 2 }),
    onMiniGameLose: (_rs, lastScore) => ({ scaleLastScore: Math.floor(lastScore * 0.5) }),
  },

  // ─── 3. HIGH ROLLER ──────────────────────────────────────────────────────
  {
    id: 'xj_high_roller',
    name: 'High Roller',
    rarity: 'Rare',
    baseCost: 10,
    sellValue: 5,
    description: 'After each hand: guess Higher or Lower. WIN: +50 Chips. LOSE: +1 Mult.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'higher_lower',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: '+50 Chips scored',
    miniGameLoseDesc: '+1 Mult (consolation)',
    onMiniGameWin: (rs) => {
      rs.chipsScored += 50;
      return { addChipsScored: 50 };
    },
    onMiniGameLose: () => ({ addMult: 1 }),
  },

  // ─── 4. DOUBLE OR NOTHING ────────────────────────────────────────────────
  {
    id: 'xj_double_or_nothing',
    name: 'Double or Nothing',
    rarity: 'Rare',
    baseCost: 12,
    sellValue: 6,
    description: 'After each hand: coin flip. WIN: double last score. LOSE: score resets to 0!',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'coin_flip',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: 'Double last score',
    miniGameLoseDesc: 'Reset chips to 0!',
    onMiniGameWin: (_rs, lastScore) => ({ scaleLastScore: lastScore }),
    onMiniGameLose: (rs) => {
      rs.chipsScored = 0;
      return { resetScore: true };
    },
  },

  // ─── 5. DICE DAREDEVIL ───────────────────────────────────────────────────
  {
    id: 'xj_dice_daredevil',
    name: 'Dice Daredevil',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: 'After each hand: roll a die (4-6 = win). WIN: +1 free hand. LOSE: -1 hand.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'dice_roll',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: '+1 free hand this round',
    miniGameLoseDesc: '-1 hand remaining',
    onMiniGameWin: (rs) => {
      rs.handsRemaining += 1;
      return { addHandsRemaining: 1 };
    },
    onMiniGameLose: (rs) => {
      rs.handsRemaining = Math.max(0, rs.handsRemaining - 1);
      return { addHandsRemaining: -1 };
    },
  },

  // ─── 6. CHAOS JESTER ─────────────────────────────────────────────────────
  {
    id: 'xj_chaos_jester',
    name: 'Chaos Jester',
    rarity: 'Rare',
    baseCost: 11,
    sellValue: 5,
    description: 'After each hand: spin the wheel. WIN: +3 Mult. LOSE: discard a random card.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'wheel',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: '+3 Mult',
    miniGameLoseDesc: 'Discard random card',
    onMiniGameWin: () => ({ addMult: 3 }),
    onMiniGameLose: (rs) => {
      if (rs.hand.length > 0) {
        const idx = Math.floor(Math.random() * rs.hand.length);
        const card = rs.hand.splice(idx, 1)[0];
        rs.discardPile.push(card);
      }
      return { discardRandomCard: true };
    },
  },

  // ─── 7. STREAK HUNTER ────────────────────────────────────────────────────
  {
    id: 'xj_streak_hunter',
    name: 'Streak Hunter',
    rarity: 'Uncommon',
    baseCost: 9,
    sellValue: 4,
    description: 'Every 3rd hand: shell game. WIN: +15 Mult for round. LOSE: -1 Discard.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'shell_game',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 0.34,
    miniGameMaxPerRound: 1,
    miniGameWinDesc: '+15 Mult',
    miniGameLoseDesc: '-1 Discard remaining',
    onMiniGameWin: () => ({ addMult: 15 }),
    onMiniGameLose: (rs) => {
      rs.discardsRemaining = Math.max(0, rs.discardsRemaining - 1);
      return { addDiscardsRemaining: -1 };
    },
  },

  // ─── 8. WHEEL OF FATE ────────────────────────────────────────────────────
  {
    id: 'xj_wheel_of_fate',
    name: 'Wheel of Fate',
    rarity: 'Legendary',
    baseCost: 20,
    sellValue: 9,
    description: 'At the start of each blind: spin the wheel. WIN: +$10. LOSE: +$2 but -1 hand.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'wheel',
    miniGameTrigger: 'on_blind_start',
    miniGameChance: 1.0,
    miniGameWinDesc: '+$10',
    miniGameLoseDesc: '+$2 but -1 hand',
    onMiniGameWin: (rs) => {
      rs.money += 10;
      return { addMoney: 10 };
    },
    onMiniGameLose: (rs) => {
      rs.money += 2;
      rs.handsRemaining = Math.max(1, rs.handsRemaining - 1);
      return { addMoney: 2, addHandsRemaining: -1 };
    },
  },

  // ─── 9. LAST STAND ───────────────────────────────────────────────────────
  {
    id: 'xj_last_stand',
    name: 'Last Stand',
    rarity: 'Rare',
    baseCost: 12,
    sellValue: 6,
    description: 'When you have 1 hand left: dice roll. WIN: +2 hands. LOSE: nothing (whew).',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'dice_roll',
    miniGameTrigger: 'on_score_milestone',
    miniGameChance: 1.0,
    miniGameMaxPerRound: 1,
    miniGameWinDesc: '+2 hands remaining',
    miniGameLoseDesc: 'Nothing (already lost enough!)',
    onMiniGameWin: (rs) => {
      rs.handsRemaining += 2;
      return { addHandsRemaining: 2 };
    },
    onMiniGameLose: () => ({}),
  },

  // ─── 10. LUCKY HORSESHOE ─────────────────────────────────────────────────
  {
    id: 'xj_lucky_horseshoe',
    name: 'Lucky Horseshoe',
    rarity: 'Common',
    baseCost: 5,
    sellValue: 2,
    description: '50% chance after each hand: Higher/Lower. WIN: +25 Chips. LOSE: lose $1.',
    isEternal: false, isPerishable: false, isRentable: false,
    effect: () => ({}),
    miniGameId: 'higher_lower',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 0.5,
    miniGameWinDesc: '+25 Chips scored',
    miniGameLoseDesc: 'Lose $1',
    onMiniGameWin: (rs) => {
      rs.chipsScored += 25;
      return { addChipsScored: 25 };
    },
    onMiniGameLose: (rs) => {
      rs.money = Math.max(0, rs.money - 1);
      return {};
    },
  },
];
