import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface Block {
    id: number;
    type: 'base' | 'middle' | 'top' | 'tower';
    x: number;
    y: number;
    placed: boolean;
    targetX: number;
    targetY: number;
}

export const TempleBuilder: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 5 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = 3;
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [dragging, setDragging] = useState<number | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
    const [placed, setPlaced] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentCount = count + (round - 1) * 2;

    const initRound = (r: number) => {
        const numBlocks = count + (r - 1) * 2;
        const newBlocks: Block[] = [];

        for (let i = 0; i < numBlocks; i++) {
            const type = i < 2 ? 'base' : i < 4 ? 'middle' : i < 6 ? 'top' : 'tower';
            newBlocks.push({
                id: i,
                type,
                x: 10 + (i % 4) * 22,
                y: 75 + Math.floor(i / 4) * 12,
                placed: false,
                targetX: 50 + (i % 2 - 0.5) * 12,
                targetY: 60 - Math.floor(i / 2) * 10,
            });
        }

        setBlocks(newBlocks);
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

        const block = blocks.find(b => b.id === dragging);
        if (!block) return;

        // Check if dropped near target position
        const dist = Math.hypot(dragPos.x - block.targetX, dragPos.y - block.targetY);

        if (dist < 15) {
            audioService.playPop();
            setBlocks(prev => prev.map(b =>
                b.id === dragging ? { ...b, placed: true, x: b.targetX, y: b.targetY } : b
            ));

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

    const getBlockEmoji = (type: string) => {
        switch (type) {
            case 'base': return '🧱';
            case 'middle': return '🪨';
            case 'top': return '🏛️';
            case 'tower': return '🗼';
            default: return '🧱';
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden select-none"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                background: 'linear-gradient(180deg, #ff9966 0%, #ff5e62 30%, #2d5016 70%, #1a3009 100%)',
            }}
        >
            {/* Sun setting */}
            <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full shadow-[0_0_100px_rgba(255,150,0,0.8)]" />

            {/* Round indicator */}
            <div className="absolute top-4 right-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl border border-orange-300 shadow-sm">
                <span className="text-orange-100 font-black text-xs uppercase tracking-widest">ជុំទី {round}/{totalRounds}</span>
            </div>

            {/* Instructions */}
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/30 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-orange-300 shadow-xl">
                    <h2 className="text-xl md:text-3xl font-black text-white drop-shadow-lg">
                        សង់ប្រាសាទអង្គរ! 🏛️ ({placed}/{currentCount})
                    </h2>
                </div>
            </div>

            {/* Temple building area */}
            <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
                {/* Foundation */}
                <div className="w-48 h-8 bg-gradient-to-b from-stone-600 to-stone-800 rounded-t-lg border-4 border-stone-900 shadow-2xl" />

                {/* Target spots visualization */}
                {blocks.map(block => !block.placed && (
                    <div
                        key={`target-${block.id}`}
                        className="absolute w-12 h-12 border-4 border-dashed border-stone-400/50 rounded-lg"
                        style={{
                            left: `${block.targetX - 50 + 24}%`,
                            top: `${block.targetY - 45}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    />
                ))}
            </div>

            {/* Placed blocks */}
            {blocks.filter(b => b.placed).map(block => (
                <div
                    key={`placed-${block.id}`}
                    className="absolute text-4xl md:text-5xl transition-all duration-300 drop-shadow-xl"
                    style={{
                        left: `${block.targetX}%`,
                        top: `${block.targetY}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    {getBlockEmoji(block.type)}
                </div>
            ))}

            {/* Blocks to drag */}
            <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-stone-900/80 to-transparent">
                <div className="absolute inset-x-4 top-4 bg-stone-800/50 backdrop-blur-md rounded-3xl p-4 border-2 border-stone-600">
                    <p className="text-center text-stone-300 font-bold mb-2">ថ្មសាងសង់:</p>
                    <div className="flex flex-wrap justify-center gap-6">
                        {blocks.filter(b => !b.placed).map(block => (
                            <div
                                key={block.id}
                                className={`cursor-grab active:cursor-grabbing transition-transform ${dragging === block.id ? 'scale-125 opacity-50' : 'hover:scale-110'
                                    }`}
                                style={{
                                    position: dragging === block.id ? 'fixed' : 'relative',
                                    left: dragging === block.id ? `${dragPos.x}%` : 'auto',
                                    top: dragging === block.id ? `${dragPos.y}%` : 'auto',
                                    transform: dragging === block.id ? 'translate(-50%, -50%)' : undefined,
                                    zIndex: dragging === block.id ? 100 : 1,
                                }}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setDragging(block.id);
                                    audioService.playHover();
                                }}
                            >
                                <div className="text-4xl md:text-5xl drop-shadow-lg">{getBlockEmoji(block.type)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Decorative trees */}
            <div className="absolute bottom-[25%] left-8 text-5xl opacity-80">🌴</div>
            <div className="absolute bottom-[25%] right-8 text-5xl opacity-80">🌴</div>

            {/* Level up modal */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 backdrop-blur-md z-[100] animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border-8 border-orange-200 text-center">
                        <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-4">អស្ចារ្យ!</h2>
                        <p className="text-xl font-black text-stone-700">ប្រាសាទធំជាង! 🏛️</p>
                    </div>
                </div>
            )}

            {/* Completion */}
            {round === totalRounds && placed === currentCount && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-900/30 backdrop-blur-md z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] shadow-2xl border-8 border-white text-center">
                        <h2 className="title-font text-5xl text-orange-600 animate-bounce mb-6">ប្រាសាទស្អាតណាស់! 🎉</h2>
                        <div className="flex justify-center gap-4 text-5xl">
                            <span className="animate-pulse">🏛️</span>
                            <span className="animate-bounce">✨</span>
                            <span className="animate-pulse">🏛️</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
