import type { PlayingCard, Edition } from './Card.ts';
import type { HandType, ScoringContext } from './Score.ts';
import type { RunState } from './Run.ts';

export type JokerRarity = 'Common'|'Uncommon'|'Rare'|'Legendary';

export interface JokerEffectResult {
  addChips?: number;
  addMult?: number;
  mulMult?: number;
  addMoney?: number;
  retrigger?: boolean;
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
}

export interface JokerInstance extends JokerDefinition {
  instanceId: string;
  edition: Edition;
  runtimeCounters: Record<string, number>;
  isDisabled: boolean;
}
