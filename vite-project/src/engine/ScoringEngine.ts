import type { PlayingCard } from '../types/Card.ts';
import type { AnimationHint, ScoringContext, ScoringResult } from '../types/Score.ts';
import type { RunState } from '../types/Run.ts';
import { evaluateHand } from './HandEvaluator.ts';
import { HAND_DEFS } from '../data/HandDefs.ts';
import { RNG } from './RNG.ts';

function emitStep(ctx: ScoringContext, source: string, opts: {
  addChips?: number; addMult?: number; mulMult?: number;
  hints?: AnimationHint[];
}): void {
  if (opts.addChips) ctx.chips += opts.addChips;
  if (opts.addMult) ctx.mult += opts.addMult;
  if (opts.mulMult) ctx.mult *= opts.mulMult;
  ctx.steps.push({
    source,
    addChips: opts.addChips,
    addMult: opts.addMult,
    mulMult: opts.mulMult,
    chipsAfter: ctx.chips,
    multAfter: ctx.mult,
    hints: opts.hints ?? [],
  });
}

export function scoreHand(
  played: PlayingCard[],
  runState: RunState,
  rng: RNG,
): ScoringResult {
  const { handType, scoredCards } = evaluateHand(played, runState);
  const level = runState.handLevels[handType] ?? 1;
  const defs = HAND_DEFS[handType];

  const isBossFlint = runState.activeBlindId === 'boss_flint';

  const ctx: ScoringContext = {
    playedCards: played,
    scoredCards,
    handType,
    handLevel: level,
    chips: 0,
    mult: 0,
    steps: [],
  };

  // Base chips/mult from hand + level
  let baseChips = defs.baseChips + (level - 1) * defs.chipsPerLevel;
  let baseMult = defs.baseMult + (level - 1) * defs.multPerLevel;
  if (isBossFlint) { baseChips = Math.floor(baseChips / 2); baseMult = Math.floor(baseMult / 2); }
  emitStep(ctx, `base_hand:${handType}`, { addChips: baseChips, addMult: baseMult });

  const deferredMoney: number[] = [];
  const destroyedCardIds: string[] = [];
  const createdConsumables: string[] = [];

  // Score each card
  function scoreCard(card: PlayingCard, isRetrigger = false): void {
    if (card.isDebuffed) return;

    const source = isRetrigger ? `retrigger:${card.id}` : `card:${card.id}`;

    // Base chips from card — glow the card when it scores
    let cardChips = card.baseChips;
    if (card.enhancement === 'stone') cardChips = 50;
    emitStep(ctx, `${source}:chips`, {
      addChips: cardChips,
      hints: [{ type: 'card_glow', cardId: card.id }, { type: 'chip_add', delta: cardChips }],
    });

    // Enhancement chips
    if (card.enhancement === 'bonus') emitStep(ctx, `${source}:bonus`, {
      addChips: 30,
      hints: [{ type: 'chip_add', delta: 30 }],
    });

    // Enhancement mult
    if (card.enhancement === 'mult') emitStep(ctx, `${source}:mult`, {
      addMult: 4,
      hints: [{ type: 'mult_add', delta: 4 }],
    });

    // Glass: ×2 mult, 1/4 chance destroy
    if (card.enhancement === 'glass') {
      emitStep(ctx, `${source}:glass`, {
        mulMult: 2,
        hints: [{ type: 'mult_mul', factor: 2 }],
      });
      if (rng.nextBool(0.25)) destroyedCardIds.push(card.id);
    }

    // Lucky: 1/5 +20 mult, 1/15 +$20
    if (card.enhancement === 'lucky') {
      const luckyProb = runState.jokers.some(j => j.id === 'j_oops_all_6s' && !j.isDisabled) ? 2 : 1;
      if (rng.nextBool(luckyProb / 5)) emitStep(ctx, `${source}:lucky_mult`, {
        addMult: 20,
        hints: [{ type: 'mult_add', delta: 20 }],
      });
      if (rng.nextBool(luckyProb / 15)) {
        deferredMoney.push(20);
        emitStep(ctx, `${source}:lucky_money`, { hints: [{ type: 'money_add', delta: 20 }] });
      }
    }

    // Edition chips
    if (card.edition === 'foil') emitStep(ctx, `${source}:foil`, {
      addChips: 50,
      hints: [{ type: 'chip_add', delta: 50 }],
    });
    if (card.edition === 'holographic') emitStep(ctx, `${source}:holo`, {
      addMult: 10,
      hints: [{ type: 'mult_add', delta: 10 }],
    });
    if (card.edition === 'polychrome') emitStep(ctx, `${source}:poly`, {
      mulMult: 1.5,
      hints: [{ type: 'mult_mul', factor: 1.5 }],
    });

    // Per-card joker triggers
    for (const joker of runState.jokers) {
      if (joker.isDisabled) continue;
      const jokerCtx = {
        joker,
        scoringCtx: ctx,
        runState,
        currentCard: card,
        handType,
        triggerType: 'on_card_scored',
      };
      const result = joker.effect(jokerCtx);
      const jokerHint: AnimationHint = { type: 'joker_activate', jokerId: joker.instanceId };
      if (result.addChips) emitStep(ctx, `joker:${joker.instanceId}:chips`, {
        addChips: result.addChips,
        hints: [jokerHint, { type: 'chip_add', delta: result.addChips }],
      });
      if (result.addMult) emitStep(ctx, `joker:${joker.instanceId}:mult`, {
        addMult: result.addMult,
        hints: [jokerHint, { type: 'mult_add', delta: result.addMult }],
      });
      if (result.mulMult) emitStep(ctx, `joker:${joker.instanceId}:xmult`, {
        mulMult: result.mulMult,
        hints: [jokerHint, { type: 'mult_mul', factor: result.mulMult }],
      });
      if (result.addMoney) deferredMoney.push(result.addMoney);
      if (result.deferredFn) runState.pendingDeferredEffects.push(result.deferredFn);
    }

    // Red seal: retrigger once
    if (card.seal === 'red' && !isRetrigger) {
      scoreCard(card, true);
    }

    // Mime joker: retrigger held-card abilities
    // (handled separately below)
  }

  // Score each scored card
  for (const card of scoredCards) {
    scoreCard(card);
  }

  // Held card effects (not played)
  const heldCards = runState.hand.filter(c => !played.find(p => p.id === c.id));
  for (const card of heldCards) {
    if (card.isDebuffed) continue;
    if (card.enhancement === 'steel') {
      emitStep(ctx, `held:${card.id}:steel`, {
        mulMult: 1.5,
        hints: [{ type: 'mult_mul', factor: 1.5 }],
      });
    }
    if (card.seal === 'blue') {
      // Create planet card at end of round
      runState.pendingPlanetCards.push(handType);
    }
    // Gold seal and gold enhancement: tracked for round-end money
  }

  // Mime joker: retrigger held cards
  const mime = runState.jokers.find(j => j.id === 'j_mime' && !j.isDisabled);
  if (mime) {
    const mimeHint: AnimationHint = { type: 'joker_activate', jokerId: mime.instanceId };
    for (const card of heldCards) {
      if (card.isDebuffed) continue;
      if (card.enhancement === 'steel') {
        emitStep(ctx, `mime:${card.id}:steel`, {
          mulMult: 1.5,
          hints: [mimeHint, { type: 'mult_mul', factor: 1.5 }],
        });
      }
    }
  }

  // Joker independent effects (left to right)
  for (const joker of runState.jokers) {
    if (joker.isDisabled) continue;
    const jokerCtx = {
      joker,
      scoringCtx: ctx,
      runState,
      handType,
      triggerType: 'independent',
    };
    const result = joker.effect(jokerCtx);
    const jokerHint: AnimationHint = { type: 'joker_activate', jokerId: joker.instanceId };
    if (result.addChips) emitStep(ctx, `joker:${joker.instanceId}:chips`, {
      addChips: result.addChips,
      hints: [jokerHint, { type: 'chip_add', delta: result.addChips }],
    });
    if (result.addMult) emitStep(ctx, `joker:${joker.instanceId}:mult`, {
      addMult: result.addMult,
      hints: [jokerHint, { type: 'mult_add', delta: result.addMult }],
    });
    if (result.mulMult) emitStep(ctx, `joker:${joker.instanceId}:xmult`, {
      mulMult: result.mulMult,
      hints: [jokerHint, { type: 'mult_mul', factor: result.mulMult }],
    });
    if (result.addMoney) deferredMoney.push(result.addMoney);
    if (result.deferredFn) runState.pendingDeferredEffects.push(result.deferredFn);

    // Joker edition bonuses
    if (joker.edition === 'foil') emitStep(ctx, `joker:${joker.instanceId}:foil`, {
      addChips: 50,
      hints: [jokerHint, { type: 'chip_add', delta: 50 }],
    });
    if (joker.edition === 'holographic') emitStep(ctx, `joker:${joker.instanceId}:holo`, {
      addMult: 10,
      hints: [jokerHint, { type: 'mult_add', delta: 10 }],
    });
    if (joker.edition === 'polychrome') emitStep(ctx, `joker:${joker.instanceId}:poly`, {
      mulMult: 1.5,
      hints: [jokerHint, { type: 'mult_mul', factor: 1.5 }],
    });
  }

  const finalScore = Math.floor(ctx.chips * ctx.mult);
  const totalDeferredMoney = deferredMoney.reduce((a, b) => a + b, 0);

  return {
    finalScore,
    handType,
    steps: ctx.steps,
    deferredMoney: totalDeferredMoney,
    destroyedCardIds,
    createdConsumables,
  };
}
