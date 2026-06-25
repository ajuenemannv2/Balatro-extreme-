import type { JokerDefinition } from '../../types/Joker.ts';
import { TAROT_DEFS } from '../TarotDefs.ts';
import { PLANET_DEFS } from '../PlanetDefs.ts';
import { addJokerToRun } from '../../engine/RunManager.ts';

const SLOT_JACKPOT_POOL = [
  'j_joker', 'j_jolly', 'j_zany', 'j_mad', 'j_crazy', 'j_droll',
  'j_abstract', 'j_half', 'j_banner', 'j_supernova',
];
const SLOT_ENHANCEMENTS = ['mult', 'glass', 'lucky', 'gold', 'crystal', 'bronze'] as const;

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

  // ─── 11. COMBO BREAKER ───────────────────────────────────────────────────
  {
    id: 'xj_combo',
    name: 'Combo Breaker',
    rarity: 'Uncommon',
    baseCost: 8,
    sellValue: 4,
    description: '+5 Mult per consecutive hand without repeating a hand type. Resets on repeat.',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      return { addMult: (ctx.joker.runtimeCounters.streak ?? 0) * 5 };
    },
    onRoundEnd: (rs) => { const j = rs.jokers.find(j => j.id === 'xj_combo'); if (j) j.runtimeCounters.streak = 0; },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 12. ENTROPY ─────────────────────────────────────────────────────────
  {
    id: 'xj_entropy',
    name: 'Entropy',
    rarity: 'Uncommon',
    baseCost: 7,
    sellValue: 4,
    description: 'After scoring: if Chips > Mult, +2 Mult; if Mult > Chips, +15 Chips. Auto-balances.',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      const chips = ctx.scoringCtx.chips;
      const mult = ctx.scoringCtx.mult;
      if (chips > mult) return { addMult: 2 };
      if (mult > chips) return { addChips: 15 };
      return {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 13. THE GAMBLER ─────────────────────────────────────────────────────
  {
    id: 'xj_gambler',
    name: 'The Gambler',
    rarity: 'Common',
    baseCost: 4,
    sellValue: 2,
    description: '50% chance: +15 Mult this hand. 50% chance: -5 Mult (min 1).',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      if (Math.random() < 0.5) return { addMult: 15 };
      return { addMult: Math.max(1 - (ctx.scoringCtx.mult), -5) };
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 14. THE HOARDER ─────────────────────────────────────────────────────
  {
    id: 'xj_hoarder',
    name: 'The Hoarder',
    rarity: 'Rare',
    baseCost: 9,
    sellValue: 5,
    description: 'On buy: +$1 sell value to all other Jokers. +2 Mult.',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      return { addMult: 2 };
    },
    onBuy: (rs) => {
      for (const j of rs.jokers) {
        if (j.id !== 'xj_hoarder') j.sellValue += 1;
      }
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 15. MIRROR IMAGE ────────────────────────────────────────────────────
  {
    id: 'xj_mirror',
    name: 'Mirror Image',
    rarity: 'Rare',
    baseCost: 10,
    sellValue: 5,
    description: 'The rightmost other Joker\'s independent effect fires a second time.',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      const others = ctx.runState.jokers.filter(j => j.instanceId !== ctx.joker.instanceId && !j.isDisabled && !j.perCard);
      if (others.length === 0) return {};
      const rightmost = others[others.length - 1];
      const mirrorCtx = { ...ctx, joker: rightmost };
      return rightmost.effect(mirrorCtx);
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 16. CATALYST ────────────────────────────────────────────────────────
  {
    id: 'xj_catalyst',
    name: 'Catalyst',
    rarity: 'Legendary',
    baseCost: 18,
    sellValue: 9,
    description: 'Crystal-enhanced cards score their play-count bonus twice.',
    effect: (ctx) => {
      if (ctx.triggerType !== 'independent') return {};
      // Find crystal cards that scored and add their bonus again
      const crystalBonus = ctx.scoringCtx.scoredCards
        .filter(c => c.enhancement === 'crystal' && !c.isDebuffed)
        .reduce((sum, c) => sum + ((c.timesPlayed ?? 1) - 1), 0);
      return crystalBonus > 0 ? { addMult: crystalBonus } : {};
    },
    isEternal: false,
    isPerishable: false,
    isRentable: false,
  },

  // ─── 17. ONE-ARMED BANDIT ────────────────────────────────────────────────────
  {
    id: 'xj_slot_machine',
    name: 'One-Armed Bandit',
    rarity: 'Ultra Rare',
    baseCost: 20,
    sellValue: 10,
    description: 'After each hand: pull the slot ($1, ↑$1/pull, resets each blind). Wins only apply to your NEXT hand. Pure gamble!',
    isEternal: false,
    isPerishable: false,
    isRentable: false,
    effect: () => ({}),
    miniGameId: 'slot_machine',
    miniGameTrigger: 'on_hand_played',
    miniGameChance: 1.0,
    miniGameWinDesc: 'Prize (next hand)!',
    miniGameLoseDesc: 'Nothing...',
    onBlindStart: (rs) => {
      const j = rs.jokers.find(jj => jj.id === 'xj_slot_machine');
      if (j) j.runtimeCounters.pullCost = 1;
    },
    onSlotResult: (rs, outcomeIndex) => {
      const j = rs.jokers.find(jj => jj.id === 'xj_slot_machine');
      const cost = j ? (j.runtimeCounters.pullCost ?? 1) : 1;
      rs.money = Math.max(0, rs.money - cost);
      if (j) j.runtimeCounters.pullCost = cost + 1;

      switch (outcomeIndex) {
        case 0:
          return {};

        case 1:
          rs.nextHandBonus = { chips: 500 };
          return {};

        case 2:
          rs.nextHandBonus = { scoreMultiplier: 3 };
          return {};

        case 3:
          rs.money += 8;
          return {};

        case 4:
          return {
            deferredFn: (runState) => {
              if (runState.consumables.length < runState.maxConsumableSlots && TAROT_DEFS.length > 0) {
                const def = TAROT_DEFS[Math.floor(Math.random() * TAROT_DEFS.length)];
                runState.consumables.push({
                  instanceId: `tarot_slot_${Date.now()}_${Math.random()}`,
                  type: 'tarot',
                  defId: def.id,
                });
              }
            },
          };

        case 5:
          return {
            deferredFn: (runState) => {
              if (runState.consumables.length < runState.maxConsumableSlots && PLANET_DEFS.length > 0) {
                const def = PLANET_DEFS[Math.floor(Math.random() * PLANET_DEFS.length)];
                runState.consumables.push({
                  instanceId: `planet_slot_${Date.now()}_${Math.random()}`,
                  type: 'planet',
                  defId: def.id,
                });
              }
            },
          };

        case 6:
          return {
            deferredFn: (runState) => {
              const played = (Object.keys(runState.handPlayCounts) as Array<keyof typeof runState.handPlayCounts>)
                .filter(ht => (runState.handPlayCounts[ht] ?? 0) > 0);
              const targets = played.length > 0
                ? played
                : Object.keys(runState.handLevels) as Array<keyof typeof runState.handLevels>;
              if (targets.length > 0) {
                const ht = targets[Math.floor(Math.random() * targets.length)];
                runState.handLevels[ht] = (runState.handLevels[ht] ?? 1) + 1;
              }
            },
          };

        case 7:
          return {
            deferredFn: (runState) => {
              const eligible = runState.hand.filter(c => c.enhancement === 'none');
              if (eligible.length > 0) {
                const card = eligible[Math.floor(Math.random() * eligible.length)];
                card.enhancement = SLOT_ENHANCEMENTS[Math.floor(Math.random() * SLOT_ENHANCEMENTS.length)];
              }
            },
          };

        case 8:
          return {
            deferredFn: (runState) => {
              const pool = SLOT_JACKPOT_POOL.filter(id => !runState.jokers.some(j => j.id === id));
              if (pool.length > 0) {
                const id = pool[Math.floor(Math.random() * pool.length)];
                addJokerToRun(runState, id);
              }
            },
          };

        default:
          return {};
      }
    },
  },
];
