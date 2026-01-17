import React, { useState, useEffect, useCallback } from 'react';
import { audioService } from '../services/audioService';

interface Particle {
  id: number;
  tx: number;
  ty: number;
  color: string;
}

export const WhackMole: React.FC<{ onComplete: () => void; goal?: number; speed?: number }> = ({ onComplete, goal = 5, speed = 1000 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [active, setActive] = useState<number | null>(null);
  const [whacked, setWhacked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentSpeed = Math.max(400, speed - (round - 1) * 200);
  const currentGoal = goal + (round - 1) * 3;

  useEffect(() => {
    if (showLevelUp) return;

    const timer = setInterval(() => {
      setActive(prev => {
        let next;
        do {
          next = Math.floor(Math.random() * 9);
        } while (next === prev);
        return next;
      });
      setWhacked(null);
    }, currentSpeed);
    return () => clearInterval(timer);
  }, [currentSpeed, showLevelUp, round]);

  const createBoom = () => {
    const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => {
      const angle = (i / 12) * Math.PI * 2;
      const velocity = 50 + Math.random() * 70;
      return {
        id: Math.random(),
        tx: Math.cos(angle) * velocity,
        ty: Math.sin(angle) * velocity,
        color: i % 2 === 0 ? '#ef4444' : '#fbbf24'
      };
    });
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 600);
  };

  const handleClick = useCallback((index: number) => {
    if (showLevelUp || whacked !== null) return;

    if (index === active) {
      audioService.playWhack();
      setWhacked(index);
      setActive(null);
      createBoom();

      const newScore = score + 1;
      setScore(newScore);

      if (newScore >= currentGoal) {
        if (round < totalRounds) {
          setTimeout(handleRoundComplete, 400);
        } else {
          setTimeout(onComplete, 800);
        }
      }
    } else {
      audioService.playHover();
    }
  }, [active, whacked, score, currentGoal, round, totalRounds, showLevelUp]);

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      setScore(0);
      setRound(r => r + 1);
    }, 2500);
  };

  return (
    <div key={`whack-round-${round}`} className="relative w-full h-full bg-emerald-50/30 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden p-2 md:p-4">

      <div className="absolute top-4 w-full text-center z-20">
        <div className="inline-block bg-emerald-100/80 backdrop-blur-md px-8 py-3 rounded-[2rem] border-2 border-emerald-300 shadow-2xl">
          <h2 className="text-xl md:text-2xl font-black text-emerald-900 tracking-tight">ចុច​ឲ្យត្រូវលើសត្វល្អិត! ({score}/{currentGoal})</h2>
        </div>
      </div>

      <div className="absolute top-4 right-8 z-40 bg-emerald-100/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-emerald-300 shadow-lg">
        <span className="text-emerald-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-200/20 rounded-full blur-[80px]" />
      </div>

      <div className="mb-6 bg-white/95 backdrop-blur-xl px-10 py-3 rounded-3xl border-2 border-emerald-100 shadow-2xl z-10 font-black text-emerald-800 text-lg md:text-xl animate-spring shrink-0">
        ពិន្ទុ: <span className="text-orange-500 text-2xl md:text-3xl">{score}</span> / {currentGoal}
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-[320px] md:max-w-md aspect-square items-center shrink z-10">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} onClick={() => handleClick(i)} className={`w-full aspect-square rounded-[2rem] md:rounded-[2.5rem] flex items-center justify-center transition-all cursor-pointer shadow-xl active:shadow-inner active:scale-95 relative overflow-hidden group border-4 ${active === i ? 'bg-emerald-100/80 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]' : 'bg-white/80 border-transparent hover:bg-white/95'}`}>
            <div className="absolute bottom-3 w-3/4 h-1/4 bg-emerald-900/10 rounded-full blur-xl transition-opacity" />
            {active === i && (
              <span className="text-6xl md:text-7xl lg:text-8xl animate-spring z-10 select-none drop-shadow-lg">🐞</span>
            )}
            {whacked === i && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <span className="text-6xl md:text-7xl lg:text-8xl select-none transition-transform duration-200" style={{ transform: 'scaleY(0.2) scaleX(1.4) translateY(80%)' }}>🐞</span>
                {particles.map(p => (
                  <div key={p.id} className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: p.color, transform: `translate(${p.tx}px, ${p.ty}px)`, transition: 'transform 0.5s ease-out, opacity 0.5s', opacity: 1 } as any} />
                ))}
                <span className="absolute text-5xl md:text-7xl animate-ping opacity-60">✨</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-emerald-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-emerald-600 animate-bounce mb-4 uppercase">ឡូយណាស់!</h2>
            <p className="text-xl font-black text-emerald-900">ជុំបន្ទាប់នឹងលឿនជាងមុន! ⚡</p>
            <div className="text-6xl mt-4">🐞💨</div>
          </div>
        </div>
      )}
    </div>
  );
};