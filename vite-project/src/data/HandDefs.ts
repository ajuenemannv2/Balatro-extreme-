import type { HandType } from '../types/Score.ts';

export const HAND_DEFS: Record<
  HandType,
  {
    baseChips: number;
    baseMult: number;
    chipsPerLevel: number;
    multPerLevel: number;
    planet: string;
  }
> = {
  'High Card':       { baseChips: 5,   baseMult: 1,  chipsPerLevel: 15, multPerLevel: 1, planet: 'Pluto'    },
  'Pair':            { baseChips: 10,  baseMult: 2,  chipsPerLevel: 15, multPerLevel: 1, planet: 'Mercury'  },
  'Two Pair':        { baseChips: 20,  baseMult: 2,  chipsPerLevel: 15, multPerLevel: 1, planet: 'Uranus'   },
  'Three of a Kind': { baseChips: 30,  baseMult: 3,  chipsPerLevel: 15, multPerLevel: 1, planet: 'Venus'    },
  'Straight':        { baseChips: 30,  baseMult: 4,  chipsPerLevel: 30, multPerLevel: 3, planet: 'Saturn'   },
  'Flush':           { baseChips: 35,  baseMult: 4,  chipsPerLevel: 15, multPerLevel: 2, planet: 'Jupiter'  },
  'Full House':      { baseChips: 40,  baseMult: 4,  chipsPerLevel: 25, multPerLevel: 2, planet: 'Earth'    },
  'Four of a Kind':  { baseChips: 60,  baseMult: 7,  chipsPerLevel: 30, multPerLevel: 3, planet: 'Mars'     },
  'Straight Flush':  { baseChips: 100, baseMult: 8,  chipsPerLevel: 40, multPerLevel: 4, planet: 'Neptune'  },
  'Five of a Kind':  { baseChips: 120, baseMult: 12, chipsPerLevel: 35, multPerLevel: 3, planet: 'Planet X' },
  'Flush House':     { baseChips: 140, baseMult: 14, chipsPerLevel: 40, multPerLevel: 4, planet: 'Ceres'    },
  'Flush Five':      { baseChips: 160, baseMult: 16, chipsPerLevel: 50, multPerLevel: 3, planet: 'Eris'     },
};

/** Returns the effective chips and mult for a hand at the given level (level 1 = base). */
export function getHandChipsMult(
  handType: HandType,
  level: number,
): { chips: number; mult: number } {
  const def = HAND_DEFS[handType];
  const lvl = Math.max(1, level);
  return {
    chips: def.baseChips + def.chipsPerLevel * (lvl - 1),
    mult:  def.baseMult  + def.multPerLevel  * (lvl - 1),
  };
}
