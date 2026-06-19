import type { PlanetDefinition } from '../types/Consumable.ts';

export const PLANET_DEFS: PlanetDefinition[] = [
  {
    id: 'planet_pluto',
    name: 'Pluto',
    upgradesHand: 'High Card',
    description: 'Upgrades the level of High Card (+15 Chips, +1 Mult per level).',
  },
  {
    id: 'planet_mercury',
    name: 'Mercury',
    upgradesHand: 'Pair',
    description: 'Upgrades the level of Pair (+15 Chips, +1 Mult per level).',
  },
  {
    id: 'planet_uranus',
    name: 'Uranus',
    upgradesHand: 'Two Pair',
    description: 'Upgrades the level of Two Pair (+15 Chips, +1 Mult per level).',
  },
  {
    id: 'planet_venus',
    name: 'Venus',
    upgradesHand: 'Three of a Kind',
    description: 'Upgrades the level of Three of a Kind (+15 Chips, +1 Mult per level).',
  },
  {
    id: 'planet_saturn',
    name: 'Saturn',
    upgradesHand: 'Straight',
    description: 'Upgrades the level of Straight (+30 Chips, +3 Mult per level).',
  },
  {
    id: 'planet_jupiter',
    name: 'Jupiter',
    upgradesHand: 'Flush',
    description: 'Upgrades the level of Flush (+15 Chips, +2 Mult per level).',
  },
  {
    id: 'planet_earth',
    name: 'Earth',
    upgradesHand: 'Full House',
    description: 'Upgrades the level of Full House (+25 Chips, +2 Mult per level).',
  },
  {
    id: 'planet_mars',
    name: 'Mars',
    upgradesHand: 'Four of a Kind',
    description: 'Upgrades the level of Four of a Kind (+30 Chips, +3 Mult per level).',
  },
  {
    id: 'planet_neptune',
    name: 'Neptune',
    upgradesHand: 'Straight Flush',
    description: 'Upgrades the level of Straight Flush (+40 Chips, +4 Mult per level).',
  },
  {
    id: 'planet_planet_x',
    name: 'Planet X',
    upgradesHand: 'Five of a Kind',
    description: 'Upgrades the level of Five of a Kind (+35 Chips, +3 Mult per level).',
  },
  {
    id: 'planet_ceres',
    name: 'Ceres',
    upgradesHand: 'Flush House',
    description: 'Upgrades the level of Flush House (+40 Chips, +4 Mult per level).',
  },
  {
    id: 'planet_eris',
    name: 'Eris',
    upgradesHand: 'Flush Five',
    description: 'Upgrades the level of Flush Five (+50 Chips, +3 Mult per level).',
  },
];
