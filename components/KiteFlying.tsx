import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

export const KiteFlying: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [kiteY, setKiteY] = useState(50);
    const [targetY, setTargetY] = useState(30);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(15);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const targetScore = 10 + (round - 1) * 5;

    useEffect(() => {
        if (!showLevelUp && !completed) {
            setKiteY(50);
            setScore(0);
            setTimeLeft(15 + round * 5);
        }
    }, [round, showLevelUp]);

    // Move target randomly
    useEffect(() => {
        if (completed || showLevelUp) return;
        const interval = setInterval(() => {
            setTargetY(20 + Math.random() * 60);
        }, 2000);
        return () => clearInterval(interval);
    }, [completed, showLevelUp]);

    // Timer
    useEffect(() => {
        if (completed || showLevelUp || timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    // Time's up - check if passed
                    if (score >= targetScore) {
                        if (round < totalRounds) {
                            handleRoundComplete();
                        } else {
                            setCompleted(true);
                            setTimeout(() => {
                                audioService.playSuccess();
                                onComplete();
                            }, 800);
                        }
                    }
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [completed, showLevelUp, score, targetScore, round, totalRounds]);

    // Check if kite is in target zone
    useEffect(() => {
        if (completed || showLevelUp) return;
        const checkScore = setInterval(() => {
            const dist = Math.abs(kiteY - targetY);
            if (dist < 10) {
                setScore(s => {
                    const newScore = s + 1;
                    if (newScore >= targetScore && !completed) {
                        if (round < totalRounds) {
                            handleRoundComplete();
                        } else {
                            setCompleted(true);
                            setTimeout(() => {
                                audioService.playSuccess();
                                onComplete();
                            }, 800);
                        }
                    }
                    return newScore;
                });
                audioService.playHover();
            }
        }, 500);
        return () => clearInterval(checkScore);
    }, [kiteY, targetY, completed, showLevelUp, targetScore, round, totalRounds]);

    const handleScroll = (e: React.WheelEvent) => {
        e.preventDefault();
        setKiteY(prev => Math.max(10, Math.min(90, prev + e.deltaY * 0.05)));
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => {
            setShowLevelUp(false);
            setRound(r => r + 1);
        }, 2000);
    };

    const isInZone = Math.abs(kiteY - targetY) < 10;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            onWheel={handleScroll}
            style={{
                background: 'linear-gradient(180deg, #1e3a5f 0%, #2d5a87 30%, #4a90b8 60%, #87ceeb 100%)',
            }}
        >
            {/* Sun */}
            <div className="absolute top-12 right-16 w-20 h-20 bg-yellow-300 rounded-full shadow-[0_0_60px_rgba(255,200,0,0.6)]" />

            {/* Clouds */}
            {[...Array(4)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-5xl opacity-60 animate-float-cloud pointer-events-none"
                    style={{
                        top: `${15 + i * 20}%`,
                        animationDelay: `${-i * 7}s`,
                        animationDuration: `${25 + i * 5}s`,
                    }}
                >
                    ☁️
                </div>
            ))}

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-300 shadow-sm">
                <span className="text-white font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Timer */}
            <div className="absolute top-4 left-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-sky-300 shadow-sm">
                <span className={`font-black text-sm ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                    ⏱️ {timeLeft}s
                </span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/30 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-sky-300 shadow-xl">
                    <h2 className="text-xl md:text-2xl font-black text-white drop-shadow-lg">
                        បោះខ្លែង! រមូរកង់ម៉ៅ! 🪁 ({score}/{targetScore})
                    </h2>
                </div>
            </div>

            {/* Target zone */}
            <div
                className={`absolute left-[20%] right-[40%] h-16 rounded-2xl border-4 border-dashed transition-all duration-500 ${isInZone ? 'bg-green-400/40 border-green-400' : 'bg-yellow-400/30 border-yellow-400'
                    }`}
                style={{ top: `${targetY}%`, transform: 'translateY(-50%)' }}
            >
                <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-3xl">
                    {isInZone ? '✅' : '👉'}
                </div>
            </div>

            {/* Kite */}
            <div
                className={`absolute right-[15%] transition-all duration-200 ${isInZone ? 'animate-pulse' : ''}`}
                style={{ top: `${kiteY}%`, transform: 'translateY(-50%)' }}
            >
                {/* Kite shape */}
                <div className="relative">
                    <div className="text-7xl md:text-8xl drop-shadow-2xl animate-kite-sway">🪁</div>
                    {/* Kite tail */}
                    <svg className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-8 h-24 overflow-visible" viewBox="0 0 20 100">
                        <path
                            d="M10 0 Q 0 25 10 50 T 10 100"
                            stroke="rgba(255,255,255,0.6)"
                            strokeWidth="3"
                            fill="none"
                            className="animate-tail-wave"
                        />
                        {[20, 40, 60, 80].map((y, i) => (
                            <circle key={i} cx="10" cy={y} r="4" fill={['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3'][i]} />
                        ))}
                    </svg>
                </div>
            </div>

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-gradient-to-t from-green-600 to-green-500">
                {/* Trees */}
                <div className="absolute bottom-0 left-[10%] text-4xl">🌳</div>
                <div className="absolute bottom-0 left-[30%] text-5xl">🌴</div>
                <div className="absolute bottom-0 right-[20%] text-4xl">🌳</div>
                <div className="absolute bottom-0 right-[40%] text-3xl">🌲</div>
            </div>

            {/* Person flying kite */}
            <div className="absolute bottom-[12%] right-[18%] text-4xl">🧒</div>

            {/* Score bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[60%] bg-white/20 backdrop-blur-md rounded-full p-2">
                <div
                    className="h-4 bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
                />
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-sky-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-sky-200 text-center">
                        <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-sky-900">ខ្យល់កាន់តែខ្លាំង! 🪁</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-sky-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-sky-600 animate-bounce mb-6">បោះខ្លែងពូកែ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🪁</span>
                            <span className="animate-bounce">☁️</span>
                            <span className="animate-pulse">🪁</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes float-cloud {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        .animate-float-cloud {
          animation: float-cloud 30s linear infinite;
        }
        @keyframes kite-sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-kite-sway {
          animation: kite-sway 2s ease-in-out infinite;
        }
        @keyframes tail-wave {
          0%, 100% { d: path('M10 0 Q 0 25 10 50 T 10 100'); }
          50% { d: path('M10 0 Q 20 25 10 50 T 10 100'); }
        }
        .animate-tail-wave {
          animation: tail-wave 1s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
