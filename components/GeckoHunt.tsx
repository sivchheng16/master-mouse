import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface Gecko {
    id: number;
    x: number;
    y: number;
    visible: boolean;
    caught: boolean;
    hideTimer: number;
}

export const GeckoHunt: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [geckos, setGeckos] = useState<Gecko[]>([]);
    const [caught, setCaught] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numGeckos = count + (r - 1) * 2;
        const newGeckos: Gecko[] = Array.from({ length: numGeckos }).map((_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 20 + Math.random() * 60,
            visible: false,
            caught: false,
            hideTimer: 2000 - r * 200 + Math.random() * 1000, // Faster in later rounds
        }));
        setGeckos(newGeckos);
        setCaught(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    // Make geckos appear and disappear
    useEffect(() => {
        if (showLevelUp) return;

        const showGeckos = () => {
            setGeckos(prev => {
                const uncaught = prev.filter(g => !g.caught && !g.visible);
                if (uncaught.length === 0) return prev;

                // Show 1-2 random geckos
                const toShow = uncaught.slice(0, Math.min(2, uncaught.length));
                return prev.map(g => {
                    if (toShow.find(s => s.id === g.id)) {
                        return { ...g, visible: true };
                    }
                    return g;
                });
            });
        };

        const hideGeckos = () => {
            setGeckos(prev => prev.map(g => {
                if (g.visible && !g.caught) {
                    // Relocate gecko when it hides
                    return {
                        ...g,
                        visible: false,
                        x: 10 + Math.random() * 80,
                        y: 20 + Math.random() * 60,
                    };
                }
                return g;
            }));
        };

        const showInterval = setInterval(showGeckos, 1500);
        const hideInterval = setInterval(hideGeckos, 2500 - round * 300);

        return () => {
            clearInterval(showInterval);
            clearInterval(hideInterval);
        };
    }, [showLevelUp, round]);

    const handleCatch = (geckoId: number) => {
        const gecko = geckos.find(g => g.id === geckoId);
        if (!gecko || gecko.caught || !gecko.visible) return;

        audioService.playPop();
        setGeckos(prev => prev.map(g =>
            g.id === geckoId ? { ...g, caught: true, visible: true } : g
        ));

        const newCaught = caught + 1;
        setCaught(newCaught);

        if (newCaught === currentCount) {
            if (round < totalRounds) {
                handleRoundComplete();
            } else {
                setTimeout(() => {
                    audioService.playSuccess();
                    onComplete();
                }, 800);
            }
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

    // Wall texture elements
    const wallElements = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        y: 10 + Math.random() * 80,
        type: ['crack', 'shadow', 'stain'][Math.floor(Math.random() * 3)],
    })), []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-stone-200 to-stone-300">
            {/* Wall texture */}
            {wallElements.map(el => (
                <div
                    key={el.id}
                    className={`absolute pointer-events-none opacity-20 ${el.type === 'crack' ? 'text-stone-600' : 'text-stone-400'
                        }`}
                    style={{ left: `${el.x}%`, top: `${el.y}%` }}
                >
                    {el.type === 'crack' ? '╱' : el.type === 'shadow' ? '▒' : '░'}
                </div>
            ))}

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-400 shadow-sm">
                <span className="text-stone-800 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-stone-400 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-stone-800">
                        ចាប់ច្កែ! 🦎 ({caught}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Geckos */}
            {geckos.map(gecko => (
                <div
                    key={gecko.id}
                    className={`absolute transition-all duration-300 ${gecko.visible
                            ? gecko.caught
                                ? 'scale-0 opacity-0'
                                : 'scale-100 opacity-100 cursor-pointer hover:scale-110'
                            : 'scale-0 opacity-0'
                        }`}
                    style={{
                        left: `${gecko.x}%`,
                        top: `${gecko.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => gecko.visible && !gecko.caught && handleCatch(gecko.id)}
                    onMouseEnter={() => gecko.visible && !gecko.caught && audioService.playHover()}
                >
                    <div className={`text-5xl md:text-6xl drop-shadow-lg ${gecko.visible && !gecko.caught ? 'animate-gecko' : ''
                        }`}>
                        🦎
                    </div>
                </div>
            ))}

            {/* Caught geckos in jar */}
            <div className="absolute bottom-8 right-8 text-center">
                <div className="relative">
                    <div className="text-6xl">🫙</div>
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                        {caught}
                    </span>
                </div>
            </div>

            {/* Kid character */}
            <div className="absolute bottom-8 left-8 text-5xl animate-bounce-slow">
                🧒
                <div className="absolute -top-2 -right-2 text-2xl">👀</div>
            </div>

            {/* Wall lamp */}
            <div className="absolute top-[15%] left-[10%] text-4xl">💡</div>
            <div className="absolute top-[15%] right-[10%] text-4xl">💡</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-green-200 text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                        <p className="text-xl font-black text-stone-700">ច្កែកាន់តែលឿន! 🦎</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && caught === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-6">ចាប់បានអស់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🦎</span>
                            <span className="animate-bounce">🫙</span>
                            <span className="animate-pulse">🦎</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes gecko {
          0%, 100% { transform: translate(-50%, -50%) rotate(-5deg); }
          25% { transform: translate(-50%, -50%) translateY(-5px) rotate(0deg); }
          50% { transform: translate(-50%, -50%) rotate(5deg); }
          75% { transform: translate(-50%, -50%) translateY(-3px) rotate(0deg); }
        }
        .animate-gecko {
          animation: gecko 0.8s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
