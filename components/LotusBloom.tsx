import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface Lotus {
    id: number;
    x: number;
    y: number;
    stage: 'bud' | 'blooming' | 'flower';
    timing: number;
    progress: number;
    bloomed: boolean;
}

interface Fish {
    id: number;
    x: number;
    y: number;
    speed: number;
    direction: 1 | -1;
    type: string;
    wobbleOffset: number;
}

export const LotusBloom: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [lotuses, setLotuses] = useState<Lotus[]>([]);
    const [fishes, setFishes] = useState<Fish[]>([]);
    const [bloomed, setBloomed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);

    const currentCount = count + (round - 1) * 2;

    const FISH_TYPES = ['🐟', '🐠', '🐡', '🦈'];

    const initRound = (r: number) => {
        const numLotuses = count + (r - 1) * 2;
        const newLotuses: Lotus[] = Array.from({ length: numLotuses }).map((_, i) => ({
            id: i,
            x: 15 + Math.random() * 70,
            y: 35 + Math.random() * 45,
            stage: 'bud',
            timing: 2000 + Math.random() * 2000,
            progress: 0,
            
            bloomed: false,
        }));
        setLotuses(newLotuses);
        setBloomed(0);
    };

    // Initialize fish
    useEffect(() => {
        const initialFishes: Fish[] = Array.from({ length: 8 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: 20 + Math.random() * 70, // Swim in the main area
            speed: 0.05 + Math.random() * 0.1,
            direction: Math.random() > 0.5 ? 1 : -1,
            type: FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)],
            wobbleOffset: Math.random() * Math.PI * 2,
        }));
        setFishes(initialFishes);
    }, []);

    // Fish animation loop
    useEffect(() => {
        let animationFrameId: number;

        const animateFish = () => {
            setFishes(prevFishes => prevFishes.map(fish => {
                let newX = fish.x + fish.speed * fish.direction;
                let newDirection = fish.direction;

                // Wrap around logic
                if (newX > 110) {
                    newX = -10;
                } else if (newX < -10) {
                    newX = 110;
                }

                return {
                    ...fish,
                    x: newX,
                    direction: newDirection,
                };
            }));
            animationFrameId = requestAnimationFrame(animateFish);
        };

        animationFrameId = requestAnimationFrame(animateFish);
        return () => cancelAnimationFrame(animationFrameId);
    }, []);


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
    const lilyPads = useMemo(() => Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: 20 + Math.random() * 70,
        size: 0.8 + Math.random() * 0.7,
        rotation: Math.random() * 360,
    })), []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-300 via-sky-400 to-teal-700">
            {/* Water deep reflection */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-black/20 pointer-events-none" />

            {/* Fish Layer - Behind everything */}
            {fishes.map(fish => (
                <div
                    key={fish.id}
                    className="absolute text-3xl md:text-4xl pointer-events-none opacity-80"
                    style={{
                        left: `${fish.x}%`,
                        top: `${fish.y}%`,
                        transform: `scaleX(${fish.direction * -1})`, // Flip fish based on direction
                        transition: 'transform 0.5s',
                    }}
                >
                    {fish.type}
                </div>
            ))}

            {/* Subtle water ripples over fish */}
            <div className="absolute inset-0 bg-transparent opacity-30 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 10px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Lily pads */}
            {lilyPads.map(pad => (
                <div
                    key={pad.id}
                    className="absolute text-4xl md:text-5xl opacity-70 pointer-events-none z-10"
                    style={{
                        left: `${pad.x}%`,
                        top: `${pad.y}%`,
                        transform: `scale(${pad.size}) rotate(${pad.rotation}deg)`,
                    }}
                >
                    🍃
                </div>
            ))}

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ចុចពេល 🪷 រីក!"
                score={bloomed}
                goal={currentCount}
            />

            {/* Lotuses - High Z-index */}
            {lotuses.map(lotus => (
                <div
                    key={lotus.id}
                    className={`absolute cursor-pointer transition-all duration-200 z-20 ${lotus.bloomed ? 'scale-125' : 'hover:scale-110'
                        }`}
                    style={{
                        left: `${lotus.x}%`,
                        top: `${lotus.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={() => handleClick(lotus.id)}
                    onMouseEnter={() => !lotus.bloomed && audioService.playHover()}
                >
                    {/* Ripple under lotus */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-white/20 rounded-full animate-ripple" />

                    <div className={`text-5xl md:text-6xl drop-shadow-2xl transition-all duration-300 ${lotus.stage === 'flower' && !lotus.bloomed ? 'animate-pulse scale-110' : ''
                        } ${lotus.bloomed ? 'animate-bloom' : ''}`}>
                        {getLotusEmoji(lotus.stage, lotus.bloomed)}
                    </div>

                    {/* Timing indicator */}
                    {!lotus.bloomed && (
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                            <div
                                className={`h-full transition-all duration-100 ${lotus.stage === 'flower' ? 'bg-green-400' :
                                    lotus.stage === 'blooming' ? 'bg-yellow-400' : 'bg-pink-300'
                                    }`}
                                style={{ width: `${(lotus.progress / lotus.timing) * 100}%` }}
                            />
                        </div>
                    )}
                </div>
            ))}

            {/* Dragonflies - Top layer */}
            <div className="absolute top-[30%] left-[20%] text-3xl animate-dragonfly pointer-events-none z-30">🦋</div>
            <div className="absolute top-[40%] right-[25%] text-2xl animate-dragonfly pointer-events-none z-30" style={{ animationDelay: '-3s' }}>🦋</div>


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
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
        .animate-ripple {
          animation: ripple 2s linear infinite;
        }
        @keyframes bloom {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }
        .animate-bloom {
          animation: bloom 0.5s ease-out forwards;
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
      `}</style>
        </div>
    );
};
