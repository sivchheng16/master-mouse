import React, { useState, useEffect } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

const EMOJIS = ['🦊', '🐰', '🦉', '🐻', '🐹', '🐧', '🦁', '🐯', '🦒', '🐘'];

export const Spotlight: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
  const [found, setFound] = useState<number[]>([]);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);

  useEffect(() => {
    const newTargets = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 70 + 15,
      emoji: EMOJIS[i % EMOJIS.length]
    }));
    setTargets(newTargets);
    setFound([]);
  }, [count]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleClick = (id: number | null) => {
    if (id !== null && !found.includes(id)) {
      audioService.playCollect();
      const next = [...found, id];
      setFound(next);
      if (next.length === targets.length) setTimeout(onComplete, 1500);
    } else {
      audioService.playError();
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => {
        // If clicking background
        if (e.target === e.currentTarget) handleClick(null);
      }}
      className="relative w-full h-full bg-gray-950 overflow-hidden cursor-none"
      style={{
        background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, transparent 40px, rgba(0,0,0,0.98) 100px)`
      }}
    >
      <GameHUD
        instruction="ស្វែងរកសត្វដែលលាក់ខ្លួន!"
        score={found.length}
        goal={count}
      />
      {targets.map(t => (
        <button
          key={t.id}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleClick(t.id);
          }}
          className={`absolute text-5xl md:text-6xl transition-all duration-500 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] ${found.includes(t.id) ? 'opacity-100 scale-110' : 'opacity-0 hover:opacity-100'}`}
          style={{ left: `${t.x}%`, top: `${t.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          {t.emoji}
        </button>
      ))}
      <div
        className="absolute w-20 h-20 md:w-24 md:h-24 border-4 border-white/40 rounded-full pointer-events-none shadow-[0_0_50px_rgba(255,255,255,0.2)]"
        style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%`, transform: 'translate(-50%, -50%)' }}
      >
        <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-ping" />
      </div>

    </div>
  );
};