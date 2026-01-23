import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../../../services/audioService';
import { GameHUD } from './../../GameHUD';

interface DeepSeaScrollProps {
  onComplete: () => void;
  count?: number;
}

const POOL_ITEMS = [
  { emoji: '🐚', name: 'សម្បកខ្យង' }, { emoji: '🦀', name: 'ក្តាមសមុទ្រ' }, { emoji: '👑', name: 'ម្កុដមាស' }, { emoji: '⚓', name: 'យុថ្កា' },
  { emoji: '🐙', name: 'មឹកយក្ស' }, { emoji: '🪸', name: 'សារាយសមុទ្រ' }, { emoji: '🔱', name: 'ត្រីសូល៍' }, { emoji: '💎', name: 'ត្បូង' },
  { emoji: '🐬', name: 'ផ្សោត' }, { emoji: '🦈', name: 'ឆ្លាម' }, { emoji: '🐠', name: 'ត្រីពណ៌' }, { emoji: '🐡', name: 'ត្រីកំពត' },
  { emoji: '🦞', name: 'បង្កង' }, { emoji: '🦐', name: 'បង្គា' }, { emoji: '🦑', name: 'មឹក' }, { emoji: '🧜‍♀️', name: 'នាងមច្ឆា' }
];

export const DeepSeaScroll: React.FC<DeepSeaScrollProps> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [foundItems, setFoundItems] = useState<number[]>([]);
  const [items, setItems] = useState<{ id: number; emoji: string; name: string; depth: number }[]>([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);

  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    // Round 1: 5 items. Round 2+: Increase by 2.
    const rc = r === 1 ? 5 : (5 + (r - 1) * 2);
    const spacing = 1000;

    // Randomize pool
    const shuffledPool = [...POOL_ITEMS].sort(() => Math.random() - 0.5);

    const newItems = Array.from({ length: rc }).map((_, i) => ({
      id: Math.random(),
      emoji: shuffledPool[i % shuffledPool.length].emoji,
      name: shuffledPool[i % shuffledPool.length].name,
      depth: (i * spacing) + 800 + Math.random() * 300
    }));
    setItems(newItems);
    setFoundItems([]);
    setCurrentDepth(0);
    setHasScrolled(false);
  };

  useEffect(() => {
    initRound(round);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [round]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setCurrentDepth(Math.floor(scrollTop));
    if (scrollTop > 50) setHasScrolled(true);
  };

  const handleFind = (id: number) => {
    if (!foundItems.includes(id) && !showLevelUp) {
      audioService.playCollect();
      const next = [...foundItems, id];
      setFoundItems(next);
      if (next.length === items.length) {
        if (round < totalRounds) {
          handleRoundComplete(false);
        } else {
          handleRoundComplete(true);
        }
      }
    }
  };

  const handleRoundComplete = (isLast: boolean) => {
    audioService.playSuccess();

    if (isLast) {
      setIsGameComplete(true);
      setTimeout(onComplete, 2500);
    } else {
      setTimeout(() => {
        setShowLevelUp(true);
        setTimeout(() => {
          setShowLevelUp(false);
          setRound(r => r + 1);
        }, 2500);
      }, 2000);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden select-none bg-gradient-to-b from-[#1e3a8a] via-[#0a192f] to-[#020617]">
      <div className="absolute inset-0 z-30 pointer-events-none">
        <GameHUD
          round={round}
          totalRounds={totalRounds}
          instruction="ស្វែងរកទ្រព្យសម្បតិ្តក្រោមបាតសមុទ្រ! 🌊"
          score={foundItems.length}
          goal={items.length}
          actionType="Scroll"
        />

        <div className="pt-24 px-4 w-full flex flex-col items-center">
          <div className="bg-blue-950/80 p-3 rounded-2xl border border-blue-400/30 shadow-xl max-w-xl w-full backdrop-blur-sm pointer-events-auto">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-md font-bold text-blue-300">វត្ថុដែលត្រូវរក:</span>
              <span className="bg-sky-600/80 px-3 py-0.5 rounded-full text-[10px] text-white border border-white/20 shadow-inner">ជម្រៅ: {currentDepth}m</span>
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              {items.map(it => (
                <span
                  key={it.id}
                  className={`text-xl transition-all duration-500 ${foundItems.includes(it.id) ? 'grayscale-0 scale-125 animate-pop-in' : 'grayscale opacity-40 scale-100'}`}
                >
                  {it.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto custom-scrollbar z-20 scroll-smooth pt-60"
        onScroll={handleScroll}
      >
        <div className="relative w-full" style={{ height: `${(items.length * 1000) + 1200}px` }}>
          {/* Start Marker */}

          {!hasScrolled && (
            <div className="absolute top-0 right-1/5 -translate-x-1/2 text-white font-black text-6xl md:text-8xl uppercase tracking-[0.5em] pointer-events-none animate-start-shine opacity-20">
              START
            </div>
          )}

          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleFind(item.id)}
              className={`absolute left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-4 border-white/20 transition-all ${foundItems.includes(item.id) ? 'bg-yellow-400/40 border-yellow-300 scale-110 shadow-[0_0_30px_rgba(253,224,71,0.5)]' : 'hover:bg-white/10 hover:border-white/40 active:scale-95'}`}
              style={{ top: `${item.depth}px` }}
            >
              <span className="text-7xl drop-shadow-2xl">{item.emoji}</span>
              {!foundItems.includes(item.id) && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max text-white font-bold text-xs uppercase tracking-widest bg-sky-500 px-3 py-1 rounded-full border-2 border-white/50 shadow-lg animate-bounce">
                  ចុចទីនេះ
                </div>
              )}
              {foundItems.includes(item.id) && (
                <div className="absolute -top-4 -right-4 bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg border-4 border-white animate-pop-in">
                  ✓
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Scroll Down Indicator */}
        {!hasScrolled && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/80 animate-scroll-down pointer-events-none">
            <span className="font-black uppercase tracking-widest text-sm">អូសចុះក្រោម</span>
            <div className="w-10 h-10 border-b-4 border-r-4 border-white rotate-45 rounded-sm" />
          </div>
        )}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
            <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-blue-900">ចុះទៅកាន់តែជ្រៅថែមទៀត! </p>
          </div>
        </div>
      )}

      {isGameComplete && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
            <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4 uppercase">ដល់គោលដៅហើយ! 🎉</h2>
            <p className="text-xl font-black text-blue-900">ពូកែណាស់កូន! 🌟</p>
          </div>
        </div>
      )}


    </div>
  );
};