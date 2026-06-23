import type { PlayingCard, Edition } from './Card.ts';
import type { HandType, ScoringContext } from './Score.ts';
import type { RunState } from './Run.ts';

export type JokerRarity = 'Common'|'Uncommon'|'Rare'|'Legendary';
export type MiniGameId = 'coin_flip'|'shell_game'|'higher_lower'|'dice_roll'|'wheel';
export type MiniGameTrigger = 'on_hand_played'|'on_blind_start'|'on_score_milestone';

export interface JokerEffectResult {
  addChips?: number;
  addMult?: number;
  mulMult?: number;
  addMoney?: number;
  retrigger?: boolean;
  addHandsRemaining?: number;
  addDiscardsRemaining?: number;
  addChipsScored?: number;
  scaleLastScore?: number;
  resetScore?: boolean;
  discardRandomCard?: boolean;
  deferredFn?: (runState: RunState) => void;
}

export interface JokerContext {
  joker: JokerInstance;
  scoringCtx: ScoringContext;
  runState: RunState;
  currentCard?: PlayingCard;
  handType: HandType;
  triggerType: string;
}

export interface MiniGameWinLoseEffect {
  addChips?: number;
  addMult?: number;
  mulMult?: number;
  addMoney?: number;
  addHandsRemaining?: number;
  addDiscardsRemaining?: number;
  addChipsScored?: number;
  scaleLastScore?: number;
  resetScore?: boolean;
  discardRandomCard?: boolean;
  deferredFn?: (runState: RunState) => void;
}

export interface JokerDefinition {
  id: string;
  name: string;
  rarity: JokerRarity;
  baseCost: number;
  sellValue: number;
  description: string;
  effect: (ctx: JokerContext) => JokerEffectResult;
  onBuy?: (runState: RunState) => void;
  onSell?: (runState: RunState) => void;
  onRoundEnd?: (runState: RunState) => void;
  onDiscard?: (runState: RunState, discarded: PlayingCard[]) => void;
  isEternal: boolean;
  isPerishable: boolean;
  perishUsesLeft?: number;
  isRentable: boolean;
  miniGameId?: MiniGameId;
  miniGameTrigger?: MiniGameTrigger;
  miniGameChance?: number;
  miniGameMaxPerRound?: number;
  miniGameWinDesc?: string;
  miniGameLoseDesc?: string;
  onMiniGameWin?: (runState: RunState, lastScore: number) => MiniGameWinLoseEffect;
  onMiniGameLose?: (runState: RunState, lastScore: number) => MiniGameWinLoseEffect;
}

export interface JokerInstance extends JokerDefinition {
  instanceId: string;
  edition: Edition;
  runtimeCounters: Record<string, number>;
  isDisabled: boolean;
}
