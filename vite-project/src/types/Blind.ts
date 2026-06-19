import type { PlayingCard } from './Card.ts';
import type { RunState } from './Run.ts';

export interface BlindConfig {
  id: string;
  name: string;
  description: string;
  isBoss: boolean;
  chipMultiplier: number;
  activateEffect?: (runState: RunState) => void;
  deactivateEffect?: (runState: RunState) => void;
  onHandPlayed?: (runState: RunState, played: PlayingCard[]) => void;
  onCardDrawn?: (runState: RunState, card: PlayingCard) => PlayingCard;
}
