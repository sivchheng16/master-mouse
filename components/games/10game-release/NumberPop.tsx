import React, { useState, useEffect } from 'react';
import { audioService } from '../../../services/audioService';
import { GameHUD } from '../../GameHUD';

interface NumberPopProps {
  onComplete: () => void;
  total?: number;
}

export const NumberPop: React.FC<NumberPopProps> = ({ onComplete, total = 8 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [next, setNext] = useState(1);
  const [positions, setPositions] = useState<{ x: number, y: number }[]>([]);
  const [errorId, setErrorId] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentTotal = total + (round - 1) * 4;

  const initRound = (r: number) => {
    const newPositions: { x: number, y: number }[] = [];
    const minDistance = 15;
    const count = total + (r - 1) * 4;

    for (let i = 0; i < count; i++) {
      let x, y, tooClose;
      let attempts = 0;
      do {
        x = 10 + Math.random() * 80;
        y = 20 + Math.random() * 60;
        tooClose = newPositions.some(p => {
          const dx = p.x - x;
          const dy = p.y - y;
          return Math.sqrt(dx * dx + dy * dy) < minDistance;
        });
        attempts++;
      } while (tooClose && attempts < 200);
      newPositions.push({ x, y });
    }
    setPositions(newPositions);
    setNext(1);
    setIsProcessing(false);
  };

  useEffect(() => {
    initRound(round);
  }, [round, total]);

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound(r => r + 1);
      }, 2500);
    }, 2000);
  };

  const handleClick = (num: number) => {
    if (isProcessing || showLevelUp || num < next) return;

    if (num === next) {
      audioService.playPop();
      if (num === currentTotal) {
        setIsProcessing(true);
        if (round < totalRounds) {
          handleRoundComplete();
        } else {
          setNext(n => n + 1);
          setTimeout(onComplete, 2000);
        }
      } else {
        setNext(n => n + 1);
      }
    } else {
      audioService.playError();
      setErrorId(num);
      setIsProcessing(true);
      setTimeout(() => {
        setErrorId(null);
        setIsProcessing(false);
      }, 500);
    }
  };

  return (
    <div key={`num-round-${round}`} className="relative w-full h-full bg-slate-50 overflow-hidden select-none flex flex-col">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ចុចលេខតាមលំដាប់:"
        actionType="Click"
      />

      <div className="flex justify-center pt-20 z-20 shrink-0">
        <div className="bg-white/95 backdrop-blur-md border-2 border-sky-200 px-10 py-4 rounded-3xl shadow-xl flex items-center gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-sky-500 rounded-full flex items-center justify-center border-b-8 border-sky-700">
            <span className="text-white font-black text-2xl md:text-4xl">
              {next <= currentTotal ? next : '🎉'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full min-h-0">
        {positions.map((p, i) => {
          const num = i + 1;
          const isActive = num === next;
          const isDone = num < next;
          const isError = errorId === num;

          return (
            <div
              key={`num-${round}-${num}`}
              className={`absolute transition-all duration-300 ${isDone ? 'z-0' : (isActive || isError) ? 'z-30' : 'z-10'}`}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <button
                onClick={() => handleClick(num)}
                disabled={isDone || showLevelUp}
                className={`w-14 h-14 md:w-24 md:h-24 rounded-full text-2xl md:text-5xl font-black transition-all duration-300 border-4 flex flex-col items-center justify-center shadow-lg relative ${isDone
                  ? 'bg-emerald-100 text-emerald-400 border-emerald-200 scale-90 opacity-40'
                  : isError
                    ? 'bg-red-500 text-white border-white scale-110 animate-shake'
                    : isActive
                      ? 'bg-orange-500 text-white border-white scale-110 shadow-orange-200 animate-wiggle ring-4 ring-orange-200'
                      : 'bg-white text-sky-500 border-sky-50 hover:border-sky-300 hover:scale-105 active:scale-95'
                  }`}
              >
                <span>{num}</span>
                {isDone && (
                  <div className="absolute -bottom-2 -right-2 text-lg md:text-3xl animate-in zoom-in duration-500">⭐</div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-sky-900">ឡើងទៅជុំបន្ទាប់! ✨</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};