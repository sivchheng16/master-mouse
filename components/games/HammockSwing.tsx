import React, { useState, useEffect, useRef } from 'react';
import { audioService } from '../../services/audioService';
import { GameHUD } from '../GameHUD';

// --- Complex SVG Assets ---

const CloudSVG: React.FC<{ className?: string; opacity?: number }> = ({ className, opacity = 0.5 }) => (
    <svg viewBox="0 0 200 100" className={className} style={{ opacity }}>
        <path d="M20,60 Q40,30 70,50 Q90,20 130,40 Q160,30 180,60 Q190,80 150,85 L50,85 Q10,80 20,60"
            fill="#FFFFFF" filter="url(#cloudBlur)" />
        <defs>
            <filter id="cloudBlur">
                <feGaussianBlur stdDeviation="3" />
            </filter>
        </defs>
    </svg>
);

const RealisticPalmTree: React.FC<{ className?: string; flip?: boolean }> = ({ className, flip }) => (
    <svg viewBox="0 0 200 400" className={className} style={{ transform: flip ? 'scaleX(-1)' : 'none' }}>
        <defs>
            <linearGradient id="trunkGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#795548" /> {/* Lighter brown */}
                <stop offset="40%" stopColor="#5D4037" />
                <stop offset="100%" stopColor="#3E2723" />
            </linearGradient>
            <filter id="dropShadow">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>
        </defs>

        {/* Curved Trunk - leaning aggressively inward */}\
        <path d="M10,400 C60,300 -20,150 80,20" fill="url(#trunkGrad)" filter="url(#dropShadow)" />

        {/* Trunk Texture Details */}
        <path d="M20,380 L50,375" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
        <path d="M25,350 L55,345" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
        <path d="M28,320 L58,315" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
        <path d="M25,290 L50,285" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
        <path d="M20,260 L45,255" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />

        {/* Dense Crown of Leaves - Drooping style */}
        <g transform="translate(80, 20)">
            {/* Back Fronds (Darker) */}
            <g opacity="0.9">
                <path d="M0,0 Q-40,-30 -80,10 L-75,15 Q-40,-20 0,5 Z" fill="#2E7D32" />
                <path d="M0,0 Q40,-40 90,-10 L85,-5 Q40,-30 0,5 Z" fill="#2E7D32" />
                <path d="M0,0 Q10,-50 30,-90 L25,-90 Q5,-45 0,0 Z" fill="#2E7D32" />
            </g>

            {/* Front Fronds (Lighter) */}
            <g filter="url(#dropShadow)">
                <path d="M0,0 Q-60,-20 -100,30 L-95,35 Q-55,-10 0,5 Z" fill="#43A047" />
                <path d="M0,0 Q-30,-60 -50,-100 L-45,-100 Q-25,-55 0,0 Z" fill="#4CAF50" />
                <path d="M0,0 Q30,-60 60,-100 L65,-100 Q35,-55 0,0 Z" fill="#4CAF50" />
                <path d="M0,0 Q70,-20 110,40 L105,45 Q65,-10 0,5 Z" fill="#66BB6A" />
            </g>

            {/* Coconuts */}
            <circle cx="-5" cy="10" r="6" fill="#5D4037" />
            <circle cx="5" cy="8" r="6" fill="#795548" />
            <circle cx="0" cy="15" r="6" fill="#5D4037" />
        </g>
    </svg>
);

