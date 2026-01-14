
import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audioService';

interface ToySorterProps {
  onComplete: () => void;
  count?: number;
}

interface Toy {
  id: number;
  emoji: string;
  x: number;
  y: number;
  isSorted: boolean;
}

const EMOJIS = ['🧸', '🚗', '🦖', '⚽', '🧱', '🚁', '🎨', '🚀', '🚂', '🛸', '🤖', '👾', '🎲', '🧩'];

const ToySorter: React.FC<ToySorterProps> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [toys, setToys] = useState<Toy[]>([]);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const initRound = (r: number) => {
    const roundCount = count + (r - 1) * 2;
    const initialToys = Array.from({ length: roundCount }).map((_, i) => ({
      id: Math.random(),
      emoji: EMOJIS[i % EMOJIS.length],
      x: 15 + Math.random() * 70,
      y: 15 + Math.random() * 35,
      isSorted: false
    }));
    setToys(initialToys);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleStart = (id: number) => {
    audioService.playDragStart();
    setDraggingId(id);
  };

  const handleMove = (e: any) => {
    if (draggingId !== null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      
      setToys(prev => prev.map(t => (t.id === draggingId ? { ...t, x, y } : t)));
    }
  };

  const handleEnd = () => {
    if (draggingId !== null) {
      const toy = toys.find(t => t.id === draggingId);
      if (toy && toy.x > 30 && toy.x < 70 && toy.y > 60) {
        audioService.playCollect();
        const nextToys = toys.map(t => t.id === draggingId ? { ...t, isSorted: true } : t);
        setToys(nextToys);
        if (nextToys.every(t => t.isSorted)) {
          if (round < totalRounds) {
            handleRoundComplete();
          } else {
            setTimeout(onComplete, 1000);
          }
        }
      } else {
        audioService.playDragEnd();
      }
      setDraggingId(null);
    }
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setRound(r => r + 1);
    }, 2000);
  };

  const sortedCount = toys.filter(t => t.isSorted).length;
  const currentRoundTotal = count + (round - 1) * 2;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseUp={handleEnd}
      onTouchEnd={handleEnd}
      onMouseLeave={handleEnd}
      className="relative w-full h-full bg-orange-50 overflow-hidden select-none flex flex-col items-center"
    >
      {/* Round Indicator - Larger */}
      <div className="absolute top-4 right-8 z-40 bg-orange-100/90 backdrop-blur-md px-6 py-3 rounded-2xl border-2 border-orange-200 shadow-sm">
        <span className="text-orange-900 font-black text-sm md:text-xl uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="absolute top-10 bg-white/90 px-10 py-4 rounded-3xl border-2 border-orange-100 shadow-xl z-20">
        <div className="text-xl md:text-3xl font-black text-orange-700">អូសប្រដាប់ក្មេងលេងចូលក្នុងប្រអប់! ({sortedCount}/{currentRoundTotal})</div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 md:w-64 h-24 md:h-40 bg-orange-200 border-4 border-orange-400 rounded-b-3xl flex flex-col items-center justify-end p-2 md:p-4 shadow-inner">
        <div className="text-3xl md:text-6xl">📦</div>
        <div className="font-black text-orange-800 text-[10px] md:text-sm uppercase tracking-widest mt-1">ប្រអប់</div>
      </div>

      {toys.map((toy) => !toy.isSorted && (
        <div
          key={toy.id}
          onMouseDown={() => handleStart(toy.id)}
          onTouchStart={() => handleStart(toy.id)}
          onMouseEnter={() => audioService.playHover()}
          className={`absolute cursor-grab active:cursor-grabbing text-4xl md:text-7xl transition-transform ${draggingId === toy.id ? 'scale-125 z-50' : 'hover:scale-110'}`}
          style={{ 
            left: `${toy.x}%`, 
            top: `${toy.y}%`, 
            transform: `translate(-50%, -50%)`,
            transition: draggingId === toy.id ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {toy.emoji}
        </div>
      ))}

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-950/30 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-orange-200 text-center">
            <h2 className="title-font text-4xl text-orange-600 animate-bounce mb-2">រៀបចំស្អាតហើយ!</h2>
            <p className="text-lg font-black text-orange-800">នៅមានរបស់លេងច្រើនទៀត... 🧸🚀</p>
            <div className="text-6xl mt-4">📦✨</div>
          </div>
        </div>
      )}

      {round === totalRounds && toys.every(t => t.isSorted) && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-30">
          <h2 className="text-2xl md:text-5xl font-black text-orange-600 animate-bounce">រៀបចំស្អាតអស់ហើយ! 🏆🧸</h2>
        </div>
      )}
    </div>
  );
};

// Fix: Added missing default export to match import in App.tsx
export default ToySorter;
