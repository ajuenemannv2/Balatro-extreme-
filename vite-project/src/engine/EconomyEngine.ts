import type { RunState } from '../types/Run.ts';

export function calcInterest(money: number, runState: RunState): number {
  const hasMoonJoker = runState.jokers.some(j => j.id === 'j_to_the_moon' && !j.isDisabled);
  const extraPer5 = hasMoonJoker ? 1 : 0;
  const baseInterest = Math.floor(money / 5);
  const interest = Math.min(5 + extraPer5, baseInterest + extraPer5);
  return Math.max(0, interest);
}

export function calcBlindWinMoney(runState: RunState): number {
  const blindIndex = runState.blindIndex;
  const basePayout = [3, 4, 5][blindIndex] ?? 3;
  return basePayout;
}

export function calcRoundEndMoney(runState: RunState, handsUsed: number, _discardsUsed: number): number {
  let total = 0;
  total += calcBlindWinMoney(runState);
  total += runState.handsRemaining;
  total += runState.discardsRemaining;
  total += calcInterest(runState.money, runState);

  // Gold cards held in hand
  for (const card of runState.hand) {
    if (card.enhancement === 'gold' && !card.isDebuffed) total += 3;
    if (card.seal === 'gold' && !card.isDebuffed) total += 3;
  }

  // Rental jokers: deduct $1 per rental joker per hand played
  const rentalCost = runState.jokers.filter(j => j.isRentable).length * handsUsed;
  total -= rentalCost;

  return Math.max(0, total);
}

export function canAfford(runState: RunState, cost: number): boolean {
  const creditCard = runState.jokers.some(j => j.id === 'j_credit_card' && !j.isDisabled);
  const minMoney = creditCard ? -20 : 0;
  return runState.money - cost >= minMoney;
}

export function buyItem(runState: RunState, cost: number): void {
  runState.money -= cost;
}

export function sellJoker(runState: RunState, instanceId: string): number {
  const idx = runState.jokers.findIndex(j => j.instanceId === instanceId);
  if (idx === -1) return 0;
  const joker = runState.jokers[idx];
  if (joker.isEternal) return 0;
  const value = joker.sellValue;
  joker.onSell?.(runState);
  runState.jokers.splice(idx, 1);
  runState.money += value;
  return value;
}

export function sellConsumable(runState: RunState, instanceId: string): number {
  const idx = runState.consumables.findIndex(c => c.instanceId === instanceId);
  if (idx === -1) return 0;
  runState.consumables.splice(idx, 1);
  runState.money += 1;
  return 1;
}