const WovenHammock: React.FC<{ isHappy: boolean }> = ({ isHappy }) => (
    <svg viewBox="0 0 240 100" className="w-full h-full drop-shadow-xl">
        <defs>
            <pattern id="weavePattern" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect x="0" y="0" width="8" height="8" fill="none" />
                {/* Thicker weave strokes for visibility */}
                <line x1="0" y1="4" x2="8" y2="4" stroke="#BCAAA4" strokeWidth="1.5" />
                <line x1="4" y1="0" x2="4" y2="8" stroke="#BCAAA4" strokeWidth="1.5" />
            </pattern>
        </defs>

        {/* Hammock Shape - Natural Catenary Curve */}
        <path d="M10,10 C60,90 180,90 230,10" fill="#F5F5F5" /> {/* Base fill for contrast */}
        <path d="M10,10 C60,90 180,90 230,10" fill="url(#weavePattern)" />

        {/* Edges / Ropes included in body */}
        <path d="M10,10 C60,90 180,90 230,10" fill="none" stroke="#8D6E63" strokeWidth="3" opacity="0.8" />

        {/* Character sitting in hammock */}
        <g transform="translate(120, 52)" className={`transition-transform duration-500 ease-in-out ${isHappy ? 'scale-110' : 'scale-100'}`}>
            {/* Head */}
            <circle cx="0" cy="0" r="14" fill="#FFCC80" stroke="#E65100" strokeWidth="0.5" />
            {/* Face */}
            <g transform={isHappy ? "translate(0, -1)" : ""}>
                {/* Eyes */}
                {isHappy ? (
                    <>
                        <path d="M-5,-1 Q-3,-3 -1,-1" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
                        <path d="M1,-1 Q3,-3 5,-1" fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
                    </>
                ) : (
                    <>
                        <path d="M-5,0 L-2,0" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
                        <path d="M2,0 L5,0" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
                    </>
                )}
                {/* Mouth */}
                <path d={isHappy ? "M-3,5 Q0,8 3,5" : "M-2,5 Q0,6 2,5"} fill="none" stroke="#5D4037" strokeWidth="2" strokeLinecap="round" />
            </g>
        </g>
    </svg>
);

