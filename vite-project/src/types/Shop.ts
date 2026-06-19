import type { JokerDefinition } from './Joker.ts';
import type { TarotDefinition, PlanetDefinition, SpectralDefinition } from './Consumable.ts';
import type { PlayingCard, Edition } from './Card.ts';

export type PackType = 'arcana'|'celestial'|'spectral'|'buffoon'|'standard'|'mega_arcana'|'mega_celestial'|'mega_buffoon'|'mega_standard';

export type ShopItemType = 'joker'|'tarot'|'planet'|'spectral'|'voucher'|'pack'|'card';

export interface ShopItem {
  type: ShopItemType;
  cost: number;
  sold: boolean;
  jokerDef?: JokerDefinition;
  jokerEdition?: Edition;
  tarotDef?: TarotDefinition;
  planetDef?: PlanetDefinition;
  spectralDef?: SpectralDefinition;
  voucherId?: string;
  packType?: PackType;
  card?: PlayingCard;
}

export interface ShopState {
  items: ShopItem[];
  voucher: ShopItem | null;
  rerollCost: number;
  rerollsUsed: number;
}
