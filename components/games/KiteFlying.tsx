import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

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
        setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => {
                setShowLevelUp(false);
                setRound(r => r + 1);
            }, 2000);
        }, 2000);
    };

    const isInZone = Math.abs(kiteY - targetY) < 10;

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            onWheel={handleScroll}
            style={{
                background: 'linear-gradient(180deg, #3aa2f0 0%, #8bcbf9 40%, #cce9ff 100%)',
            }}
        >
            {/* Realistic Sky Elements */}
            <div className="absolute top-8 right-12 w-24 h-24 bg-[#ffeb3b] rounded-full shadow-[0_0_100px_rgba(255,235,59,0.8)] animate-pulse-slow opactiy-90" />

            {/* Fluffy Clouds */}
            {[...Array(5)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-white/80 animate-float-cloud pointer-events-none blur-[1px]"
                    style={{
                        top: `${10 + i * 15}%`,
                        fontSize: `${4 + i * 1.5}rem`,
                        animationDelay: `${-i * 8}s`,
                        animationDuration: `${35 + i * 5}s`,
                        textShadow: '0 0 20px rgba(255,255,255,0.8)'
                    }}
                >
                    ☁️
                </div>
            ))}

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="បោះខ្លែង! រមូរកង់ម៉ៅ! 🪁"
                score={score}
                goal={targetScore}
            />

            {/* Focused Target Zone Indicator */}
            <div
                className={`absolute left-[25%] right-[25%] h-24 rounded-3xl border-4 transition-all duration-300 z-10 flex items-center justify-between px-4 ${isInZone
                    ? 'border-green-400 bg-green-400/20 shadow-[0_0_50px_rgba(74,222,128,0.4)] scale-105'
                    : 'border-white/40 bg-white/10 border-dashed'
                    }`}
                style={{ top: `${targetY}%`, transform: 'translateY(-50%)' }}
            >
                <span className={`text-4xl transition-opacity ${isInZone ? 'opacity-100' : 'opacity-50'}`}>✨</span>
                <span className={`text-4xl transition-opacity ${isInZone ? 'opacity-100' : 'opacity-50'}`}>✨</span>
            </div>

            {/* KITE (SVG) */}
            <div
                className={`absolute left-1/2 -translate-x-1/2 transition-all duration-300 ease-out z-20 ${isInZone ? 'scale-110 drop-shadow-2xl' : 'scale-100 drop-shadow-lg'}`}
                style={{ top: `${kiteY}%`, transform: 'translate(-50%, -50%)' }}
            >
                {/* String Line */}
                <div className="absolute top-[80px] left-1/2 w-0.5 h-[1000px] bg-white/60 origin-top -translate-x-1/2" style={{ transform: `rotate(${(50 - kiteY) * 0.1}deg)` }} />

                {/* SVG Kite Body */}
                <svg width="120" height="160" viewBox="0 0 100 140" className="overflow-visible animate-kite-sway">
                    {/* Frame */}
                    <path d="M50 0 L90 40 L50 110 L10 40 Z" fill="#FF5252" stroke="white" strokeWidth="2" />
                    {/* Cross Structure */}
                    <path d="M10 40 L90 40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    <path d="M50 0 L50 110" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
                    {/* Shine */}
                    <path d="M50 0 L90 40 L50 110 L10 40 Z" fill="url(#shine)" opacity="0.3" />

                    {/* Tail */}
                    <path
                        d="M50 110 Q 50 130 60 140 T 50 170 T 40 200"
                        stroke="#FF5252"
                        strokeWidth="4"
                        fill="none"
                        className="animate-tail-wave"
                        strokeLinecap="round"
                    />
                    {/* Bows on tail */}
                    {[130, 160, 190].map((y, i) => (
                        <circle key={i} cx={50 + Math.sin(i) * 5} cy={y} r="3" fill="white" className="animate-pulse" />
                    ))}

                    <defs>
                        <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="white" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Wind Effect particles when in zone */}
                {isInZone && (
                    <div className="absolute -inset-10 pointer-events-none">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="absolute w-full h-0.5 bg-white/40 animate-wind-gust"
                                style={{ top: `${20 + i * 30}%`, animationDelay: `${i * 0.2}s` }} />
                        ))}
                    </div>
                )}
            </div>


            {/* Ground / Landscape */}
            <div className="absolute bottom-0 left-0 right-0 h-[20%] pointer-events-none">
                {/* Back Hills */}
                <div className="absolute bottom-0 w-full h-[80%] bg-[#81c784] rounded-t-[50%] scale-x-150 translate-y-10" />
                {/* Front Grass */}
                <div className="absolute bottom-0 w-full h-[60%] bg-[#66bb6a] rounded-t-[30%] shadow-lg" />

                {/* Decor */}
                <div className="absolute bottom-4 left-10 text-6xl drop-shadow-md">🏡</div>
                <div className="absolute bottom-4 right-10 text-6xl drop-shadow-md">🌳</div>
                <div className="absolute bottom-8 left-1/4 text-4xl drop-shadow-sm">🌲</div>
            </div>

            {/* Timer Floating */}
            <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-6 py-1 rounded-full border border-white/40">
                <span className={`font-mono text-xl ${timeLeft <= 5 ? 'text-red-500 font-black animate-ping' : 'text-white font-bold'}`}>
                    00:{timeLeft.toString().padStart(2, '0')}
                </span>
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
                        <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-blue-900 animate-pulse">ខ្លែងហោះខ្ពស់ណាស់! 🪁</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {completed && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/95 p-16 rounded-[3rem] shadow-2xl border-8 border-white text-center transform hover:scale-105 transition-transform">
                        <h2 className="title-font text-6xl text-blue-600 animate-tada mb-8">ជ័យជំនះ! 🎉</h2>
                        <div className="flex justify-center gap-6 text-7xl">
                            <span className="animate-bounce delay-100">🏆</span>
                            <span className="animate-bounce delay-200">🪁</span>
                            <span className="animate-bounce delay-300">🌟</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes float-cloud {
          from { transform: translateX(-150px); }
          to { transform: translateX(110vw); }
        }
        .animate-float-cloud {
          animation: float-cloud 40s linear infinite;
        }
        @keyframes kite-sway {
          0%, 100% { transform: rotate(-3deg) translateY(0); }
          50% { transform: rotate(3deg) translateY(-5px); }
        }
        .animate-kite-sway {
          animation: kite-sway 3s ease-in-out infinite;
        }
        @keyframes tail-wave {
          0% { d: path('M50 110 Q 50 130 60 140 T 50 170 T 40 200'); }
          50% { d: path('M50 110 Q 60 130 40 140 T 60 170 T 50 200'); }
          100% { d: path('M50 110 Q 50 130 60 140 T 50 170 T 40 200'); }
        }
        .animate-tail-wave {
          animation: tail-wave 1.5s ease-in-out infinite;
        }
        @keyframes wind-gust {
            0% { transform: translateX(-50%) scaleX(0.5); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateX(50%) scaleX(1.5); opacity: 0; }
        }
        .animate-wind-gust {
            animation: wind-gust 1s linear infinite;
        }
        @keyframes pulse-slow {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
        }
        .animate-pulse-slow {
            animation: pulse-slow 4s ease-in-out infinite;
        }
        @keyframes sway-slow {
            0%, 100% { transform: rotate(-2deg); }
            50% { transform: rotate(2deg); }
        }
        .animate-sway-slow {
            animation: sway-slow 4s ease-in-out infinite;
            transform-origin: bottom center;
        }
      `}</style>
        </div>
    );
};
