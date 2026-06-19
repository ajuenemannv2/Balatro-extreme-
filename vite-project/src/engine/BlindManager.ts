import type { RunState } from '../types/Run.ts';
import { ANTE_CHIP_TARGETS, BASE_HANDS, BASE_DISCARDS } from '../data/AnteDefs.ts';
import { BOSS_BLIND_DEFS } from '../data/BossBlindDefs.ts';
import { RNG } from './RNG.ts';

const BOSS_BLIND_POOL = BOSS_BLIND_DEFS.map(b => b.id);

export function getChipTarget(ante: number, blindIndex: number): number {
  const anteRow = ANTE_CHIP_TARGETS[ante - 1];
  if (!anteRow) return 300;
  const base = anteRow[blindIndex] ?? 300;
  return base;
}

export function selectBossBlind(_ante: number, rng: RNG, previousBossIds: string[]): string {
  // Rotate through boss blinds, avoid recent ones
  const eligible = BOSS_BLIND_POOL.filter(id => !previousBossIds.slice(-3).includes(id));
  const pool = eligible.length > 0 ? eligible : BOSS_BLIND_POOL;
  return rng.pick(pool);
}

export function activateBlind(runState: RunState): void {
  if (runState.blindIndex !== 2) return;
  const def = BOSS_BLIND_DEFS.find(b => b.id === runState.activeBlindId);
  if (def?.activateEffect) def.activateEffect(runState);
}

export function deactivateBlind(runState: RunState): void {
  if (runState.blindIndex !== 2) return;
  const def = BOSS_BLIND_DEFS.find(b => b.id === runState.activeBlindId);
  if (def?.deactivateEffect) def.deactivateEffect(runState);
  // Re-enable all debuffed cards
  const allCards = [...runState.deck, ...runState.hand, ...runState.discardPile];
  for (const card of allCards) card.isDebuffed = false;
  // Re-enable all jokers
  for (const j of runState.jokers) j.isDisabled = false;
}

export function onHandPlayedForBlind(runState: RunState, played: import('../types/Card.ts').PlayingCard[]): void {
  if (runState.blindIndex !== 2) return;
  const def = BOSS_BLIND_DEFS.find(b => b.id === runState.activeBlindId);
  def?.onHandPlayed?.(runState, played);
}

export function getBlindName(_ante: number, blindIndex: number, bossId: string | null): string {
  if (blindIndex === 0) return 'Small Blind';
  if (blindIndex === 1) return 'Big Blind';
  const boss = BOSS_BLIND_DEFS.find(b => b.id === bossId);
  return boss?.name ?? 'Boss Blind';
}

export function getBlindDescription(blindIndex: number, bossId: string | null): string {
  if (blindIndex < 2) return '';
  const boss = BOSS_BLIND_DEFS.find(b => b.id === bossId);
  return boss?.description ?? '';
}

export function initRound(runState: RunState): void {
  runState.handsRemaining = BASE_HANDS;
  runState.discardsRemaining = BASE_DISCARDS;

  // Apply voucher modifications
  for (const vid of runState.vouchers) {
    if (vid === 'grabber' || vid === 'nacho_tong') runState.handsRemaining += 1;
    if (vid === 'wasteful' || vid === 'recyclomancy') runState.discardsRemaining += 1;
  }

  // Apply joker modifications
  for (const j of runState.jokers) {
    if (j.id === 'j_merry_andy') runState.discardsRemaining += 3;
    if (j.id === 'j_troubadour') { runState.handsRemaining -= 1; runState.handSize += 2; }
    if (j.id === 'j_stuntman') runState.handSize -= 2;
  }

  runState.handsRemaining = Math.max(1, runState.handsRemaining);
  runState.discardsRemaining = Math.max(0, runState.discardsRemaining);

  // The Water boss blind: 0 discards
  if (runState.activeBlindId === 'boss_water') runState.discardsRemaining = 0;
  // The Needle: 1 hand
  if (runState.activeBlindId === 'boss_needle') runState.handsRemaining = 1;
  // The Manacle: -1 hand size
  if (runState.activeBlindId === 'boss_manacle') runState.handSize = Math.max(1, runState.handSize - 1);

  runState.bossBlindHandsPlayed = 0;
  runState.chipsScored = 0;
  runState.playedThisRound = [];
  runState.pendingPlanetCards = [];
  runState.mostPlayedHand = null;
}
