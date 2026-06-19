import type { RunState } from '../types/Run.ts';
import type { ShopState, ShopItem, PackType } from '../types/Shop.ts';
import { ALL_JOKER_DEFS } from '../data/jokers/index.ts';
import { TAROT_DEFS } from '../data/TarotDefs.ts';
import { PLANET_DEFS } from '../data/PlanetDefs.ts';
import { SPECTRAL_DEFS } from '../data/SpectralDefs.ts';
import { VOUCHER_DEFS } from '../data/VoucherDefs.ts';
import type { JokerDefinition } from '../types/Joker.ts';
import type { Edition } from '../types/Card.ts';
import { RNG } from './RNG.ts';
import { RANKS, SUITS } from './DeckBuilder.ts';

const PACK_TYPES: PackType[] = ['arcana','celestial','buffoon','standard'];

function pickJoker(rng: RNG, runState: RunState): JokerDefinition | null {
  const pool = ALL_JOKER_DEFS.filter(j => {
    if (runState.jokers.some(ji => ji.id === j.id) &&
        !runState.jokers.some(ji => ji.id === 'j_showman' && !ji.isDisabled)) return false;
    return true;
  });
  if (pool.length === 0) return null;

  const rarityRoll = rng.nextInt(0, 99);
  let rarity: 'Common'|'Uncommon'|'Rare'|'Legendary' = 'Common';
  if (rarityRoll >= 98) rarity = 'Legendary';
  else if (rarityRoll >= 90) rarity = 'Rare';
  else if (rarityRoll >= 70) rarity = 'Uncommon';

  const byRarity = pool.filter(j => j.rarity === rarity);
  return byRarity.length > 0 ? rng.pick(byRarity) : rng.pick(pool);
}

function pickEdition(rng: RNG, runState: RunState): Edition {
  const hasHone = runState.vouchers.includes('hone');
  const hasGlowUp = runState.vouchers.includes('glow_up');
  const mult = hasGlowUp ? 4 : hasHone ? 2 : 1;

  const roll = rng.nextInt(0, 999);
  if (roll < 3 * mult) return 'negative';
  if (roll < 6 * mult) return 'polychrome';
  if (roll < 20 * mult) return 'holographic';
  if (roll < 60 * mult) return 'foil';
  return 'base';
}

function applyDiscount(cost: number, runState: RunState): number {
  const hasClearance = runState.vouchers.includes('clearance_sale');
  const hasLiquidation = runState.vouchers.includes('liquidation');
  if (hasLiquidation) return Math.floor(cost * 0.5);
  if (hasClearance) return Math.floor(cost * 0.75);
  return cost;
}

export function generateShop(runState: RunState, rng: RNG): ShopState {
  const items: ShopItem[] = [];

  // 2 card-type slots (joker or consumable)
  for (let i = 0; i < 2; i++) {
    const roll = rng.nextInt(0, 99);
    if (roll < 60) {
      // Joker
      const def = pickJoker(rng, runState);
      if (def) {
        const edition = pickEdition(rng, runState);
        const cost = applyDiscount(def.baseCost, runState);
        items.push({ type: 'joker', cost, sold: false, jokerDef: def, jokerEdition: edition });
      }
    } else if (roll < 75) {
      // Tarot
      const def = rng.pick(TAROT_DEFS);
      items.push({ type: 'tarot', cost: applyDiscount(3, runState), sold: false, tarotDef: def });
    } else if (roll < 88) {
      // Planet
      const def = rng.pick(PLANET_DEFS);
      const isFree = runState.vouchers.includes('astronomer');
      items.push({ type: 'planet', cost: isFree ? 0 : applyDiscount(3, runState), sold: false, planetDef: def });
    } else {
      // Spectral (ante >= 2 only)
      if (runState.ante >= 2) {
        const def = rng.pick(SPECTRAL_DEFS);
        items.push({ type: 'spectral', cost: applyDiscount(4, runState), sold: false, spectralDef: def });
      } else {
        const def = pickJoker(rng, runState);
        if (def) {
          const edition = pickEdition(rng, runState);
          items.push({ type: 'joker', cost: applyDiscount(def.baseCost, runState), sold: false, jokerDef: def, jokerEdition: edition });
        }
      }
    }
  }

  // 2 pack slots
  for (let i = 0; i < 2; i++) {
    const packType = rng.pick(PACK_TYPES);
    items.push({ type: 'pack', cost: applyDiscount(4, runState), sold: false, packType });
  }

  // Voucher (every other ante, roughly)
  let voucher: ShopItem | null = null;
  if (runState.ante % 2 === 1 || rng.nextBool(0.3)) {
    const available = VOUCHER_DEFS.filter(v => {
      if (runState.vouchers.includes(v.id)) return false;
      if (v.upgradeOf && !runState.vouchers.includes(v.upgradeOf)) return false;
      return true;
    });
    if (available.length > 0) {
      const vDef = rng.pick(available);
      voucher = { type: 'voucher', cost: 10, sold: false, voucherId: vDef.id };
    }
  }

  const rerollCost = runState.shopRerollCost ?? 5;

  return { items, voucher, rerollCost, rerollsUsed: 0 };
}

export function rerollShop(runState: RunState, rng: RNG, current: ShopState): ShopState {
  const newShop = generateShop(runState, rng);
  newShop.rerollCost = current.rerollCost + 1;
  newShop.rerollsUsed = current.rerollsUsed + 1;
  return newShop;
}

export function generatePackContents(packType: PackType, runState: RunState, rng: RNG): unknown[] {
  switch (packType) {
    case 'arcana':
    case 'mega_arcana': {
      const count = packType.startsWith('mega') ? 4 : 2;
      return Array.from({ length: count }, () => rng.pick(TAROT_DEFS));
    }
    case 'celestial':
    case 'mega_celestial': {
      const count = packType.startsWith('mega') ? 4 : 2;
      if (runState.vouchers.includes('telescope')) {
        const mostPlayed = runState.mostPlayedHand;
        const planet = PLANET_DEFS.find(p => p.upgradesHand === mostPlayed);
        if (planet) return [planet, ...Array.from({ length: count - 1 }, () => rng.pick(PLANET_DEFS))];
      }
      return Array.from({ length: count }, () => rng.pick(PLANET_DEFS));
    }
    case 'spectral': {
      return [rng.pick(SPECTRAL_DEFS), rng.pick(SPECTRAL_DEFS)];
    }
    case 'buffoon':
    case 'mega_buffoon': {
      const count = packType.startsWith('mega') ? 4 : 2;
      return Array.from({ length: count }, () => pickJoker(rng, runState)).filter(Boolean);
    }
    case 'standard':
    case 'mega_standard': {
      const count = packType.startsWith('mega') ? 6 : 4;
      return Array.from({ length: count }, () => ({
        rank: rng.pick(RANKS as never[]),
        suit: rng.pick(SUITS as never[]),
      }));
    }
  }
}
