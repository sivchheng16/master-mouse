import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface Lotus {
    id: number;
    x: number;
    y: number;
    stage: 'bud' | 'blooming' | 'flower';
    timing: number;
    progress: number;
    bloomed: boolean;
}

export const LotusBloom: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [lotuses, setLotuses] = useState<Lotus[]>([]);
    const [bloomed, setBloomed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numLotuses = count + (r - 1) * 2;
        const newLotuses: Lotus[] = Array.from({ length: numLotuses }).map((_, i) => ({
            id: i,
            x: 15 + Math.random() * 70,
            y: 35 + Math.random() * 45,
            stage: 'bud',
            timing: 2000 + Math.random() * 2000, // Random timing for each lotus
            progress: 0,
            bloomed: false,
        }));
        setLotuses(newLotuses);
        setBloomed(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    // Progress the lotus timing
    useEffect(() => {
        if (showLevelUp) return;

        const interval = setInterval(() => {
            setLotuses(prev => prev.map(lotus => {
                if (lotus.bloomed) return lotus;

                const newProgress = (lotus.progress + 50) % lotus.timing;
                const progressPercent = newProgress / lotus.timing;

                let stage: 'bud' | 'blooming' | 'flower' = 'bud';
                if (progressPercent > 0.6 && progressPercent < 0.9) {
                    stage = 'blooming';
                } else if (progressPercent >= 0.9 || progressPercent < 0.1) {
                    stage = 'flower';
                }

                return { ...lotus, progress: newProgress, stage };
            }));
        }, 50);

        return () => clearInterval(interval);
    }, [showLevelUp]);

    const handleClick = (lotusId: number) => {
        const lotus = lotuses.find(l => l.id === lotusId);
        if (!lotus || lotus.bloomed) return;

        // Check if clicked at the right time (during 'flower' stage)
        if (lotus.stage === 'flower') {
            audioService.playSuccess();
            setLotuses(prev => prev.map(l =>
                l.id === lotusId ? { ...l, bloomed: true } : l
            ));

            const newBloomed = bloomed + 1;
            setBloomed(newBloomed);

            if (newBloomed === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        } else {
            // Wrong timing - play error sound
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

    const getLotusEmoji = (stage: string, bloomed: boolean) => {
        if (bloomed) return '🌸';
        switch (stage) {
            case 'bud': return '🌱';
            case 'blooming': return '🌷';
            case 'flower': return '🪷';
            default: return '🌱';
        }
    };

    // Decorative elements
    const lilyPads = useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        x: 5 + Math.random() * 90,
        y: 30 + Math.random() * 55,
        size: 0.6 + Math.random() * 0.5,
        rotation: Math.random() * 360,
    })), []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-300 via-sky-400 to-emerald-600">
            {/* Water reflection effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />

            {/* Lily pads */}
            {lilyPads.map(pad => (
                <div
                    key={pad.id}
                    className="absolute text-4xl md:text-5xl opacity-60 pointer-events-none"
                    style={{
                        left: `${pad.x}%`,
                        top: `${pad.y}%`,
                        transform: `scale(${pad.size}) rotate(${pad.rotation}deg)`,
                    }}
                >
                    🍃
                </div>
            ))}

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-pink-300 shadow-sm">
                <span className="text-pink-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-pink-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-pink-800">
                        ចុចពេល 🪷 រីក! ({bloomed}/{currentCount})
                    </h2>
                    <p className="text-sm text-pink-600 mt-1">រង់ចាំពេលវេលាត្រឹមត្រូវ!</p>
                </div>
            </div>

            {/* Lotuses */}
            {lotuses.map(lotus => (
                <div
                    key={lotus.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${lotus.bloomed ? 'scale-125' : 'hover:scale-110'
                        }`}
                    style={{
                        left: `${lotus.x}%`,
                        top: `${lotus.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleClick(lotus.id)}
                    onMouseEnter={() => !lotus.bloomed && audioService.playHover()}
                >
                    <div className={`text-5xl md:text-6xl drop-shadow-xl transition-all duration-300 ${lotus.stage === 'flower' && !lotus.bloomed ? 'animate-pulse scale-110' : ''
                        } ${lotus.bloomed ? 'animate-bloom' : ''}`}>
                        {getLotusEmoji(lotus.stage, lotus.bloomed)}
                    </div>

                    {/* Timing indicator */}
                    {!lotus.bloomed && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-2 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-100 ${lotus.stage === 'flower' ? 'bg-green-400' :
                                        lotus.stage === 'blooming' ? 'bg-yellow-400' : 'bg-pink-300'
                                    }`}
                                style={{ width: `${(lotus.progress / lotus.timing) * 100}%` }}
                            />
                        </div>
                    )}

                    {/* Success sparkles */}
                    {lotus.bloomed && (
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute text-xl animate-sparkle"
                                    style={{
                                        left: '50%',
                                        top: '50%',
                                        transform: `rotate(${i * 60}deg) translateY(-40px)`,
                                        animationDelay: `${i * 0.1}s`,
                                    }}
                                >
                                    ✨
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Dragonflies */}
            <div className="absolute top-[30%] left-[20%] text-3xl animate-dragonfly pointer-events-none">🦋</div>
            <div className="absolute top-[40%] right-[25%] text-2xl animate-dragonfly pointer-events-none" style={{ animationDelay: '-3s' }}>🦋</div>

            {/* Fish in water */}
            <div className="absolute bottom-[20%] left-[30%] text-3xl animate-fish pointer-events-none">🐟</div>
            <div className="absolute bottom-[25%] right-[35%] text-2xl animate-fish pointer-events-none" style={{ animationDelay: '-2s' }}>🐠</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-pink-200 text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-4">ស្រស់ស្អាត!</h2>
                        <p className="text-xl font-black text-pink-900">ផ្កាច្រើនជាង! 🪷</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && bloomed === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-pink-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-pink-600 animate-bounce mb-6">ផ្កាឈូករីកអស់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🪷</span>
                            <span className="animate-bounce">🌸</span>
                            <span className="animate-pulse">🪷</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes bloom {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }
        .animate-bloom {
          animation: bloom 0.5s ease-out forwards;
        }
        @keyframes sparkle {
          0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(-20px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-60px) scale(0); }
        }
        .animate-sparkle {
          animation: sparkle 0.8s ease-out forwards;
        }
        @keyframes dragonfly {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(30px, -20px); }
          50% { transform: translate(60px, 0); }
          75% { transform: translate(30px, 20px); }
        }
        .animate-dragonfly {
          animation: dragonfly 8s ease-in-out infinite;
        }
        @keyframes fish {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(50px); }
        }
        .animate-fish {
          animation: fish 5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
