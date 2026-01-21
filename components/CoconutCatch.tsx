import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

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
    const [scorePopups, setScorePopups] = useState<{ id: number; x: number; y: number }[]>([]);

    const currentCount = count + (round - 1) * 3;
    const maxMisses = 3;

    const initRound = (r: number) => {
        setCoconuts([]);
        setCaught(0);
        setMissed(0);
        setSpawnIndex(0);
        setSplashes([]);
        setScorePopups([]);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, showLevelUp]);

    // Spawn coconuts
    useEffect(() => {
        if (showLevelUp || caught >= currentCount) return;

        const spawnInterval = setInterval(() => {
            setCoconuts(prev => {
                const activeCount = prev.filter(c => c.falling && !c.caught).length;
                if (caught + activeCount >= currentCount) return prev;

                const speed = 1 + round * 0.3 + Math.random() * 0.5;
                const newCoconut: Coconut = {
                    id: Date.now() + Math.random(),
                    x: 15 + Math.random() * 70,
                    y: -10,
                    speed,
                    falling: true,
                    caught: false,
                };
                return [...prev, newCoconut];
            });
            setSpawnIndex(prev => prev + 1);
        }, 1500 - round * 200);

        return () => clearInterval(spawnInterval);
    }, [round, showLevelUp, currentCount, caught]);

    // Animate falling coconuts (Refactored for safety)
    useEffect(() => {
        if (showLevelUp) return;

        const loop = setTimeout(() => {
            let newMisses = 0;
            const updated = coconuts.map(coconut => {
                if (!coconut.falling || coconut.caught) return coconut;

                const newY = coconut.y + coconut.speed;

                // Check if missed
                if (newY > 90 && !coconut.caught) {
                    newMisses++;
                    // Trigger splash
                    const splash: Splash = { id: coconut.id, x: coconut.x, y: 85 };
                    setSplashes(s => [...s, splash]);
                    setTimeout(() => setSplashes(s => s.filter(sp => sp.id !== splash.id)), 500);

                    return { ...coconut, y: newY, falling: false };
                }

                return { ...coconut, y: newY };
            });

            // If we have changes or movement, update state
            // Optimization: Only update if strictly needed, but for game loop constant update is fine
            const filtered = updated.filter(c => c.y < 100 || c.caught);

            // Only update if frame changed something (avoids some re-renders if idle?) 
            // Actually, in this game, things are always moving if existing.
            if (coconuts.length > 0) {
                setCoconuts(filtered);
            }

            if (newMisses > 0) {
                setMissed(m => {
                    const newTotal = m + newMisses;
                    if (newTotal >= maxMisses) audioService.playError();
                    return newTotal;
                });
            }

        }, 50);

        return () => clearTimeout(loop);
    }, [coconuts, showLevelUp]);

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

        // precise location for popup
        const popupId = Date.now();
        setScorePopups(prev => [...prev, { id: popupId, x: coconut.x, y: coconut.y }]);
        setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== popupId)), 800);

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
            <div className="absolute top-10 right-50 w-20 h-20 bg-yellow-300 rounded-full shadow-[0_0_90px_rgba(255,200,0,0.6)]" />

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ចាប់ផ្លែដូង! 🥥"
                score={caught}
                goal={currentCount}
            />

            {/* Misses indicator - Top Right for balance */}
            <div className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
                <span className="text-red-400 text-lg">❌</span>
                <span className="text-red-500 font-bold text-xl">{missed}</span>
            </div>

            {/* Palm trees - better positioning on land */}
            {palmTrees.map((tree, i) => (
                <div
                    key={i}
                    className="absolute text-7xl md:text-8xl pointer-events-none opacity-90 transition-transform duration-500 ease-in-out z-10"
                    style={{
                        left: `${tree.x}%`,
                        bottom: `${5 + (i % 3) * 5}%`, // Vary between 5% and 15% to Scatter on sand
                        transform: `scale(${tree.scale})`,
                        transformOrigin: 'bottom center'
                    }}
                >
                    🌴
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

            {/* Splash effects */}
            {splashes.map(splash => (
                <div
                    key={splash.id}
                    className="absolute text-4xl animate-splash pointer-events-none z-10 opacity-80"
                    style={{ left: `${splash.x}%`, bottom: '15%', transform: 'translate(-50%, 0)' }}
                >
                    💦
                </div>
            ))}

            {/* +1 Score Popups */}
            {scorePopups.map(popup => (
                <div
                    key={popup.id}
                    className="absolute text-4xl font-black text-amber-500 z-50 animate-float-up pointer-events-none drop-shadow-md"
                    style={{
                        left: `${popup.x}%`,
                        top: `${popup.y}%`,
                        textShadow: '2px 2px 0px white'
                    }}
                >
                    +1
                </div>
            ))}

            {/* Ground/Beach Scene */}
            <div className="absolute bottom-0 left-0 right-0 h-[25%] pointer-events-none">
                {/* Ocean Background */}
                <div className="absolute bottom-0 w-full h-full bg-blue-400/30" />

                {/* Sand Dune */}
                <div className="absolute bottom-0 w-full h-[80%] bg-[#e6c288] rounded-t-[50%_20%] shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                    {/* Texture */}
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #b89055 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                </div>
            </div>

            {/* Player Group (Basket & Farmer together) */}
            <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 flex items-end gap-[-20px] pointer-events-none z-20">
                {/* Farmer leaning on basket */}
                <div className="text-6xl md:text-7xl transform -scale-x-100 translate-x-4 animate-bounce-slow">
                    👨‍🌾
                </div>
                {/* Basket */}
                <div className="relative text-7xl md:text-8xl">
                    🧺
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-2 text-2xl font-bold text-amber-900/80">
                        {caught}
                    </span>
                </div>
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
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s ease-in-out infinite;
        }
        @keyframes float-up {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -150%) scale(1.5); opacity: 0; }
        }
        .animate-float-up {
            animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
        </div>
    );
};
