import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

export const WaterRefill: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fillLevel, setFillLevel] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // The target line is at 85% fill level (15% from the top)
  const TARGET_THRESHOLD = 85;

  const startFilling = () => {
    if (isComplete) return;
    setIsHolding(true);
    audioService.playDragStart();
    intervalRef.current = window.setInterval(() => {
      // Play fluid sound every few ticks
      if (Math.random() > 0.7) audioService.playFluid();

      setFillLevel(prev => {
        const next = Math.min(prev + 0.8, 100);
        // We trigger completion once they reach or pass the target line
        if (next >= TARGET_THRESHOLD && !isComplete) {
          setIsComplete(true);
          audioService.playCollect();
          // Briefly fill a bit more for a satisfying "full" feeling
          setTimeout(() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setTimeout(onComplete, 1500);
          }, 400);
        }
        return next;
      });
    }, 20);
  };

  const stopFilling = () => {
    setIsHolding(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center p-8 select-none overflow-hidden"
      onMouseDown={startFilling}
      onMouseUp={stopFilling}
      onMouseLeave={stopFilling}
      onTouchStart={startFilling}
      onTouchEnd={stopFilling}
    >
      <GameHUD
        instruction={isComplete ? 'ពេញហើយ! ✨' : isHolding ? 'កំពុងបំពេញ...' : 'ចុចម៉ៅឱ្យជាប់ដើម្បីបំពេញទឹក!'}
        progress={fillLevel}
      />

      {/* Tap / Dispenser */}
      <div className="absolute top-[18%] w-24 h-24 flex flex-col items-center z-10">
        <div className="w-16 h-12 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 rounded-t-xl border-x-4 border-slate-400 shadow-md" />
        <div className="w-8 h-6 bg-slate-400 rounded-b-lg shadow-inner" />
        {isHolding && !isComplete && (
          <div className="relative w-4 h-[45vh] bg-blue-400/40 blur-[1px] shadow-[0_0_15px_rgba(96,165,250,0.5)] flex flex-col items-center overflow-hidden">
            <div className="w-full h-full bg-gradient-to-b from-blue-300/60 to-blue-500/80 animate-[stream_0.5s_linear_infinite]" />
          </div>
        )}
      </div>

      {/* Water Bottle / Container */}
      <div className="relative w-48 h-72 md:w-64 md:h-96 mt-20">
        {/* The Glass Container */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] rounded-[3rem] border-[6px] border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_4px_20px_rgba(255,255,255,0.8)] overflow-hidden z-10">

          {/* Refraction/Highlights on Glass */}
          <div className="absolute left-4 top-10 bottom-10 w-2 bg-white/30 rounded-full blur-[2px]" />
          <div className="absolute right-6 top-20 bottom-20 w-1 bg-white/20 rounded-full blur-[1px]" />

          {/* Water Fill */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-b from-sky-300 to-blue-600 transition-all duration-100 ease-linear overflow-hidden"
            style={{ height: `${fillLevel}%` }}
          >
            {/* Wave Animation at the Top */}
            <div className="absolute top-0 left-0 w-[200%] h-10 -translate-y-1/2">
              <svg className="w-full h-full animate-[wave_3s_linear_infinite]" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0 10 Q 25 20 50 10 T 100 10 T 150 10 T 200 10 V 20 H 0 Z" fill="rgba(255,255,255,0.4)" />
              </svg>
            </div>

            {/* Inner highlights for water */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* Bubbles */}
            {(isHolding || isComplete) && Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="absolute bg-white/30 rounded-full animate-float-up"
                style={{
                  width: `${Math.random() * 8 + 4}px`,
                  height: `${Math.random() * 8 + 4}px`,
                  left: `${Math.random() * 90}%`,
                  bottom: `-${Math.random() * 20}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 2 + 1}s`
                }}
              />
            ))}
          </div>

          {/* Target Line - More distinct */}
          <div
            className="absolute left-0 right-0 border-t-[3px] border-dashed border-yellow-400 z-20 flex justify-center"
            style={{ top: `${100 - TARGET_THRESHOLD}%` }}
          >
            <div className="bg-yellow-400 text-yellow-900 text-[9px] font-black px-3 py-1 rounded-full -mt-3 uppercase tracking-widest shadow-md">
              បន្ទាត់ជ័យជំនះ • WIN LINE
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-blue-900/40 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3">
        <span className="w-8 h-px bg-current opacity-20" />
        Click and Hold Training
        <span className="w-8 h-px bg-current opacity-20" />
      </div>

      <style>{`
        @keyframes stream {
          0% { transform: translateY(-10%); }
          100% { transform: translateY(0%); }
        }
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.5; }
          80% { opacity: 0.5; }
          100% { transform: translateY(-300px) scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
};