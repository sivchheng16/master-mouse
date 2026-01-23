import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

interface Gecko {
    id: number;
    x: number;
    y: number;
    visible: boolean;
    caught: boolean;
    hideTimer: number;
    scale: number;
    rotation: number;
}

export const GeckoHunt: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [geckos, setGeckos] = useState<Gecko[]>([]);
    const [caught, setCaught] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 3; // Increase count slightly per round

    const initRound = (r: number) => {
        const numGeckos = count + (r - 1) * 3;
        const newGeckos: Gecko[] = Array.from({ length: numGeckos }).map((_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 20 + Math.random() * 60,
            visible: i < 3, // Instant start: First 3 are visible
            caught: false,
            hideTimer: 2000 - r * 200 + Math.random() * 1000,
            scale: 0.8 + Math.random() * 0.6, // Random size 0.8x to 1.4x
            rotation: Math.random() * 360, // Random initial rotation
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
                const visibleCount = prev.filter(g => g.visible && !g.caught).length;
                if (visibleCount >= 6) return prev; // Cap at 6 visible at once for "messy" but playable feel

                const candidates = prev.filter(g => !g.caught && !g.visible);
                if (candidates.length === 0) return prev;

                // Randomly pick 1-3 to show
                const amountToShow = Math.floor(Math.random() * 3) + 1;
                const shuffled = [...candidates].sort(() => 0.5 - Math.random());
                const toShow = shuffled.slice(0, amountToShow);

                return prev.map(g => {
                    if (toShow.find(s => s.id === g.id)) {
                        return {
                            ...g,
                            visible: true,
                            // Relocate when appearing if needed, or keep same position
                            x: 10 + Math.random() * 80,
                            y: 20 + Math.random() * 60,
                            rotation: Math.random() * 360
                        };
                    }
                    return g;
                });
            });
        };

        const hideGeckos = () => {
            setGeckos(prev => prev.map(g => {
                // Random chance to hide if visible (so they don't all hide at once)
                if (g.visible && !g.caught && Math.random() > 0.4) {
                    return {
                        ...g,
                        visible: false,
                    };
                }
                return g;
            }));
        };

        const showInterval = setInterval(showGeckos, 1000); // Faster checks
        const hideInterval = setInterval(hideGeckos, 2000);

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
        setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => {
                setShowLevelUp(false);
                setRound(r => r + 1);
            }, 2000);
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
        <div className="relative w-full h-full overflow-hidden select-none bg-[#e8e6e1]">
            {/* Realistic Wall Texture & Lighting */}
            <div className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(at 40% 20%, hsla(28,100%,74%,1) 0px, transparent 50%),
                        radial-gradient(at 80% 0%, hsla(189,100%,56%,1) 0px, transparent 50%),
                        radial-gradient(at 0% 50%, hsla(355,100%,93%,1) 0px, transparent 50%)
                    `,
                    filter: 'url(#noiseFilter)' // We will add an SVG noise filter below
                }}
            />
            {/* Base noise texture */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Vignette for depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />

            {/* Wall details (cracks/dirt) - blending better now */}
            {wallElements.map(el => (
                <div
                    key={el.id}
                    className={`absolute pointer-events-none opacity-40 mix-blend-multiply ${el.type === 'crack' ? 'text-stone-700/60' : 'text-stone-500/40'
                        }`}
                    style={{ left: `${el.x}%`, top: `${el.y}%`, transform: `scale(${1 + Math.random()}) rotate(${Math.random() * 360}deg)` }}
                >
                    {el.type === 'crack' ? '⚡' : el.type === 'shadow' ? '☁️' : '🌑'}
                </div>
            ))}

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ចាប់ជីងចក់! 🦎"
                score={caught}
                goal={currentCount}
            />

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
                        transform: `translate(-50%, -50%) rotate(${gecko.rotation}deg) scale(${gecko.scale})`,
                    }}
                    onClick={() => gecko.visible && !gecko.caught && handleCatch(gecko.id)}
                    onMouseEnter={() => gecko.visible && !gecko.caught && audioService.playHover()}
                >
                    {/* Gecko Shadow for realism */}
                    <div className="absolute top-2 left-2 text-5xl md:text-6xl text-black/20 blur-sm transform scale-y-90 scale-x-105 origin-center animate-gecko-shadow pointer-events-none">
                        🦎
                    </div>
                    {/* The Gecko itself */}
                    <div className={`relative text-5xl md:text-6xl drop-shadow-md filter brightness-110 ${gecko.visible && !gecko.caught ? 'animate-gecko' : ''
                        }`}>
                        🦎
                    </div>
                </div>
            ))}


            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-[#f0fdf4] p-12 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-8 border-green-400 text-center transform hover:scale-105 transition-transform">
                        <h2 className="title-font text-6xl text-green-600 animate-bounce mb-4 drop-shadow-sm">ពូកែណាស់​!</h2>
                        <p className="text-2xl font-black text-stone-700 opacity-90">ជីងចក់ចេញមកកាន់តែលឿន! 🦎💨</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && caught === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(255,255,255,0.5)] border-8 border-[#58cc02] text-center">
                        <h2 className="title-font text-6xl text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-600 animate-bounce mb-8">ចាប់គ្រប់អស់ហើយ! 🎉</h2>
                        <div className="flex justify-center gap-6 text-7xl">
                            <span className="animate-spin-slow">🦎</span>
                            <span className="animate-bounce">🫙</span>
                            <span className="animate-spin-slow" style={{ animationDirection: 'reverse' }}>🦎</span>
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
        @keyframes gecko-shadow {
          0%, 100% { transform: translate(5px, 5px) rotate(-5deg); opacity: 0.2; }
          25% { transform: translate(5px, 5px) translateY(-5px) rotate(0deg); opacity: 0.15; }
          50% { transform: translate(5px, 5px) rotate(5deg); opacity: 0.2; }
          75% { transform: translate(5px, 5px) translateY(-3px) rotate(0deg); opacity: 0.15; }
        }
        .animate-gecko {
          animation: gecko 0.2s ease-in-out infinite alternate;
        }
        .animate-gecko-shadow {
          animation: gecko-shadow 0.2s ease-in-out infinite alternate;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
            animation: spin 3s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        @keyframes flicker {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.45; transform: scale(0.98); }
            80% { opacity: 0.52; transform: scale(1.01); }
        }
        .animate-flicker {
            animation: flicker 4s infinite alternate ease-in-out;
        }
      `}</style>
        </div>
    );
};
