import React, { useState, useEffect } from 'react';
import { audioService } from '../services/audioService';

export const Flashlight: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [keys, setKeys] = useState<{ id: number; x: number; y: number; found: boolean }[]>([]);
  const [mouse, setMouse] = useState({ x: 50, y: 50 });
  const [showLevelUp, setShowLevelUp] = useState(false);

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 2;
    const newKeys = Array.from({ length: rc }).map((_, i) => ({
      id: i, x: 15 + Math.random() * 70, y: 15 + Math.random() * 60, found: false
    }));
    setKeys(newKeys);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handleMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  const handleKey = (id: number) => {
    if (showLevelUp) return;
    audioService.playCollect();
    const next = keys.map(k => k.id === id ? { ...k, found: true } : k);
    setKeys(next);
    if (next.every(k => k.found)) {
      if (round < totalRounds) {
        handleRoundComplete();
      } else {
        setTimeout(onComplete, 1500);
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
    <div 
      onMouseMove={handleMove}
      className="relative w-full h-full bg-black overflow-hidden cursor-none"
      style={{ 
        background: `radial-gradient(circle at ${mouse.x}% ${mouse.y}%, rgba(255,255,255,0.25) 0%, rgba(0,0,0,1) 120px)` 
      }}
    >
      <div className="absolute top-4 right-8 z-40 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 shadow-sm">
        <span className="text-white font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white font-black uppercase text-sm tracking-widest text-center w-full z-10 pointer-events-none">
         ស្វែងរកសោទាំង {keys.length} ដែលលាក់ទុក! ({keys.filter(k => k.found).length}/{keys.length})
      </div>
      
      {keys.map(k => !k.found && (
        <button
          key={`${round}-${k.id}`}
          onClick={() => handleKey(k.id)}
          onMouseEnter={() => audioService.playHover()}
          className="absolute text-5xl opacity-0 hover:opacity-100 transition-opacity p-8 z-20 hover:scale-125 duration-300 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
          style={{ left: `${k.x}%`, top: `${k.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          🔑
        </button>
      ))}
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-10 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
        {keys.map(k => (
          <div key={`${round}-${k.id}`} className={`text-2xl transition-all duration-700 ${k.found ? 'opacity-100 scale-110' : 'opacity-10 grayscale'}`}>
            {k.found ? '🔑' : '🗝️'}
          </div>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-950/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-100 text-center">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-sky-900">សោលាក់ខ្លួនកាន់តែច្រើន! 🔍</p>
          </div>
        </div>
      )}
    </div>
  );
};