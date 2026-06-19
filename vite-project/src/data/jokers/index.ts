export { COMMON_JOKER_DEFS } from './common.ts';
export { UNCOMMON_JOKER_DEFS } from './uncommon.ts';
export { RARE_JOKER_DEFS } from './rare.ts';
export { LEGENDARY_JOKER_DEFS } from './legendary.ts';

import { COMMON_JOKER_DEFS } from './common.ts';
import { UNCOMMON_JOKER_DEFS } from './uncommon.ts';
import { RARE_JOKER_DEFS } from './rare.ts';
import { LEGENDARY_JOKER_DEFS } from './legendary.ts';
import type { JokerDefinition } from '../../types/Joker.ts';

export const ALL_JOKER_DEFS: JokerDefinition[] = [
  ...COMMON_JOKER_DEFS,
  ...UNCOMMON_JOKER_DEFS,
  ...RARE_JOKER_DEFS,
  ...LEGENDARY_JOKER_DEFS,
];

export function getJokerDef(id: string): JokerDefinition | undefined {
  return ALL_JOKER_DEFS.find((j) => j.id === id);
}
