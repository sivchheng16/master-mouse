import React, { useState, useEffect, useMemo } from 'react';
import { audioService } from '../services/audioService';

interface Fruit {
    id: number;
    emoji: string;
    name: string;
    x: number;
    y: number;
    chopped: boolean;
    rotation: number;
}

interface ChopEffect {
    id: number;
    x: number;
    y: number;
    pieces: string[];
}

const FRUITS = [
    { emoji: '🥭', name: 'ស្វាយ', pieces: ['🟡', '🟠'] },
    { emoji: '🍍', name: 'មនាស់', pieces: ['🟡', '🟤'] },
    { emoji: '🍉', name: 'ឪឡឹក', pieces: ['🔴', '🟢'] },
    { emoji: '🍌', name: 'ចេក', pieces: ['🟡', '⬜'] },
    { emoji: '🥥', name: 'ដូង', pieces: ['🟤', '⬜'] },
    { emoji: '🍑', name: 'ពោធិ៍សាត់', pieces: ['🟠', '🟡'] },
];

export const FruitChop: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 6 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [effects, setEffects] = useState<ChopEffect[]>([]);
    const [chopped, setChopped] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [combo, setCombo] = useState(0);

    const currentCount = count + (round - 1) * 3;

    const initRound = (r: number) => {
        const numFruits = count + (r - 1) * 3;
        const newFruits = Array.from({ length: numFruits }).map((_, i) => ({
            id: i,
            ...FRUITS[i % FRUITS.length],
            x: 15 + Math.random() * 70,
            y: 25 + Math.random() * 50,
            chopped: false,
            rotation: Math.random() * 30 - 15,
        }));
        setFruits(newFruits);
        setChopped(0);
        setCombo(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    const handleChop = (fruitId: number) => {
        const fruit = fruits.find(f => f.id === fruitId);
        if (!fruit || fruit.chopped) return;

        audioService.playPop();
        setCombo(c => c + 1);

        // Create chop effect
        const fruitData = FRUITS.find(f => f.emoji === fruit.emoji);
        const effect: ChopEffect = {
            id: Date.now(),
            x: fruit.x,
            y: fruit.y,
            pieces: fruitData?.pieces || ['🟡', '🟡'],
        };
        setEffects(prev => [...prev, effect]);
        setTimeout(() => {
            setEffects(prev => prev.filter(e => e.id !== effect.id));
        }, 600);

        setFruits(prev => prev.map(f => f.id === fruitId ? { ...f, chopped: true } : f));

        const newChopped = chopped + 1;
        setChopped(newChopped);

        if (newChopped === currentCount) {
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

    // Decorative elements
    const decorations = useMemo(() => Array.from({ length: 6 }).map((_, i) => ({
        id: i,
        emoji: ['🍃', '🌿', '🍂', '🌸', '🦋', '✨'][i],
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
    })), []);

    return (
        <div className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-green-200 via-green-100 to-amber-100">
            {/* Decorations */}
            {decorations.map(d => (
                <div
                    key={d.id}
                    className="absolute text-3xl opacity-40 pointer-events-none animate-float"
                    style={{ left: `${d.x}%`, top: `${d.y}%` }}
                >
                    {d.emoji}
                </div>
            ))}

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-green-300 shadow-sm">
                <span className="text-green-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Combo indicator */}
            {combo > 2 && (
                <div className="absolute top-4 left-8 z-40 bg-orange-500 px-4 py-2 rounded-2xl shadow-lg animate-bounce">
                    <span className="text-white font-black text-sm">🔥 COMBO x{combo}</span>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-green-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-green-800">
                        កាត់ផ្លែឈើ! 🔪 ({chopped}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Cutting board background */}
            <div className="absolute inset-x-8 top-[20%] bottom-[15%] bg-amber-200/50 rounded-[3rem] border-8 border-amber-300/50" />

            {/* Chop effects */}
            {effects.map(effect => (
                <div
                    key={effect.id}
                    className="absolute pointer-events-none z-50"
                    style={{ left: `${effect.x}%`, top: `${effect.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                    <div className="text-4xl animate-chop-left">{effect.pieces[0]}</div>
                    <div className="text-4xl animate-chop-right absolute top-0 left-0">{effect.pieces[1]}</div>
                </div>
            ))}

            {/* Fruits */}
            {fruits.map(fruit => !fruit.chopped && (
                <div
                    key={fruit.id}
                    className="absolute cursor-pointer transition-transform hover:scale-125 active:scale-90"
                    style={{
                        left: `${fruit.x}%`,
                        top: `${fruit.y}%`,
                        transform: `translate(-50%, -50%) rotate(${fruit.rotation}deg)`,
                    }}
                    onClick={() => handleChop(fruit.id)}
                    onMouseEnter={() => audioService.playHover()}
                >
                    <div className="text-5xl md:text-6xl drop-shadow-xl hover:animate-wiggle">
                        {fruit.emoji}
                    </div>
                </div>
            ))}

            {/* Knife decoration */}
            <div className="absolute bottom-4 right-8 text-6xl rotate-45 opacity-70">🔪</div>

            {/* Fruit bowl */}
            <div className="absolute bottom-4 left-8 text-5xl">
                🥗
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {chopped}
                </span>
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-green-200 text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                        <p className="text-xl font-black text-green-900">ផ្លែឈើច្រើនជាង! 🥭</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && chopped === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-green-600 animate-bounce mb-6">កាត់អស់ហើយ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🥭</span>
                            <span className="animate-bounce">🍉</span>
                            <span className="animate-pulse">🍍</span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes chop-left {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50px, 60px) rotate(-45deg); opacity: 0; }
        }
        @keyframes chop-right {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(50px, 60px) rotate(45deg); opacity: 0; }
        }
        .animate-chop-left {
          animation: chop-left 0.5s ease-out forwards;
        }
        .animate-chop-right {
          animation: chop-right 0.5s ease-out forwards;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        .hover\\:animate-wiggle:hover {
          animation: wiggle 0.2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};
