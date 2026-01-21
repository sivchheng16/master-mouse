import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface MagicGardenProps {
  onComplete: () => void;
  count?: number;
}

const MagicGarden: React.FC<MagicGardenProps> = ({ onComplete, count = 9 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [revealed, setRevealed] = useState<number[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentRoundCount = count + (round - 1) * 3;

  const handleAction = (id: number) => {
    if (!revealed.includes(id) && !showLevelUp) {
      audioService.playTing(revealed.length);
      const nextRevealed = [...revealed, id];
      setRevealed(nextRevealed);
      if (nextRevealed.length === currentRoundCount) {
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setTimeout(onComplete, 1500);
        }
      }
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRevealed([]);
      setRound(r => r + 1);
    }, 2000);
  };

  return (
    <div className="relative w-full h-full bg-emerald-50 overflow-hidden shadow-inner flex flex-col p-4 md:p-8">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ដាក់ម៉ៅពីលើដើម្បីឱ្យផ្ការីក!"
        score={revealed.length}
        goal={currentRoundCount}
      />

      <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 gap-2 md:gap-4 pb-4 ">
        {Array.from({ length: currentRoundCount }).map((_, i) => (
          <div
            key={`${round}-${i}`}
            onMouseEnter={() => handleAction(i)}
            onClick={() => handleAction(i)}
            className={`flex items-center justify-center rounded-2xl md:rounded-[2.5rem] transition-all duration-300 cursor-crosshair group relative border-2 ${revealed.includes(i)
                ? 'bg-white border-emerald-200 shadow-md scale-100'
                : 'bg-emerald-100/30 border-emerald-100/50 scale-95 hover:bg-emerald-100/60'
              }`}
          >
            {!revealed.includes(i) && (
              <div className="w-2 h-2 md:w-5 md:h-5 bg-emerald-300 rounded-full animate-pulse opacity-50" />
            )}
            <span className={`text-4xl md:text-7xl transition-all duration-700 ${revealed.includes(i) ? 'scale-100' : 'opacity-0 scale-50'}`}>
              {['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '💐', '🌵', '🌱', '🌿', '☘️', '🍀', '🍃', '🎋', '🍄'][i % 15]}
            </span>
          </div>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/30 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-emerald-100 text-center">
            <h2 className="title-font text-4xl text-emerald-600 animate-bounce mb-2">សួនផ្កាដ៏ស្អាត!</h2>
            <p className="text-lg font-black text-emerald-800">ត្រៀមខ្លួនសម្រាប់ជុំបន្ទាប់... ✨</p>
          </div>
        </div>
      )}

      {round === totalRounds && revealed.length === currentRoundCount && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md z-30 animate-in fade-in duration-500">
          <h2 className="title-font text-2xl md:text-6xl text-emerald-600 animate-pulse drop-shadow-md text-center">សួនផ្កាដ៏ស្អាតបំផុត! 🌿✨</h2>
        </div>
      )}
    </div>
  );
};

export default MagicGarden;