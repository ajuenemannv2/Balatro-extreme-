export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';
export type Suit = 'Spades'|'Hearts'|'Clubs'|'Diamonds';
export type Enhancement = 'none'|'bonus'|'mult'|'wild'|'glass'|'steel'|'stone'|'gold'|'lucky'|'crystal'|'bronze'|'ephemeral';
export type Edition = 'base'|'foil'|'holographic'|'polychrome'|'negative';
export type Seal = 'none'|'gold'|'red'|'blue'|'purple';

export interface PlayingCard {
  id: string;
  rank: Rank | null;
  suit: Suit | null;
  baseChips: number;
  enhancement: Enhancement;
  edition: Edition;
  seal: Seal;
  isDebuffed: boolean;
  faceUp: boolean;
  timesPlayed?: number;
}

export function rankChips(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['J','Q','K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

export function rankValue(rank: Rank): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank, 10);
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'Spades':   return '♠';
    case 'Hearts':   return '♥';
    case 'Clubs':    return '♣';
    case 'Diamonds': return '♦';
  }
}

export function suitColor(suit: Suit): string {
  return suit === 'Hearts' || suit === 'Diamonds' ? '#d63030' : '#1a1a1a';
}
