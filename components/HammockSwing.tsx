import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../services/audioService';

export const HammockSwing: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [swingAngle, setSwingAngle] = useState(0);
    const [targetZone, setTargetZone] = useState({ min: -10, max: 10 });
    const [score, setScore] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const targetScore = 10 + round * 5;

    useEffect(() => {
        if (!showLevelUp) {
            setSwingAngle(0);
            setScore(0);
            setTargetZone({ min: -15 + round * 2, max: 15 - round * 2 });
        }
    }, [round, showLevelUp]);

    useEffect(() => {
        if (showLevelUp) return;
        const interval = setInterval(() => {
            const inZone = swingAngle >= targetZone.min && swingAngle <= targetZone.max;
            if (inZone) {
                setScore(s => {
                    const newScore = s + 1;
                    if (newScore >= targetScore) {
                        if (round < totalRounds) { handleRoundComplete(); }
                        else { setTimeout(() => { audioService.playSuccess(); onComplete(); }, 500); }
                    }
                    return newScore;
                });
            }
        }, 300);
        return () => clearInterval(interval);
    }, [swingAngle, targetZone, showLevelUp, targetScore, round]);

    const handleScroll = (e: React.WheelEvent) => {
        e.preventDefault();
        const newAngle = Math.max(-45, Math.min(45, swingAngle + e.deltaY * 0.15));
        setSwingAngle(newAngle);
        if (Math.random() < 0.2) audioService.playHover();
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setShowLevelUp(true);
        setTimeout(() => { setShowLevelUp(false); setRound(r => r + 1); }, 2000);
    };

    const inZone = swingAngle >= targetZone.min && swingAngle <= targetZone.max;

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none" onWheel={handleScroll}
            style={{ background: 'linear-gradient(180deg, #ff9966 0%, #ff5e62 30%, #2d5016 85%, #1a3009 100%)' }}>
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-28 h-28 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full 
        shadow-[0_0_100px_rgba(255,150,0,0.8)]" />
            <div className="absolute top-4 right-8 z-40 bg-white/30 backdrop-blur-md px-4 py-2 rounded-2xl">
                <span className="text-white font-black text-xs uppercase">ជុំទី {round}/{totalRounds}</span>
            </div>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 z-30 text-center">
                <div className="inline-block bg-white/30 backdrop-blur-xl px-8 py-4 rounded-[2rem] border-2 border-orange-300">
                    <h2 className="text-xl md:text-3xl font-black text-white">រមូរក្នុងតំបន់! 🛏️ ({score}/{targetScore})</h2>
                </div>
            </div>

            {/* Trees */}
            <div className="absolute bottom-[15%] left-[15%] text-7xl">🌴</div>
            <div className="absolute bottom-[15%] right-[15%] text-7xl">🌴</div>

            {/* Hammock */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2" style={{ transform: `translateX(-50%) rotate(${swingAngle}deg)`, transition: 'transform 0.1s' }}>
                {/* Ropes */}
                <div className="absolute -top-20 left-0 w-1 h-20 bg-amber-700 origin-top" style={{ transform: 'rotate(-20deg)' }} />
                <div className="absolute -top-20 right-0 w-1 h-20 bg-amber-700 origin-top" style={{ transform: 'rotate(20deg)' }} />
                {/* Hammock body */}
                <div className="w-40 h-16 bg-gradient-to-b from-red-400 to-red-600 rounded-[50%] relative shadow-xl">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl">😊</div>
                </div>
            </div>

            {/* Target zone indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[300px] h-8 bg-white/20 rounded-full overflow-hidden">
                <div className={`absolute top-0 bottom-0 transition-colors ${inZone ? 'bg-green-400' : 'bg-yellow-400/50'}`}
                    style={{ left: `${((targetZone.min + 45) / 90) * 100}%`, width: `${((targetZone.max - targetZone.min) / 90) * 100}%` }} />
                <div className="absolute top-0 bottom-0 w-2 bg-white rounded-full transition-all"
                    style={{ left: `${((swingAngle + 45) / 90) * 100}%`, transform: 'translateX(-50%)' }} />
            </div>

            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-900/40 backdrop-blur-md z-[100]">
                    <div className="bg-white p-12 rounded-[3.5rem] text-center">
                        <h2 className="text-5xl text-orange-600 animate-bounce mb-4">សប្បាយណាស់!</h2>
                    </div>
                </div>
            )}
            {score >= targetScore && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-orange-900/20 backdrop-blur-md z-50">
                    <div className="bg-white/90 p-12 rounded-[3.5rem] text-center">
                        <h2 className="text-5xl text-orange-600 animate-bounce mb-6">សម្រាកល្អ! 🎉</h2>
                    </div>
                </div>
            )}
        </div>
    );
};
