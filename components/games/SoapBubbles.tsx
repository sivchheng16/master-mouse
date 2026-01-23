import React, { useState, useEffect } from 'react';
import { audioService } from '../../../services/audioService';
import { GameHUD } from '../../GameHUD';

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  isPopping: boolean;
}

export const SoapBubbles: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [popped, setPopped] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const currentRoundCount = count + (round - 1) * 6;

  const initRound = (r: number) => {
    const rc = count + (r - 1) * 6;
    const newBubbles = Array.from({ length: rc }).map((_, i) => ({
      id: Math.random(),
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      size: Math.max(40, (75 + Math.random() * 30) - (r * 8)),
      delay: Math.random() * -10,
      isPopping: false
    }));
    setBubbles(newBubbles);
    setPopped(0);
  };

  useEffect(() => {
    initRound(round);
    return () => setBubbles([]);
  }, [round, count]);

  const handlePop = (id: number) => {
    if (showLevelUp) return;

    setBubbles(prev => prev.map(b => b.id === id ? { ...b, isPopping: true } : b));
    audioService.playBubble();

    setTimeout(() => {
      setBubbles(prev => prev.filter(b => b.id !== id));
      setPopped(p => {
        const next = p + 1;
        if (next >= currentRoundCount) {
          if (round < totalRounds) {
            handleRoundComplete();
          } else {
            setTimeout(onComplete, 1200);
          }
        }
        return next;
      });
    }, 250);
  };

  const handleRoundComplete = () => {
    if (showLevelUp) return;
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound(r => r + 1);
      }, 2500);
    }, 2000);
  };

  return (
    <div key={`soap-round-${round}`} className="relative w-full h-full bg-gradient-to-br from-sky-50 to-indigo-100 overflow-hidden select-none">
      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="បំបែកពពុះសាប៊ូ!"
        score={popped}
        goal={currentRoundCount}
      />

      <div className="absolute inset-0">
        {bubbles.map(b => (
          <div
            key={b.id}
            onMouseEnter={() => audioService.playHover()}
            onClick={() => handlePop(b.id)}
            className={`absolute rounded-full transition-all cursor-pointer flex items-center justify-center ${b.isPopping ? 'scale-150 opacity-0' : 'animate-float-bubble'}`}
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              animationDelay: `${b.delay}s`,
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(135,206,250,0.3) 50%, rgba(255,105,180,0.2) 100%)',
              border: '1px solid rgba(255,255,255,0.4)',
              boxShadow: 'inset -5px -5px 15px rgba(0,0,0,0.05), 0 10px 20px rgba(0,0,0,0.05)',
              backdropFilter: 'blur(1px)'
            }}
          >
            <div className="absolute top-[20%] left-[20%] w-[25%] h-[25%] bg-white/60 rounded-full blur-[2px]" />
          </div>
        ))}
      </div>

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-sky-900">ត្រៀមខ្លួនសម្រាប់ពពុះសាប៊ូបន្ថែម! 🫧🧼</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes float-bubble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(15px, -20px) rotate(5deg); }
          66% { transform: translate(-10px, -15px) rotate(-5deg); }
        }
        .animate-float-bubble {
          animation: float-bubble 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};