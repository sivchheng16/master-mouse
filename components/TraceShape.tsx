import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface Dot {
  id: number;
  x: number;
  y: number;
}

export const TraceShape: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 12 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [traced, setTraced] = useState<number[]>([]);
  const [dots, setDots] = useState<Dot[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const getShapeDots = (r: number, baseCount: number): Dot[] => {
    const newDots: Dot[] = [];
    const currentCount = baseCount + (r - 1) * 4;

    if (r === 1) {
      // Circle
      for (let i = 0; i < currentCount; i++) {
        const angle = (i * 2 * Math.PI) / currentCount;
        newDots.push({
          id: i,
          x: 50 + 35 * Math.cos(angle),
          y: 50 + 35 * Math.sin(angle)
        });
      }
    } else if (r === 2) {
      // Square
      const perSide = Math.ceil(currentCount / 4);
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 20 + (i / perSide) * 60, y: 20 }); // Top
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 80, y: 20 + (i / perSide) * 60 }); // Right
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 80 - (i / perSide) * 60, y: 80 }); // Bottom
      for (let i = 0; i < perSide; i++) newDots.push({ id: newDots.length, x: 20, y: 80 - (i / perSide) * 60 }); // Left
    } else {
      // Heart
      for (let i = 0; i < currentCount; i++) {
        const t = (i * 2 * Math.PI) / currentCount;
        // Heart curve parametric equations
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
        newDots.push({
          id: i,
          x: 50 + x * 2.2,
          y: 45 + y * 2.2
        });
      }
    }
    return newDots;
  };

  useEffect(() => {
    setDots(getShapeDots(round, count));
    setTraced([]);
  }, [round, count]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1 || showLevelUp || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    // Find the closest untraced dot
    let closestId = -1;
    let minDist = 8; // Threshold distance for "catching" a dot

    dots.forEach((dot) => {
      if (!traced.includes(dot.id)) {
        const dist = Math.sqrt(Math.pow(dot.x - px, 2) + Math.pow(dot.y - py, 2));
        if (dist < minDist) {
          minDist = dist;
          closestId = dot.id;
        }
      }
    });

    if (closestId !== -1) {
      audioService.playTing(traced.length);
      const nextTraced = [...traced, closestId];
      setTraced(nextTraced);
      
      if (nextTraced.length === dots.length) {
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

  const shapeNames = ["រង្វង់ (CIRCLE)", "ការ៉េ (SQUARE)", "បេះដូង (HEART)"];

  return (
    <div className="relative w-full h-full bg-orange-50/30 flex flex-col items-center justify-center select-none overflow-hidden p-4">
      {/* Round Indicator */}
      <div className="absolute top-4 right-8 z-40 bg-orange-100/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-orange-200 shadow-sm">
        <span className="text-orange-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="mb-6 z-20 text-center animate-pop-in">
        <div className="inline-block bg-white/90 px-8 py-3 rounded-3xl border-2 border-orange-100 shadow-xl">
          <h2 className="text-xl md:text-2xl font-black text-orange-800 tracking-tight leading-none uppercase">
            ចុចឱ្យជាប់ហើយគូសតាមរូប! ({traced.length}/{dots.length})
          </h2>
          <div className="mt-1 text-[10px] font-black text-orange-400 tracking-[0.2em]">
            {shapeNames[round - 1]}
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseMove}
        className="relative w-72 h-72 md:w-[32rem] md:h-[32rem] flex-shrink flex items-center justify-center cursor-crosshair group"
      >
        {/* Connection Path Guide */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 100 100">
          <path 
            d={dots.map((d, i) => `${i === 0 ? 'M' : 'L'} ${d.x} ${d.y}`).join(' ') + (round === 1 || round === 3 ? ' Z' : '')} 
            fill="none" 
            stroke="orange" 
            strokeWidth="0.5" 
            strokeDasharray="2 2"
          />
        </svg>

        {dots.map(d => (
          <div
            key={`${round}-${d.id}`}
            className={`absolute w-8 h-8 md:w-11 md:h-11 rounded-full transition-all duration-300 border-2 border-white shadow-md flex items-center justify-center ${
              traced.includes(d.id) 
                ? 'bg-orange-500 scale-110 z-10 shadow-orange-200' 
                : 'bg-orange-100 opacity-60 group-hover:opacity-100'
            }`}
            style={{ left: `${d.x}%`, top: `${d.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {traced.includes(d.id) && (
              <span className="text-white text-xs animate-in zoom-in">⭐</span>
            )}
          </div>
        ))}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="text-7xl md:text-9xl opacity-[0.03] font-black text-orange-950 uppercase tracking-tighter rotate-12 select-none">
              {shapeNames[round-1].split(' ')[0]}
           </div>
        </div>
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-orange-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-orange-900">ត្រៀមខ្លួនសម្រាប់រូបរាងបន្ទាប់! ✨</p>
            <div className="text-7xl mt-6">🎨✨</div>
          </div>
        </div>
      )}

      {round === totalRounds && traced.length === dots.length && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md z-30 animate-in fade-in duration-500">
           <div className="text-center">
              <h2 className="title-font text-5xl md:text-8xl text-orange-600 animate-bounce drop-shadow-lg">ជោគជ័យ! 🏆</h2>
              <div className="flex justify-center gap-4 mt-4 text-5xl">
                <span>🌟</span><span>✨</span><span>🌟</span>
              </div>
           </div>
        </div>
      )}

      <div className="mt-8 text-orange-900/30 font-black text-[10px] md:text-xs uppercase tracking-[0.4em] pointer-events-none flex items-center gap-4">
        <span className="w-12 h-px bg-current opacity-20" />
        Trace and Hold Skills
        <span className="w-12 h-px bg-current opacity-20" />
      </div>
    </div>
  );
};