import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface MarketItem {
    id: number;
    emoji: string;
    name: string;
    x: number;
    y: number;
    inBasket: boolean;
}

const MARKET_ITEMS = [
    { emoji: '🥭', name: 'ស្វាយ' },
    { emoji: '🍌', name: 'ចេក' },
    { emoji: '🥬', name: 'បន្លែ' },
    { emoji: '🐟', name: 'ត្រី' },
    { emoji: '🍚', name: 'អង្ករ' },
    { emoji: '🥥', name: 'ដូង' },
    { emoji: '🌶️', name: 'ម្ទេស' },
    { emoji: '🧅', name: 'ខ្ទឹម' },
];

export const MarketShop: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [items, setItems] = useState<MarketItem[]>([]);
    const [targetItems, setTargetItems] = useState<string[]>([]);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [collected, setCollected] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentCount = count + (round - 1);

    const initRound = (r: number) => {
        const numItems = count + (r - 1);
        const shuffled = [...MARKET_ITEMS].sort(() => Math.random() - 0.5);

        // Items to collect (shown in shopping list)
        const targets = shuffled.slice(0, numItems).map(i => i.emoji);
        setTargetItems(targets);

        // All items in market (including targets and some extras)
        const allItems: MarketItem[] = shuffled.slice(0, numItems + 3).map((item, i) => ({
            id: i,
            ...item,
            x: 10 + (i % 4) * 22,
            y: 40 + Math.floor(i / 4) * 20,
            inBasket: false,
        }));

        setItems(allItems);
        setCollected(0);
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

        const item = items.find(i => i.id === dragging);
        if (!item) {
            setDragging(null);
            return;
        }

        // Check if dropped in basket area (bottom center)
        const inBasket = dragPos.x > 35 && dragPos.x < 65 && dragPos.y > 75;

        if (inBasket && targetItems.includes(item.emoji) && !item.inBasket) {
            audioService.playPop();
            setItems(prev => prev.map(i => i.id === dragging ? { ...i, inBasket: true } : i));

            const newCollected = collected + 1;
            setCollected(newCollected);

            if (newCollected === currentCount) {
                if (round < totalRounds) {
                    handleRoundComplete();
                } else {
                    setTimeout(() => {
                        audioService.playSuccess();
                        onComplete();
                    }, 800);
                }
            }
        } else if (inBasket && !targetItems.includes(item.emoji)) {
            // Wrong item
            audioService.playError();
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
            className="relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-amber-100 to-amber-200"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Market stall roof */}
            <div className="absolute top-0 left-0 right-0 h-[15%] bg-gradient-to-b from-red-600 to-red-700 flex items-center justify-center">
                <h1 className="text-white font-black text-2xl md:text-4xl drop-shadow-lg">🏪 ផ្សារ</h1>
            </div>

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-red-300 shadow-sm">
                <span className="text-red-900 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Shopping list */}
            <div className="absolute top-[18%] left-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border-2 border-amber-300 shadow-lg z-30">
                <h3 className="font-black text-amber-800 text-sm mb-2">📝 បញ្ជីទិញ:</h3>
                <div className="flex flex-wrap gap-2">
                    {targetItems.map((emoji, i) => (
                        <div
                            key={i}
                            className={`text-2xl ${items.find(item => item.emoji === emoji && item.inBasket) ? 'opacity-30' : ''}`}
                        >
                            {emoji}
                        </div>
                    ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">{collected}/{currentCount} ទិញហើយ</p>
            </div>

            {/* Market stall table */}
            <div className="absolute top-[30%] left-4 right-4 h-[40%] bg-amber-600/30 rounded-3xl border-4 border-amber-700/50">
                <div className="absolute inset-2 bg-gradient-to-b from-amber-100 to-amber-200 rounded-2xl" />
            </div>

            {/* Market items */}
            {items.filter(i => !i.inBasket).map(item => (
                <div
                    key={item.id}
                    className={`absolute cursor-grab active:cursor-grabbing transition-transform ${dragging === item.id ? 'scale-125 z-50 opacity-75' : 'hover:scale-110'
                        }`}
                    style={{
                        left: dragging === item.id ? `${dragPos.x}%` : `${item.x}%`,
                        top: dragging === item.id ? `${dragPos.y}%` : `${item.y}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setDragging(item.id);
                        audioService.playHover();
                    }}
                >
                    <div className="text-4xl md:text-5xl drop-shadow-lg">{item.emoji}</div>
                    <p className="text-center text-xs font-bold text-amber-800 mt-1">{item.name}</p>
                </div>
            ))}

            {/* Shopping basket */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                <div className="relative">
                    <div className="text-7xl">🧺</div>
                    {/* Items in basket */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1">
                        {items.filter(i => i.inBasket).map(item => (
                            <div key={item.id} className="text-2xl animate-bounce">{item.emoji}</div>
                        ))}
                    </div>
                </div>
                <p className="text-amber-800 font-black text-sm mt-2">ដាក់ក្នុងកន្រ្តក់!</p>
            </div>

            {/* Vendor */}
            <div className="absolute bottom-[25%] right-8 text-5xl">👩‍🌾</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/40 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-amber-200 text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                        <p className="text-xl font-black text-amber-900">ទិញច្រើនជាង! 🛒</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && collected === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-amber-600 animate-bounce mb-6">ទិញអស់ហើយ! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🛒</span>
                            <span className="animate-bounce">🧺</span>
                            <span className="animate-pulse">🛒</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
