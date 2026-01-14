export enum GameType {
  CLICK = 'CLICK',
  HOVER = 'HOVER',
  DRAG = 'DRAG',
  FOLLOW = 'FOLLOW',
  WHACK = 'WHACK',
  RIGHT_CLICK = 'RIGHT_CLICK',
  SIZE_WHEEL = 'SIZE_WHEEL',
  STAR_CATCH = 'STAR_CATCH',
  GEM_SORT = 'GEM_SORT',
  MAZE = 'MAZE',
  NUMBER_POP = 'NUMBER_POP',
  TRACE = 'TRACE',
  SCROLL = 'SCROLL',
  PATTERN = 'PATTERN',
  SOAP_BUBBLES = 'SOAP_BUBBLES',
  WATER_REFILL = 'WATER_REFILL',
  FLASHLIGHT = 'FLASHLIGHT'
}

export interface GameState {
  currentLevel: number;
  highestLevel: number;
  isMenuOpen: boolean;
}