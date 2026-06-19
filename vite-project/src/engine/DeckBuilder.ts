import type { PlayingCard, Rank, Suit } from '../types/Card.ts';
import { rankChips } from '../types/Card.ts';
import type { RNG } from './RNG.ts';

const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS: Suit[] = ['Spades','Hearts','Clubs','Diamonds'];

let _cardCounter = 0;
function newId(): string { return `card_${++_cardCounter}`; }

export function makeCard(rank: Rank, suit: Suit): PlayingCard {
  return {
    id: newId(),
    rank,
    suit,
    baseChips: rankChips(rank),
    enhancement: 'none',
    edition: 'base',
    seal: 'none',
    isDebuffed: false,
    faceUp: true,
  };
}

export function makeStoneCard(): PlayingCard {
  return {
    id: newId(),
    rank: null,
    suit: null,
    baseChips: 50,
    enhancement: 'stone',
    edition: 'base',
    seal: 'none',
    isDebuffed: false,
    faceUp: true,
  };
}

export function buildStandardDeck(): PlayingCard[] {
  const deck: PlayingCard[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
}

export function shuffleDeck(deck: PlayingCard[], rng: RNG): PlayingCard[] {
  return rng.shuffle(deck);
}

export function drawCards(deck: PlayingCard[], n: number): { drawn: PlayingCard[]; remaining: PlayingCard[] } {
  const drawn = deck.slice(0, n);
  const remaining = deck.slice(n);
  return { drawn, remaining };
}

export function advanceRank(rank: Rank): Rank {
  const order: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const i = order.indexOf(rank);
  if (i === -1 || i === order.length - 1) return rank;
  return order[i + 1];
}

export { RANKS, SUITS };
