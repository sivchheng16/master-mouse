
import React, { useState, useEffect } from 'react';
import { GameHUD } from './GameHUD';

interface MysteryChestsProps {
  onComplete: () => void;
  count?: number;
}

const TREASURES = ['💎', '👑', '💰', '🌟', '🏆', '🎁', '💍', '🦄'];

const MysteryChests: React.FC<MysteryChestsProps> = ({ onComplete, count = 3 }) => {
  const [opened, setOpened] = useState<number[]>([]);
  const [chests, setChests] = useState<{ id: number; treasure: string }[]>([]);

  useEffect(() => {
    const newChests = Array.from({ length: count }).map((_, i) => ({
      id: i,
      treasure: TREASURES[i % TREASURES.length]
    }));
    setChests(newChests);
    setOpened([]);
  }, [count]);

  const handleDoubleClick = (id: number) => {
    if (!opened.includes(id)) {
      const next = [...opened, id];
      setOpened(next);
      if (next.length === count) {
        setTimeout(onComplete, 2000);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-purple-50 overflow-hidden shadow-inner flex flex-wrap items-center justify-center gap-4 p-8">
      <GameHUD
        instruction="ចុចពីរដងដើម្បីបើកហឹបកំណប់!"
        score={opened.length}
        goal={count}
      />

      {chests.map((chest) => (
        <div
          key={chest.id}
          onDoubleClick={() => handleDoubleClick(chest.id)}
          className={`group w-24 h-24 md:w-40 md:h-40 cursor-pointer flex flex-col items-center justify-center rounded-3xl transition-all duration-300 border-4 ${opened.includes(chest.id) ? 'bg-yellow-100 border-yellow-400' : 'bg-purple-200 border-purple-300 hover:bg-purple-300'
            }`}
        >
          <div className={`text-5xl md:text-7xl transition-transform ${opened.includes(chest.id) ? 'scale-110' : 'group-hover:scale-105'}`}>
            {opened.includes(chest.id) ? chest.treasure : '🎁'}
          </div>
          <div className="mt-1 font-black text-purple-800 text-[8px] md:text-xs text-center uppercase">
            {opened.includes(chest.id) ? 'BINGO!' : 'Double Click!'}
          </div>
        </div>
      ))}

      {chests.length > 0 && opened.length === chests.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-purple-600 animate-bounce text-center">កូនរកឃើញកំណប់ហើយ! 🏴‍☠️✨</h2>
        </div>
      )}
    </div>
  );
};

export default MysteryChests;
