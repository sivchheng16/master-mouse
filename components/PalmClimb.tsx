import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

interface PalmFruit {
    y: number;
    collected: boolean;
}

export const PalmClimb: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [climberY, setClimberY] = useState(85);
    const [fruits, setFruits] = useState<PalmFruit[]>([]);
    const [collected, setCollected] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const numFruits = 3 + round;

    useEffect(() => {
        if (!showLevelUp) {
            setClimberY(85);
            setCollected(0);
            const newFruits: PalmFruit[] = Array.from({ length: numFruits }).map((_, i) => ({
                y: 15 + (i * (60 / numFruits)),
                collected: false,
            }));
            setFruits(newFruits);
        }
    }, [round, showLevelUp]);

    const handleScroll = (e: React.WheelEvent) => {
        e.preventDefault();
        const newY = Math.max(10, Math.min(85, climberY + e.deltaY * 0.1));
        setClimberY(newY);

        fruits.forEach((fruit, index) => {
            if (!fruit.collected && Math.abs(climberY - fruit.y) < 8) {
                audioService.playPop();
                setFruits(prev => prev.map((f, i) => i === index ? { ...f, collected: true } : f));
                const newCollected = collected + 1;
                setCollected(newCollected);
                if (newCollected === numFruits) {
                    if (round < totalRounds) {
                        handleRoundComplete();
                    } else {
                        setTimeout(() => { audioService.playSuccess(); onComplete(); }, 800);
                    }
                }
            }
        });
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => { setShowLevelUp(false); setRound(r => r + 1); }, 2000);
    };

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none" onWheel={handleScroll}
            style={{ background: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 60%, #228B22 60%, #1a5c1a 100%)' }}>
            <div className="absolute top-8 right-12 w-24 h-24 bg-yellow-300 rounded-full shadow-[0_0_80px_rgba(255,200,0,0.6)]" />
            <div className="absolute top-4 right-8 z-40 bg-white/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-amber-300">
                <span className="text-amber-900 font-black text-xs uppercase">ជុំទី {round}/{totalRounds}</span>
            </div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/50 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-amber-300">
                    <h2 className="text-xl md:text-3xl font-black text-amber-800">រមូរកង់ម៉ៅដើម្បីឡើង! 🌴 ({collected}/{numFruits})</h2>
                </div>
            </div>
            <div className="absolute left-1/2 top-[5%] bottom-[10%] w-12 md:w-16 -translate-x-1/2 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-lg" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 text-8xl z-20">🌴</div>
            {fruits.map((fruit, i) => (
                <div key={i} className={`absolute left-1/2 transition-all ${fruit.collected ? 'opacity-0 scale-0' : ''}`}
                    style={{ top: `${fruit.y}%`, transform: `translateX(${i % 2 === 0 ? '-120%' : '20%'})` }}>
                    <div className="text-4xl">🥥</div>
                </div>
            ))}
            <div className="absolute left-1/2 -translate-x-1/2 transition-all z-30" style={{ top: `${climberY}%` }}>
                <div className="text-5xl">🧗</div>
            </div>
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/40 backdrop-blur-md z-[100]">
                    <div className="bg-white p-12 rounded-[3.5rem] text-center">
                        <h2 className="text-5xl text-amber-600 animate-bounce mb-4">ពូកែណាស់!</h2>
                    </div>
                </div>
            )}
            {collected === numFruits && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-900/20 backdrop-blur-md z-50">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] text-center">
                        <h2 className="text-5xl text-amber-600 animate-bounce mb-6">រើសផ្លែអស់ហើយ! 🎉</h2>
                    </div>
                </div>
            )}
        </div>
    );
};
