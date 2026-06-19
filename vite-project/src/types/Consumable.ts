import type { PlayingCard } from './Card.ts';
import type { HandType } from './Score.ts';
import type { RunState } from './Run.ts';

export type ConsumableType = 'tarot'|'planet'|'spectral';

export interface ConsumableUseContext {
  runState: RunState;
  selectedCards: PlayingCard[];
}

export interface TarotDefinition {
  id: string;
  name: string;
  arcanaNumber: number;
  description: string;
  targetCount: number;
  effect: (ctx: ConsumableUseContext) => void;
}

export interface PlanetDefinition {
  id: string;
  name: string;
  upgradesHand: HandType;
  description: string;
}

export interface SpectralDefinition {
  id: string;
  name: string;
  description: string;
  targetCount: number;
  effect: (ctx: ConsumableUseContext) => void;
}

export interface ConsumableInstance {
  instanceId: string;
  type: ConsumableType;
  defId: string;
}
