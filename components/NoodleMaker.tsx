import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';
import { GameHUD } from './GameHUD';

interface Topping {
    id: number;
    emoji: string;
    name: string;
    x: number;
    y: number;
    placed: boolean;
}

interface BowlSpot {
    id: number;
    x: number;
    y: number;
    filled: boolean;
    topping?: string;
}

const TOPPINGS = ['🥬', '🥒', '🌸', '🥕', '🌿', '🍃'];

export const NoodleMaker: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 4 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [toppings, setToppings] = useState<Topping[]>([]);
    const [bowlSpots, setBowlSpots] = useState<BowlSpot[]>([]);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [placed, setPlaced] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentCount = count + (round - 1);

    const initRound = (r: number) => {
        const numToppings = count + (r - 1);
        const newToppings = Array.from({ length: numToppings }).map((_, i) => ({
            id: i,
            emoji: TOPPINGS[i % TOPPINGS.length],
            name: ['បន្លែ', 'ត្រសក់', 'ផ្កា', 'ការ៉ុត', 'ស្លឹកគ្រៃ', 'ម្រះ'][i % 6],
            x: 10 + (i % 3) * 30,
            y: 75 + Math.floor(i / 3) * 12,
            placed: false,
        }));

        const spots = Array.from({ length: numToppings }).map((_, i) => ({
            id: i,
            x: 35 + (i % 3) * 15,
            y: 35 + Math.floor(i / 3) * 12,
            filled: false,
        }));

        setToppings(newToppings);
        setBowlSpots(spots);
        setPlaced(0);
    };

    useEffect(() => {
        if (!showLevelUp) initRound(round);
    }, [round, count, showLevelUp]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (dragging === null || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setDragPos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    const handleMouseUp = () => {
        if (dragging === null) return;

        const topping = toppings.find(t => t.id === dragging);
        if (!topping) return;

        // Check if dropped in the bowl area (center of screen)
        const inBowl = dragPos.x > 25 && dragPos.x < 75 && dragPos.y > 20 && dragPos.y < 60;

        if (inBowl) {
            audioService.playPop();
            setToppings(prev => prev.map(t => t.id === dragging ? { ...t, placed: true } : t));
            setBowlSpots(prev => {
                const emptySpot = prev.find(s => !s.filled);
                if (emptySpot) {
                    return prev.map(s => s.id === emptySpot.id ? { ...s, filled: true, topping: topping.emoji } : s);
                }
                return prev;
            });

            const newPlaced = placed + 1;
            setPlaced(newPlaced);

            if (newPlaced === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        }

        setDragging(null);
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
            className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-orange-100 to-amber-100"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="ដាក់គ្រឿងលើនំបញ្ចុក! 🍜"
                score={placed}
                goal={currentCount}
            />

            {/* Noodle bowl */}
            <div className="absolute left-1/2 top-[35%] -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                    {/* Bowl base */}
                    <div
                        className="w-64 h-40 md:w-80 md:h-48 rounded-[50%] bg-gradient-to-b from-amber-100 to-amber-200 border-8 border-amber-600 shadow-2xl"
                        style={{
                            boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.1), 0 20px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        {/* Noodles inside */}
                        <div className="absolute inset-4 flex items-center justify-center text-4xl md:text-6xl opacity-80">
                            🍝
                        </div>

                        {/* Placed toppings */}
                        {bowlSpots.filter(s => s.filled).map((spot, i) => (
                            <div
                                key={spot.id}
                                className="absolute text-3xl md:text-4xl animate-bounce"
                                style={{
                                    left: `${20 + (i % 3) * 25}%`,
                                    top: `${20 + Math.floor(i / 3) * 30}%`,
                                }}
                            >
                                {spot.topping}
                            </div>
                        ))}
                    </div>

                    {/* Bowl rim highlight */}
                    <div className="absolute -top-2 left-4 right-4 h-6 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full" />
                </div>
            </div>

            {/* Toppings tray */}
            <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-orange-200 to-transparent">
                <div className="absolute inset-x-8 top-4 bg-white/30 backdrop-blur-md rounded-3xl p-4 border-2 border-orange-300">
                    <p className="text-center text-orange-800 font-bold mb-2">គ្រឿងផ្សេងៗ:</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {toppings.filter(t => !t.placed).map(topping => (
                            <div
                                key={topping.id}
                                className={`cursor-grab active:cursor-grabbing transition-transform ${dragging === topping.id ? 'scale-125 opacity-50' : 'hover:scale-110'
                                    }`}
                                style={{
                                    position: dragging === topping.id ? 'fixed' : 'relative',
                                    left: dragging === topping.id ? `${dragPos.x}%` : 'auto',
                                    top: dragging === topping.id ? `${dragPos.y}%` : 'auto',
                                    transform: dragging === topping.id ? 'translate(-50%, -50%)' : undefined,
                                    zIndex: dragging === topping.id ? 100 : 1,
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setDragging(topping.id);
                                    audioService.playHover();
                                }}
                            >
                                <div className="text-4xl md:text-5xl drop-shadow-lg">{topping.emoji}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-orange-200 text-center">
                        <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-4">ឆ្ងាញ់ណាស់!</h2>
                        <p className="text-xl font-black text-orange-900">ចានបន្ទាប់ធំជាង! 🍜</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && placed === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-6">នំបញ្ចុកឆ្ងាញ់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🍜</span>
                            <span className="animate-bounce">😋</span>
                            <span className="animate-pulse">🍜</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
