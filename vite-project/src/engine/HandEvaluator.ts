import type { PlayingCard } from '../types/Card.ts';
import type { HandType } from '../types/Score.ts';
import type { RunState } from '../types/Run.ts';

const RANK_VALUES: Record<string, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14
};

interface EvalResult {
  handType: HandType;
  scoredCards: PlayingCard[];
}

function getRankGroups(cards: PlayingCard[]): Map<string, PlayingCard[]> {
  const groups = new Map<string, PlayingCard[]>();
  for (const c of cards) {
    if (c.rank === null) continue;
    const key = c.rank;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return groups;
}

function getSuitGroups(cards: PlayingCard[]): Map<string, PlayingCard[]> {
  const groups = new Map<string, PlayingCard[]>();
  for (const c of cards) {
    if (c.suit === null) continue;
    const key = c.suit;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }
  return groups;
}

function isStraight(cards: PlayingCard[], allowGap: boolean): PlayingCard[] | null {
  const nonStone = cards.filter(c => c.rank !== null);
  if (nonStone.length < 5) return null;

  const sorted = [...nonStone].sort((a, b) => RANK_VALUES[a.rank!] - RANK_VALUES[b.rank!]);
  const vals = sorted.map(c => RANK_VALUES[c.rank!]);
  const unique = [...new Set(vals)].sort((a, b) => a - b);

  const check5 = (arr: number[]): boolean => {
    if (allowGap) {
      // Shortcut joker: gaps of 1 allowed
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] - arr[i - 1] > 2) return false;
      }
      return arr[arr.length - 1] - arr[0] <= 8;
    }
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] - arr[i - 1] !== 1) return false;
    }
    return true;
  };

  for (let start = 0; start <= unique.length - 5; start++) {
    const slice = unique.slice(start, start + 5);
    if (check5(slice)) {
      const result: PlayingCard[] = [];
      for (const v of slice) {
        const card = nonStone.find(c => RANK_VALUES[c.rank!] === v && !result.includes(c));
        if (card) result.push(card);
      }
      return result;
    }
  }

  // Ace-low straight: A-2-3-4-5
  if (unique.includes(14)) {
    const low = [1, ...unique.filter(v => v <= 5)];
    const uniqueLow = [...new Set(low)].sort((a, b) => a - b);
    if (uniqueLow.length >= 5 && check5(uniqueLow.slice(0, 5))) {
      const targetVals = uniqueLow.slice(0, 5);
      const result: PlayingCard[] = [];
      for (const v of targetVals) {
        if (v === 1) {
          const ace = nonStone.find(c => c.rank === 'A' && !result.includes(c));
          if (ace) result.push(ace);
        } else {
          const card = nonStone.find(c => RANK_VALUES[c.rank!] === v && !result.includes(c));
          if (card) result.push(card);
        }
      }
      return result.length >= 5 ? result : null;
    }
  }
  return null;
}


