import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface Coconut {
    id: number;
    x: number;
    y: number;
    speed: number;
    falling: boolean;
    caught: boolean;
}

interface Splash {
    id: number;
    x: number;
    y: number;
}

export const CoconutCatch: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 8 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [coconuts, setCoconuts] = useState<Coconut[]>([]);
    const [splashes, setSplashes] = useState<Splash[]>([]);
    const [caught, setCaught] = useState(0);
    const [missed, setMissed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [spawnIndex, setSpawnIndex] = useState(0);

    const currentCount = count + (round - 1) * 3;
    const maxMisses = 3;

    const initRound = (r: number) => {
        setCoconuts([]);
        setCaught(0);
        setMissed(0);
        setSpawnIndex(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, showLevelUp]);

    // Spawn coconuts
    useEffect(() => {
        if (showLevelUp || caught + missed >= currentCount) return;

        const spawnInterval = setInterval(() => {
            if (spawnIndex >= currentCount) return;

            const speed = 1 + round * 0.3 + Math.random() * 0.5;
            const newCoconut: Coconut = {
                id: Date.now() + Math.random(),
                x: 15 + Math.random() * 70,
                y: -10,
                speed,
                falling: true,
                caught: false,
            };

            setCoconuts(prev => [...prev, newCoconut]);
            setSpawnIndex(prev => prev + 1);
        }, 1500 - round * 200);

        return () => clearInterval(spawnInterval);
    }, [round, showLevelUp, spawnIndex, currentCount, caught, missed]);

    // Animate falling coconuts
    useEffect(() => {
        if (showLevelUp) return;

        const animationInterval = setInterval(() => {
            setCoconuts(prev => {
                const updated = prev.map(coconut => {
                    if (!coconut.falling || coconut.caught) return coconut;
                    return { ...coconut, y: coconut.y + coconut.speed };
                });

                // Check for missed coconuts
                updated.forEach(coconut => {
                    if (coconut.y > 90 && coconut.falling && !coconut.caught) {
                        coconut.falling = false;
                        setMissed(m => {
                            const newMissed = m + 1;
                            if (newMissed >= maxMisses) {
                                // Game over scenario - but let's be forgiving for kids
                                audioService.playError();
                            }
                            return newMissed;
                        });

                        // Add splash effect
                        const splash: Splash = { id: coconut.id, x: coconut.x, y: 85 };
                        setSplashes(s => [...s, splash]);
                        setTimeout(() => setSplashes(s => s.filter(sp => sp.id !== splash.id)), 500);
                    }
                });

                return updated.filter(c => c.y < 100 || c.caught);
            });
        }, 50);

        return () => clearInterval(animationInterval);
    }, [showLevelUp]);

    // Check for completion
    useEffect(() => {
        if (caught >= currentCount) {
            if (round < totalRounds) {
                handleRoundComplete();
            } else {
                setTimeout(() => {
                    audioService.playSuccess();
                    onComplete();
                }, 800);
            }
        }
    }, [caught, currentCount, round, totalRounds]);

    const handleCatch = (coconutId: number) => {
        const coconut = coconuts.find(c => c.id === coconutId);
        if (!coconut || coconut.caught || !coconut.falling) return;

        audioService.playPop();
        setCoconuts(prev => prev.map(c =>
            c.id === coconutId ? { ...c, caught: true, falling: false } : c
        ));
        setCaught(c => c + 1);
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => {
            setShowLevelUp(false);
            setRound(r => r + 1);
        }, 2000);
    };

    // Palm trees decoration
    const palmTrees = useMemo(() => [
        { x: 5, scale: 1.2 },
        { x: 25, scale: 0.9 },
        { x: 70, scale: 1.1 },
        { x: 90, scale: 0.8 },
    ], []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-400 via-sky-300 to-yellow-200">
            {/* Sun */}
            <div className="absolute top-8 right-12 w-20 h-20 bg-yellow-300 rounded-full shadow-[0_0_60px_rgba(255,200,0,0.6)]" />

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-300 shadow-sm">
                <span className="text-amber-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Lives/Misses indicator */}
            <div className="absolute top-4 left-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-300 shadow-sm">
                <span className="text-red-700 font-black text-sm">
                    ❌ {missed}/{maxMisses}
                </span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-amber-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-amber-800">
                        ចាប់ផ្លែដូង! 🥥 ({caught}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Palm trees */}
            {palmTrees.map((tree, i) => (
                <div
                    key={i}
                    className="absolute top-0 text-7xl md:text-8xl pointer-events-none"
                    style={{
                        left: `${tree.x}%`,
                        transform: `scale(${tree.scale})`,
                    }}
                >
                    🌴
                </div>
            ))}

            {/* Splash effects */}
            {splashes.map(splash => (
                <div
                    key={splash.id}
                    className="absolute text-3xl animate-splash pointer-events-none"
                    style={{ left: `${splash.x}%`, top: `${splash.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    💥
                </div>
            ))}

            {/* Falling coconuts */}
            {coconuts.map(coconut => !coconut.caught && coconut.falling && (
                <div
                    key={coconut.id}
                    className="absolute cursor-pointer transition-transform hover:scale-110 active:scale-90"
                    style={{
                        left: `${coconut.x}%`,
                        top: `${coconut.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleCatch(coconut.id)}
                    onMouseEnter={() => audioService.playHover()}
                >
                    <div className="text-5xl md:text-6xl drop-shadow-xl animate-spin-slow">
                        🥥
                    </div>
                </div>
            ))}

            {/* Caught coconuts go to basket */}
            {coconuts.filter(c => c.caught).map(coconut => (
                <div
                    key={coconut.id}
                    className="absolute text-4xl animate-catch-fly pointer-events-none"
                    style={{
                        left: `${coconut.x}%`,
                        top: `${coconut.y}%`,
                    }}
                >
                    🥥
                </div>
            ))}

            {/* Ground/Beach */}
            <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-yellow-400 to-yellow-300">
                {/* Sand texture dots */}
                <div className="absolute inset-0 opacity-30">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-1 h-1 bg-amber-600 rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Basket */}
            <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-6xl">
                🧺
                <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                    {caught}
                </span>
            </div>

            {/* Character */}
            <div className="absolute bottom-[5%] left-[30%] text-5xl animate-bounce-slow">
                👨‍🌾
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-200 text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                        <p className="text-xl font-black text-amber-900">ដូងធ្លាក់លឿនជាង! 🥥</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {caught >= currentCount && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-6">ចាប់ដូងបានអស់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🥥</span>
                            <span className="animate-bounce">🌴</span>
                            <span className="animate-pulse">🥥</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes spin-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 1s linear infinite;
        }
        @keyframes splash {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .animate-splash {
          animation: splash 0.5s ease-out forwards;
        }
        @keyframes catch-fly {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { 
            transform: translate(calc(50vw - 50%), calc(100vh - 150px - 50%)) scale(0.5); 
            opacity: 0;
          }
        }
        .animate-catch-fly {
          animation: catch-fly 0.5s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
