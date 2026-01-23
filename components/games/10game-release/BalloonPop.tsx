import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../../../services/audioService';
import { GameHUD } from '../../GameHUD';

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  isPopping: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  rotation: number;
}

interface BalloonPopProps {
  onComplete: () => void;
  count?: number; // Base count per round
}

const BalloonPop: React.FC<BalloonPopProps> = ({ onComplete, count = 5 }) => {
  const [round, setRound] = useState(1);
  const totalRounds = 3;
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const colors = [
    '#FF4D4D', '#4D94FF', '#FFD93D', '#6BCB77', '#B983FF', '#FF8AAE', '#FF9F45', '#4ECDC4'
  ];

  const initRound = (r: number) => {
    // Increase count and slightly decrease size or increase float speed for higher rounds
    const roundCount = count + (r - 1) * 3;
    const newBalloons = Array.from({ length: roundCount }).map((_, i) => ({
      id: Math.random(),
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 50,
      color: colors[i % colors.length],
      size: Math.max(50, (70 + Math.random() * 20) - (r * 5)),
      delay: Math.random() * -10,
      isPopping: false,
    }));
    setBalloons(newBalloons);
    setPoppedCount(0);
  };

  useEffect(() => {
    initRound(round);
  }, [round, count]);

  const handlePop = (balloonId: number) => {
    const balloon = balloons.find(b => b.id === balloonId);
    if (!balloon || balloon.isPopping) return;

    audioService.playPop();

    setBalloons(prev => prev.map(b => b.id === balloonId ? { ...b, isPopping: true } : b));

    const burstCount = 15;
    const newParticles: Particle[] = Array.from({ length: burstCount }).map((_, i) => {
      const angle = (i / burstCount) * Math.PI * 2;
      const velocity = 100 + Math.random() * 150;
      return {
        id: Math.random(),
        x: balloon.x,
        y: balloon.y,
        tx: Math.cos(angle) * velocity,
        ty: Math.sin(angle) * velocity,
        color: balloon.color,
        rotation: Math.random() * 360
      };
    });
    setParticles(prev => [...prev, ...newParticles]);

    setTimeout(() => {
      setBalloons(prev => prev.filter(b => b.id !== balloonId));
      setPoppedCount(prev => {
        const next = prev + 1;
        const roundTotal = count + (round - 1) * 3;
        if (next === roundTotal) {
          if (round < totalRounds) {
            handleRoundComplete();
          } else {
            setTimeout(onComplete, 1200);
          }
        }
        return next;
      });
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 700);
    }, 200);
  };

  const handleRoundComplete = () => {
    audioService.playSuccess();
    setTimeout(() => {
      setShowLevelUp(true);
      setTimeout(() => {
        setShowLevelUp(false);
        setRound(r => r + 1);
      }, 2000);
    }, 2000);
  };

  const clouds = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    top: `${5 + i * 15}%`,
    duration: `${25 + Math.random() * 30}s`,
    delay: `-${Math.random() * 40}s`,
    scale: 0.6 + Math.random() * 1.0,
    opacity: 0.2 + Math.random() * 0.4
  })), []);

  const currentRoundTotal = count + (round - 1) * 3;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#4facfe] to-[#00f2fe] select-none">

      <GameHUD
        round={round}
        totalRounds={totalRounds}
        instruction="ចុចដើម្បីបំបែកប៉េងប៉ោង!"
        score={poppedCount}
        goal={currentRoundTotal}
        actionType="Click"
      />

      <div className="absolute inset-0 pointer-events-none z-0">
        {clouds.map(c => (
          <div
            key={c.id}
            className="cloud-container absolute"
            style={{
              top: c.top,
              animation: `float-cloud ${c.duration} linear infinite`,
              animationDelay: c.delay,
              transform: `scale(${c.scale})`,
              opacity: c.opacity,
              left: '-20%'
            }}
          >
            <div className="cloud-main w-32 h-10 bg-white rounded-full relative">
              <div className="cloud-puff w-16 h-16 bg-white rounded-full absolute -top-10 left-4" />
              <div className="cloud-puff w-20 h-20 bg-white rounded-full absolute -top-12 left-12" />
              <div className="cloud-puff w-14 h-14 bg-white rounded-full absolute -top-8 left-24" />
            </div>
          </div>
        ))}
      </div>

      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-3 h-3 rounded-sm pointer-events-none z-40 particle-boom"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--tr': `${p.rotation}deg`
          } as any}
        />
      ))}

      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          onMouseEnter={() => audioService.playHover()}
          className={`absolute flex flex-col items-center cursor-pointer transition-transform ${balloon.isPopping ? 'scale-150 opacity-0' : 'balloon-floating'}`}
          style={{
            left: `${balloon.x}%`,
            top: `${balloon.y}%`,
            animationDelay: `${balloon.delay}s`,
            zIndex: balloon.isPopping ? 50 : 20,
            transitionDuration: '0.2s'
          }}
          onClick={() => handlePop(balloon.id)}
        >
          <div className="relative shadow-2xl transition-transform hover:scale-110 active:scale-95 balloon-wobble" style={{ width: `${balloon.size}px`, height: `${balloon.size * 1.2}px`, borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%', background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.6) 0%, transparent 20%), radial-gradient(circle at 30% 30%, ${balloon.color} 0%, rgba(0,0,0,0.3) 150%)`, boxShadow: 'inset -5px -10px 15px rgba(0,0,0,0.1), 0 10px 25px rgba(0,0,0,0.2)' }}>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-3 rounded-b-full opacity-90" style={{ backgroundColor: balloon.color, clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
            <svg className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-24 overflow-visible pointer-events-none opacity-40" viewBox="0 0 20 100">
              <path d="M10 0 Q 15 25 10 50 T 10 100" stroke="white" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
      ))}

      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-950/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200 text-center transform scale-125">
            <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4 uppercase">អស្ចារ្យ!</h2>
            <p className="text-xl font-black text-sky-900">ឡើងទៅជុំបន្ទាប់! ✨</p>
          </div>
        </div>
      )}

      {round === totalRounds && poppedCount === currentRoundTotal && !showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center bg-sky-950/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border-8 border-white text-center">
            <h2 className="title-font text-6xl text-pink-500 animate-bounce drop-shadow-lg mb-6">បែកអស់ហើយ! 🎉</h2>
            <div className="flex justify-center gap-6 text-5xl">
              <span className="animate-pulse">🎈</span>
              <span className="animate-ping delay-100">✨</span>
              <span className="animate-pulse delay-200">🎈</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .particle-boom {
          animation: particle-boom-anim 0.7s cubic-bezier(0, 0, 0.2, 1) forwards;
        }
        @keyframes particle-boom-anim {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--tr)); opacity: 0; }
        }

        @keyframes float-cloud {
          from { transform: translateX(-100%) scale(var(--tw-scale-x, 1)); }
          to { transform: translateX(120vw) scale(var(--tw-scale-x, 1)); }
        }

        .balloon-floating {
          animation: balloon-float-anim 6s ease-in-out infinite;
        }
        @keyframes balloon-float-anim {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-30px) rotate(2deg); }
        }

        .balloon-wobble {
          animation: balloon-wobble-anim 4s ease-in-out infinite;
        }
        @keyframes balloon-wobble-anim {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05, 0.95); }
        }
      `}</style>
    </div>
  );
};

export default BalloonPop;