export function evaluateHand(played: PlayingCard[], runState: RunState): EvalResult {
  const hasFourFingers = runState.jokers.some(j => j.id === 'j_four_fingers' && !j.isDisabled);
  const hasShortcut = runState.jokers.some(j => j.id === 'j_shortcut' && !j.isDisabled);
  const hasSplash = runState.jokers.some(j => j.id === 'j_splash' && !j.isDisabled);
  const hasSmeared = runState.jokers.some(j => j.id === 'j_smeared_joker' && !j.isDisabled);
  const minFlush = hasFourFingers ? 4 : 5;
  const minStraight = hasFourFingers ? 4 : 5;

  const stones = played.filter(c => c.enhancement === 'stone');
  const nonStone = played.filter(c => c.enhancement !== 'stone' && c.rank !== null);

  const rankGroups = getRankGroups(nonStone);

  // Determine flush
  function checkFlush(): { flushed: boolean; suitCards: PlayingCard[] } {
    const suitGroups = getSuitGroups(played.filter(c => c.suit !== null && c.enhancement !== 'wild' && c.enhancement !== 'stone'));
    const wilds = played.filter(c => c.enhancement === 'wild');

    if (hasSmeared) {
      // Hearts/Diamonds count as same, Spades/Clubs count as same
      const redCards = played.filter(c => (c.suit === 'Hearts' || c.suit === 'Diamonds') && c.enhancement !== 'wild' && c.enhancement !== 'stone');
      const blackCards = played.filter(c => (c.suit === 'Spades' || c.suit === 'Clubs') && c.enhancement !== 'wild' && c.enhancement !== 'stone');
      if (redCards.length + wilds.length >= minFlush) return { flushed: true, suitCards: [...redCards, ...wilds].slice(0, minFlush) };
      if (blackCards.length + wilds.length >= minFlush) return { flushed: true, suitCards: [...blackCards, ...wilds].slice(0, minFlush) };
      return { flushed: false, suitCards: [] };
    }

    for (const [, cards] of suitGroups) {
      if (cards.length + wilds.length >= minFlush) {
        return { flushed: true, suitCards: [...cards, ...wilds].slice(0, minFlush) };
      }
    }
    // All wilds can form a flush
    if (wilds.length >= minFlush) return { flushed: true, suitCards: wilds.slice(0, minFlush) };
    return { flushed: false, suitCards: [] };
  }

  const { flushed, suitCards } = checkFlush();
  const straightCards = isStraight(nonStone, hasShortcut);
  const hasStraight = straightCards !== null && straightCards.length >= minStraight;

  // Rank group helpers
  const quads = [...rankGroups.values()].filter(g => g.length >= 4);
  const trips = [...rankGroups.values()].filter(g => g.length >= 3);
  const pairs = [...rankGroups.values()].filter(g => g.length >= 2);

  // Scored cards builder
  function scored(cards: PlayingCard[]): PlayingCard[] {
    if (hasSplash) return played;
    return [...new Set([...cards, ...stones])];
  }

  // Determine hand type from highest to lowest

  // Flush Five: all 5 same rank, all same suit
  if (flushed && nonStone.length >= 5) {
    const topGroup = [...rankGroups.values()].find(g => g.length >= 5);
    if (topGroup && topGroup.length + stones.length >= 5) {
      return { handType: 'Flush Five', scoredCards: scored([...topGroup, ...stones]) };
    }
  }

  // Flush House: full house, all same suit
  if (flushed && trips.length >= 1 && pairs.length >= 2) {
    const trip = trips[0];
    const pair = pairs.find(g => g !== trip);
    if (pair) {
      const flushHouseCards = [...trip, ...pair];
      if (flushHouseCards.every(c => suitCards.includes(c) || c.enhancement === 'wild' || c.enhancement === 'stone')) {
        return { handType: 'Flush House', scoredCards: scored(flushHouseCards) };
      }
    }
  }

  // Five of a Kind
  const fiveGroup = [...rankGroups.values()].find(g => g.length >= 5);
  if (fiveGroup) return { handType: 'Five of a Kind', scoredCards: scored(fiveGroup) };

  // Straight Flush
  if (flushed && hasStraight) {
    const sfCards = straightCards!;
    return { handType: 'Straight Flush', scoredCards: scored(sfCards) };
  }

  // Four of a Kind
  if (quads.length >= 1) {
    return { handType: 'Four of a Kind', scoredCards: scored(quads[0]) };
  }

  // Full House
  if (trips.length >= 1 && pairs.length >= 2) {
    const trip = trips[0];
    const pair = pairs.find(g => g !== trip)!;
    return { handType: 'Full House', scoredCards: scored([...trip, ...pair]) };
  }

  // Flush
  if (flushed) {
    return { handType: 'Flush', scoredCards: scored(suitCards) };
  }

  // Straight
  if (hasStraight) {
    return { handType: 'Straight', scoredCards: scored(straightCards!) };
  }

  // Three of a Kind
  if (trips.length >= 1) {
    return { handType: 'Three of a Kind', scoredCards: scored(trips[0]) };
  }

  // Two Pair
  if (pairs.length >= 2) {
    return { handType: 'Two Pair', scoredCards: scored([...pairs[0], ...pairs[1]]) };
  }

  // Pair
  if (pairs.length >= 1) {
    return { handType: 'Pair', scoredCards: scored(pairs[0]) };
  }

  // High Card: highest card + stones
  const sorted = [...nonStone].sort((a, b) => RANK_VALUES[b.rank!] - RANK_VALUES[a.rank!]);
  return { handType: 'High Card', scoredCards: scored(sorted.slice(0, 1)) };
}
