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
  FLASHLIGHT = 'FLASHLIGHT',
  // New Cambodian-themed games
  RICE_PLANTING = 'RICE_PLANTING',        // ដាំស្រូវ
  KHMER_LETTER = 'KHMER_LETTER',          // គូរអក្សរខ្មែរ  
  NOODLE_MAKER = 'NOODLE_MAKER',          // ធ្វើនំបញ្ចុក
  WATER_SPLASH = 'WATER_SPLASH',          // សង្ក្រានស្រោចទឹក
  ELEPHANT_MARCH = 'ELEPHANT_MARCH',      // ដំណើរដំរី
  TEMPLE_BUILDER = 'TEMPLE_BUILDER',      // សង់ប្រាសាទអង្គរ
  FRUIT_CHOP = 'FRUIT_CHOP',              // កាត់ផ្លែឈើ
  KITE_FLYING = 'KITE_FLYING',            // បោះខ្លែង
  LOTUS_BLOOM = 'LOTUS_BLOOM',            // ផ្ការីកផ្កាឈូក
  COCONUT_CATCH = 'COCONUT_CATCH',        // រើសដូង
  TUK_TUK = 'TUK_TUK',                    // តុកតុក
  MARKET_SHOP = 'MARKET_SHOP',            // ផ្សារ
  FISH_POND = 'FISH_POND',                // បំបាក់ត្រី
  BOAT_RACE = 'BOAT_RACE',                // អុំទូក
  COLOR_APSARA = 'COLOR_APSARA',          // ផាត់ពណ៌អប្សរា
  GECKO_HUNT = 'GECKO_HUNT',              // ចាប់ច្កែ
  FIRECRACKER = 'FIRECRACKER',            // បំផ្ទុះកាំជ្រួច
  BOBA_SHAKE = 'BOBA_SHAKE',              // អង្គុំទឹកត្រា
  PALM_CLIMB = 'PALM_CLIMB'              // ឡើងដើមត្នោត
}

export interface GameState {
  currentLevel: number;
  highestLevel: number;
  isMenuOpen: boolean;
}

export interface LevelHistory {
  level: number;
  completedAt: string;
}