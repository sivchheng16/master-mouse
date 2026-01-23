import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

interface Shape {
  id: string;
  emoji: string;
  color: string;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  isPlaced: boolean;
}

export const ShapePuzzle: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    const initialShapes: Shape[] = [
      { id: 'star', emoji: '⭐', color: 'bg-yellow-100', targetX: 30, targetY: 35, currentX: 10, currentY: 75, isPlaced: false },
      { id: 'heart', emoji: '❤️', color: 'bg-red-100', targetX: 70, targetY: 35, currentX: 35, currentY: 75, isPlaced: false },
      { id: 'moon', emoji: '🌙', color: 'bg-indigo-100', targetX: 30, targetY: 65, currentX: 60, currentY: 75, isPlaced: false },
      { id: 'sun', emoji: '☀️', color: 'bg-orange-100', targetX: 70, targetY: 65, currentX: 85, currentY: 75, isPlaced: false }
    ];
    setShapes(initialShapes);
  }, []);

  const handleMouseDown = (id: string) => {
    if (shapes.find(s => s.id === id)?.isPlaced) return;
    audioService.playDragStart();
    setDraggingId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setShapes(prev => prev.map(s => s.id === draggingId ? { ...s, currentX: x, currentY: y } : s));
  };

  const handleMouseUp = () => {
    if (!draggingId) return;

    setShapes(prev => {
      const shape = prev.find(s => s.id === draggingId);
      if (!shape) return prev;

      const dist = Math.sqrt(Math.pow(shape.currentX - shape.targetX, 2) + Math.pow(shape.currentY - shape.targetY, 2));

      let nextShapes;
      if (dist < 10) {
        audioService.playCollect();
        nextShapes = prev.map(s => s.id === draggingId ? { ...s, isPlaced: true, currentX: s.targetX, currentY: s.targetY } : s);
      } else {
        audioService.playError();
        // Return to start area roughly
        nextShapes = prev.map(s => s.id === draggingId ? { ...s, currentX: s.id === 'star' ? 10 : s.id === 'heart' ? 35 : s.id === 'moon' ? 60 : 85, currentY: 75 } : s);
      }

      if (nextShapes.every(s => s.isPlaced)) {
        setTimeout(onComplete, 1500);
      }
      return nextShapes;
    });

    setDraggingId(null);
  };

  return (
    <div
      className="relative w-full h-full bg-slate-50 overflow-hidden select-none p-4"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <GameHUD
        instruction="ដាក់រូបរាងឱ្យត្រូវកន្លែង!"
        score={shapes.filter(s => s.isPlaced).length}
        goal={shapes.length}
      />

      <div className="absolute inset-0 pointer-events-none">
        {shapes.map(s => (
          <div
            key={`target-${s.id}`}
            className="absolute w-24 h-24 md:w-32 md:h-32 border-4 border-dashed border-slate-200 rounded-3xl flex items-center justify-center transition-all"
            style={{ left: `${s.targetX}%`, top: `${s.targetY}%`, transform: 'translate(-50%, -50%)' }}
          >
            <span className="text-4xl md:text-6xl opacity-10 grayscale">{s.emoji}</span>
          </div>
        ))}
      </div>

      {shapes.map(s => (
        <div
          key={s.id}
          onMouseDown={() => handleMouseDown(s.id)}
          onMouseEnter={() => !s.isPlaced && audioService.playHover()}
          className={`absolute w-24 h-24 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-5xl md:text-7xl shadow-lg border-4 transition-all ${s.isPlaced
            ? 'bg-emerald-100 border-emerald-400 scale-95 shadow-none'
            : draggingId === s.id
              ? 'bg-white border-sky-400 scale-110 z-50 cursor-grabbing'
              : 'bg-white border-white cursor-grab hover:scale-105'
            }`}
          style={{
            left: `${s.currentX}%`,
            top: `${s.currentY}%`,
            transform: 'translate(-50%, -50%)',
            transition: draggingId === s.id ? 'none' : 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {s.emoji}
          {s.isPlaced && <div className="absolute -top-2 -right-2 text-2xl animate-bounce">⭐</div>}
        </div>
      ))}

      {shapes.every(s => s.isPlaced) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-md z-30 animate-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[4rem] border-8 border-sky-200 shadow-2xl flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <span className="text-6xl animate-bounce">⭐</span>
              <span className="text-6xl animate-bounce delay-100">❤️</span>
              <span className="text-6xl animate-bounce delay-200">🌙</span>
            </div>
            <h2 className="title-font text-4xl md:text-6xl text-sky-600 uppercase">ជោគជ័យ!</h2>
          </div>
        </div>
      )}
    </div>
  );
};