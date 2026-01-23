import React, { useState, useEffect, useCallback } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

export const GemSorter: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 4 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [items, setItems] = useState<{ id: number; type: 'RED' | 'BLUE'; x: number; y: number; startX: number; startY: number }[]>([]);
  const [dragId, setDragId] = useState<number | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 2;
    const newItems = Array.from({ length: rc }).map((_, i) => {
      const sx = 25 + Math.random() * 50;
      const sy = 15 + Math.random() * 25;
      return {
        id: i,
        type: i % 2 === 0 ? 'RED' as const : 'BLUE' as const,
        x: sx,
        y: sy,
        startX: sx,
        startY: sy
      };
    });
    setItems(newItems);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleDrag = useCallback((e: React.MouseEvent) => {
    if (dragId !== null && !showLevelUp) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setItems(prev => prev.map(i => i.id === dragId ? { ...i, x, y } : i));
    }
  }, [dragId, showLevelUp]);

  const handleStart = (id: number) => {
    if (showLevelUp) return;
    setDragId(id);
    audioService.playDragStart();
  };

  const handleDrop = () => {
    if (dragId !== null) {
      const item = items.find(i => i.id === dragId);
      if (item) {
        // Drop zones are simplified to left/right halves below 60% Y
        const inRedBin = item.x < 40 && item.y > 55;
        const inBlueBin = item.x > 60 && item.y > 55;

        const isCorrect = (item.type === 'RED' && inRedBin) || (item.type === 'BLUE' && inBlueBin);

        if (isCorrect) {
          audioService.playCollect();
          const next = items.filter(i => i.id !== dragId);
          setItems(next);
          if (next.length === 0) {
            if (round < totalRounds) {
              handleRoundComplete();
            } else {
              setTimeout(onComplete, 1200);
            }
          }
        } else {
          audioService.playError();
          setItems(prev => prev.map(i => i.id === dragId ? { ...i, x: i.startX, y: i.startY } : i));
        }
      }
      setDragId(null);
    }
  };

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

  const draggedItem = items.find(i => i.id === dragId);

  return (
    <div
      onMouseMove={handleDrag}
      onMouseUp={handleDrop}
      onMouseLeave={handleDrop}
      className="relative w-full h-full bg-pink-50/20 overflow-hidden select-none flex flex-col items-center"
    >
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction={`បែងចែកតាមពណ៌! (${items.length} នៅសល់)`}
      />



      <div className={`absolute bottom-6 left-6 w-32 h-32 md:w-44 md:h-40 border-4 rounded-2xl flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-300 ${draggedItem?.type === 'RED' ? 'bg-red-200 border-red-500 scale-105 shadow-red-200' : 'bg-red-100/40 border-red-500 opacity-60'}`}>
        <div className="text-6xl opacity-30">📦</div>
        <div className="font-black text-red-600 text-[10px] md:text-xs uppercase mt-1 bg-white px-3 py-1 rounded-full">ក្រហម (RED)</div>
      </div>

      <div className={`absolute bottom-6 right-6 w-32 h-32 md:w-44 md:h-40 border-4 rounded-2xl flex flex-col items-center justify-center p-2 shadow-lg transition-all duration-300 ${draggedItem?.type === 'BLUE' ? 'bg-blue-200 border-blue-500 scale-105 shadow-blue-200' : 'bg-blue-100/40 border-blue-500 opacity-60'}`}>
        <div className="text-6xl opacity-30">📦</div>
        <div className="font-black text-blue-600 text-[10px] md:text-xs uppercase mt-1 bg-white px-3 py-1 rounded-full">ខៀវ (BLUE)</div>
      </div>

      {items.map(item => (
        <div
          key={`${round}-${item.id}`}
          onMouseDown={() => handleStart(item.id)}
          className={`absolute text-5xl md:text-7xl cursor-grab active:cursor-grabbing transition-transform ${dragId === item.id ? 'scale-125 z-50 pointer-events-none' : 'hover:scale-110'}`}
          style={{
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: dragId === item.id ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {item.type === 'RED' ? '🍎' : '💎'}
        </div>
      ))}

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-pink-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-pink-100 text-center transform scale-125">
            <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-pink-900">ត្បូងកាន់តែច្រើនទៀត! 🍎💎</p>
          </div>
        </div>
      )}
    </div>
  );
};