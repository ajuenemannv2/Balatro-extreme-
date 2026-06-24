export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const CARD_W = 71;
export const CARD_H = 95;
export const CARD_RADIUS = 5;

export const COLORS = {
  bg:        0x1c1930,
  bgHex:     '#1c1930',
  cardFace:  0xf0e6d3,
  cardBack:  0x1a3a6b,
  panel:     0x2d1e3e,
  panelDark: 0x180f27,
  gold:      0xf5a623,
  goldHex:   '#f5a623',
  chipBlue:  0x4a90d9,
  multRed:   0xe74c3c,
  green:     0x27ae60,
  btnPurple: 0x6c3483,
  btnHover:  0x8e44ad,
  white:     0xffffff,
  dim:       0xaaaaaa,
  hearts:    0xd63030,
  diamonds:  0xd63030,
  spades:    0x1a1a1a,
  clubs:     0x1a1a1a,
  heartsHex:   '#d63030',
  diamondsHex: '#d63030',
  spadesHex:   '#1a1a1a',
  clubsHex:    '#1a1a1a',
  // Joker rarity border colors
  rarityCommon:    0x888888,
  rarityUncommon:  0x4488ff,
  rarityRare:      0xff4444,
  rarityLegendary: 0xffaa00,
} as const;

export const DEPTH = {
  bg: 0,
  table: 10,
  cards: 20,
  cardSelected: 25,
  ui: 30,
  hud: 40,
  popup: 50,
  tooltip: 60,
  modal: 70,
} as const;

export const ANIM = {
  dealDuration:    350,
  dealStagger:     80,
  playDuration:    300,
  discardDuration: 250,
  scoreStepDelay:  280,
  counterDuration: 400,
  popupDuration:   900,
  jokerFlashDuration: 300,
} as const;

export const FONT = 'Nunito, monospace';

export const HAND_POSITIONS_Y = 590;
export const JOKER_ROW_Y = 120;
export const CONSUMABLE_ROW_Y = 120;
export const PLAY_AREA_Y = 360;
export const HUD_Y = 20;
