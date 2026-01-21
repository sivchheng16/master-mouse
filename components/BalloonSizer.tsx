import React, { useState, useEffect, useMemo, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface BalloonSizerProps {
  onComplete: () => void;
  tolerance?: number;
}

export const BalloonSizer: React.FC<BalloonSizerProps> = ({ onComplete, tolerance = 12 }) => {
  const [size, setSize] = useState(60);
  const [isScrolling, setIsScrolling] = useState(false);
  const [success, setSuccess] = useState(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Random target size between 160 and 260
  const targetSize = useMemo(() => 160 + Math.random() * 100, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (success) return;

    setIsScrolling(true);
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);

    setSize(prev => {
      const change = e.deltaY * -0.15;
      const next = Math.min(Math.max(prev + change, 30), 400);

      const diff = Math.abs(next - targetSize);

      // Play resizing sound
      if (Math.abs(change) > 1) {
        audioService.playBubble();
      }

      if (diff < tolerance) {
        setSuccess(true);
        audioService.playCollect();
        setTimeout(onComplete, 1500);
      }
      return next;
    });

    scrollTimeoutRef.current = window.setTimeout(() => setIsScrolling(false), 300);
  };

  const diff = Math.abs(size - targetSize);
  const isNear = diff < tolerance * 3;
  const isPerfect = diff < tolerance;

  return (
    <div
      onWheel={handleWheel}
      className="relative w-full h-full bg-gradient-to-b from-[#e0f7fa] to-[#b2ebf2] flex flex-col items-center justify-center overflow-hidden p-8 select-none"
    >
      <GameHUD
        instruction="ប្រើកង់ម៉ៅ (SCROLL) ដើម្បីតម្រូវទំហំ!"
      />

      {!success && (
        <div className="absolute left-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 z-20 opacity-60">
          <div className="w-10 h-16 border-4 border-sky-400 rounded-2xl relative flex justify-center p-1">
            <div className={`w-2 h-4 bg-sky-500 rounded-full ${isScrolling ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <span className="text-[10px] font-black text-sky-800 uppercase tracking-widest vertical-text">Scroll Up/Down</span>
        </div>
      )}

      <div className="relative flex items-center justify-center pointer-events-none">
        {/* Target Ring - Circular */}
        <div
          className={`absolute border-[6px] border-dashed rounded-full transition-all duration-300 flex items-center justify-center ${isPerfect ? 'border-emerald-500 scale-105 opacity-100' : isNear ? 'border-sky-400 animate-pulse' : 'border-sky-300/40'
            }`}
          style={{ width: targetSize, height: targetSize }}
        >
          {isPerfect && (
            <div className="absolute inset-0 border-4 border-emerald-400 rounded-full animate-ping opacity-20" />
          )}
        </div>

        {/* The Balloon - Circular Shape */}
        <div
          className={`relative transition-all duration-75 flex flex-col items-center justify-center ${success ? 'animate-spring' : ''}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          <div
            className={`w-full h-full rounded-full transition-colors duration-300 shadow-2xl relative flex items-center justify-center ${isPerfect ? 'bg-emerald-500' : isNear ? 'bg-orange-400' : 'bg-red-500'
              }`}
            style={{
              background: isPerfect
                ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, transparent 25%), radial-gradient(circle at 30% 30%, #10b981 0%, #064e3b 150%)`
                : isNear
                  ? `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, transparent 25%), radial-gradient(circle at 30% 30%, #f97316 0%, #7c2d12 150%)`
                  : `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.7) 0%, transparent 25%), radial-gradient(circle at 30% 30%, #ef4444 0%, #7f1d1d 150%)`,
              boxShadow: 'inset -5px -10px 15px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.15)'
            }}
          >
            <span className="text-white/20 text-3xl md:text-5xl font-black">🎈</span>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-2" style={{ backgroundColor: 'inherit', clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          </div>

          <svg className="absolute top-[98%] left-1/2 -translate-x-1/2 w-10 h-32 overflow-visible opacity-30" viewBox="0 0 20 100">
            <path d="M10 0 Q 15 25 10 50 T 10 100" stroke="#075985" strokeWidth="2.5" fill="none" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-16 w-full max-w-sm px-8 z-10">
        <div className="bg-white/40 backdrop-blur-sm rounded-full h-3 border border-white/40 shadow-inner overflow-hidden flex items-center p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-200 ${isPerfect ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-sky-500'}`}
            style={{ width: `${Math.max(5, Math.min(100, (1 - (diff / 200)) * 100))}%` }}
          />
        </div>
      </div>

      {success && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-emerald-600 font-black text-2xl md:text-3xl animate-bounce bg-white/90 px-10 py-4 rounded-full border-4 border-emerald-100 shadow-2xl z-50">
          ទំហំត្រឹមត្រូវហើយ! 🏆✨
        </div>
      )}

      <style>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
      `}</style>
    </div>
  );
};