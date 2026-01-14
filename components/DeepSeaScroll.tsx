import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface DeepSeaScrollProps {
  onComplete: () => void;
  count?: number;
}

const POOL_ITEMS = [
  { emoji: '🐚', name: 'សម្បកខ្យង' }, { emoji: '🦀', name: 'ក្តាមរីករាយ' }, { emoji: '👑', name: 'ម្កុដមាស' }, { emoji: '🐳', name: 'បាឡែន' },
  { emoji: '🐙', name: 'មឹកយក្ស' }, { emoji: '🧜‍♀️', name: 'នាងមច្ឆា' }, { emoji: '🔱', name: 'ត្រីសូល៍' }, { emoji: '💎', name: 'ត្បូង' }
];

export const DeepSeaScroll: React.FC<DeepSeaScrollProps> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [foundItems, setFoundItems] = useState<number[]>([]);
  const [items, setItems] = useState<{ id: number; emoji: string; name: string; depth: number }[]>([]);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 2;
    const spacing = 900;
    const newItems = Array.from({ length: rc }).map((_, i) => ({
      id: Math.random(),
      emoji: POOL_ITEMS[i % POOL_ITEMS.length].emoji,
      name: POOL_ITEMS[i % POOL_ITEMS.length].name,
      depth: (i * spacing) + 500 + Math.random() * 200
    }));
    setItems(newItems);
    setFoundItems([]);
    setCurrentDepth(0);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleFind = (id: number) => {
    if (!foundItems.includes(id) && !showLevelUp) {
      audioService.playCollect();
      const next = [...foundItems, id];
      setFoundItems(next);
      if (next.length === items.length) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(onComplete, 2000);
        }
      }
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2500);
  };

  return (
    <div className="relative w-full h-full bg-[#0a192f] flex flex-col overflow-hidden select-none">
      <div className="absolute top-4 right-8 z-40 bg-blue-900/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-400 shadow-sm">
        <span className="text-white font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="relative z-30 pt-4 px-4 w-full flex flex-col items-center">
        <div className="bg-blue-950/90 p-4 rounded-2xl border-2 border-blue-400/30 shadow-2xl max-w-2xl w-full">
          <div className="flex justify-between items-center mb-2 px-1">
            <span className="text-xs font-black text-blue-300">ស្វែងរក ({foundItems.length}/{items.length}):</span>
            <span className="bg-sky-500 px-3 py-1 rounded-full text-xs text-white">ជម្រៅ: {currentDepth}m</span>
          </div>
          <div className="flex gap-2 justify-center">
            {items.map(it => <span key={it.id} className={`text-2xl ${foundItems.includes(it.id) ? 'grayscale-0' : 'grayscale opacity-30'}`}>{it.emoji}</span>)}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar" onScroll={(e) => setCurrentDepth(Math.floor(e.currentTarget.scrollTop))}>
        <div className="relative w-full" style={{ height: `${items.length * 900 + 1000}px`, background: 'linear-gradient(to bottom, #1e3a8a, #020617)' }}>
          {items.map(item => (
            <button key={item.id} onClick={() => handleFind(item.id)} className={`absolute left-1/2 -translate-x-1/2 w-40 h-40 rounded-full border-2 border-white/10 transition-all ${foundItems.includes(item.id) ? 'bg-yellow-400/20 border-yellow-300 scale-110' : 'hover:bg-white/5'}`} style={{ top: `${item.depth}px` }}>
              <span className="text-7xl">{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
            <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-blue-900">ចុះទៅកាន់តែជ្រៅថែមទៀត! ⚓</p>
          </div>
        </div>
      )}
    </div>
  );
};