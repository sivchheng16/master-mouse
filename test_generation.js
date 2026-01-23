const GameType = {
  CLICK: 'CLICK',
  HOVER: 'HOVER',
  DRAG: 'DRAG',
  FOLLOW: 'FOLLOW',
  WHACK: 'WHACK',
  RIGHT_CLICK: 'RIGHT_CLICK',
  SIZE_WHEEL: 'SIZE_WHEEL',
  STAR_CATCH: 'STAR_CATCH',
  GEM_SORT: 'GEM_SORT',
  MAZE: 'MAZE',
  NUMBER_POP: 'NUMBER_POP',
  TRACE: 'TRACE',
  SCROLL: 'SCROLL',
  PATTERN: 'PATTERN',
  SOAP_BUBBLES: 'SOAP_BUBBLES',
  WATER_REFILL: 'WATER_REFILL',
  FLASHLIGHT: 'FLASHLIGHT',
  MARKET_SHOP: 'MARKET_SHOP'
};

const ACTIVE_GAME_TYPES = [
  GameType.CLICK,
  GameType.DRAG,
  GameType.WHACK,
  GameType.RIGHT_CLICK,
  GameType.NUMBER_POP,
  GameType.TRACE,
  GameType.SCROLL,
  GameType.FLASHLIGHT,
  GameType.STAR_CATCH,
  GameType.MARKET_SHOP
];

const TOTAL_LEVELS = 30;

function generate() {
    const newMap = [];
    let lastType = null;
    
    // Generate enough batches to cover all levels
    while (newMap.length < TOTAL_LEVELS) {
      // Shuffle active games
      let shuffled = [...ACTIVE_GAME_TYPES].sort(() => Math.random() - 0.5);
      
      // Prevent consecutive duplicates across batches
      if (lastType && shuffled[0] === lastType) {
        // Swap first element with the last to break the chain
        [shuffled[0], shuffled[shuffled.length - 1]] = [shuffled[shuffled.length - 1], shuffled[0]];
      }
      
      newMap.push(...shuffled);
      lastType = shuffled[shuffled.length - 1];
    }
    
    const finalMap = newMap.slice(0, TOTAL_LEVELS);
    return finalMap;
}

const map = generate();
console.log("Generated " + map.length + " levels");

let hasDupes = false;
for (let i = 0; i < map.length - 1; i++) {
    if (map[i] === map[i+1]) {
        console.log("DUPLICATE FOUND at " + i + ": " + map[i]);
        hasDupes = true;
    }
}

if (!hasDupes) {
    console.log("SUCCESS: No consecutive duplicates found.");
}

// Check distribution
const counts = {};
map.forEach(t => counts[t] = (counts[t] || 0) + 1);
console.log("Counts:", counts);