export const HammockSwing: React.FC<{ onComplete: () => void; count?: number }> = ({ onComplete, count = 3 }) => {
    const [round, setRound] = useState(1);
    const totalRounds = count;
    const [swingAngle, setSwingAngle] = useState(0);
    const [targetZone, setTargetZone] = useState({ min: -10, max: 10 });
    const [score, setScore] = useState(0);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [hasScrolled, setHasScrolled] = useState(false);
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
                    if (newScore > 0 && !hasScrolled) setHasScrolled(true);

                    if (newScore >= targetScore) {
                        if (round < totalRounds) { handleRoundComplete(); }
                        else { setTimeout(() => { audioService.playSuccess(); onComplete(); }, 500); }
                    }
                    return newScore;
                });
            }
        }, 300);
        return () => clearInterval(interval);
    }, [swingAngle, targetZone, showLevelUp, targetScore, round, hasScrolled]);

    const handleScroll = (e: React.WheelEvent) => {
        e.preventDefault();
        const newAngle = Math.max(-60, Math.min(60, swingAngle + e.deltaY * 0.15));
        setSwingAngle(newAngle);
        if (!hasScrolled && Math.abs(swingAngle) > 5) setHasScrolled(true);
        if (Math.random() < 0.2) audioService.playHover();
    };

    const handleRoundComplete = () => {
        audioService.playSuccess();
        setTimeout(() => {
            setShowLevelUp(true);
            setTimeout(() => { setShowLevelUp(false); setRound(r => r + 1); }, 2000);
        }, 2000);
    };

    const inZone = swingAngle >= targetZone.min && swingAngle <= targetZone.max;

    // Swing physics adjustments for realism
    const ropeStyle = {
        transform: `rotate(${swingAngle}deg)`,
        transformOrigin: '50% -300px', // Very high pivot for long pendulum feel
        transition: 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    };

    return (
        <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none font-fredoka" onWheel={handleScroll}
            style={{ fontFamily: '"Quicksand", sans-serif' }}>

            {/* --- Atmosphere / Sky (Simplified & Brightened) --- */}
            {/* Direct linear gradient to ensure visibility - No mix-blend-overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#6A1B9A] via-[#FF5722] to-[#FFC107]" />

            {/* Sun - Large & Bright */}
            <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2">
                <div className="w-48 h-48 bg-yellow-200 rounded-full blur-[60px] opacity-40 animate-pulse" /> {/* Large Glow */}
                <div className="absolute top-12 left-12 w-24 h-24 bg-gradient-to-b from-[#FFF59D] to-[#FFB74D] rounded-full shadow-[0_0_50px_rgba(255,167,38,0.8)]" /> {/* Core */}
            </div>

            {/* Clouds - White & Subtle */}
            <CloudSVG className="absolute top-[8%] left-[10%] w-64 h-32 opacity-40" />
            <CloudSVG className="absolute top-[18%] right-[15%] w-48 h-24 opacity-30" />

            {/* Ocean - Vibrant Blue */}
            <div className="absolute bottom-0 w-full h-[30%] bg-[#0288D1]" />
            <div className="absolute bottom-0 w-full h-[30%] bg-gradient-to-t from-[#01579B] to-transparent opacity-60" />
            <div className="absolute bottom-[28%] w-full h-1 bg-white/20 blur-[1px]" /> {/* Horizon Line */}

            {/* Sun Reflection on Water */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-[30%] bg-[#FFB74D] blur-[30px] opacity-40" />

            {/* Sand - Warm Beige */}
            <div className="absolute bottom-0 w-full h-[15%] bg-[#D7CCC8]">
                <div className="absolute padding-8 inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]" />
            </div>

            <GameHUD
                round={round}
                totalRounds={totalRounds}
                instruction="រមូរដើម្បីយោល!"
                score={score}
                goal={targetScore}
            />

            {/* --- Scene Scene --- */}
            <div className="absolute inset-0 pointer-events-none">

                {/* Left Palm - Lighter & Detailed */}
                <div className="absolute -bottom-10 left-[-80px] w-[300px] h-[600px] z-20 origin-bottom-left" style={{ transform: 'rotate(10deg)' }}>
                    <RealisticPalmTree className="w-full h-full drop-shadow-2xl" />
                </div>

                {/* Right Palm - Lighter & Detailed */}
                <div className="absolute -bottom-10 right-[-80px] w-[300px] h-[600px] z-20 origin-bottom-right" style={{ transform: 'rotate(-10deg)' }}>
                    <RealisticPalmTree className="w-full h-full drop-shadow-2xl" flip />
                </div>

                {/* Swing Mechanism */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[100px] w-[280px] h-32 z-10" style={ropeStyle}>
                    {/* Ropes - Visual thickness & rope color */}
                    <div className="absolute -top-[350px] -left-12 w-1 h-[400px] bg-[#A1887F] origin-bottom shadow-sm"
                        style={{ transform: 'rotate(-25deg)' }} />
                    <div className="absolute -top-[350px] -right-12 w-1 h-[400px] bg-[#A1887F] origin-bottom shadow-sm"
                        style={{ transform: 'rotate(25deg)' }} />

                    <WovenHammock isHappy={inZone} />

                    {/* Scroll Hint */}
                    {!hasScrolled && (
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                            <div className="bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 rounded-full mb-2 border border-white/20">SCROLL TO SWING</div>
                            <div className="w-8 h-12 border-2 border-white rounded-full flex justify-center p-1 bg-black/20">
                                <div className="w-1.5 h-3 bg-white rounded-full animate-[scroll_1.5s_infinite]" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Target UI - Enhanced Contrast */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[60%] max-w-sm z-30">
                <div className="relative h-3 bg-black/60 rounded-full backdrop-blur-md border border-white/30 shadow-xl">
                    {/* Safe Zone */}
                    <div
                        className={`absolute top-0 bottom-0 transition-all duration-300 rounded-full ${inZone ? 'bg-[#00E676] shadow-[0_0_15px_#00E676]' : 'bg-[#FF9800]/50'}`}
                        style={{
                            left: `${50 + (targetZone.min / 90) * 100}%`,
                            right: `${50 - (targetZone.max / 90) * 100}%`
                        }}
                    />
                    {/* Indicator */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-gray-200 transition-all duration-75"
                        style={{
                            left: `${50 + (swingAngle / 90) * 100}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className={`absolute inset-0.5 rounded-full ${inZone ? 'bg-[#00E676]' : 'bg-transparent'}`} />
                    </div>
                </div>
            </div>

            {/* Feedback Overlays */}
            {showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
                    <div className="text-white text-center animate-in fade-in zoom-in duration-500">
                        <h2 className="text-6xl font-bold mb-2 drop-shadow-lg text-[#FFD54F]">អស្ចារ្យ!</h2>
                        <div className="text-8xl">✨</div>
                    </div>
                </div>
            )}
            {score >= targetScore && round === totalRounds && !showLevelUp && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-md">
                    <div className="text-white text-center animate-in slide-in-from-bottom duration-700">
                        <h2 className="text-5xl font-bold mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">សម្រាកបានល្អ!</h2>
                        <button onClick={onComplete} className="px-8 py-3 bg-[#4CAF50] hover:bg-[#43A047] text-white font-bold rounded-full shadow-lg transition-all transform hover:scale-105">
                            បន្តទៅមុខទៀត
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};
