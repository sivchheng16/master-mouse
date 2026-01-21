import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface MagicalColorsProps {
  onComplete: () => void;
  count?: number;
}

const EMOJIS = ['💎', '⭐', '🍀', '🍎', '🦋', '🍭', '🌈', '🌸', '🍕', '🛸'];

const MagicalColors: React.FC<MagicalColorsProps> = ({ onComplete, count = 4 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [colored, setColored] = useState<number[]>([]);
  const [shapes, setShapes] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentRoundCount = count + (round - 1) * 3;

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 3;
    const newShapes = Array.from({ length: rc }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      emoji: EMOJIS[(i + (r * 3)) % EMOJIS.length]
    }));
    setShapes(newShapes);
    setColored([]);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleRightClick = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    if (!colored.includes(id) && !showLevelUp) {
      audioService.playCollect();
      const next = [...colored, id];
      setColored(next);
      if (next.length === shapes.length) {
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
      setRound(r => r + 1);
    }, 2500);
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden shadow-inner flex flex-col">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ប្រើប៊ូតុងម៉ៅខាងស្តាំដើម្បីដាស់រូបរាង!"
        score={colored.length}
        goal={shapes.length}
      />

      <div className="relative flex-1">
        {shapes.map((shape) => (
          <div
            key={`${round}-${shape.id}`}
            onContextMenu={(e) => handleRightClick(e, shape.id)}
            className={`absolute w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-4xl md:text-5xl rounded-3xl md:rounded-full transition-all duration-500 cursor-help border-4 ${colored.includes(shape.id)
                ? 'bg-white border-yellow-400 shadow-xl scale-110 rotate-12'
                : 'bg-slate-300 border-slate-400 grayscale opacity-60 scale-100'
              }`}
            style={{ left: `${shape.x}%`, top: `${shape.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {colored.includes(shape.id) ? shape.emoji : '⚪'}
          </div>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-slate-200 text-center">
            <h2 className="title-font text-5xl text-indigo-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-slate-900">រូបរាងកាន់តែច្រើនកំពុងរង់ចាំ! ✨</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default MagicalColors;