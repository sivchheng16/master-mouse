import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface FirecrackerItem {
    id: number;
    x: number;
    y: number;
    fuseProgress: number;
    exploded: boolean;
    missed: boolean;
    speed: number;
}

export const Firecracker: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [firecrackers, setFirecrackers] = useState<FirecrackerItem[]>([]);
    const [exploded, setExploded] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numFirecrackers = count + (r - 1) * 2;
        const newFirecrackers: FirecrackerItem[] = Array.from({ length: numFirecrackers }).map((_, i) => ({
            id: i,
            x: 15 + (i % 5) * 15,
            y: 40 + Math.floor(i / 5) * 25,
            fuseProgress: 0,
            exploded: false,
            missed: false,
            speed: 0.5 + r * 0.2 + Math.random() * 0.3,
        }));
        setFirecrackers(newFirecrackers);
        setExploded(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    // Animate fuse burning
    useEffect(() => {
        if (showLevelUp) return;

        const interval = setInterval(() => {
            setFirecrackers(prev => prev.map(fc => {
                if (fc.exploded || fc.missed) return fc;

                const newProgress = fc.fuseProgress + fc.speed;

                if (newProgress >= 100) {
                    // Missed - fuse burned out
                    audioService.playError();
                    return { ...fc, missed: true, fuseProgress: 100 };
                }

                return { ...fc, fuseProgress: newProgress };
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [showLevelUp]);

    const handleClick = (firecrackerID: number) => {
        const fc = firecrackers.find(f => f.id === firecrackerID);
        if (!fc || fc.exploded || fc.missed) return;

        // Perfect timing: progress between 70-90%
        if (fc.fuseProgress >= 70 && fc.fuseProgress <= 95) {
            audioService.playSuccess();
            setFirecrackers(prev => prev.map(f =>
                f.id === firecrackerID ? { ...f, exploded: true } : f
            ));

            const newExploded = exploded + 1;
            setExploded(newExploded);

            if (newExploded === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        } else if (fc.fuseProgress < 70) {
            // Too early
            audioService.playError();
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

    // Decorations
    const decorations = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        emoji: ['✨', '🎊', '🎉', '⭐'][i % 4],
        delay: Math.random() * 2,
    })), []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-indigo-900 via-purple-900 to-black">
            {/* Stars in night sky */}
            {decorations.map(d => (
                <div
                    key={d.id}
                    className="absolute text-xl opacity-60 animate-twinkle pointer-events-none"
                    style={{ left: `${d.x}%`, top: `${d.y}%`, animationDelay: `${d.delay}s` }}
                >
                    {d.emoji}
                </div>
            ))}

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-yellow-400 shadow-sm">
                <span className="text-yellow-300 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/20 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-yellow-400 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-yellow-300 drop-shadow-lg">
                        ចុចពេល 🔴 ក្រហម! 🎆 ({exploded}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Firecrackers */}
            {firecrackers.map(fc => (
                <div
                    key={fc.id}
                    className={`absolute transition-all duration-200 ${fc.exploded ? 'scale-150' : fc.missed ? 'opacity-30' : 'cursor-pointer hover:scale-105'
                        }`}
                    style={{
                        left: `${fc.x}%`,
                        top: `${fc.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => !fc.exploded && !fc.missed && handleClick(fc.id)}
                    onMouseEnter={() => !fc.exploded && !fc.missed && audioService.playHover()}
                >
                    {/* Firecracker body */}
                    <div className="relative">
                        {fc.exploded ? (
                            // Explosion effect
                            <div className="text-6xl animate-explode">💥</div>
                        ) : (
                            <>
                                <div className="text-5xl md:text-6xl">🧨</div>

                                {/* Fuse progress indicator */}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-100 ${fc.fuseProgress >= 70 && fc.fuseProgress <= 95
                                                ? 'bg-red-500 animate-pulse'
                                                : fc.fuseProgress < 70
                                                    ? 'bg-yellow-400'
                                                    : 'bg-gray-400'
                                            }`}
                                        style={{ width: `${fc.fuseProgress}%` }}
                                    />
                                </div>

                                {/* Perfect zone indicator */}
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-3 pointer-events-none">
                                    <div
                                        className="absolute h-full bg-red-500/30 rounded"
                                        style={{ left: '70%', width: '25%' }}
                                    />
                                </div>

                                {/* Spark on fuse */}
                                {!fc.missed && (
                                    <div
                                        className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl animate-spark"
                                        style={{ left: `${50 + (fc.fuseProgress - 50) * 0.3}%` }}
                                    >
                                        🔥
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            ))}

            {/* Celebration effects for explosions */}
            {firecrackers.filter(fc => fc.exploded).map(fc => (
                <div
                    key={`effect-${fc.id}`}
                    className="absolute pointer-events-none"
                    style={{ left: `${fc.x}%`, top: `${fc.y}%` }}
                >
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute text-2xl animate-firework"
                            style={{
                                transform: `rotate(${i * 45}deg) translateY(-60px)`,
                                animationDelay: `${i * 0.05}s`,
                            }}
                        >
                            ✨
                        </div>
                    ))}
                </div>
            ))}

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-300 text-center">
                        <h2 className="title-font text-5xl text-white animate-bounce mb-4 drop-shadow-lg">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-yellow-100">កាំជ្រួចកាន់តែលឿន! 🎆</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && exploded === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-gradient-to-b from-yellow-400 to-orange-500 p-12 rounded-[3.5rem] shadow-2xl border-8 border-yellow-300 text-center">
                        <h2 className="title-font text-5xl text-white animate-bounce mb-6 drop-shadow-lg">បុណ្យអស្ចារ្យ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🎆</span>
                            <span className="animate-bounce">💥</span>
                            <span className="animate-pulse">🎆</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        @keyframes spark {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.3); }
        }
        .animate-spark {
          animation: spark 0.3s ease-in-out infinite;
        }
        @keyframes explode {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(2); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .animate-explode {
          animation: explode 0.5s ease-out forwards;
        }
        @keyframes firework {
          0% { transform: rotate(var(--angle, 0deg)) translateY(0) scale(1); opacity: 1; }
          100% { transform: rotate(var(--angle, 0deg)) translateY(-80px) scale(0); opacity: 0; }
        }
        .animate-firework {
          animation: firework 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    );
};
