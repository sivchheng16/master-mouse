import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface Fish {
    id: number;
    x: number;
    y: number;
    emoji: string;
    fed: boolean;
    attracted: boolean;
}

export const FishPond: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [fishes, setFishes] = useState<Fish[]>([]);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const [fed, setFed] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const FISH_EMOJIS = ['🐟', '🐠', '🐡', '🦈', '🐋'];
    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numFish = count + (r - 1) * 2;
        const newFishes: Fish[] = Array.from({ length: numFish }).map((_, i) => ({
            id: i,
            x: 15 + Math.random() * 70,
            y: 30 + Math.random() * 50,
            emoji: FISH_EMOJIS[i % FISH_EMOJIS.length],
            fed: false,
            attracted: false,
        }));
        setFishes(newFishes);
        setFed(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    // Animate fish swimming toward cursor
    useEffect(() => {
        if (showLevelUp) return;

        const interval = setInterval(() => {
            setFishes(prev => prev.map(fish => {
                if (fish.fed) return fish;

                const dist = Math.hypot(mousePos.x - fish.x, mousePos.y - fish.y);
                const attracted = dist < 25;

                if (attracted && !fish.attracted) {
                    audioService.playHover();
                }

                // Move toward cursor if attracted
                if (attracted) {
                    const dx = mousePos.x - fish.x;
                    const dy = mousePos.y - fish.y;
                    const speed = 0.5;
                    return {
                        ...fish,
                        x: fish.x + dx * speed * 0.1,
                        y: fish.y + dy * speed * 0.1,
                        attracted: true,
                    };
                } else {
                    // Random swimming
                    return {
                        ...fish,
                        x: fish.x + (Math.random() - 0.5) * 2,
                        y: fish.y + (Math.random() - 0.5) * 2,
                        attracted: false,
                    };
                }
            }));
        }, 100);

        return () => clearInterval(interval);
    }, [mousePos, showLevelUp]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    const handleFeedFish = (fishId: number) => {
        const fish = fishes.find(f => f.id === fishId);
        if (!fish || fish.fed) return;

        audioService.playPop();
        setFishes(prev => prev.map(f => f.id === fishId ? { ...f, fed: true } : f));

        const newFed = fed + 1;
        setFed(newFed);

        if (newFed === currentCount) {
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

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            style={{
                background: 'linear-gradient(180deg, #2d5016 0%, #1a3009 20%, #0a3d62 50%, #0a2d4e 100%)',
            }}
        >
            {/* Lily pads */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="absolute text-4xl opacity-60 pointer-events-none"
                    style={{
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 2) * 5}%`,
                    }}
                >
                    🍃
                </div>
            ))}

            {/* Water ripples (following cursor) */}
            <div
                className="absolute w-20 h-20 rounded-full border-2 border-white/20 animate-ripple pointer-events-none"
                style={{
                    left: `${mousePos.x}%`,
                    top: `${mousePos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            />

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-blue-300 shadow-sm">
                <span className="text-blue-100 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/30 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-blue-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-lg">
                        ផ្ដិតម៉ៅដើម្បីបំបាក់ត្រី! 🐟 ({fed}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Food cursor indicator */}
            <div
                className="absolute text-3xl pointer-events-none animate-bounce z-50"
                style={{
                    left: `${mousePos.x}%`,
                    top: `${mousePos.y}%`,
                    transform: 'translate(-50%, -50%)',
                }}
            >
                🍞
            </div>

            {/* Fishes */}
            {fishes.map(fish => (
                <div
                    key={fish.id}
                    className={`absolute transition-all duration-300 ${fish.fed ? 'opacity-50 scale-125' : 'cursor-pointer hover:scale-110'
                        }`}
                    style={{
                        left: `${fish.x}%`,
                        top: `${fish.y}%`,
                        transform: `translate(-50%, -50%) scaleX(${fish.x < mousePos.x ? 1 : -1})`,
                    }}
                    onClick={() => !fish.fed && fish.attracted && handleFeedFish(fish.id)}
                >
                    <div className={`text-4xl md:text-5xl drop-shadow-xl ${fish.attracted && !fish.fed ? 'animate-wiggle' : 'animate-swim'
                        }`}>
                        {fish.emoji}
                    </div>
                    {fish.fed && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl animate-float-up">
                            😋
                        </div>
                    )}
                </div>
            ))}

            {/* Decorative elements */}
            <div className="absolute bottom-8 left-8 text-5xl opacity-60">🌿</div>
            <div className="absolute bottom-12 right-12 text-4xl opacity-50">🐸</div>
            <div className="absolute bottom-4 left-1/3 text-3xl opacity-40">🪨</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-blue-200 text-center">
                        <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-blue-900">ត្រីច្រើនជាង! 🐟</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && fed === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-blue-600 animate-bounce mb-6">ត្រីឆ្អែតហើយ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🐟</span>
                            <span className="animate-bounce">🐠</span>
                            <span className="animate-pulse">🐡</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .animate-ripple {
          animation: ripple 1s ease-out infinite;
        }
        @keyframes swim {
          0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(-2deg); }
          50% { transform: translate(-50%, -50%) translateY(-5px) rotate(2deg); }
        }
        .animate-swim {
          animation: swim 2s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .animate-wiggle {
          animation: wiggle 0.3s ease-in-out infinite;
        }
        @keyframes float-up {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-30px); opacity: 0; }
        }
        .animate-float-up {
          animation: float-up 1s ease-out forwards;
        }
      `}</style>
        </div>
    );
};
